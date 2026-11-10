#!/usr/bin/env node
// The hooks `.claude/settings.json` runs: reads a hook's JSON on stdin, exits 2 with one line to refuse, 0 otherwise.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { guardFile, judgeCommand, keyMaterial, localOnly, secretRules, stopVerdict, treeState } from "./agent-guard-core.mjs";
import { collectChanges, scope } from "./verify-scope.mjs";

const refuse = (message) => {
  process.stderr.write(`agent-guard: ${message}\n`);
  process.exit(2);
};

/** Git in the session's own tree, which a worktree session does not share with this script's checkout. */
const gitIn = (cwd) => (args) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

/** Everything a write tool is about to put into a file, whichever tool it is. */
function newText(input) {
  const parts = [input.content, input.new_string, input.new_source, ...(input.edits ?? []).map((e) => e.new_string)];
  return parts.filter((p) => typeof p === "string").join("\n");
}

function write(hook) {
  const rules = secretRules(newText(hook.tool_input ?? {}));
  if (rules.length) refuse(`this write holds what looks like a credential (${rules.join(", ")}); keep it out of the tree`);
}

/** The text a commit could add: the added lines against HEAD, and with a `git add` the untracked files too. */
function pending(git, root, withUntracked) {
  const lines = (...args) => git(args).split("\n").filter(Boolean);
  const paths = lines("diff", "--name-only", "--no-renames", "HEAD");
  let text = lines("diff", "--no-color", "-U0", "HEAD").filter((l) => l.startsWith("+") && !l.startsWith("+++")).join("\n");
  if (withUntracked) {
    for (const file of lines("ls-files", "--others", "--exclude-standard")) {
      paths.push(file);
      const full = path.join(root, file);
      if (statSync(full).size < 1024 * 1024) text += `\n${readFileSync(full, "utf8")}`;
    }
  }
  return { paths, text };
}

function bash(hook) {
  const verdict = judgeCommand(String(hook.tool_input?.command ?? ""));
  if (verdict.deny) refuse(verdict.deny.message);
  if (!verdict.commits && !verdict.dev) return;
  const cwd = hook.cwd ?? process.cwd();
  const root = gitIn(cwd)(["rev-parse", "--show-toplevel"]).trim();
  if (verdict.dev && !existsSync(path.join(root, "src-tauri", "target", "debug", "karasu.portable"))) {
    refuse("the dev app would open the installed app's data: create src-tauri/target/debug/karasu.portable first");
  }
  if (!verdict.commits) return;
  const { paths, text } = pending(gitIn(root), root, verdict.adds);
  const keys = paths.filter(keyMaterial);
  if (keys.length) refuse(`key material must not be committed: ${keys.join(", ")}`);
  const local = paths.filter(localOnly);
  if (local.length) refuse(`these stay local in a public repository: ${local.join(", ")}`);
  const rules = secretRules(text);
  if (rules.length) refuse(`the change holds what looks like a credential (${rules.join(", ")}); take it out before committing`);
}

/** The session's tree: its root, git there, a reader of its files, and the guard's per-clone notes. */
function tree(hook) {
  const root = gitIn(hook.cwd ?? process.cwd())(["rev-parse", "--show-toplevel"]).trim();
  const git = (args, input) => execFileSync("git", args, { cwd: root, encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"] });
  const read = (file) => {
    try {
      return readFileSync(path.join(root, file), "utf8");
    } catch {
      return null;
    }
  };
  const json = (name) => {
    try {
      return JSON.parse(readFileSync(guardFile(git, name), "utf8"));
    } catch {
      return null;
    }
  };
  return { root, git, read, json };
}

const SESSIONS = "karasu-agent-sessions.json";
const cloud = process.env.CLAUDE_CODE_REMOTE === "true";

function stop(hook) {
  const { git, read, json } = tree(hook);
  const sessions = json(SESSIONS) ?? {};
  const mine = sessions[hook.session_id];
  if (!mine) return;
  const state = treeState(git, read);
  const need = scope(collectChanges((args) => git(args), read)?.changes ?? []);
  const why = stopVerdict({ state, baseline: mine.baseline, stamp: json("karasu-verified.json"), need, cloud, asked: mine.asked });
  if (!why) return;
  mine.asked.push(state);
  writeFileSync(guardFile(git, SESSIONS), JSON.stringify(sessions));
  refuse(why);
}

const LOCAL_FOLDERS = ["docs/superpowers/", ".impeccable/"];

function session(hook) {
  const { git, read, json } = tree(hook);
  const sessions = json(SESSIONS) ?? {};
  if (hook.session_id && !sessions[hook.session_id]) {
    sessions[hook.session_id] = { baseline: treeState(git, read), asked: [] };
    const kept = Object.fromEntries(Object.entries(sessions).slice(-20));
    writeFileSync(guardFile(git, SESSIONS), JSON.stringify(kept));
  }
  const exclude = guardFile(git, "info/exclude");
  const lines = existsSync(exclude) ? readFileSync(exclude, "utf8").split(/\r?\n/) : [];
  const missing = LOCAL_FOLDERS.filter((folder) => !lines.includes(folder));
  if (missing.length) {
    mkdirSync(path.dirname(exclude), { recursive: true });
    appendFileSync(exclude, `${lines.length && lines.at(-1) !== "" ? "\n" : ""}${missing.join("\n")}\n`);
  }
  const notes = [];
  let hooksPath = "";
  try {
    hooksPath = git(["config", "core.hooksPath"]).trim();
  } catch {
    // Unset is git's exit 1, and the answer the note below is for.
  }
  if (hooksPath !== ".githooks" && !cloud) notes.push("The push gate is not wired on this clone: `git config core.hooksPath .githooks` runs `npm run verify:full` before a push.");
  if (cloud) {
    notes.push("Cloud session: run `npm ci` before the gate. `cargo test` and `npm run verify:full` cannot build here; CI checks them.");
    notes.push("A changed Rust command signature cannot regenerate `src/api/bindings.ts` here: say so, never edit the file by hand.");
  }
  if (notes.length) process.stdout.write(`${notes.join("\n")}\n`);
}

const MODES = { write, bash, stop, session };

// A guard that crashes must never lock a session out, so every failure of its own lets the tool call through.
try {
  const hook = JSON.parse(readFileSync(0, "utf8") || "{}");
  MODES[process.argv[2]]?.(hook);
} catch {
  process.exit(0);
}
