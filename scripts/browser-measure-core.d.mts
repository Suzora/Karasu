// The types of `browser-measure-core.mjs` for `src/lib/browserMeasure.test.ts`; the app's tsconfig reads no JavaScript.

export const MAX_DECODED: number;

export interface Tab {
  window: number;
  tab: number;
  selected: boolean;
  hidden: boolean;
  lastAccessed: number | null;
  title: string;
  url: string;
}

export interface Profile {
  name: string;
  dir: string;
  installs: string[];
  legacyDefault: boolean;
}

export function norm(s: unknown): string;
export function distinctive(s: string): boolean;
export function relation(title: string, sessionTitle: string): "equal" | "contains" | null;
export function redactText(s: string, options?: { brands?: string[]; keepHosts?: boolean; home?: string }): string;
export function lz4Block(src: Uint8Array, size: number): Uint8Array;
export function mozLz4(bytes: Uint8Array, cap?: number): Uint8Array;
export function tabsOf(state: unknown): Tab[];
export function unvariant(v: unknown): unknown;
export function parseIni(text: string): Record<string, Record<string, string>>;
export function profilesOf(root: string, iniText: string): Profile[];
