#!/usr/bin/env node
// Writes the Android widget strings from src/i18n/native/<code>.json; --check exits 1 when a written file is stale.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "src/i18n/native");
const RES = path.join(ROOT, "src-tauri/gen/android/app/src/main/res");
const check = process.argv.includes("--check");

/** Android's resource folder for a catalog code; English is the default folder every missing language falls back to. */
export function qualifier(code) {
  if (code === "en") return "values";
  const [lang, region] = code.split("-");
  if (!region) return `values-${lang}`;
  // A script or a three-character region needs the BCP-47 form, which plain `values-xx-rYY` cannot spell.
  return region.length === 2 ? `values-${lang}-r${region.toUpperCase()}` : `values-b+${lang}+${region}`;
}

/** Android string escaping: the apostrophe and quote are syntax there, and so are a leading @ or ?. */
export function escape(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/^([@?])/, "\\$1");
}

export function xmlFor(code, catalog) {
  const rows = Object.entries(catalog)
    .filter(([key]) => key.startsWith("android."))
    .map(([key, value]) => `    <string name="${key.slice("android.".length)}">${escape(value)}</string>`);
  return `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generated from src/i18n/native/${code}.json by scripts/i18n-native.mjs; edit that file, not this one. -->\n<resources>\n${rows.join("\n")}\n</resources>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stale = [];
  for (const file of readdirSync(SOURCE).filter((f) => f.endsWith(".json")).sort()) {
    const code = file.slice(0, -5);
    const catalog = JSON.parse(readFileSync(path.join(SOURCE, file), "utf8"));
    if (!Object.keys(catalog).some((k) => k.startsWith("android."))) continue;
    const target = path.join(RES, qualifier(code), "strings_widgets.xml");
    const want = xmlFor(code, catalog);
    const have = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (have === want) continue;
    if (check) stale.push(path.relative(ROOT, target));
    else {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, want);
      console.log(`i18n-native: wrote ${path.relative(ROOT, target)}`);
    }
  }
  if (check && stale.length) {
    console.log(`i18n-native: stale, run node scripts/i18n-native.mjs: ${stale.join(", ")}`);
    process.exit(1);
  }
  if (check) console.log("i18n-native: up to date");
}
