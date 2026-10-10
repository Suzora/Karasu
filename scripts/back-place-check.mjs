#!/usr/bin/env node
// Checks in a real Chromium that Back returns each page to the place and the view it was left at; jsdom has no layout.
//
//   node scripts/back-place-check.mjs    runs the screens harness's app over its mocked backend
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, "..");
const CHROMIUM =
  process.env.CHROMIUM_PATH ??
  (process.platform === "win32"
    ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    : "/opt/pw-browsers/chromium");
if (!existsSync(CHROMIUM)) {
  console.error(`back-place-check: no browser at ${CHROMIUM} — set CHROMIUM_PATH`);
  process.exit(1);
}
const BASE = "http://localhost:5198/scripts/screens/index.html";

const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "  ok " : "FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

// Not `npx`: spawn cannot find `npx.cmd` without a shell, and a shell would make `vite.kill()` orphan the server.
let stopping = false;
const vite = spawn(process.execPath, [path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "--config", path.join(here, "screens", "vite.config.ts")], {
  cwd: ROOT,
  stdio: "ignore",
});
vite.on("error", (e) => {
  console.error(`back-place-check: could not start vite: ${e.message}`);
  process.exit(1);
});
vite.on("exit", (code) => {
  if (!stopping) {
    console.error(`back-place-check: vite exited early (${code})`);
    process.exit(1);
  }
});
const stop = (code) => {
  stopping = true;
  vite.kill();
  process.exit(code);
};
// Registered before the first await that can throw, so no failure after the spawn leaves the server on its port.
process.on("exit", () => {
  if (!stopping) vite.kill();
});
process.on("uncaughtException", (e) => {
  console.error(`back-place-check: ${e instanceof Error ? e.message : String(e)}`);
  stop(1);
});
process.on("unhandledRejection", (e) => {
  console.error(`back-place-check: ${e instanceof Error ? e.message : String(e)}`);
  stop(1);
});
process.on("SIGINT", () => stop(130));
process.on("SIGTERM", () => stop(143));

let up = false;
for (let i = 0; i < 240 && !up; i++) {
  try {
    up = (await fetch(BASE)).ok;
  } catch {}
  if (!up) await new Promise((r) => setTimeout(r, 500));
}
if (!up) {
  console.error("back-place-check: the dev server did not come up on port 5198");
  stop(1);
}
// The stylesheet is generated on its first request, which can outlast a page load; asked once here, it is cached.
await fetch("http://localhost:5198/src/app/index.css").catch(() => {});

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: CHROMIUM });

// The harness answers the genre vocabulary with nothing, so the picker would have no genre to choose; a real answer wins.
function seedGenres() {
  const internals = (window.__TAURI_INTERNALS__ ??= {});
  let real;
  const wrapped = async (cmd, args, options) => {
    const answer = await real(cmd, args, options);
    const asked = cmd === "anilist_query" && String(args?.query ?? "").includes("GenreCollection");
    if (!asked || answer?.GenreCollection?.length) return answer;
    return { GenreCollection: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Romance"], MediaTagCollection: [] };
  };
  Object.defineProperty(internals, "invoke", {
    configurable: true,
    get: () => (real ? wrapped : undefined),
    set: (fn) => {
      real = fn;
    },
  });
}

async function open(route, { phone = false, w = 1232, h = 800, view } = {}) {
  const context = await browser.newContext({
    viewport: phone ? { width: 405, height: 860 } : { width: w, height: h },
    hasTouch: phone,
    isMobile: phone,
  });
  await context.addInitScript(seedGenres);
  if (view) await context.addInitScript((v) => localStorage.setItem("karasu-list-view", JSON.stringify(v)), view);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const q = new URLSearchParams({ style: "", theme: "dark", contrast: "", android: phone ? "1" : "", route, lang: "de" });
  // Generous: a cold dev server generates the whole stylesheet before the first page can settle.
  await page.goto(`${BASE}?${q}`, { waitUntil: "networkidle", timeout: 300_000 });
  await page.waitForTimeout(1200);
  return { context, page, errors };
}

// The first element under <main> that scrolls, <main> included, and what the page shows about itself.
const probe = (page) =>
  page.evaluate(() => {
    const main = document.getElementById("main");
    const el = [main, ...main.querySelectorAll("*")].find(
      (e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4,
    );
    const field = document.querySelector("[data-page-search]");
    return {
      top: el ? Math.round(el.scrollTop) : null,
      max: el ? el.scrollHeight - el.clientHeight : null,
      hash: location.hash,
      q: field ? field.value : null,
      focused: field ? document.activeElement === field : null,
    };
  });

async function scrollTo(page, px) {
  await page.evaluate((px) => {
    const main = document.getElementById("main");
    const el = [main, ...main.querySelectorAll("*")].find(
      (e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4,
    );
    if (el) el.scrollTop = Math.min(px, el.scrollHeight - el.clientHeight);
  }, px);
  await page.waitForTimeout(400);
}

// A DOM click on a link the scroller shows whole: a pointer click would first scroll it into view and move the place.
async function openLink(page) {
  return page.evaluate(() => {
    const main = document.getElementById("main");
    const el = [main, ...main.querySelectorAll("*")].find(
      (e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4,
    );
    const box = (el ?? main).getBoundingClientRect();
    const links = [...document.querySelectorAll('#main a[href^="#/media/"], #main a[href^="#/thread/"]')];
    const a = links.find((l) => {
      const r = l.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top >= box.top + 4 && r.bottom <= box.bottom - 4;
    });
    if (!a) return null;
    a.click();
    return a.getAttribute("href");
  });
}

/** Scroll, open a link, go Back: the same view at the same place, within the rounding of a fractional row. */
async function roundTrip(name, opts, prepare) {
  const { context, page, errors } = await open(opts.route, opts);
  await prepare?.(page);
  const before = await probe(page);
  // Each case is sized to scroll, so a page that does not is a setup that broke, never a pass.
  if (before.top === null || before.max < 40 || !(before.top > 0)) {
    check(name, false, `nothing scrolled (top ${before.top}, max ${before.max}) — the page did not load or no longer overflows`);
    await context.close();
    return;
  }
  const opened = await openLink(page);
  if (!opened) {
    check(name, false, "no link on screen to open");
    await context.close();
    return;
  }
  await page.waitForTimeout(1200);
  await page.goBack();
  await page.waitForTimeout(1500);
  const after = await probe(page);
  const same = after.hash === before.hash && after.q === before.q && Math.abs(after.top - before.top) <= 4;
  check(name, same && errors.length === 0, `${before.hash} at ${before.top} → ${opened} → ${after.hash} at ${after.top}${errors.length ? `; ${errors[0]}` : ""}`);
  await context.close();
}

await roundTrip("list, rows", { route: "/list", view: { ANIME: "rows" } }, (p) => scrollTo(p, 700));
await roundTrip("list, cover grid", { route: "/list", h: 560 }, (p) => scrollTo(p, 420));
await roundTrip("list, phone", { route: "/list", phone: true }, (p) => scrollTo(p, 1400));
await roundTrip("search", { route: "/search", h: 520 }, async (p) => {
  await p.getByRole("searchbox").fill("Frieren");
  await p.waitForTimeout(1500);
  await scrollTo(p, 500);
});
// Typed, then a genre, then a status: the order the address is built in is the one Back has to find again.
await roundTrip("search, genre then status", { route: "/search", h: 520 }, async (p) => {
  await p.getByRole("searchbox").fill("Frieren");
  await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Genre", exact: true }).click();
  await p.getByRole("button", { name: "Fantasy", exact: true }).click();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(800);
  await p.getByLabel("Status", { exact: true }).selectOption("FINISHED");
  await p.waitForTimeout(1500);
  await scrollTo(p, 500);
});
await roundTrip("seasonal, a past season", { route: "/seasonal", h: 700 }, async (p) => {
  await p.getByRole("button", { name: "Vorherige Saison" }).click();
  await p.waitForTimeout(1500);
  await scrollTo(p, 500);
});
await roundTrip("overview, in <main>", { route: "/", h: 600 }, (p) => scrollTo(p, 900));
await roundTrip("calendar", { route: "/calendar", h: 340 }, (p) => scrollTo(p, 40));
await roundTrip("local library", { route: "/library", h: 600 }, (p) => scrollTo(p, 300));
await roundTrip("forum", { route: "/forum", h: 600 }, (p) => scrollTo(p, 400));

// Two entries of one open page: a link to it starts it at the top, and Back brings the first entry's season and place.
{
  const { context, page } = await open("/seasonal", { h: 700 });
  await page.getByRole("button", { name: "Vorherige Saison" }).click();
  await page.waitForTimeout(1500);
  await scrollTo(page, 500);
  const before = await probe(page);
  await page.getByRole("link", { name: "Saison", exact: true }).first().click();
  await page.waitForTimeout(1500);
  const fresh = await probe(page);
  await page.goBack();
  await page.waitForTimeout(1500);
  const after = await probe(page);
  check("seasonal, a link to the open page starts at the top", fresh.top === 0 && fresh.hash !== before.hash, `${fresh.hash} at ${fresh.top}`);
  check("seasonal, Back to its earlier entry", after.hash === before.hash && Math.abs(after.top - before.top) <= 4, `${before.hash} at ${before.top} → ${after.hash} at ${after.top}`);
  await context.close();
}

// "/" on a search that Back restored focuses the field and keeps the query, rather than starting a new search.
{
  const { context, page } = await open("/search", { h: 700 });
  await page.getByRole("searchbox").fill("Frieren");
  await page.waitForTimeout(1500);
  await openLink(page);
  await page.waitForTimeout(1200);
  await page.goBack();
  await page.waitForTimeout(1500);
  await page.keyboard.press("/");
  await page.waitForTimeout(500);
  const after = await probe(page);
  check('search, "/" refines a restored search', after.q === "Frieren" && after.focused === true, `query "${after.q}", focused ${after.focused}`);
  await context.close();
}

await browser.close();
console.log(failures.length ? `\nback-place-check: ${failures.length} failed` : "\nback-place-check: ok");
stop(failures.length ? 1 : 0);
