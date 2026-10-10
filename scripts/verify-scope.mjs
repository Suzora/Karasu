// Which suite of the commit gate a change can reach: cargo test for the Rust crate, vitest for everything else.
import { VERSION_PATTERNS } from "./version-patterns.mjs";

/** Every `?raw` glob a test reads files through; `verifyScope.test.ts` fails when a test adds one this list lacks. */
export const RAW_READ_GLOBS = [
  "/src/**/*.{ts,tsx}",
  "/src/**/*.test.{ts,tsx}",
  "/index.html",
  "/src-tauri/tauri.conf.json",
  "/src-tauri/gen/android/app/src/main/res/{drawable/karasu_widget_bg,layout/karasu_widget,values/styles_widgets}.xml",
  "/src-tauri/gen/android/app/src/main/java/dev/kyu/karasu/{MainActivity,SystemBars}.kt",
  "/THIRD-PARTY-NOTICES.md",
  "/src-tauri/gen/android/app/src/main/assets/THIRD-PARTY-NOTICES.md",
  "/rust-toolchain.toml",
  "/.github/workflows/*.yml",
  "/packaging/fdroid/dev.kyu.karasu.yml",
  "/src-tauri/src/commands/prefs.rs",
];

const escape = (s) => s.replace(/[.+^$()|[\]\\?]/g, "\\$&");

/** A Vite-style glob as a regular expression: double-star folders, `*` and one level of `{a,b}`, all the tests use. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      const slash = glob[i + 2] === "/";
      re += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "{") {
      const end = glob.indexOf("}", i);
      re += `(?:${glob.slice(i + 1, end).split(",").map(escape).join("|")})`;
      i = end;
    } else {
      re += escape(c);
    }
  }
  return new RegExp(`^${re}$`);
}

const RAW_READ = RAW_READ_GLOBS.map(globToRegExp);
const isRawRead = (path) => RAW_READ.some((re) => re.test(`/${path}`));

/** Whether a file's change from `before` to `after` is a version bump alone, judged by the patterns bump-version writes. */
export function versionOnly(path, before, after) {
  const patterns = VERSION_PATTERNS[path];
  if (!patterns || before == null || after == null) return false;
  const flat = (text) => patterns.reduce((t, p) => t.replace(p, "<version>"), text.replace(/\r\n/g, "\n"));
  return before !== after && flat(before) === flat(after);
}

const isCrate = (path) => path === "rust-toolchain.toml" || (path.startsWith("src-tauri/") && !path.startsWith("src-tauri/gen/"));

/** What a set of changes reaches: the crate's tests, and the frontend's, which also cover any file a test reads raw. */
export function scope(changes) {
  const real = changes.filter((c) => !c.versionOnly);
  const rust = real.some((c) => isCrate(c.path));
  // Unknown ground runs vitest: only Rust-side files and docs no test reads are left out.
  const frontend = real.some((c) => !((c.path.startsWith("src-tauri/") || /\.md$/i.test(c.path)) && !isRawRead(c.path)));
  return { rust, frontend };
}

/** The changed paths with their version-only verdicts: the working tree against HEAD, else HEAD's own commit. */
export function collectChanges(git, readWorking) {
  const list = (...args) => git(args).split("\n").map((l) => l.trim()).filter(Boolean);
  const show = (rev, path) => {
    try {
      return git(["show", `${rev}:${path}`]);
    } catch {
      return null;
    }
  };
  let paths = [...list("diff", "--name-only", "--no-renames", "HEAD"), ...list("ls-files", "--others", "--exclude-standard")];
  if (paths.length > 0) {
    return { since: "since HEAD", changes: paths.map((path) => ({ path, versionOnly: versionOnly(path, show("HEAD", path), readWorking(path)) })) };
  }
  try {
    paths = list("diff", "--name-only", "--no-renames", "HEAD~1", "HEAD");
  } catch {
    return null;
  }
  return { since: "in HEAD", changes: paths.map((path) => ({ path, versionOnly: versionOnly(path, show("HEAD~1", path), show("HEAD", path)) })) };
}

/** Which suites one run of the gate starts; anything that asks for all of it, or a scope that could not be read, runs both. */
export function decide({ flags, ci, collected }) {
  if (flags.has("--frontend")) return { vitest: true, cargo: false, why: null };
  if (flags.has("--rust")) return { vitest: false, cargo: true, why: null };
  if (ci || flags.has("--full") || flags.has("--all") || collected == null) return { vitest: true, cargo: true, why: null };
  const { rust, frontend } = scope(collected.changes);
  return { vitest: frontend, cargo: rust, why: `nothing it can reach changed ${collected.since}; --all runs it anyway` };
}
