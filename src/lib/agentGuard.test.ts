import { describe, expect, it } from "vitest";
import { judgeCommand, keyMaterial, localOnly, secretRules } from "../../scripts/agent-guard-core.mjs";

/** The rules `.claude/settings.json` enforces for an agent session, without a session: the guard's pure half. */

const SETTINGS = import.meta.glob("/.claude/settings.json", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

const SCRIPTS = import.meta.glob("/scripts/agent-guard.mjs", { query: "?raw", import: "default", eager: true });

// Every sample is put together here, so this file holds nothing the guard would refuse to see written.
const dashes = "-".repeat(5);
const pem = `${dashes}BEGIN OPENSSH PRIVATE ${"KEY"}${dashes}\nabc\n`;
const jwt = ["eyJ" + "a".repeat(20), "b".repeat(20), "c".repeat(20)].join(".");
const github = ["gh", "p_", "A1".repeat(20)].join("");
const minisign = ["untrusted comment:", "rsign encrypted secret key"].join(" ");
const clientSecret = ["client", 'secret: "s3cr3tvalue99"'].join("_");
const storePassword = ["store", "Password=hunter2hunter2"].join("");

describe("secretRules", () => {
  it.each([
    ["a private key", pem, "private-key"],
    ["a token shaped like a JWT", `Bearer ${jwt}`, "jwt"],
    ["a GitHub token", `token=${github}`, "github-token"],
    ["a minisign secret key", `${minisign}\nxyz`, "minisign-secret"],
    ["a client secret with a value", clientSecret, "client-secret"],
    ["a keystore password with a value", `${storePassword}\n`, "keystore-password"],
  ])("names %s", (_what, text, rule) => {
    expect(secretRules(text)).toEqual([rule]);
  });

  it.each([
    ["the public half of the updater key", "untrusted comment: minisign public key: ABCDEF\nRWQabc"],
    ["a password read from a properties file", 'storePassword = keystoreProperties["storePassword"] as String'],
    ["a password taken from the environment", "keyPassword=$ANDROID_KEY_PASSWORD"],
    ["the scrubber's own label", "Authorization: Bearer <CREDENTIAL_BEARER>"],
    ["a client id", 'const BUILTIN_ANILIST_CLIENT_ID: &str = "12345";'],
  ])("lets %s through", (_what, text) => {
    expect(secretRules(text)).toEqual([]);
  });
});

describe("judgeCommand", () => {
  it.each([
    ["npm run verify 2>&1 | tail -5", "gate-piped"],
    ["npm run verify || true", "gate-piped"],
    ["npm run verify:full | grep FAIL", "gate-piped"],
    ["node scripts/verify.mjs --all | tee log.txt", "gate-piped"],
    ["git push --force origin x", "force-push"],
    ["git -C . push --force", "force-push"],
    ["git push -uf origin x", "force-push"],
    ["git push origin +main", "force-push"],
    ["git push origin v1.78.2", "tag-push"],
    ["git push origin HEAD:refs/tags/v2.0.0", "tag-push"],
    ["git push --tags", "tag-push"],
    ["git push origin refs/tags/v1.79.0-rc.1", "tag-push"],
  ])("refuses `%s`", (command, rule) => {
    expect(judgeCommand(command).deny?.rule).toBe(rule);
  });

  it.each([
    "npm run verify",
    "cd . && npm run verify 2>&1",
    "npm run verify; echo $?",
    "git push -u origin ccr-8d3aca32-tb98r7",
    "git push --force-with-lease origin x",
    'git commit -m "never run git push --force, or npm run verify | tail"',
    "git commit -F - <<'EOF'\nnpm run verify | tail is how a failure got committed\nEOF",
    "git log --oneline | head -5",
  ])("lets `%s` through", (command) => {
    expect(judgeCommand(command).deny).toBeNull();
  });

  it("says when a command commits, adds, or starts the dev app", () => {
    expect(judgeCommand("git add -A && git commit -m x")).toMatchObject({ commits: true, adds: true, dev: false });
    expect(judgeCommand("git commit --amend --no-edit")).toMatchObject({ commits: true, adds: false });
    expect(judgeCommand("npm run tauri dev")).toMatchObject({ commits: false, dev: true });
    expect(judgeCommand("npm run tauri build")).toMatchObject({ dev: false });
  });
});

describe("the paths a commit must not carry", () => {
  it("knows key material by its name", () => {
    for (const path of ["release.jks", "a/b/upload.keystore", "cert.p12", ".env", "site/.env.local", "src-tauri/gen/android/key.properties"]) {
      expect(keyMaterial(path), path).toBe(true);
    }
    for (const path of ["src/lib/env.ts", "scripts/keystore.md", "src-tauri/src/keystore.rs"]) expect(keyMaterial(path), path).toBe(false);
  });

  it("knows the folders that stay local", () => {
    for (const path of ["docs/superpowers/plans/a.md", ".impeccable/x.json", "audit/report.md"]) expect(localOnly(path), path).toBe(true);
    for (const path of ["docs.md", "src/lib/audit/x.ts", "scripts/comment-audit.mjs"]) expect(localOnly(path), path).toBe(false);
  });
});

describe(".claude/settings.json", () => {
  const settings = JSON.parse(Object.values(SETTINGS)[0]) as {
    permissions: { deny: string[]; ask: string[] };
    hooks: Record<string, { matcher?: string; hooks: { command: string; args: string[] }[] }[]>;
  };

  it("parses, since a broken file switches every rule off without a word", () => {
    expect(settings.permissions.deny.length).toBeGreaterThan(0);
    expect(settings.permissions.ask.length).toBeGreaterThan(0);
  });

  it("names no rule twice, and none under both deny and ask", () => {
    const all = [...settings.permissions.deny, ...settings.permissions.ask];
    expect(new Set(all).size).toBe(all.length);
  });

  it("runs only hook scripts that exist, each in a mode the guard knows", () => {
    const calls = Object.values(settings.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks));
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.command).toBe("node");
      const [script, mode] = call.args;
      expect(Object.keys(SCRIPTS), script).toContain(script.replace("${CLAUDE_PROJECT_DIR}", ""));
      expect(["write", "bash", "stop", "session"]).toContain(mode);
    }
  });

  it("guards every tool that writes a file or runs a command", () => {
    const matchers = settings.hooks.PreToolUse.map((g) => g.matcher);
    expect(matchers).toEqual(["Edit|Write|NotebookEdit", "Bash|PowerShell"]);
  });
});
