import { SHOTS } from "@/content/screenshots";

/** The screenshots the page shows, whose caption and alt text every catalog carries. */
const SHOT_IDS = [
  "anime-grid",
  "overview",
  "now-playing",
  "seasonal",
  "calendar",
  "stats-overview",
  "franchise",
  "phone-overview",
  "phone-list",
  "phone-detail",
  "phone-search",
] as const;

export type ShotId = (typeof SHOT_IDS)[number];

/** English keeps its captions in `scripts/shots.config.mjs`, so the screenshot pipeline stays their one source. */
const shots = Object.fromEntries(
  SHOT_IDS.map((id) => {
    const s = SHOTS.find((x) => x.id === id);
    if (!s) throw new Error(`no screenshot ${id}`);
    return [id, { alt: s.alt, caption: s.caption }];
  }),
) as Record<ShotId, { alt: string; caption: string }>;

/** The site's English copy, the source every other catalog translates; `{name}` marks a value filled in at render time. */
export const en = {
  meta: {
    title: "Karasu — A modern anime & manga tracker for AniList",
    description:
      "Karasu is a free, open-source anime and manga tracker built exclusively for AniList. It notices what you play — and, on Windows, what you read — and keeps your AniList progress in sync. Windows, Linux and Android.",
    notFoundTitle: "Page not found — Karasu",
  },
  skip: "Skip to content",
  nav: {
    label: "Primary",
    home: "Karasu — back to top",
    changes: "What changed",
    screenshots: "Screenshots",
    join: "Get involved",
    faq: "FAQ",
    github: "GitHub",
    download: "Download",
    downloadKarasu: "Download Karasu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    eyebrow: "Free · open source · for AniList",
    title: "The AniList client that writes your episodes for you",
    lede: "Your lists, the season, the airing calendar, statistics, the feed and the forum in one quick window, and detection that brings your list up to date when an episode ends.",
    windows: "Download for Windows",
    linux: "Linux",
    android: "Android",
    note: "Version {version}. The Windows installer is not code-signed, so SmartScreen may warn on first run · Linux is an experimental AppImage · Android is a sideloaded APK · no macOS",
    checksums: "checksums",
    everyDownload: "every download",
  },
  changes: {
    title: "What changed",
    nightly: "In the Nightly",
    version: "Version {version}",
    since: "Since {version}, not yet in a Stable release",
    added: "Added",
    changed: "Changed",
    fixed: "Fixed",
    whole: "The whole changelog",
  },
  gallery: {
    eyebrow: "Screenshots",
    title: "The app, as it is",
    which: "Which screenshots",
    desktop: "Desktop",
    android: "Android",
    open: "Open: {caption}",
    dialog: "Screenshot {n} of {total}: {caption}",
    previous: "Previous screenshot",
    next: "Next screenshot",
    close: "Close",
  },
  join: {
    title: "Try it, then tell us how it went",
    body: "Karasu is built by one maintainer with whoever joins in. A bug report, an idea or a note that something works on your machine helps, on Linux and Android above all.",
    discord: "Join the Discord",
    bug: "Report a bug",
    source: "Source on GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions, answered from the code.",
    items: {
      what: {
        q: "What is Karasu?",
        a: "A desktop and Android app that keeps your AniList anime and manga list. It notices what you are playing or reading and updates your progress on AniList by itself, asking once first for a chapter from a site it does not name, and it gives that list a fast local interface with statistics, notifications and the social pages.",
      },
      free: {
        q: "Is it free?",
        a: "Yes. Karasu is free of cost and released under the GNU AGPL-3.0, or any later version. There is no paid tier and nothing to unlock.",
      },
      open: {
        q: "Is it open source?",
        a: "Yes. The complete source is on GitHub, and every release is built there from a tagged commit.",
      },
      anilist: {
        q: "What is AniList?",
        a: "A free anime and manga database and tracking site at anilist.co. Your list lives there; Karasu reads it and writes to it through AniList's public API.",
      },
      replace: {
        q: "Does Karasu replace AniList?",
        a: "No. It is a client for it. Your list stays on AniList and every change Karasu makes is visible on the website a moment later. You can also use Karasu without any account, with a local list only.",
      },
      platforms: {
        q: "Which platforms are supported?",
        a: "Windows and Android are Stable, Linux is an experimental AppImage, and there is no macOS build. Windows has every feature. Android has the list, statistics, notifications, widgets, the social pages and its own updater, but no local library and no tray. Detection differs: Windows reads media sessions, player and browser windows, mpv and Jellyfin; Linux reads media sessions, mpv and Jellyfin, with no window titles; Android reads Jellyfin.",
      },
      credentials: {
        q: "Does Karasu store my AniList credentials?",
        a: "It never sees your password. Signing in happens on anilist.co in your browser, which hands Karasu a token. That token is kept in your operating system's credential store on the desktop, in an encrypted file next to the app in portable mode, and in a Keystore-sealed file on Android — and it is never handed back to the app's web view.",
      },
      offline: {
        q: "Can Karasu work offline?",
        a: "Your list is cached locally, so it opens without a network, a title on it shows its cached page with a working +1, and edits are queued and sent when the connection returns. Browsing titles that are not on your list, search and the social pages need the network.",
      },
      automatic: {
        q: "Does it update my AniList progress automatically?",
        a: "Yes, once an episode has played for two thirds of its length by default — or for the minutes you set, or after you confirm a toast, if you prefer to be asked. A chapter from a site Karasu does not name always asks first. Progress only ever moves forward, and Karasu re-reads your list right before it writes.",
      },
      affiliated: {
        q: "Is Karasu affiliated with AniList?",
        a: "No. It is an independent project using AniList's public API, with a registered client id and no special access.",
      },
      smartscreen: {
        q: "Why does Windows warn when I install it?",
        a: "The installer is not code-signed, so SmartScreen has never seen it before and says so. Every release ships a SHA256SUMS.txt you can check the download against.",
      },
      network: {
        q: "What does Karasu talk to?",
        a: "AniList's API and image servers; GitHub, for the update check and the download; the community's episode-relations data on GitHub, at most once a week; your own Jellyfin server if you set one up; Discord's local socket for Rich Presence if you enable it. Images in AniList user bios are fetched through Karasu's own bounded proxy, so those hosts learn your IP address when you open a profile. Nothing else, and no analytics.",
      },
    },
  },
  footer: {
    tagline: "A modern anime & manga tracker — built exclusively for AniList.",
    badge: "Open source · free of cost",
    project: "Project",
    github: "GitHub",
    download: "Download",
    changelog: "Changelog",
    nightly: "Nightly builds",
    help: "Help",
    docs: "Documentation",
    issue: "Report an issue",
    feature: "Request a feature",
    discord: "Discord",
    elsewhere: "Elsewhere",
    anilist: "AniList",
    security: "Security policy",
    contributing: "Contributing",
    license: "AGPL-3.0 licence",
    copyright: "AGPL-3.0 licensed · © 2026 Kyu and Karasu contributors",
    disclaimer:
      "Karasu is an independent project and is not affiliated with or endorsed by AniList. SN Pro is used under the SIL Open Font License 1.1.",
    language: "Language",
    aiNote: "Every language other than English and German is an AI translation that no person has reviewed.",
  },
  notFound: {
    title: "Nothing perched here.",
    body: "The page you were looking for does not exist. The whole site is one page, and this is not it.",
    back: "Back to Karasu",
  },
  shots,
};

export type Messages = typeof en;
