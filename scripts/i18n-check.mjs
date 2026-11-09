// The rules a translation is held to, shared by the coverage test and scripts/i18n-missing.mjs.

const PLURAL = /_(zero|one|two|few|many|other)$/;

/** Every leaf as a dotted path and its text. */
export function flatten(tree, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else if (value && typeof value === "object") Object.assign(out, flatten(value, path));
  }
  return out;
}

/** What i18next fills in or nests: `{{name}}`, Trans tags `<1>`, and `$t(…)`; `count` is the plural's own number. */
export function placeholders(text) {
  const found = [...text.matchAll(/\{\{\s*([^}\s,]+)[^}]*\}\}|<\/?(\d+)\/?>|\$t\(([^)]*)\)/g)].map((m) => m[1] ?? (m[2] ? `<${m[2]}>` : m[3]));
  return [...new Set(found)].sort();
}

/** The English text a translated key answers to: itself, or for an extra plural form its base's `_other`. */
function englishFor(en, key) {
  if (key in en) return en[key];
  const base = key.replace(PLURAL, "");
  return base !== key ? en[`${base}_other`] : undefined;
}

/** What is wrong with one language against English, and how much of English it covers. */
export function audit(enTree, localeTree) {
  const en = flatten(enTree);
  const locale = flatten(localeTree);
  const problems = [];
  for (const [key, text] of Object.entries(locale)) {
    const english = englishFor(en, key);
    if (english === undefined) problems.push(`${key}: not an English key`);
    else if (text.trim() === "") problems.push(`${key}: empty`);
    else {
      const want = placeholders(english).filter((p) => p !== "count");
      const got = placeholders(text).filter((p) => p !== "count");
      if (want.join() !== got.join()) problems.push(`${key}: placeholders ${got.join(" ") || "none"} where English has ${want.join(" ") || "none"}`);
    }
  }
  const missing = Object.keys(en).filter((key) => !(key in locale));
  return { problems, missing, total: Object.keys(en).length };
}
