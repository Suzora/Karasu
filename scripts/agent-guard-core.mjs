// What the agent guard decides, git and files handed in: `agent-guard.mjs` feeds it a hook's input and acts on the answer.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { VERSION_PATTERNS } from "./version-patterns.mjs";

const dashes = "-".repeat(5);

/** A credential's shape and the name a refusal prints; each is put together here so this file matches none of them. */
const SECRET_RULES = [
  ["jwt", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["private-key", new RegExp(`${dashes}BEGIN [A-Z ]*PRIVATE ${"KEY"}${dashes}`)],
  ["minisign-secret", new RegExp(["untrusted comment: (?:rsign|minisign)", "encrypted secret key"].join(" "))],
  ["minisign-secret", new RegExp(["dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQg", "a2V5"].join(""))],
  ["github-token", /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/],
  ["client-secret", new RegExp(["client", "secret"].join("_") + String.raw`["']?\s*[:=]\s*["'][^"'\s]{8,}["']`, "i")],
  ["keystore-password", new RegExp(String.raw`\b(store|key)${"Password"}\s*=\s*["']?[^\s"'$({.]{4,}["']?\s*$`, "m")],
];

/** The names of the credential shapes a text holds, each once, and never the match itself. */
export function secretRules(text) {
  return [...new Set(SECRET_RULES.filter(([, re]) => re.test(text)).map(([name]) => name))];
}

const KEY_FILE = /(^|\/)(\.env(\..+)?|key\.properties|keystore\.properties|[^/]+\.(jks|keystore|p12))$/;
const LOCAL_ONLY = /^(docs\/superpowers|\.impeccable|audit)\//;

/** Whether a path is key material by its name alone. */
export const keyMaterial = (path) => KEY_FILE.test(path);
/** Whether a path lies in a folder that stays out of the public repository. */
export const localOnly = (path) => LOCAL_ONLY.test(path);

/** A command without what it only quotes: heredoc bodies, quoted strings and descriptor redirections. */
function bare(command) {
  return command
    .replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2\b/g, " ")
    .replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, " ")
    .replace(/\d*>&\d+/g, " ");
}

const GATE_PIPED = /(npm\s+run\s+verify(:\w+)?|node\s+(\.\/)?scripts\/verify\.mjs)\b[^|;&\n]*\|/;
const PUSH = String.raw`\bgit\b[^|;&\n]*\bpush\b[^|;&\n]*`;
const FORCE_PUSH = new RegExp(PUSH + String.raw`(\s--force(?![-\w])|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s\+\S)`);
const TAG_PUSH = new RegExp(PUSH + String.raw`(\s--tags\b|\s(?:\S+:)?(?:refs\/tags\/)?v\d+\.\d+\.\d+)`);
const COMMIT = /\bgit\b[^|;&\n]*\bcommit\b/;
const ADD = /\bgit\b[^|;&\n]*\badd\b/;
const TAURI_DEV = /\btauri(\.js)?\s+dev\b/;

const DENIALS = [
  ["gate-piped", GATE_PIPED, "Run the gate bare and read its exit code: a pipe reports the other command's status."],
  ["force-push", FORCE_PUSH, "A forced push rewrites history others may hold; --force-with-lease is the one that checks first."],
  ["tag-push", TAG_PUSH, "A Stable commit, its tag and its push are the maintainer's."],
];

/** What a shell command is to the guard: a refusal with its rule, and whether it commits, adds or starts the dev app. */
export function judgeCommand(command) {
  const text = bare(command);
  const hit = DENIALS.find(([, re]) => re.test(text));
  return {
    deny: hit ? { rule: hit[0], message: hit[2] } : null,
    commits: COMMIT.test(text),
    adds: ADD.test(text),
    dev: TAURI_DEV.test(text),
  };
}

/** Paths whose change never asks for a new run of the gate: the changelog the loop rewrites, and the website. */
const outsideGate = (path) => path === "CHANGELOG.md" || path.startsWith("site/");
const sha = (text) => createHash("sha256").update(text).digest("hex");

/** A fingerprint of the tree's content that a commit, a version bump and the changelog amend all leave as it was. */
export function treeState(git, read) {
  const list = (...args) => git(args).split("\0").filter(Boolean);
  const ids = new Map(list("ls-tree", "-r", "-z", "HEAD").map((row) => [row.slice(row.indexOf("\t") + 1), row.split(/\s/)[2]]));
  const changed = [...list("diff", "--name-only", "--no-renames", "-z", "HEAD"), ...list("ls-files", "--others", "--exclude-standard", "-z")];
  const present = changed.filter((p) => read(p) != null);
  for (const p of changed) ids.delete(p);
  const hashed = present.length ? git(["hash-object", "--stdin-paths"], present.join("\n")).split("\n") : [];
  present.forEach((p, i) => ids.set(p, hashed[i]));
  for (const [file, patterns] of Object.entries(VERSION_PATTERNS)) {
    const text = read(file);
    if (text != null) ids.set(file, `flat:${sha(patterns.reduce((t, re) => t.replace(re, "<version>"), text.replace(/\r\n/g, "\n")))}`);
  }
  const rows = [...ids].filter(([p]) => !outsideGate(p)).map(([p, id]) => `${id} ${p}`);
  return sha(rows.sort().join("\n"));
}

/** Why a session may not stop yet, or null: its changes need a green gate run of this state, asked for once. */
export function stopVerdict({ state, baseline, stamp, need, cloud, asked }) {
  if (state === baseline || asked.includes(state)) return null;
  const ran = stamp?.state === state ? stamp.ran : null;
  const missing = [need.frontend && "vitest", need.rust && !cloud && "cargo test"].filter((s) => s && !ran?.includes(s));
  if (ran && missing.length === 0) return null;
  const what = ran ? `the last green run of this state left out ${missing.join(" and ")}` : "no green gate run vouches for this state";
  return `${what}: run \`npm run verify\` bare and read its exit code, or say plainly that this state is unverified and which phases could not run here.`;
}

/** Where a per-clone file of the guard lives: inside the git directory, so a worktree keeps its own. */
export const guardFile = (git, name) => git(["rev-parse", "--path-format=absolute", "--git-path", name]).trim();

/** Records that the gate ran green on the tree as it stands, for the stop hook to read. */
export function writeStamp(root, ran) {
  const git = (args, input) => execFileSync("git", args, { cwd: root, encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"] });
  const read = (p) => {
    try {
      return readFileSync(path.join(root, p), "utf8");
    } catch {
      return null;
    }
  };
  writeFileSync(guardFile(git, "karasu-verified.json"), JSON.stringify({ state: treeState(git, read), ran }));
}
