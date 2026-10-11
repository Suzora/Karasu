import { describe, expect, it } from "vitest";
import { sourceLabel } from "./syncSources";

/** The two places a request names its source: a Rust `query_from` and a frontend `gql(…, { source })`. */
const RUST = import.meta.glob(["/src-tauri/src/identify.rs", "/src-tauri/src/{alerts,anilist,commands}/*.rs"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const SRC = import.meta.glob("/src/**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const key = (k: string) => k;

function sources(): string[] {
  const found = new Set<string>();
  for (const text of Object.values(RUST)) {
    for (const m of text.matchAll(/\bquery_(?:from|with)\(\s*"([a-zA-Z]+)"/g)) found.add(m[1]);
  }
  for (const [file, text] of Object.entries(SRC)) {
    if (!file.startsWith("/src/api/") || file.endsWith("bindings.ts")) continue;
    for (const m of text.matchAll(/\bsource: "([a-zA-Z]+)"/g)) found.add(m[1]);
  }
  return [...found].sort();
}

describe("sourceLabel", () => {
  it("finds the sources it guards", () => {
    // A scan that finds nothing would pass every assertion below.
    expect(sources()).toEqual(expect.arrayContaining(["airing", "list", "live", "probe", "mediaDetail", "siteNotifs"]));
  });

  /** A new source without a label shows its raw name in the sync panel, which is the confusion this exists to end. */
  it("has a label for every source the code sends", () => {
    const unlabelled = sources().filter((s) => sourceLabel(s, key) == null);
    expect(unlabelled).toEqual([]);
  });

  it("labels the four background passes and the stale one, which sends nothing", () => {
    for (const pass of ["airing", "site", "sequel", "stale"]) expect(sourceLabel(pass, key)).not.toBeNull();
  });

  it("returns nothing for a source it does not know, so the caller can show the raw name", () => {
    expect(sourceLabel("somethingNew", key)).toBeNull();
    expect(sourceLabel("gql:SaveRecommendation", key)).toBeNull();
  });
});
