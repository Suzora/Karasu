#!/usr/bin/env node
/**
 * Turns the client build into finished pages. Vite's client build leaves the
 * template with two placeholders; the SSR build exports `render(path)`; this
 * joins them and writes `index.html` (English) and `<code>/index.html` for
 * every other language, `404.html` and `sitemap.xml` into `dist/client`, which
 * is what GitHub Pages serves. A loop instead of a framework, because the site
 * is one page in many languages and has no routing.
 */
// The SSR bundle resolves react-dom/server by NODE_ENV at import time; the
// production build is the one to render with.
process.env.NODE_ENV = "production";
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SITE = path.resolve(here, "..");
const CLIENT = path.join(SITE, "dist", "client");
const SERVER = path.join(SITE, "dist", "server");
const SITE_URL = "https://suzora.github.io/Karasu/";

const template = readFileSync(path.join(CLIENT, "index.html"), "utf8");
const entry = readdirSync(SERVER).find((f) => /^entry-server\.(m?js)$/.test(f));
if (!entry) throw new Error("prerender: no entry-server bundle under dist/server");
const { render, LANGUAGES, langPath } = await import(pathToFileURL(path.join(SERVER, entry)).href);

function page(routePath, lang, dataPage) {
  const { html, head, messages } = render(routePath, lang);
  let out = template
    // the dev-only <title>; the head string carries the real one
    .replace(/\s*<title>[^<]*<\/title>/, "")
    .replace('<html lang="en"', `<html lang="${lang}"`)
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</body>", `  <script type="application/json" id="i18n">${messages}</script>\n  </body>`);
  if (dataPage) out = out.replace('<div id="root">', `<div id="root" data-page="${dataPage}">`);
  if (out.includes("<!--app-")) throw new Error("prerender: a placeholder survived");
  if (!out.includes(`<html lang="${lang}"`)) throw new Error(`prerender: <html lang> not set for ${lang}`);
  return out;
}

for (const { code } of LANGUAGES) {
  const dir = path.join(CLIENT, langPath(code));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), page("/", code));
}
writeFileSync(path.join(CLIENT, "404.html"), page("/404", "en", "404"));

const today = new Date().toISOString().slice(0, 10);
const alternates = LANGUAGES.map(
  (l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${SITE_URL}${langPath(l.code)}"/>`,
).join("\n");
const urls = LANGUAGES.map(
  (l) => `  <url>\n    <loc>${SITE_URL}${langPath(l.code)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`,
).join("\n");
writeFileSync(
  path.join(CLIENT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
);
console.log(`prerender: ${LANGUAGES.length} language pages, 404.html, sitemap.xml written`);
