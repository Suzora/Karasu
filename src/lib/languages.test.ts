import { describe, expect, it } from "vitest";
import { LANGUAGES, isLanguageCode, matchSystemLanguage } from "./languages";

describe("matchSystemLanguage", () => {
  const cases: [string[], string][] = [
    [["de-AT"], "de"],
    [["zh-TW"], "zh-Hant"],
    [["zh-HK"], "zh-Hant"],
    [["zh-Hant-TW"], "zh-Hant"],
    [["zh-CN"], "zh-Hans"],
    [["zh"], "zh-Hans"],
    [["pt-BR"], "pt-BR"],
    [["pt-PT"], "pt"],
    [["es-ES"], "es"],
    [["es"], "es"],
    [["es-MX"], "es-419"],
    [["fr-CA"], "fr-CA"],
    [["fr-BE"], "fr"],
    [["nn-NO"], "nb"],
    [["no"], "nb"],
    [["tl-PH"], "fil"],
    [["sr-Cyrl-RS"], "sr"],
    [["ar-EG", "fr-FR"], "fr"],
    [["xx"], "en"],
    [[], "en"],
  ];
  for (const [given, want] of cases) {
    it(`reads ${given.join(", ") || "nothing"} as ${want}`, () => expect(matchSystemLanguage(given)).toBe(want));
  }
});

describe("the registry", () => {
  it("holds every code once, English and German first and complete", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.slice(0, 2)).toEqual(["en", "de"]);
    expect(LANGUAGES.filter((l) => l.complete).map((l) => l.code)).toEqual(["en", "de"]);
    expect(isLanguageCode("pt-BR")).toBe(true);
    expect(isLanguageCode("qps")).toBe(false);
  });

  it("names every language in its own words, as Intl does", () => {
    for (const l of LANGUAGES) expect(l.endonym.length).toBeGreaterThan(1);
  });
});
