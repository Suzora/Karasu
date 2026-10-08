import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";
import {
  compactCount,
  countdown,
  durationText,
  formatDecimal,
  formatLabel,
  formatSigned,
  fuzzyDate,
  mediaStatusLabel,
  personDate,
  sourceLabel,
} from "./format";

// Echoing stub: returns the i18n key so we can assert the lookup path.
const t = ((key: string) => key) as unknown as TFunction;
// Echoing stub with the values, so a dropped zero part is asserted rather than assumed.
const tv = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}(${JSON.stringify(params)})` : key) as unknown as TFunction;

describe("formatLabel", () => {
  it("looks up known formats by i18n key", () => {
    expect(formatLabel("TV_SHORT", t)).toBe("format.TV_SHORT");
    expect(formatLabel("MOVIE", t)).toBe("format.MOVIE");
  });

  it("title-cases unknown formats as a fallback", () => {
    expect(formatLabel("SOME_NEW_FORMAT", t)).toBe("Some New Format");
  });

  it("returns empty for null/undefined/empty", () => {
    expect(formatLabel(null, t)).toBe("");
    expect(formatLabel(undefined, t)).toBe("");
    expect(formatLabel("", t)).toBe("");
  });
});

describe("mediaStatusLabel", () => {
  it("looks up known media statuses by i18n key", () => {
    expect(mediaStatusLabel("RELEASING", t)).toBe("mediaStatus.RELEASING");
    expect(mediaStatusLabel("NOT_YET_RELEASED", t)).toBe(
      "mediaStatus.NOT_YET_RELEASED",
    );
  });

  it("title-cases unknown statuses", () => {
    expect(mediaStatusLabel("SOMETHING_ELSE", t)).toBe("Something Else");
  });

  it("returns empty for null", () => {
    expect(mediaStatusLabel(null, t)).toBe("");
  });
});

describe("sourceLabel", () => {
  it("looks up known sources by i18n key", () => {
    expect(sourceLabel("LIGHT_NOVEL", t)).toBe("source.LIGHT_NOVEL");
  });

  it("title-cases unknown sources", () => {
    expect(sourceLabel("BRAND_NEW_SOURCE", t)).toBe("Brand New Source");
  });
});

describe("fuzzyDate", () => {
  it("renders a full date", () => {
    expect(fuzzyDate({ year: 2026, month: 4, day: 4 }, "en-US")).toBe(
      "Apr 4, 2026",
    );
  });

  it("omits the day when it is unknown", () => {
    expect(fuzzyDate({ year: 2026, month: 4, day: null }, "en-US")).toBe(
      "Apr 2026",
    );
  });

  it("falls back to the year alone, and to empty without one", () => {
    expect(fuzzyDate({ year: 2026, month: null, day: null }, "en-US")).toBe(
      "2026",
    );
    expect(fuzzyDate({ year: null, month: null, day: null }, "en-US")).toBe("");
    expect(fuzzyDate(null, "en-US")).toBe("");
  });
});

describe("personDate", () => {
  it("reads a birthday without a year as day and month, and anything less as nothing", () => {
    expect(personDate({ year: null, month: 5, day: 10 }, "de")).toBe("10. Mai");
    expect(personDate({ year: null, month: 5, day: 10 }, "en-US")).toBe("May 10");
    expect(personDate({ year: null, month: 2, day: 29 }, "en-US")).toBe("Feb 29");
    expect(personDate({ year: null, month: null, day: 10 }, "de")).toBe("");
    expect(personDate({ year: null, month: 5, day: null }, "de")).toBe("");
  });

  it("is fuzzyDate once there is a year, and a media date without one stays empty", () => {
    expect(personDate({ year: 1995, month: 7, day: 23 }, "de")).toBe(fuzzyDate({ year: 1995, month: 7, day: 23 }, "de"));
    expect(fuzzyDate({ year: null, month: 5, day: 10 }, "de")).toBe("");
  });
});

describe("durationText", () => {
  it("uses at most two units, largest first, and leaves a zero second unit off", () => {
    expect(durationText(2 * 1440 + 4 * 60, tv)).toBe('time.dh({"d":2,"h":4})');
    expect(durationText(2 * 1440 + 30, tv)).toBe('time.d({"d":2})');
    expect(durationText(4 * 60 + 30, tv)).toBe('time.hm({"h":4,"m":30})');
    expect(durationText(4 * 60, tv)).toBe('time.h({"h":4})');
    expect(durationText(35, tv)).toBe('time.m({"m":35})');
  });

  it("rounds before it splits, so a fraction never reads as sixty minutes", () => {
    expect(durationText(59.6, tv)).toBe('time.h({"h":1})');
  });
});

describe("countdown", () => {
  it("is the same duration, counted down from the air time", () => {
    expect(countdown(2 * 86400 + 4 * 3600, t)).toBe("time.dh");
    expect(countdown(4 * 3600 + 30 * 60, t)).toBe("time.hm");
    expect(countdown(35 * 60, t)).toBe("time.m");
  });

  it("never counts down to zero minutes", () => {
    expect(countdown(30, tv)).toBe('time.m({"m":1})');
  });

  it("returns empty once the episode has aired", () => {
    expect(countdown(0, t)).toBe("");
    expect(countdown(-60, t)).toBe("");
  });
});

describe("formatDecimal", () => {
  it("writes the reader's separators at a fixed count of digits", () => {
    expect(formatDecimal(1700.46, "de", 1)).toBe("1.700,5");
    expect(formatDecimal(1700.46, "en", 1)).toBe("1,700.5");
    expect(formatDecimal(29, "de", 1)).toBe("29,0");
  });

  it("falls back to English for a tag Intl does not know", () => {
    expect(formatDecimal(2.5, "not a tag!", 1)).toBe("2.5");
  });
});

describe("formatSigned", () => {
  it("always writes the sign, the minus as U+2212", () => {
    expect(formatSigned(0.25, "de", 2)).toBe("+0,25");
    expect(formatSigned(-0.25, "de", 2)).toBe("−0,25");
    expect(formatSigned(-1.5, "en", 1)).toBe("−1.5");
  });

  it("writes no sign on a difference that rounds to zero", () => {
    expect(formatSigned(0.04, "en", 1)).toBe("0.0");
    expect(formatSigned(-0.04, "en", 1)).toBe("0.0");
  });
});

describe("compactCount", () => {
  it("keeps a count exact below ten thousand, as the chart always showed it", () => {
    expect(compactCount(0, "de")).toBe("0");
    expect(compactCount(995, "de")).toBe("995");
    expect(compactCount(9_999, "de")).toBe("9999");
  });

  /** German compact notation leaves thousands alone ("106.581"), so this one has to shorten them itself. */
  it("rounds to whole thousands from ten thousand up, in every language", () => {
    expect(compactCount(10_000, "de")).toBe("10k");
    expect(compactCount(21_874, "de")).toBe("22k");
    expect(compactCount(106_581, "de")).toBe("107k");
    expect(compactCount(196_515, "en")).toBe("197k");
    expect(compactCount(999_499, "de")).toBe("999k");
  });

  it("moves to millions where the thousands would round to a thousand", () => {
    expect(compactCount(999_500, "de")).toBe("1M");
    expect(compactCount(1_000_000, "en")).toBe("1M");
    expect(compactCount(1_234_567, "de")).toBe("1,2M");
    expect(compactCount(1_250_000, "en")).toBe("1.3M");
    expect(compactCount(9_940_000, "de")).toBe("9,9M");
    expect(compactCount(9_950_000, "en")).toBe("10M");
    expect(compactCount(12_345_678, "en")).toBe("12M");
  });

  it("rounds halves up at the thousands boundary", () => {
    expect(compactCount(10_499, "en")).toBe("10k");
    expect(compactCount(10_500, "en")).toBe("11k");
  });

  /** The label sits over a column a phone squeezes to a few digits' width. */
  it("never needs more than four characters", () => {
    for (const n of [9_999, 10_000, 99_999, 999_499, 999_500, 9_949_999, 99_499_999]) {
      expect(compactCount(n, "de").length).toBeLessThanOrEqual(4);
    }
  });

  it("passes a value that is not a count through rather than inventing one", () => {
    expect(compactCount(Number.NaN, "en")).toBe("NaN");
  });
});
