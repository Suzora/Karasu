import { describe, expect, it } from "vitest";
import { audit, placeholders } from "../../scripts/i18n-check.mjs";
import { en } from "@/i18n/en";
import { de } from "@/i18n/de";

/** Every machine-translated language, loaded as the app loads it. */
const LOCALES = import.meta.glob<{ default: object }>("/src/i18n/locales/*.ts", { eager: true });

describe("the translation rules", () => {
  it("reads every kind of placeholder i18next fills", () => {
    expect(placeholders("{{n}} of {{ total }} <1>link</1> $t(a.b)")).toEqual(["<1>", "a.b", "n", "total"]);
  });

  it("refuses an invented key, an empty text and a lost placeholder, and counts the gaps", () => {
    const result = audit(
      { a: { one: "{{n}} file", two: "Hello", x_one: "1 file", x_other: "{{count}} files" } },
      { a: { one: "{{m}} Datei", two: " ", made: "up", x_few: "{{count}} pliki" } },
    );
    expect(result.problems).toEqual(["a.one: placeholders m where English has n", "a.two: empty", "a.made: not an English key"]);
    expect(result.missing).toEqual(["a.x_one", "a.x_other"]);
  });
});

describe("every language", () => {
  it("holds German to English, whole", () => {
    const { problems, missing } = audit(en, de);
    expect(problems).toEqual([]);
    expect(missing).toEqual([]);
  });

  for (const [path, mod] of Object.entries(LOCALES)) {
    it(`keeps ${path.split("/").pop()} to English's keys and placeholders`, () => {
      expect(audit(en, mod.default).problems).toEqual([]);
    });
  }
});
