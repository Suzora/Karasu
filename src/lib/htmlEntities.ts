/** HTML entity decoding shared by both text parsers; named ones ask the browser, so no copied table can drift from it. */

/** A table to answer from instead of the browser, for the node tests, which have no DOM; the app never sets one. */
let table: Readonly<Record<string, string>> | null = null;
const decoded = new Map<string, string | null>();
let probe: HTMLTextAreaElement | null = null;

export function setEntityTable(entities: Readonly<Record<string, string>> | null): void {
  table = entities;
  decoded.clear();
}

/** One named entity through a detached textarea, whose content the parser decodes and never turns into markup. */
function named(body: string): string | null {
  if (table) return Object.prototype.hasOwnProperty.call(table, body) ? table[body] : null;
  const known = decoded.get(body);
  if (known !== undefined) return known;
  if (typeof document === "undefined") return null;
  probe ??= document.createElement("textarea");
  probe.innerHTML = `&${body};`;
  const text = probe.value;
  // Unchanged is no entity; a longer answer ending in ";" is a legacy prefix ("&ampx;" read as "&x;"), not this name.
  const out = text === `&${body};` || (text.length > 1 && text.endsWith(";")) ? null : text;
  decoded.set(body, out);
  return out;
}

/** Sticky and semicolon-required, so callers match at an explicit index and `AT&T` stays the text it is. */
export const ENTITY_RE = /&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/y;

/** Decodes one entity body (the part between `&` and `;`), or returns null to leave it as literal text. */
export function decodeEntity(body: string): string | null {
  if (body.startsWith("#")) {
    const hex = body[1] === "x" || body[1] === "X";
    const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
    // Surrogates and out-of-range values would produce a lone half or throw.
    if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return null;
    if (code >= 0xd800 && code <= 0xdfff) return null;
    return String.fromCodePoint(code);
  }
  return named(body);
}
