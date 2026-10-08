import { describe, expect, it } from "vitest";
import {
  RAW_READ_GLOBS,
  collectChanges,
  decide,
  globToRegExp,
  scope,
  versionOnly,
  type Change,
} from "../../scripts/verify-scope.mjs";

/** The commit gate's choice of suites, without git: the changes are what `collectChanges` would hand it. */

const TESTS = import.meta.glob("/src/**/*.test.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

const changed = (...paths: string[]): Change[] => paths.map((path) => ({ path, versionOnly: false }));
const bumped = (...paths: string[]): Change[] => paths.map((path) => ({ path, versionOnly: true }));

describe("versionOnly", () => {
  const files = {
    "package.json": ['{\n  "name": "karasu",\n  "version": "1.41.13",\n  "type": "module"\n}\n', '"version": "1.41.14"'],
    "src-tauri/tauri.conf.json": ['{\n  "productName": "Karasu",\n  "version": "1.41.13"\n}\n', '"version": "1.41.14"'],
    "src-tauri/Cargo.toml": ['[package]\nname = "karasu"\nversion = "1.41.13"\n\n[dependencies]\nserde = "1"\n', 'version = "1.41.14"'],
    "src-tauri/Cargo.lock": ['[[package]]\nname = "karasu"\nversion = "1.41.13"\n\n[[package]]\nname = "serde"\nversion = "1.0.1"\n', 'version = "1.41.14"'],
  } as const;

  it("calls a bump of each version file a bump, whatever the line endings", () => {
    for (const [path, [before]] of Object.entries(files)) {
      const after = before.replace(/1\.41\.13/, "1.41.14");
      expect(versionOnly(path, before, after), path).toBe(true);
      expect(versionOnly(path, before, after.replace(/\n/g, "\r\n")), path).toBe(true);
    }
    const rs = "pub const COMMIT_NUMBER: u32 = 827;\npub const FULL_VERSION: &str = \"1.41.13.827\";\nfn x() {}\n";
    expect(versionOnly("src-tauri/src/commands/update.rs", rs, rs.replace("827;", "828;").replace("1.41.13.827", "1.41.14.828"))).toBe(true);
  });

  it("calls anything beside the bump a change", () => {
    const toml = files["src-tauri/Cargo.toml"][0];
    expect(versionOnly("src-tauri/Cargo.toml", toml, toml.replace('serde = "1"', 'serde = "2"'))).toBe(false);
    const lock = files["src-tauri/Cargo.lock"][0];
    const both = lock.replace("1.41.13", "1.41.14").replace('version = "1.0.1"', 'version = "1.0.2"');
    expect(versionOnly("src-tauri/Cargo.lock", lock, both)).toBe(false);
    const rs = "pub const COMMIT_NUMBER: u32 = 827;\nfn x() {}\n";
    expect(versionOnly("src-tauri/src/commands/update.rs", rs, rs.replace("827;", "828;").replace("fn x", "fn y"))).toBe(false);
  });

  it("knows no version in any other file, and nothing about a file that is new or gone", () => {
    expect(versionOnly("src-tauri/src/lib.rs", 'version = "1.0.0"', 'version = "1.0.1"')).toBe(false);
    expect(versionOnly("package.json", null, '"version": "1.0.0"')).toBe(false);
    expect(versionOnly("package.json", '"version": "1.0.0"', null)).toBe(false);
  });
});

describe("scope", () => {
  it("sends a frontend change to vitest alone and a crate change to cargo alone", () => {
    expect(scope(changed("src/lib/fuzzy.ts", "src/components/shell/Sidebar.tsx"))).toEqual({ rust: false, frontend: true });
    expect(scope(changed("src-tauri/src/alerts/site.rs", "src-tauri/Cargo.toml"))).toEqual({ rust: true, frontend: false });
  });

  it("sends a crate file a test reads raw to both", () => {
    expect(scope(changed("src-tauri/src/commands/prefs.rs"))).toEqual({ rust: true, frontend: true });
    expect(scope(changed("src-tauri/tauri.conf.json"))).toEqual({ rust: true, frontend: true });
    expect(scope(changed("rust-toolchain.toml"))).toEqual({ rust: true, frontend: true });
  });

  it("runs neither for a version bump, a doc no test reads, or an Android file no test reads", () => {
    expect(scope(bumped("package.json", "src-tauri/Cargo.toml", "src-tauri/Cargo.lock", "src-tauri/tauri.conf.json"))).toEqual({
      rust: false,
      frontend: false,
    });
    expect(scope(changed("CLAUDE.md", "DESIGN.md"))).toEqual({ rust: false, frontend: false });
    expect(scope(changed("src-tauri/gen/android/app/src/main/java/dev/kyu/karasu/NotifJob.kt"))).toEqual({ rust: false, frontend: false });
    expect(scope([])).toEqual({ rust: false, frontend: false });
  });

  it("runs vitest for everything it cannot place, and for the files the raw tests read", () => {
    for (const path of [
      "scripts/verify-scope.mjs",
      ".github/workflows/ci.yml",
      "THIRD-PARTY-NOTICES.md",
      "index.html",
      "src-tauri/gen/android/app/src/main/java/dev/kyu/karasu/MainActivity.kt",
      "src-tauri/gen/android/app/src/main/res/layout/karasu_widget.xml",
      "packaging/fdroid/dev.kyu.karasu.yml",
      "vite.config.ts",
    ]) {
      expect(scope(changed(path)).frontend, path).toBe(true);
    }
  });

  it("does not let a bump hide a real change beside it", () => {
    expect(scope([...bumped("src-tauri/Cargo.toml"), ...changed("src-tauri/src/lib.rs")])).toEqual({ rust: true, frontend: false });
  });
});

describe("globToRegExp", () => {
  it("reads the shapes the tests write", () => {
    expect(globToRegExp("/src/**/*.{ts,tsx}").test("/src/lib/a.ts")).toBe(true);
    expect(globToRegExp("/src/**/*.{ts,tsx}").test("/src/a.tsx")).toBe(true);
    expect(globToRegExp("/src/**/*.{ts,tsx}").test("/src/a.css")).toBe(false);
    expect(globToRegExp("/.github/workflows/*.yml").test("/.github/workflows/ci.yml")).toBe(true);
    expect(globToRegExp("/.github/workflows/*.yml").test("/.github/workflows/x/ci.yml")).toBe(false);
    expect(globToRegExp("/index.html").test("/indexXhtml")).toBe(false);
  });
});

/** A test that reads a file through `?raw` is invisible to an import graph, so the scope must name what it reads. */
describe("the raw-read list", () => {
  it("names every glob a test reads files through", () => {
    const call = /import\.meta\.glob\(\s*(\[[^\]]*\]|"[^"]*")/g;
    // Vite leaves the importing file out of its own glob, so this file's one glob is named here by hand.
    const globs = new Set<string>(["/src/**/*.test.{ts,tsx}"]);
    for (const source of Object.values(TESTS)) {
      for (const match of source.matchAll(call)) {
        for (const literal of match[1].matchAll(/"([^"]+)"/g)) globs.add(literal[1]);
      }
    }
    expect([...globs].sort()).toEqual([...RAW_READ_GLOBS].sort());
  });
});

describe("collectChanges", () => {
  /** A stand-in for git: answers by the joined arguments, and throws for anything it was not given. */
  const fakeGit = (answers: Record<string, string>) => (args: string[]) => {
    const key = args.join(" ");
    if (!(key in answers)) throw new Error(`no ${key}`);
    return answers[key];
  };
  const pkg = (v: string) => `{\n  "version": "${v}"\n}\n`;

  it("reads the working tree against HEAD, untracked files included", () => {
    const git = fakeGit({
      "diff --name-only --no-renames HEAD": "package.json\nsrc/lib/a.ts\n",
      "ls-files --others --exclude-standard": "src/lib/new.ts\n",
      "show HEAD:package.json": pkg("1.0.0"),
      "show HEAD:src/lib/a.ts": "a",
    });
    const read = (path: string) => (path === "package.json" ? pkg("1.0.1") : "b");
    expect(collectChanges(git, read)).toEqual({
      since: "since HEAD",
      changes: [
        { path: "package.json", versionOnly: true },
        { path: "src/lib/a.ts", versionOnly: false },
        { path: "src/lib/new.ts", versionOnly: false },
      ],
    });
  });

  it("falls back to HEAD's own commit on a clean tree, and to nothing without a parent", () => {
    const git = fakeGit({
      "diff --name-only --no-renames HEAD": "",
      "ls-files --others --exclude-standard": "",
      "diff --name-only --no-renames HEAD~1 HEAD": "src-tauri/src/lib.rs\n",
    });
    expect(collectChanges(git, () => null)).toEqual({ since: "in HEAD", changes: [{ path: "src-tauri/src/lib.rs", versionOnly: false }] });
    const orphan = fakeGit({ "diff --name-only --no-renames HEAD": "", "ls-files --others --exclude-standard": "" });
    expect(collectChanges(orphan, () => null)).toBeNull();
  });
});

describe("decide", () => {
  const collected = { since: "since HEAD", changes: changed("src/lib/a.ts") };

  it("follows the scope in a plain local run", () => {
    expect(decide({ flags: new Set(), ci: false, collected })).toMatchObject({ vitest: true, cargo: false });
  });

  it("runs both in CI, before a push, on request, or when the changes could not be read", () => {
    for (const run of [
      { flags: new Set<string>(), ci: true, collected },
      { flags: new Set(["--full"]), ci: false, collected },
      { flags: new Set(["--all"]), ci: false, collected },
      { flags: new Set<string>(), ci: false, collected: null },
    ]) {
      expect(decide(run)).toEqual({ vitest: true, cargo: true, why: null });
    }
  });

  it("keeps the two halves' own flags as they were", () => {
    expect(decide({ flags: new Set(["--frontend"]), ci: true, collected })).toEqual({ vitest: true, cargo: false, why: null });
    expect(decide({ flags: new Set(["--rust"]), ci: false, collected })).toEqual({ vitest: false, cargo: true, why: null });
  });
});
