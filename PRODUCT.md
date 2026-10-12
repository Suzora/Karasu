# Product

<!-- impeccable:product-schema 1 -->

Written with the maintainer on 2026-10-12. DESIGN.md holds how Karasu looks
and moves; CLAUDE.md holds the invariants and the measurements. This file
holds who it is for and why, and outranks neither.

## Platform

web

Karasu's interface is a WebView app (Tauri 2) with one design language on
every platform: Windows and Linux desktops, and an Android phone shell
chosen by width. Its website is a static page on GitHub Pages.

## Users

Three groups, in this order of priority:

1. **AniList power users** who want a fast desktop and phone client in
   place of the website: their lists, the season, the airing calendar,
   statistics, profiles, the activity feed and the forum, in one quick,
   dense window. This is the group the website persuades first.
2. **AniList users who watch locally** in mpv, VLC and other players, in a
   browser, or through Jellyfin, and forget to bring their list up to date.
   Karasu notices what plays and writes the progress for them.
3. **People who used Taiga** and want the same thing for AniList, current,
   and on Linux and Android too.

Manga readers are served (chapters on MANGA Plus, a chapter tab in any
browser, which always asks first), but they are not a primary group.

## Product Purpose

Karasu is a tracker built exclusively for AniList. It is the AniList client
people keep open, and it keeps their list right without being asked:
episodes watched are written back automatically, edits made offline are
queued and sent later, and everything AniList offers a signed-in user is
one click away. Success is a list that is always current and a reason not
to open anilist.co.

## Positioning

What a neighbouring product could not truthfully claim:

- **Detection without a browser extension.** Karasu reads only what the
  system and the player already publish: media sessions (SMTC on Windows,
  MPRIS on Linux), window titles on Windows, Jellyfin's sessions, an opt-in
  mpv socket, and, opt-in, the browser's own session file. Every other
  tracker that knows the playing tab ships an extension.
- **No server but AniList.** A local app with no account of its own and no
  hosted backend, ever. The AniList token stays in the Rust backend, out of
  the web view's reach.
- **AniList only, and all of it.** No lowest common denominator across
  several trackers: the whole AniList surface, social and forum included,
  in AniList's own terms (score formats, custom lists, advanced scores).
- **Honest to the detail.** It says what it cannot do (no macOS, an
  unsigned Windows installer, Linux detection without window titles, a
  sideloaded Android APK), and every claim on the website has a row in
  `site/CONTENT-AUDIT.md` naming what makes it true.

## Operating Context

- Runs beside the player, often in the tray, polling detection every few
  seconds; a floating detection window shows what it recognised and when
  it will write.
- One AniList request budget (about 30 a minute, per IP) is shared by every
  screen, the scrobbler and the background checks, so the app caches,
  names every request's sender and pages by button, never by scroll.
- Works offline with a queue, and in an account-free local mode.
- English and German throughout; a title in the language the user picks
  (English, Romaji or the original).

## Capabilities and Constraints

- Platforms: Windows and Linux (x86_64), Android (arm64 first). No macOS.
- On Android, detection is Jellyfin alone; the desktop detection settings
  are shown greyed under a "desktop only" badge, never hidden.
- Never named, anywhere: an unofficial streaming or reading site, or a real
  release group. Detection is site-neutral by decision.
- Rejected for good: a hosted backend, settings cloud sync, a playback
  history screen, cost tracking of a collection, Plex or Emby, RSS or
  torrent feeds, a browser extension, Windows code signing and winget.
- Distribution: GitHub releases (installer, AppImage, .deb, .rpm, APKs),
  an F-Droid recipe and a Flatpak build (not submitted to Flathub) under
  `packaging/`; an in-app updater on the
  desktop and on Android outside the stores.

## Brand Commitments

- The name Karasu and the crow mark (`src/assets/karasu-mark.svg`).
- Inspired by Taiga, credited as such.
- A plain, candid voice: what it does, what it does not, no hype.
- The look is DESIGN.md's: dark, dense, quiet, one accent.

## Evidence on Hand

- Screenshots and captures of the real app: `site/src/assets`,
  `site/captures`, and the screens harness (`scripts/screens.mjs`) for any
  new one.
- The repository itself: the source, the changelog, the content audit.
- Nothing else. There are no user counts, testimonials, reviews or press
  to show, and no surface may invent any.

## Product Principles

1. **The list is always right.** Automatic where it can be sure, asking
   where it cannot, and never overwriting the user's own newer edit.
2. **AniList's client, not a layer over it.** AniList's data in AniList's
   terms; nothing that needs a server of ours.
3. **Read what is published, never more.** Detection uses what the system
   and the player already expose; no extension, no scraping.
4. **Spend the shared budget only when someone asked.** Cache first, name
   every request, page by button.
5. **Say the truth plainly.** Every claim has evidence; every limit is
   stated where a user would meet it.
