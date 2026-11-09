// The types of `i18n-check.mjs` for `src/lib/i18nCoverage.test.ts`; the app's tsconfig reads no JavaScript.

export function flatten(tree: object, prefix?: string): Record<string, string>;
export function placeholders(text: string): string[];
export function audit(en: object, locale: object): { problems: string[]; missing: string[]; total: number };
