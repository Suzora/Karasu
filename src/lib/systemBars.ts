/** Android's two system strips in one look's colours: the status strip under the page, the navigation strip under the bar. */
export interface SystemBars {
  /** The page's own ground, `surface-950`, which the status strip continues. */
  status: string;
  /** The bottom bar's `surface-900` in the phone shell, which the navigation strip under it continues. */
  navigation: string;
  /** Dark glyphs, for a light ground. */
  light: boolean;
}

// Copies of index.css's four palettes, since Kotlin cannot read a custom property; `tokens.test.ts` holds them to it.
const LOOKS = {
  dark: { status: "#0b0d12", navigation: "#12141a", light: false },
  light: { status: "#f4f6f8", navigation: "#ffffff", light: true },
  highDark: { status: "#050608", navigation: "#090b0f", light: false },
  highLight: { status: "#ffffff", navigation: "#ffffff", light: true },
} as const satisfies Record<string, SystemBars>;

/** `phone` is the shell with a bottom bar; the wide shell's bottom edge is the page, so both strips take its ground. */
export function systemBars(dark: boolean, contrast: "standard" | "high", phone: boolean): SystemBars {
  const look = contrast === "high" ? (dark ? LOOKS.highDark : LOOKS.highLight) : dark ? LOOKS.dark : LOOKS.light;
  return phone ? look : { ...look, navigation: look.status };
}
