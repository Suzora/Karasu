// The types of `i18n-native.mjs` for `src/lib/i18nNative.test.ts`; the app's tsconfig reads no JavaScript.
export function qualifier(code: string): string;
/** A text escaped for an Android string resource. */
export function escape(text: string): string;
/** The strings_widgets.xml a catalog writes. */
export function xmlFor(code: string, catalog: Record<string, string>): string;
