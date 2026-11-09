#!/usr/bin/env node
// What each language still lacks against English: `--all` prints a table, `<code>` the missing texts as JSON.
//   node scripts/i18n-missing.mjs --all
//   node scripts/i18n-missing.mjs fr > /tmp/fr-missing.json
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { audit, flatten } from "./i18n-check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = async (file) => (await import(pathToFileURL(path.join(ROOT, file)).href));

const { en } = await load("src/i18n/en.ts");
// The registry is TypeScript too; Node strips the types, and Intl names the languages as the app does.
const { LANGUAGES } = await load("src/lib/languages.ts");

async function localeOf(code) {
  if (code === "en") return en;
  if (code === "de") return (await load("src/i18n/de.ts")).de;
  const file = `src/i18n/locales/${code}.ts`;
  return existsSync(path.join(ROOT, file)) ? (await load(file)).default : {};
}

const arg = process.argv[2];
if (arg === "--all" || !arg) {
  for (const { code } of LANGUAGES) {
    const { problems, missing, total } = audit(en, await localeOf(code));
    const done = (((total - missing.length) / total) * 100).toFixed(1).padStart(5);
    console.log(`${code.padEnd(8)} ${done} %  ${String(missing.length).padStart(5)} missing${problems.length ? `  ${problems.length} problem(s)` : ""}`);
  }
} else {
  const flat = flatten(en);
  const { missing } = audit(en, await localeOf(arg));
  console.log(JSON.stringify(Object.fromEntries(missing.map((key) => [key, flat[key]])), null, 1));
}
