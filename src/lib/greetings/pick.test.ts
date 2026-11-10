import { describe, expect, it } from "vitest";
import { entry, media } from "@/test/fixtures";
import type { MediaListEntry } from "@/api/types";
import { candidates, dayWindow, fillGreeting, greetingFacts, pickGreeting, type GreetingContext, type PickedLine } from "./pick";

const now = new Date(2026, 9, 14, 20, 0);
const secs = now.getTime() / 1000;
const title = (e: MediaListEntry) => e.media.title.english ?? "";
const facts = (anime: MediaListEntry[], nameable: (e: MediaListEntry) => boolean = () => true) =>
  greetingFacts(anime, [], now, 0, title, nameable);
const ctx = (over: Partial<GreetingContext> = {}): GreetingContext => ({ now, named: true, facts: facts([]), ...over });
const line = (id: string, over: Partial<PickedLine> = {}): PickedLine => ({ id, text: "Hallo, {name}.", ...over });

describe("dayWindow", () => {
  it("cuts the day at the agreed hours", () => {
    expect([0, 4, 5, 7, 8, 10, 11, 13, 14, 17, 18, 21, 22, 23].map(dayWindow)).toEqual([
      "night", "night", "early", "early", "morning", "morning", "noon", "noon",
      "afternoon", "afternoon", "evening", "evening", "late", "late",
    ]);
  });
});

describe("greetingFacts", () => {
  const airing = entry({ media: media({ title: { romaji: "a", english: "Tonight", native: null }, episodes: 12, nextAiringEpisode: { episode: 5, airingAt: secs + 3600 } }), progress: 4 });

  it("finds what airs before midnight", () => {
    expect(facts([airing]).airingToday).toEqual({ title: "Tonight", at: secs + 3600 });
  });

  it("never names a title the filter would hide or blur", () => {
    expect(facts([airing], () => false).airingToday).toBeUndefined();
  });

  it("cuts a long title", () => {
    const long = entry({ ...airing, media: { ...airing.media, title: { romaji: "a", english: "An Extraordinarily Long Title For A Banner", native: null } } });
    expect(facts([long]).airingToday?.title).toBe("An Extraordinarily Long Tit…");
  });
});

describe("candidates", () => {
  it("keeps a line only in its part of the day, on its date and with its data", () => {
    const lines = [
      line("evening", { w: ["evening"] }),
      line("morning", { w: ["morning"] }),
      line("today", { on: ["10-14"] }),
      line("tomorrow", { on: ["10-15"] }),
      line("airing", { need: ["airingToday"], text: "{title}, {name}." }),
    ];
    expect(candidates(lines, ctx()).map((l) => l.id)).toEqual(["evening", "today"]);
  });

  it("leaves out a named line when there is no name", () => {
    const lines = [line("plain"), line("named", { text: "Die Stadt schläft, {name} nicht.", named: true })];
    expect(candidates(lines, ctx({ named: false })).map((l) => l.id)).toEqual(["plain"]);
  });
});

describe("pickGreeting", () => {
  const pool = [line("a"), line("b"), line("c")];

  it("is deterministic for a given draw", () => {
    expect(pickGreeting(pool, [], () => 0)?.id).toBe("a");
    expect(pickGreeting(pool, [], () => 0.99)?.id).toBe("c");
  });

  it("never repeats a recent line while others remain", () => {
    for (const r of [0, 0.3, 0.6, 0.99]) expect(pickGreeting(pool, ["a", "b"], () => r)?.id).toBe("c");
  });

  it("falls back to the whole pool once everything was shown", () => {
    expect(pickGreeting(pool, ["a", "b", "c"], () => 0)?.id).toBe("a");
  });

  it("gives a dated line more weight than a plain one", () => {
    const dated = [line("plain"), line("dated", { on: ["10-14"] })];
    expect(pickGreeting(dated, [], () => 0.3)?.id).toBe("dated");
  });
});

describe("fillGreeting", () => {
  it("fills the title its need names and the countdown", () => {
    const c = ctx({ facts: { ...facts([]), airingToday: { title: "Tonight", at: secs + 600 } } });
    expect(fillGreeting(line("x", { text: "{title} in {when}, {name}.", need: ["airingToday"] }), c, "Kyusetzu", (s) => `${s}s`)).toBe("Tonight in 600s, Kyusetzu.");
  });

  it("drops the name for a profile without one", () => {
    expect(fillGreeting(line("x", { text: "Ach, {name}. Schon wieder." }), ctx({ named: false }), null, String)).toBe("Ach. Schon wieder.");
  });
});
