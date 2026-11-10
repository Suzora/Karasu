// What the agent guard decides, as pure functions: `agent-guard.mjs` feeds them a hook's input and acts on the answer.

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
  ["force-push", FORCE_PUSH, "A forced push rewrites history others may hold; --force-with-lease asks the maintainer."],
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
