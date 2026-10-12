declare module "virtual:changes" {
  /** What `scripts/changes.mjs` reads from the repository's CHANGELOG.md. */
  const changes: {
    /** The release the lines come from, or null for the Nightly's unreleased lines. */
    version: string | null;
    /** For unreleased lines, the Stable release they follow. */
    since: string | null;
    items: { kind: "added" | "changed" | "fixed"; text: string }[];
  };
  export default changes;
}
