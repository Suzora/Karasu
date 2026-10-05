#!/usr/bin/env node
// Renders the real app, shell included, over a mocked backend: screenshots, comparison boards, motion clips, pixel hashes.
//
//   node scripts/screens.mjs shoot [--only d3-detail,p1-liste] [--styles ,a,b] [--themes dark,light,hc-dark,hc-light]
//   node scripts/screens.mjs board scripts/screens/.out/boards/spec.json
//   node scripts/screens.mjs clip [--styles ,a]           one webm per style, then all of them side by side
//   node scripts/screens.mjs hash [--out scripts/screens/.out/before.json]   still frames at a fixed clock, one sha256 each
//   node scripts/screens.mjs hash --compare scripts/screens/.out/before.json exit 1 when any screen's pixels changed
//   node scripts/screens.mjs overflow [--only p2-detail]   exit 1 when a screen's <main> scrolls sideways, naming why
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(here);
const DIR = path.join(here, "screens");
const CACHE = path.join(DIR, ".cache");
const OUT = path.join(DIR, ".out");
const BASE = "http://localhost:5198/scripts/screens/index.html";
const CHROMIUM = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
/** The clock every still is taken at, so countdowns and dates render the same on every run. */
const CLOCK = new Date("2026-09-25T10:00:00Z");

const [command, ...rest] = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = rest.indexOf(name);
  return i === -1 ? fallback : rest[i + 1];
};
const list = (name, fallback) => flag(name, fallback).split(",");

/** Each screen: a route, a viewport, and what to do before the picture; the ids name the files. */
const toCard = (title) => (p) =>
  p.evaluate((t) => {
    const heading = [...document.querySelectorAll("h2, h3")].find((h) => h.textContent?.trim() === t);
    (heading?.closest(".rounded-panel") ?? heading)?.scrollIntoView({ block: "start" });
  }, title);
/** Centres a setting the way a deep link lands on it, for the screens that start from one. */
const landOn = (setting, card) => async (p) => {
  await p.waitForTimeout(400);
  const found = await p.evaluate((s) => {
    const el = document.querySelector(`[data-setting="${s}"]`);
    el?.scrollIntoView({ block: "center" });
    return el !== null;
  }, setting);
  if (!found && card) await toCard(card)(p);
};
/** Opens the detail page's cast fold and scrolls it to the top, where its rows can be judged. */
const openCast = async (p) => {
  await p.getByRole("button", { name: "Besetzung & Staff" }).click();
  await p.waitForTimeout(600);
  await toCard("Besetzung & Staff")(p);
};
/** Steps the Overview's hero to its second title, which under `no-banner` has neither a banner nor a relative to lend one. */
const secondSlide = (p) => p.getByRole("button", { name: "Mushoku Tensei: Jobless Reincarnation Season 3", exact: true }).first().click();
const statusButton = (p) => p.locator('[title="Status ändern"], [title="Change status"], [title="Status wählen"], [title="Choose a status"]').first();
export const SCREENS = [
  { id: "d1-uebersicht", w: 1232, h: 800, route: "/" },
  { id: "d2-liste", w: 1232, h: 800, route: "/list", act: (p) => p.locator("[data-media-id]").nth(2).click({ button: "right" }) },
  { id: "d3-detail", w: 1232, h: 800, route: "/media/178789", act: (p) => statusButton(p).click() },
  { id: "d4-einstellungen", w: 1232, h: 800, route: "/settings?pane=appearance" },
  { id: "d56-hinzufuegen", w: 1232, h: 800, route: "/media/178789", mock: "off-list", act: (p) => statusButton(p).click() },
  { id: "p41-hinzufuegen", w: 405, h: 860, phone: true, route: "/media/178789", mock: "off-list", act: (p) => statusButton(p).click() },
  { id: "d57-statusfarbe", w: 1232, h: 900, route: "/settings?pane=appearance", mock: "status-low", act: async (p) => {
    await p.getByRole("button", { name: /^Pausiert/ }).first().click();
    await p.getByText("Farben der Listenstatus").evaluate((el) => el.scrollIntoView({ block: "start" }));
  } },
  { id: "d58-statusfarben", w: 1232, h: 800, route: "/settings?pane=appearance", act: (p) => p.getByText("Farben der Listenstatus").evaluate((el) => el.scrollIntoView({ block: "start" })) },
  { id: "p42-statusfarbe", w: 405, h: 1000, phone: true, route: "/settings?pane=appearance", mock: "status-low", act: async (p) => {
    await p.getByRole("button", { name: /^Pausiert/ }).first().click();
    await p.getByText("Farben der Listenstatus").evaluate((el) => el.scrollIntoView({ block: "start" }));
  } },
  {
    id: "d5-palette",
    w: 1232,
    h: 800,
    route: "/list",
    act: async (p) => {
      const text = "Frieren: Beyond Journey's End auf 8 gesetzt";
      await p.evaluate((t) => window.__toast.getState().show({ kind: "success", text: t, action: { label: "Rückgängig", run: () => {} } }), text);
      await p.keyboard.press("Control+k");
      await p.keyboard.type("stat");
    },
  },
  { id: "p1-liste", w: 405, h: 860, phone: true, route: "/list" },
  { id: "p2-detail", w: 405, h: 860, phone: true, route: "/media/178789" },
  { id: "p43-detail-ohne-banner", w: 405, h: 1600, phone: true, route: "/media/178789", mock: "no-banner" },
  { id: "p44-detail-schmal", w: 360, h: 1600, phone: true, route: "/media/178789" },
  { id: "p45-uebersicht-ohne-banner", w: 405, h: 860, phone: true, route: "/", mock: "no-banner" },
  { id: "p46-besetzung", w: 405, h: 1800, phone: true, route: "/media/178789", act: openCast },
  { id: "p47-besetzung-schmal", w: 320, h: 1800, phone: true, route: "/media/178789", act: openCast },
  { id: "p48-detail-reihe", w: 405, h: 860, phone: true, route: "/media/195516" },
  { id: "p49-uebersicht-farbe", w: 405, h: 860, phone: true, route: "/", mock: "no-banner", act: secondSlide },
  { id: "p50-detail-laedt", w: 405, h: 860, phone: true, route: "/media/178789", mock: "detail-pending" },
  { id: "p51-titelsprache", w: 405, h: 860, phone: true, route: "/settings?pane=appearance&setting=titleLanguage", act: landOn("titleLanguage", "Sprache & Bewegung") },
  { id: "p52-liste-original", w: 405, h: 860, phone: true, route: "/list", mock: "titles-native" },
  { id: "p53-hintergrund", w: 405, h: 860, phone: true, route: "/settings?pane=account", act: toCard("Benachrichtigungen im Hintergrund") },
  { id: "d59-detail-reihe", w: 1232, h: 800, route: "/media/195516" },
  { id: "d60-detail-ohne-banner", w: 1232, h: 800, route: "/media/178789", mock: "no-banner" },
  { id: "d61-uebersicht-ohne-banner", w: 1232, h: 800, route: "/", mock: "no-banner" },
  { id: "d62-uebersicht-farbe", w: 1232, h: 800, route: "/", mock: "no-banner", act: secondSlide },
  { id: "d63-detail-laedt", w: 1232, h: 800, route: "/media/178789", mock: "detail-pending" },
  { id: "d64-detail-schmal", w: 768, h: 700, route: "/media/178789", act: toCard("So bewertet die Community") },
  { id: "d65-detail-mittel", w: 1000, h: 700, route: "/media/178789", act: toCard("So bewertet die Community") },
  { id: "d66-detail-breit", w: 1232, h: 700, route: "/media/178789", act: toCard("So bewertet die Community") },
  { id: "d67-titelsprache", w: 1232, h: 800, route: "/settings?pane=appearance&setting=titleLanguage", act: landOn("titleLanguage", "Sprache & Bewegung") },
  { id: "d68-liste-romaji", w: 1232, h: 800, route: "/list", mock: "titles-romaji" },
  { id: "d69-detail-original", w: 1232, h: 800, route: "/media/178789", mock: "titles-native" },
  { id: "d70-erkennung-original", w: 1232, h: 800, route: "/list", mock: "titles-native", playing: true },
  { id: "p3-editor", w: 405, h: 860, phone: true, route: "/media/178789", act: (p) => statusButton(p).click() },
  { id: "p4-mehr", w: 405, h: 860, phone: true, route: "/", act: (p) => p.getByText("Mehr", { exact: true }).last().click() },
  { id: "p5-einstellungen", w: 405, h: 860, phone: true, route: "/settings" },
  { id: "p19-darstellung", w: 405, h: 2000, phone: true, route: "/settings?pane=appearance" },
  { id: "d32-darstellung-lang", w: 1232, h: 2000, route: "/settings?pane=appearance" },
  { id: "d33-konto-lang", w: 1232, h: 2400, route: "/settings?pane=account" },
  { id: "p20-konto-lang", w: 405, h: 3600, phone: true, route: "/settings?pane=account" },
  { id: "d34-erkennung-lang", w: 1232, h: 2400, route: "/settings?pane=detection" },
  { id: "d35-bibliothek-lang", w: 1232, h: 2000, route: "/settings?pane=library" },
  { id: "d36-desktop-lang", w: 1232, h: 2400, route: "/settings?pane=desktop" },
  { id: "d37-daten-lang", w: 1232, h: 2400, route: "/settings?pane=data" },
  { id: "d38-erweitert-lang", w: 1232, h: 2000, route: "/settings?pane=advanced" },
  { id: "p21-erkennung-lang", w: 405, h: 3600, phone: true, route: "/settings?pane=detection" },
  { id: "p22-daten-lang", w: 405, h: 3000, phone: true, route: "/settings?pane=data" },
  { id: "p23-erweitert-lang", w: 405, h: 2400, phone: true, route: "/settings?pane=advanced" },
  { id: "p24-konto-anilist", w: 405, h: 1300, phone: true, route: "/settings?pane=account", act: toCard("Kontoeinstellungen") },
  { id: "p25-jellyfin", w: 405, h: 1800, phone: true, route: "/settings?pane=detection", act: toCard("Jellyfin-Server") },
  { id: "p26-jellyfin-aus", w: 405, h: 1500, phone: true, route: "/settings?pane=detection", mock: "jellyfin-out", act: toCard("Jellyfin-Server") },
  { id: "p27-backups", w: 405, h: 800, phone: true, route: "/settings?pane=data", act: toCard("Backups") },
  { id: "p28-erkennung-schmal", w: 320, h: 900, phone: true, route: "/settings?pane=detection", act: toCard("Mediensitzungen") },
  { id: "d41-social", w: 1232, h: 800, route: "/social" },
  { id: "d42-profil", w: 1232, h: 800, route: "/user/Kyusetzu" },
  { id: "d43-forum", w: 1232, h: 800, route: "/forum" },
  { id: "d44-thread", w: 1232, h: 1100, route: "/thread/44" },
  { id: "d45-aktivitaet", w: 1232, h: 800, route: "/activity/5002" },
  { id: "p29-social", w: 405, h: 860, phone: true, route: "/social" },
  { id: "p30-profil", w: 405, h: 860, phone: true, route: "/user/Mikan" },
  { id: "p31-forum", w: 405, h: 860, phone: true, route: "/forum" },
  { id: "p32-thread", w: 405, h: 1400, phone: true, route: "/thread/44" },
  { id: "p35-editor-mehr", w: 405, h: 860, phone: true, route: "/social", act: (p) => p.getByRole("button", { name: "Weitere Formatierungen" }).click() },
  { id: "p33-profil-selbst", w: 405, h: 860, phone: true, route: "/user/Kyusetzu" },
  { id: "p34-profil-lang", w: 405, h: 860, phone: true, route: "/user/TsubameNoYume" },
  { id: "d46-statistik", w: 1232, h: 1600, route: "/stats" },
  { id: "p40-statistik-schmal", w: 320, h: 2000, phone: true, route: "/stats" },
  { id: "d48-stat-bewertungen", w: 1232, h: 1400, route: "/stats", act: (p) => p.getByRole("tab", { name: "Bewertungen" }).click() },
  { id: "d49-stat-jahre", w: 1232, h: 1400, route: "/stats", act: (p) => p.getByRole("tab", { name: "Jahre" }).click() },
  { id: "d50-stat-genres", w: 1232, h: 1800, route: "/stats", act: (p) => p.getByRole("tab", { name: "Genres & Tags" }).click() },
  { id: "d51-stat-mitwirkende", w: 1232, h: 1600, route: "/stats", act: (p) => p.getByRole("tab", { name: "Mitwirkende & Studios" }).click() },
  { id: "d52-bibliothek", w: 1232, h: 1000, route: "/library" },
  { id: "d53-figur", w: 1232, h: 1000, route: "/character/41" },
  { id: "d54-staff", w: 1232, h: 1000, route: "/staff/500" },
  { id: "d55-ueber", w: 1232, h: 1000, route: "/about" },
  { id: "p38-figur", w: 405, h: 1400, phone: true, route: "/character/41" },
  { id: "p39-ueber", w: 405, h: 1400, phone: true, route: "/about" },
  { id: "d47-wrapped", w: 1232, h: 1600, route: "/wrapped" },
  { id: "p36-statistik", w: 405, h: 2400, phone: true, route: "/stats" },
  { id: "p37-wrapped", w: 405, h: 2400, phone: true, route: "/wrapped" },
  { id: "d39-jellyfin", w: 1232, h: 1100, route: "/settings?pane=detection", act: toCard("Jellyfin-Server") },
  { id: "d40-jellyfin-aus", w: 1232, h: 1000, route: "/settings?pane=detection", mock: "jellyfin-out", act: toCard("Jellyfin-Server") },
  { id: "d6-sortierung", w: 1232, h: 800, route: "/list", act: (p) => p.locator('[aria-label^="Sortierung"], [aria-label^="Sort:"]').first().click() },
  { id: "p6-aktionen", w: 405, h: 860, phone: true, route: "/list", act: (p) => longPress(p, p.locator("[data-media-id]").nth(1)) },
  { id: "d7-bearbeiten", w: 1232, h: 800, route: "/list", act: (p) => fromMenu(p, "Bearbeiten") },
  { id: "d8-bestaetigen", w: 1232, h: 800, route: "/list", act: (p) => fromMenu(p, "Von der Liste entfernen") },
  { id: "d9-cover", w: 1232, h: 800, route: "/media/178789", act: (p) => p.getByRole("button", { name: "Cover im Vollbild ansehen" }).first().click() },
  { id: "d10-suchseite", w: 1232, h: 800, route: "/search", act: (p) => p.keyboard.type("Frieren") },
  { id: "d31-suchseite-leer", w: 1232, h: 800, route: "/search" },
  { id: "p18-suchseite", w: 405, h: 860, phone: true, route: "/search" },
  {
    id: "d11-leiste-zu",
    w: 1232,
    h: 800,
    route: "/list",
    act: async (p) => {
      await p.getByRole("button", { name: "Leiste einklappen" }).click();
      await p.waitForTimeout(400);
      await p.locator('nav a[href="#/calendar"]').first().hover();
    },
  },
  { id: "d13-palette-leer", w: 1232, h: 800, route: "/list", act: (p) => p.keyboard.press("Control+k") },
  {
    id: "d14-palette-zuletzt",
    w: 1232,
    h: 800,
    route: "/list",
    act: async (p) => {
      await p.evaluate(() => localStorage.setItem("karasu-palette-recent", JSON.stringify(["/calendar", "command:sync", "/stats"])));
      await p.keyboard.press("Control+k");
    },
  },
  { id: "d12-glocke", w: 1232, h: 800, route: "/list", act: (p) => p.getByRole("button", { name: "Benachrichtigungen" }).first().click() },
  { id: "d15-benachrichtigungen", w: 1232, h: 800, route: "/notifications" },
  { id: "d21-detail", w: 1232, h: 800, route: "/media/178789" },
  { id: "d25-raster-hover", w: 1232, h: 800, route: "/list", act: (p) => p.locator("[data-media-id]").nth(1).hover() },
  { id: "d26-uebersicht-lang", w: 1232, h: 2600, route: "/" },
  { id: "p14-uebersicht-lang", w: 405, h: 4200, phone: true, route: "/" },
  { id: "d27-kalender", w: 1232, h: 800, route: "/calendar" },
  { id: "p15-kalender", w: 405, h: 860, phone: true, route: "/calendar" },
  { id: "d29-kalender-woche", w: 1440, h: 900, route: "/calendar" },
  { id: "d30-kalender-kacheln", w: 1232, h: 800, route: "/calendar", act: (p) => p.getByRole("radio", { name: "Kacheln" }).click() },
  { id: "p17-kalender-kacheln", w: 405, h: 860, phone: true, route: "/calendar", act: (p) => p.getByRole("radio", { name: "Kacheln" }).click() },
  { id: "d28-saison", w: 1232, h: 800, route: "/seasonal" },
  { id: "p16-saison", w: 405, h: 860, phone: true, route: "/seasonal" },
  { id: "d22-detail-unten", w: 1232, h: 800, route: "/media/178789", act: (p) => p.evaluate(() => document.getElementById("main")?.scrollTo(0, 1e6)) },
  { id: "d23-franchise", w: 1232, h: 800, route: "/franchise/178789" },
  { id: "p12-franchise", w: 405, h: 860, phone: true, route: "/franchise/178789" },
  { id: "p13-editor-mehr", w: 405, h: 860, phone: true, route: "/media/178789", act: async (p) => {
    await statusButton(p).click();
    await p.waitForTimeout(400);
    await p.getByRole("button", { name: /^Mehr ·/ }).last().click();
    await p.waitForTimeout(300);
    await p.locator("input[list]").last().focus();
  } },
  { id: "p11-benachrichtigungen", w: 405, h: 860, phone: true, route: "/notifications" },
  { id: "d16-erster-start", w: 1232, h: 800, route: "/", out: true },
  { id: "p9-erster-start", w: 405, h: 860, phone: true, route: "/", out: true },
  { id: "d17-erkennung", w: 1232, h: 800, route: "/list", playing: true },
  { id: "p10-erkennung", w: 405, h: 860, phone: true, route: "/list", playing: true },
  { id: "d19-auswahl", w: 1232, h: 800, route: "/list", act: async (p) => {
    await p.getByRole("button", { name: "Auswählen" }).first().click();
    await p.waitForTimeout(300);
    await p.getByRole("checkbox").nth(1).click();
  } },
  { id: "d20-listenansicht", w: 1232, h: 800, route: "/list", act: (p) => p.getByRole("radio", { name: "Liste" }).first().click() },
  { id: "d18-sync", w: 1232, h: 800, route: "/list", act: (p) => p.getByRole("button", { name: "Details zur Synchronisierung" }).first().click() },
  {
    id: "p8-glocke",
    w: 405,
    h: 860,
    phone: true,
    route: "/",
    act: async (p) => {
      await p.getByText("Mehr", { exact: true }).last().click();
      await p.waitForTimeout(600);
      await p.getByRole("button", { name: "Benachrichtigungen" }).first().click();
    },
  },
  {
    id: "p7-bestaetigen",
    w: 405,
    h: 860,
    phone: true,
    route: "/list",
    act: async (p) => {
      await longPress(p, p.locator("[data-media-id]").nth(1));
      await p.waitForTimeout(700);
      await p.getByRole("button", { name: "Von der Liste entfernen" }).click();
    },
  },
];

/** Right-clicks a card and picks a row of its menu, for the dialogs an action opens. */
async function fromMenu(page, row) {
  await page.locator("[data-media-id]").nth(2).click({ button: "right" });
  await page.getByRole("menuitem", { name: row }).click();
}

/** A held finger, sent as raw touch events: Playwright's own tap lifts at once, and the sheet needs the press. */
async function longPress(page, target) {
  const box = await target.boundingBox();
  // The upper part of a card, clear of the quick buttons along the cover's foot.
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 4 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await page.waitForTimeout(650);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** The titles the mock draws with real art, cached on first use and never committed; an id added here is fetched next run. */
const ART = [178789, 135865, 103303, 195516, 176301];
const FONTS = ["roboto", "open-sans"];

async function ensureAssets() {
  mkdirSync(path.join(CACHE, "fonts"), { recursive: true });
  const manifest = path.join(CACHE, "assets.json");
  const entries = existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")) : {};
  const missing = ART.filter((id) => !entries[id]);
  if (missing.length) {
    const query = `{ Page(perPage: 10) { media(id_in: [${missing.join(",")}], type: ANIME) { id bannerImage coverImage { extraLarge } } } }`;
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
    const media = (await res.json()).data?.Page?.media ?? [];
    for (const m of media) {
      entries[m.id] = {};
      for (const [kind, url] of [["banner", m.bannerImage], ["cover", m.coverImage?.extraLarge]]) {
        if (!url) continue;
        const file = `${m.id}-${kind}${path.extname(new URL(url).pathname)}`;
        writeFileSync(path.join(CACHE, file), Buffer.from(await (await fetch(url)).arrayBuffer()));
        entries[m.id][kind] = file;
      }
    }
    writeFileSync(manifest, JSON.stringify(entries, null, 1));
  }
  for (const family of FONTS) {
    for (const weight of [400, 500, 600, 700]) {
      const file = path.join(CACHE, "fonts", `${family}-latin-${weight}-normal.woff2`);
      if (existsSync(file)) continue;
      const url = `https://cdn.jsdelivr.net/npm/@fontsource/${family}/files/${family}-latin-${weight}-normal.woff2`;
      writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
  }
}

/** Roboto stands in for Android's face and Open Sans for Segoe UI, which Linux lacks; both are close in metrics. */
const fontCss = (phone) => {
  const [family, file] = phone ? ["Roboto", "roboto"] : ["Open Sans", "open-sans"];
  const faces = [400, 500, 600, 700].map((w) => `@font-face { font-family: "${family}"; font-weight: ${w}; src: url("/scripts/screens/.cache/fonts/${file}-latin-${w}-normal.woff2"); }`);
  return `${faces.join(" ")} :root { --font-sans: "${family}", sans-serif; }`;
};

async function startVite() {
  const vite = spawn(process.execPath, [path.join(ROOT, "node_modules", "vite", "bin", "vite.js"), "--config", path.join(DIR, "vite.config.ts")], { cwd: ROOT, stdio: "ignore" });
  process.on("exit", () => vite.kill());
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("screens: the dev server did not come up on port 5198");
}

async function launch() {
  const { chromium } = await import("playwright-core").catch(() => {
    throw new Error("screens: playwright-core is missing; run npm install");
  });
  return chromium.launch({ executablePath: CHROMIUM });
}

const urlFor = (s, style, theme, still) => {
  const [mode, contrast] = theme.startsWith("hc-") ? [theme.slice(3), "more"] : [theme, ""];
  const q = new URLSearchParams({ style, theme: mode, contrast, android: s.phone ? "1" : "", out: s.out ? "1" : "", playing: s.playing ? "1" : "", mock: s.mock ?? "", route: s.route, lang: flag("--lang", "de"), still: still ? "1" : "" });
  return `${BASE}?${q}`;
};

/** Opens one screen, waits for its images and fonts, performs its action, and returns the page and what went wrong. */
async function open(browser, s, style, theme, { still = false, video } = {}) {
  const context = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: video ? 1 : 2, hasTouch: !!s.phone, isMobile: !!s.phone, ...(video ? { recordVideo: { dir: video, size: { width: s.w, height: s.h } } } : {}) });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  if (still) await page.clock.setFixedTime(CLOCK);
  // Generous: a cold dev server generates the whole stylesheet before the first page can settle.
  await page.goto(urlFor(s, style, theme, still), { waitUntil: "networkidle", timeout: 180_000 });
  await page.addStyleTag({ content: fontCss(s.phone) });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(700);
  if (s.act && !video) {
    await s.act(page).catch((e) => errors.push(`act: ${e.message.split("\n")[0]}`));
    await page.waitForTimeout(900);
  }
  const unknown = await page.evaluate(() => window.__unknown ?? []);
  return { context, page, errors, unknown };
}

function selected() {
  const only = flag("--only", "").split(",").filter(Boolean);
  return SCREENS.filter((s) => only.length === 0 || only.includes(s.id));
}

async function shoot() {
  const out = path.join(OUT, "shots");
  mkdirSync(out, { recursive: true });
  const browser = await launch();
  const report = [];
  for (const s of selected()) {
    for (const theme of list("--themes", "dark")) {
      for (const style of list("--styles", "")) {
        const { context, page, errors, unknown } = await open(browser, s, style, theme);
        const name = `${style || "heute"}-${theme}-${s.id}`;
        await page.screenshot({ path: path.join(out, `${name}.png`) });
        // A page that scrolls sideways can look fine in a still, so every shot reports it; `overflow` says why.
        const sideways = await page.evaluate(() => {
          const main = document.querySelector("main");
          return main ? main.scrollWidth - main.clientWidth : 0;
        });
        report.push({ name, errors, unknown, sideways });
        const problems = [...errors, ...unknown.map((u) => `unmocked ${u}`), ...(sideways > 0 ? [`<main> scrolls ${sideways}px sideways`] : [])];
        if (problems.length) console.log(`${name}: ${problems.join("; ")}`);
        await context.close();
      }
    }
  }
  writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 1));
  await browser.close();
  console.log(`screens: ${report.length} shot(s) in ${path.relative(ROOT, out)}`);
}

async function hash() {
  const browser = await launch();
  const hashes = {};
  for (const s of selected()) {
    for (const theme of list("--themes", "dark,light")) {
      const { context, page } = await open(browser, s, flag("--style", ""), theme, { still: true });
      hashes[`${theme}-${s.id}`] = createHash("sha256").update(await page.screenshot()).digest("hex").slice(0, 16);
      await context.close();
    }
  }
  await browser.close();
  const against = flag("--compare", "");
  if (against) {
    const before = JSON.parse(readFileSync(against, "utf8"));
    const changed = Object.keys(before).filter((k) => before[k] !== hashes[k]);
    for (const k of changed) console.log(`changed: ${k}`);
    console.log(`screens: ${changed.length} of ${Object.keys(before).length} screen(s) changed`);
    process.exit(changed.length ? 1 : 0);
  }
  const file = flag("--out", path.join(OUT, "hashes.json"));
  writeFileSync(file, JSON.stringify(hashes, null, 1));
  console.log(`screens: ${Object.keys(hashes).length} hash(es) in ${path.relative(ROOT, file)}`);
}

/** Each screen's sideways overflow: how far `<main>` scrolls past its width, and which elements push it there. */
async function overflow() {
  const browser = await launch();
  const screens = selected();
  let failed = 0;
  for (const s of screens) {
    const { context, page } = await open(browser, s, "", "dark", { still: true });
    const found = await page.evaluate(() => {
      const main = document.querySelector("main");
      const by = () => main.scrollWidth - main.clientWidth;
      const over = main ? by() : 0;
      if (over <= 0) return null;
      const edge = main.getBoundingClientRect().right;
      // A box below `<main>` that clips its overflow cannot widen it, so only elements nothing clips are suspects.
      const clipped = (el) => {
        for (let up = el.parentElement; up && up !== main; up = up.parentElement) if (getComputedStyle(up).overflowX !== "visible") return true;
        return false;
      };
      const past = [...main.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > edge + 0.5 && !clipped(el));
      const deepest = past.filter((el) => !past.some((o) => o !== el && el.contains(o))).slice(0, 8);
      const name = (el) => [el.tagName.toLowerCase(), ...String(el.className?.baseVal ?? el.className ?? "").split(/\s+/).filter(Boolean).slice(0, 5)].join(".");
      // Removing a suspect and measuring again is the proof; a reach past the edge alone can be paint the layout never counts.
      const culprits = deepest.map((el) => {
        const before = el.style.display;
        el.style.setProperty("display", "none", "important");
        const without = by();
        el.style.display = before;
        return { name: name(el), freed: over - Math.max(0, without) };
      });
      return { over, culprits };
    });
    await context.close();
    if (!found) continue;
    failed++;
    const proven = found.culprits.filter((c) => c.freed > 0);
    const shown = (proven.length ? proven : found.culprits).map((c) => (c.freed > 0 ? `${c.name} (${c.freed}px)` : c.name));
    console.log(`${s.id}: <main> scrolls ${found.over}px sideways; ${proven.length ? "" : "suspects "}${shown.join("; ") || "nothing named"}`);
  }
  await browser.close();
  console.log(`screens: ${failed} of ${screens.length} screen(s) overflow`);
  process.exit(failed ? 1 : 0);
}

async function clip() {
  const out = path.join(OUT, "clips");
  mkdirSync(out, { recursive: true });
  const browser = await launch();
  const styles = list("--styles", "");
  const phone = SCREENS.find((s) => s.id === "p2-detail");
  for (const style of styles) {
    const { context, page } = await open(browser, phone, style, "dark", { video: out });
    for (let round = 0; round < 2; round++) {
      await statusButton(page).click();
      await page.waitForTimeout(1300);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(900);
    }
    await page.getByText("Mehr", { exact: true }).last().click();
    await page.waitForTimeout(1300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    const video = page.video();
    await context.close();
    renameSync(await video.path(), path.join(out, `${style || "heute"}.webm`));
  }
  // The side-by-side is the clips played at once in a page and recorded again, since the bundled ffmpeg cannot tile.
  const cells = styles.map((s) => `<figure><figcaption>${s || "heute"}</figcaption><video src="${pathToFileURL(path.join(out, `${s || "heute"}.webm`)).href}" muted preload="auto"></video></figure>`);
  const page = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e9ebef;font-family:sans-serif;padding:14px;display:flex;gap:14px}figure{margin:0}figcaption{font:bold 17px sans-serif;margin:0 0 6px}video{width:300px;height:637px;border-radius:6px;display:block}</style>${cells.join("")}`;
  writeFileSync(path.join(out, "side-by-side.html"), page);
  const size = { width: 20 + styles.length * 314, height: 700 };
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: out, size } });
  const tab = await context.newPage();
  await tab.goto(pathToFileURL(path.join(out, "side-by-side.html")).href);
  await tab.waitForFunction(() => [...document.querySelectorAll("video")].every((v) => v.readyState >= 3));
  const ms = await tab.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")];
    await Promise.all(videos.map((v) => v.play()));
    return Math.max(...videos.map((v) => (Number.isFinite(v.duration) ? v.duration : 12))) * 1000;
  });
  await tab.waitForTimeout(Math.min(ms, 16000) + 400);
  const video = tab.video();
  await context.close();
  renameSync(await video.path(), path.join(out, "side-by-side.webm"));
  await browser.close();
  console.log(`screens: clips in ${path.relative(ROOT, out)}`);
}

/** A labelled grid from a spec: name, title, subtitle, columns, cellWidth, rows of `{ label, cells }`, notes. */
async function board() {
  const spec = JSON.parse(readFileSync(rest[0], "utf8"));
  const out = path.join(OUT, "boards");
  mkdirSync(out, { recursive: true });
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const img = (c) => `<figure><img src="${pathToFileURL(path.join(OUT, "shots", `${c.img}.png`)).href}" style="width:${c.width ?? spec.cellWidth}px">${c.caption ? `<figcaption>${esc(c.caption)}</figcaption>` : ""}</figure>`;
  const rows = spec.rows.map((r) => `<tr><td class="row">${esc(r.label)}</td>${r.cells.map((c) => `<td>${img(c)}</td>`).join("")}</tr>`);
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e9ebef;font-family:"DejaVu Sans",sans-serif;color:#111;padding:28px}h1{font-size:26px;margin:0 0 6px}p{margin:0 0 18px;font-size:15px;color:#444;max-width:1400px;line-height:1.45}table{border-collapse:separate;border-spacing:16px 0}th{font-size:20px;text-align:left;padding:0 0 8px}td{vertical-align:top;padding:0 0 18px}td.row{font-size:15px;font-weight:bold;writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;padding:0 6px 18px 0;color:#333}figure{margin:0}img{display:block;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.25)}figcaption{font-size:13px;color:#333;margin-top:6px}.notes{margin-top:8px;font-size:14px;color:#333;line-height:1.5}</style>
<h1>${esc(spec.title)}</h1><p>${esc(spec.subtitle)}</p><table><tr><th></th>${spec.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${rows.join("")}</table>${spec.notes ? `<div class="notes">${spec.notes.map((n) => `<div>${n}</div>`).join("")}</div>` : ""}`;
  const file = path.join(out, `${spec.name}.html`);
  writeFileSync(file, html);
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: path.join(out, `${spec.name}.png`), fullPage: true });
  await browser.close();
  console.log(path.relative(ROOT, path.join(out, `${spec.name}.png`)));
}

const COMMANDS = { shoot, hash, overflow, clip, board };
if (!COMMANDS[command]) {
  console.error(`screens: unknown command "${command ?? ""}"; one of ${Object.keys(COMMANDS).join(", ")}`);
  process.exit(2);
}
if (command !== "board") {
  await ensureAssets();
  await startVite();
}
await COMMANDS[command]();
process.exit(0);
