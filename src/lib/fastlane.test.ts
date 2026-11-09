import { describe, expect, it } from "vitest";
import { LANGUAGES } from "./languages";

/** The store texts per locale; F-Droid cuts or refuses what runs past its limits, so they are held here instead. */
const FILES = import.meta.glob("/fastlane/metadata/android/*/*.txt", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const LIMITS: Record<string, number> = { "title.txt": 50, "short_description.txt": 80, "full_description.txt": 4000 };

describe("the store listing", () => {
  it("keeps every text inside F-Droid's limits", () => {
    const over = Object.entries(FILES)
      .map(([path, text]) => [path, text, LIMITS[path.split("/").pop() ?? ""]] as const)
      .filter(([, text, limit]) => limit !== undefined && [...text.trim()].length > limit)
      .map(([path]) => path);
    expect(over).toEqual([]);
  });

  it("writes every listed locale whole, and only for a language Karasu speaks", () => {
    const known = new Set(LANGUAGES.map((l) => l.fastlane));
    const locales = new Set(Object.keys(FILES).map((p) => p.split("/")[4]));
    expect([...locales].filter((l) => !known.has(l))).toEqual([]);
    for (const locale of locales) {
      for (const name of Object.keys(LIMITS)) expect(FILES[`/fastlane/metadata/android/${locale}/${name}`], `${locale}/${name}`).toBeTruthy();
    }
  });
});
