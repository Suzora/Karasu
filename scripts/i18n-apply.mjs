#!/usr/bin/env node
// Merges flat translations (`{"nav.myProfile": "…"}`) into src/i18n/locales/<code>.ts, in English's key order.
//   node scripts/i18n-apply.mjs fr /tmp/fr-part1.json
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { flatten } from "./i18n-check.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [code, ...inputs] = process.argv.slice(2);
if (!code || inputs.length === 0) throw new Error("usage: i18n-apply.mjs <code> <flat.json>…");

const { en } = await import(pathToFileURL(path.join(ROOT, "src/i18n/en.ts")).href);
const target = path.join(ROOT, `src/i18n/locales/${code}.ts`);
const current = existsSync(target) ? flatten((await import(`${pathToFileURL(target).href}?t=${process.pid}`)).default) : {};
for (const input of inputs) Object.assign(current, JSON.parse(readFileSync(input, "utf8")));

const PLURAL = /_(zero|one|two|few|many|other)$/;
const order = Object.keys(flatten(en));
const rank = (key) => {
  const at = order.indexOf(key);
  if (at !== -1) return [at, 0];
  const base = key.replace(PLURAL, "");
  return [Math.max(order.indexOf(`${base}_other`), order.indexOf(`${base}_one`), 0), 1];
};
const keys = Object.keys(current).sort((a, b) => {
  const [ra, sa] = rank(a);
  const [rb, sb] = rank(b);
  return ra - rb || sa - sb || a.localeCompare(b);
});

const tree = {};
for (const key of keys) {
  const parts = key.split(".");
  let node = tree;
  for (const part of parts.slice(0, -1)) node = node[part] ??= {};
  node[parts.at(-1)] = current[key];
}

const render = (node, depth) =>
  Object.entries(node)
    .map(([k, v]) => {
      const pad = "  ".repeat(depth);
      const name = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
      return typeof v === "string" ? `${pad}${name}: ${JSON.stringify(v)},` : `${pad}${name}: {\n${render(v, depth + 1)}\n${pad}},`;
    })
    .join("\n");

writeFileSync(
  target,
  `import type { PartialLocale } from "../types";\n\n/** ${code}, machine-translated from English; a missing key shows in English. */\nconst locale: PartialLocale = {\n${render(tree, 1)}\n};\n\nexport default locale;\n`,
);
console.log(`i18n-apply: ${code} holds ${keys.length} texts`);
