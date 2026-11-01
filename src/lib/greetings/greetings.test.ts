import { describe, expect, it } from "vitest";
import de from "./de";
import en from "./en";
import { allLines, candidates, fillGreeting, withoutName, type GreetingFacts } from "./pick";
import { CATEGORIES, NEED_FIELDS, type DayWindow, type GreetingLine } from "./types";

const options = (l: GreetingLine) => ({ ...l, text: undefined });
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

const facts: GreetingFacts = {
  airingToday: { title: "A Fairly Long Anime Title", at: 0 },
  behind: { title: "A Fairly Long Anime Title", n: 12 },
  nearlyDone: { title: "A Fairly Long Anime Title", n: 3 },
  lastOne: { title: "A Fairly Long Anime Title" },
  week: 24,
  listEmpty: false,
  completed: 1250,
  manga: "A Fairly Long Manga Title",
  awayDays: 14,
};

describe.each([
  ["de", de],
  ["en", en],
])("the %s catalogue", (_, catalogue) => {
  it("has twenty lines in each of the thirty categories", () => {
    expect(Object.keys(catalogue).sort()).toEqual([...CATEGORIES].sort());
    for (const cat of CATEGORIES) expect(catalogue[cat], cat).toHaveLength(20);
  });

  it("uses only the placeholders its needs provide", () => {
    for (const l of allLines(catalogue)) {
      const allowed = new Set(["name", ...(l.need ?? []).flatMap((n) => NEED_FIELDS[n])]);
      for (const p of placeholders(l.text)) expect(allowed.has(p), `${l.id}: {${p}}`).toBe(true);
    }
  });

  it("names at most one title per line", () => {
    const titled = ["airingToday", "behind", "nearlyDone", "lastOne"];
    for (const l of allLines(catalogue)) expect((l.need ?? []).filter((n) => titled.includes(n)).length, l.id).toBeLessThanOrEqual(1);
  });

  it("stays short enough for the banner once filled", () => {
    const ctx = { now: new Date(2026, 0, 1, 9), named: true, facts };
    for (const l of allLines(catalogue)) {
      const text = fillGreeting(l, ctx, "Abcdefghijklmnop", () => "16h 34m");
      expect(text.length, `${l.id}: ${text}`).toBeLessThanOrEqual(84);
      expect(text, l.id).not.toMatch(/\{|\}/);
    }
  });

  it("reads cleanly without a name wherever a line is not marked named", () => {
    for (const l of allLines(catalogue)) {
      if (l.named) continue;
      const plain = withoutName(l.text);
      expect(plain, `${l.id}: ${l.text}`).not.toBeNull();
      expect(plain, l.id).not.toMatch(/ {2}|,[.!?]| [.!?,]|^[,\s]/);
    }
  });

  it("offers every part of the day at least forty lines with no data and no name", () => {
    const empty: GreetingFacts = { week: 0, listEmpty: true, completed: 0, awayDays: 0 };
    const hours: Record<DayWindow, number> = { night: 2, early: 6, morning: 9, noon: 12, afternoon: 15, evening: 19, late: 23 };
    for (const [window, hour] of Object.entries(hours)) {
      const pool = candidates(allLines(catalogue), { now: new Date(2026, 5, 17, hour), named: false, facts: empty });
      expect(pool.length, window).toBeGreaterThanOrEqual(40);
    }
  });
});

describe("the two catalogues", () => {
  it("match line for line in everything but the words", () => {
    const d = allLines(de);
    const e = allLines(en);
    expect(e.map((l) => l.id)).toEqual(d.map((l) => l.id));
    d.forEach((l, i) => expect(options(e[i]), l.id).toEqual(options(l)));
  });

  it("use the same placeholders in each pair", () => {
    const d = allLines(de);
    const e = allLines(en);
    d.forEach((l, i) => expect(placeholders(e[i].text).sort(), l.id).toEqual(placeholders(l.text).sort()));
  });
});
