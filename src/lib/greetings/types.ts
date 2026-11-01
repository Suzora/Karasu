/** The seven parts of the day a greeting can belong to, by the local hour. */
export type DayWindow = "night" | "early" | "morning" | "noon" | "afternoon" | "evening" | "late";

/** What a greeting needs from the lists; each one fills the placeholders `NEED_FIELDS` names. */
export type Need =
  | "airingToday"
  | "behind"
  | "nearlyDone"
  | "lastOne"
  | "newThisWeek"
  | "nothingThisWeek"
  | "completed"
  | "round"
  | "reading"
  | "away"
  | "seasonStart";

export interface LineOptions {
  /** The parts of the day it fits; every one when absent. */
  w?: DayWindow[];
  /** Weekdays as `Date.getDay` counts them, Sunday 0. */
  d?: number[];
  /** Months from 1 to 12. */
  m?: number[];
  /** Calendar days as `MM-DD`. */
  on?: string[];
  need?: Need[];
  /** The name sits inside the sentence, so the line cannot be said without one. */
  named?: boolean;
}

export interface GreetingLine extends LineOptions {
  text: string;
}

export const CATEGORIES = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o",
  "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "aa", "ab", "ac", "ad",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type Catalogue = Record<Category, GreetingLine[]>;

/** The placeholders each need fills, so a line can only use what its needs provide. */
export const NEED_FIELDS: Record<Need, string[]> = {
  airingToday: ["title", "when"],
  behind: ["title", "n"],
  nearlyDone: ["title", "n"],
  lastOne: ["title"],
  newThisWeek: ["count"],
  nothingThisWeek: [],
  completed: ["done"],
  round: ["done"],
  reading: ["manga"],
  away: ["days"],
  seasonStart: [],
};

export function line(text: string, o: LineOptions = {}): GreetingLine {
  return { text, ...o };
}

/** Day-part shorthands the catalogues share. */
export const W = {
  night: ["night"],
  early: ["early"],
  morning: ["morning"],
  noon: ["noon"],
  afternoon: ["afternoon"],
  evening: ["evening"],
  late: ["late"],
  am: ["early", "morning"],
  day: ["morning", "noon", "afternoon"],
  pm: ["afternoon", "evening"],
  eve: ["evening", "late"],
  dark: ["late", "night"],
} satisfies Record<string, DayWindow[]>;

/** Season shorthands as months. */
export const M = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};
