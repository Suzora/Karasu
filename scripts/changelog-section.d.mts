// The types of `changelog-section.mjs` for `src/lib/changelog.test.ts`; the app's tsconfig reads no JavaScript.

export const MARKER: RegExp;
export const UNRELEASED: string;

export interface Entry {
  group: string;
  text: string;
}

export function findSection(file: string): { start: number; end: number } | null;
export function addEntries(file: string, entries: Entry[], through: string): string;
