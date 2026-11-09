/** The pseudo-locale qps: every text accented, 40% longer and bracketed, so a text missing `t()` or a cramped box shows. */

const ACCENT: Record<string, string> = {
  a: "á", e: "é", i: "í", o: "ö", u: "ü", y: "ý", c: "ç", n: "ñ", s: "š", z: "ž",
  A: "Á", E: "É", I: "Í", O: "Ö", U: "Ü", Y: "Ý", C: "Ç", N: "Ñ", S: "Š", Z: "Ž",
};

/** Placeholders, Trans tags and nesting stay exactly as written, since i18next must still find them. */
const KEEP = /(\{\{[^}]+\}\}|<\/?\d+\/?>|\$t\([^)]*\))/;

export function pseudoText(text: string): string {
  const parts = text.split(KEEP);
  const body = parts.map((p, i) => (i % 2 === 1 ? p : p.replace(/[A-Za-z]/g, (c) => ACCENT[c] ?? c))).join("");
  const letters = text.replace(new RegExp(KEEP, "g"), "").length;
  // The padding comes as short words, since one long run would be a word no real language writes and overflow by itself.
  const pad = Array.from({ length: Math.ceil((letters * 0.4) / 5) }, () => "~~~~").join(" ");
  return `⟦${body}${pad ? ` ${pad}` : ""}⟧`;
}

type Tree = { [key: string]: string | Tree };

export function pseudoTree(tree: Tree): Tree {
  return Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, typeof v === "string" ? pseudoText(v) : pseudoTree(v)]));
}
