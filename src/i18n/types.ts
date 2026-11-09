import type { en } from "./en";

/** The plural forms English never needs but other languages do; a base key may carry these beside `_one`/`_other`. */
type ExtraPlural = `${string}_${"zero" | "two" | "few" | "many"}`;

type Gaps<T> = { [K in keyof T]?: T[K] extends string ? string : Gaps<T[K]> } & { [key: ExtraPlural]: string };

/** A machine-translated language: any key may be missing, and English shows in its place, but no key may be invented. */
export type PartialLocale = Gaps<typeof en>;
