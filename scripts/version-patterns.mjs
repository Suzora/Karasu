// Where the version lives and what a bump rewrites there, shared by bump-version and the commit gate's scope.

export const SEMVER = String.raw`\d+\.\d+\.\d+`;
/** The top-level "version" key — the first one in both JSON files. */
export const JSON_VERSION = new RegExp(`"version":\\s*"${SEMVER}"`);
/** Anchored to line start, so inline `{ version = "0.13" }` deps don't match. */
export const TOML_VERSION = new RegExp(`^version = "${SEMVER}"`, "m");
export const LOCK_VERSION = new RegExp(`(name = "karasu"\\r?\\nversion = )"${SEMVER}"`);
export const COMMIT_NUMBER = /COMMIT_NUMBER: u32 = (\d+);/;
export const FULL_VERSION = new RegExp(`FULL_VERSION: &str = "(${SEMVER}\\.\\d+)";`);

/** Each version file, repository-relative, with the patterns a bump rewrites in it. */
export const VERSION_PATTERNS = {
  "package.json": [JSON_VERSION],
  "src-tauri/tauri.conf.json": [JSON_VERSION],
  "src-tauri/Cargo.toml": [TOML_VERSION],
  "src-tauri/Cargo.lock": [LOCK_VERSION],
  "src-tauri/src/commands/update.rs": [COMMIT_NUMBER, FULL_VERSION],
};
