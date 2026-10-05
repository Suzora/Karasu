import { afterEach, describe, expect, it } from "vitest";
import type { MediaTitle } from "@/api/types";
import { displayTitle } from "@/api/types";
import {
  DEFAULT_TITLE_LANGUAGE,
  SAMPLE_TITLE,
  activeTitleLanguage,
  exampleTitle,
  isNativeLine,
  needsJapaneseFace,
  parseTitleLanguage,
  pickTitle,
  secondLine,
  setActiveTitleLanguage,
} from "@/lib/titleLanguage";

const frieren: MediaTitle = {
  english: "Frieren: Beyond Journey’s End",
  romaji: "Sousou no Frieren",
  native: "葬送のフリーレン",
};

afterEach(() => setActiveTitleLanguage(DEFAULT_TITLE_LANGUAGE));

describe("parseTitleLanguage", () => {
  it("keeps the three languages and reads anything else as English", () => {
    expect(parseTitleLanguage("romaji")).toBe("romaji");
    expect(parseTitleLanguage("native")).toBe("native");
    expect(parseTitleLanguage("english")).toBe("english");
    expect(parseTitleLanguage("ROMAJI")).toBe("english");
    expect(parseTitleLanguage(null)).toBe("english");
    expect(parseTitleLanguage(undefined)).toBe("english");
  });
});

describe("pickTitle", () => {
  it("shows the chosen language when the title has it", () => {
    expect(pickTitle(frieren, "english")).toBe("Frieren: Beyond Journey’s End");
    expect(pickTitle(frieren, "romaji")).toBe("Sousou no Frieren");
    expect(pickTitle(frieren, "native")).toBe("葬送のフリーレン");
  });

  it("falls back through each language's own order", () => {
    const noEnglish = { ...frieren, english: null };
    expect(pickTitle(noEnglish, "english")).toBe("Sousou no Frieren");
    const noRomaji = { ...frieren, romaji: null };
    expect(pickTitle(noRomaji, "romaji")).toBe("Frieren: Beyond Journey’s End");
    // Native falls back to romaji, never to the English one, because romaji is the closer spelling.
    expect(pickTitle({ ...frieren, native: null }, "native")).toBe("Sousou no Frieren");
    expect(pickTitle({ english: "Only English", romaji: null, native: null }, "native")).toBe("Only English");
  });

  it("treats a blank variant as missing and keeps the old last resort", () => {
    expect(pickTitle({ ...frieren, english: "  " }, "english")).toBe("Sousou no Frieren");
    expect(pickTitle({ english: null, romaji: null, native: null }, "romaji")).toBe("?");
  });
});

describe("displayTitle", () => {
  it("follows the active language unless a caller names one", () => {
    expect(displayTitle(frieren)).toBe("Frieren: Beyond Journey’s End");
    setActiveTitleLanguage("native");
    expect(activeTitleLanguage()).toBe("native");
    expect(displayTitle(frieren)).toBe("葬送のフリーレン");
    expect(displayTitle(frieren, "romaji")).toBe("Sousou no Frieren");
  });
});

describe("secondLine", () => {
  it("puts the native title under a Latin one", () => {
    expect(secondLine(frieren, "Frieren: Beyond Journey’s End")).toEqual({ text: "葬送のフリーレン", native: true });
    expect(secondLine(frieren, "Sousou no Frieren")).toEqual({ text: "葬送のフリーレン", native: true });
  });

  it("puts the romaji under a native main line instead of repeating it", () => {
    expect(secondLine(frieren, "葬送のフリーレン")).toEqual({ text: "Sousou no Frieren", native: false });
  });

  it("copes with a blank native title and with no title at all", () => {
    expect(secondLine({ ...frieren, native: "  " }, "Frieren: Beyond Journey’s End")).toEqual({
      text: "Sousou no Frieren",
      native: false,
    });
  });

  it("has nothing to add when every other variant is missing, blank or the same", () => {
    expect(secondLine({ english: "Bebop", romaji: "Bebop", native: "  " }, "Bebop")).toBeNull();
    expect(secondLine(null, "Frieren")).toBeNull();
  });
});

describe("isNativeLine", () => {
  it("says whether a shown string is the native spelling", () => {
    expect(isNativeLine(frieren, "葬送のフリーレン")).toBe(true);
    expect(isNativeLine(frieren, "Sousou no Frieren")).toBe(false);
    expect(isNativeLine({ ...frieren, native: null }, "?")).toBe(false);
  });
});

describe("needsJapaneseFace", () => {
  it("is true for kana, kanji and hangul and false for Latin text", () => {
    expect(needsJapaneseFace("葬送のフリーレン")).toBe(true);
    expect(needsJapaneseFace("ソードアート・オンライン")).toBe(true);
    expect(needsJapaneseFace("나 혼자만 레벨업")).toBe(true);
    expect(needsJapaneseFace("Sousou no Frieren")).toBe(false);
    expect(needsJapaneseFace("Frieren: Beyond Journey’s End")).toBe(false);
  });
});

describe("exampleTitle", () => {
  it("prefers a title whose three variants all differ", () => {
    const same = { english: "Bebop", romaji: "Bebop", native: "カウボーイビバップ" };
    expect(exampleTitle([same, frieren])).toBe(frieren);
  });

  it("takes any title over the sample, and the sample over nothing", () => {
    const same = { english: "Bebop", romaji: "Bebop", native: null };
    expect(exampleTitle([same])).toBe(same);
    expect(exampleTitle([])).toBe(SAMPLE_TITLE);
  });
});
