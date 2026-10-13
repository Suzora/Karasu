// CHANGELOG.md as data, read at build time by `changelogPlugin` in `scripts/changelog-read.mjs`.
declare module "virtual:changelog" {
  const changelog: import("@/lib/whatsNew").Changelog;
  export default changelog;
}
