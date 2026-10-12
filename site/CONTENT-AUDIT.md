# Content audit

Every claim the site makes, and what in the repository makes it true. A
sentence with no row here does not go on the page; a row whose evidence
moves takes the sentence with it. Paths are relative to the repository root;
the file names are what a row points at, and a row whose file moves is
rewritten with it. The site describes `main` (the Nightly), not only the
newest tag; where a feature is newer than the Stable download, the row
names the version that shipped it.

Status: **confirmed** (read in the code), **partial** (true with the stated
limit, and the page states it), **mock** (a drawn stand-in, labelled as
such in the code and showing no invented data).

## The page of 2026-10-12

The page was rebuilt as one short page (pitch and downloads, the app beside
its changelog, a gallery of real captures, the call to join, the FAQ; DESIGN.md, 2026-10-12). The
sections it dropped took their rows with them; the rows below that keep an
old heading are the ones the FAQ, the footer or the head still state.

| # | Claim | Evidence | Status |
|---|---|---|---|
| 93 | "The AniList client that writes your episodes for you" | `src-tauri/src/playback/scrobbler.rs` `drive_session` writes once the threshold passes (rows 13, 17); AniList only (`CLAUDE.md` Project) | confirmed |
| 94 | "Your lists, the season, the airing calendar, statistics, the feed and the forum in one quick window" | `src/pages/` (`MediaList`, `Seasonal`, `Calendar`, `Statistics`, `Social`, `Forum`), one window (`src/app/App.tsx`) | confirmed |
| 95 | "detection that brings your list up to date when an episode ends" | rows 13, 17 and 23 (two thirds of the runtime by default, which is the end for the purpose of the sentence; the FAQ gives the exact rule) | partial (the FAQ states the threshold) |
| 96 | The three downloads (Windows installer, Linux AppImage, Android arm64 APK), the version, the checksums and "every download" | `site/src/generated/release.json` (row 63), `site.config.ts` `LINKS.releases` | confirmed |
| 97 | "not code-signed, so SmartScreen may warn on first run · Linux is an experimental AppImage · Android is a sideloaded APK · no macOS" | rows 57, 61, 62, 59 and 72 | confirmed |
| 98 | The screenshot beside the changelog: the anime list in grid view | `site/scripts/shots.config.mjs` `anime-grid`, captured as the Screenshots section says | confirmed (real capture) |
| 99 | "What changed": the newest Added, Changed and Fixed line, "In the Nightly", "Since 1.32.0, not yet in a Stable release" | read at build time from `CHANGELOG.md` by `site/scripts/changes.mjs` (tested by `changes.test.mjs`): the `Unreleased` section's last line of each kind, or the newest release's when it is empty; `since` is the newest `## x.y.z` heading; `pages.yml` deploys on a `CHANGELOG.md` push so the card follows `main` | confirmed |
| 100 | "Karasu is built by one maintainer with whoever joins in" | `CLAUDE.md` preamble (one maintainer reviews every change), `CONTRIBUTING.md` | confirmed |
| 101 | The three calls to join: the Discord, the bug report form, the source on GitHub | row 79 | confirmed |
| 102 | "The app, as it is": six desktop and four Android captures with their captions, opened full size in the lightbox | `site/src/sections/Gallery.tsx` picks them from `site/src/content/screenshots.ts`; captions and alt texts are row 81's, the captures the Screenshots section's | confirmed (real captures) |

## Footer, the head and the social card

| # | Claim on the page | Evidence | Status |
|---|---|---|---|
| 1 | "A modern anime & manga tracker, built exclusively for AniList." | `README.md` tagline, `src-tauri/tauri.conf.json` `shortDescription`, `CLAUDE.md` Project | confirmed |
| 2 | "Karasu watches what you play and read and keeps your AniList progress in sync — an episode with no buttons to press, a chapter with one at most." | `src-tauri/src/playback/detection/mod.rs` `detect_playback` (four sources), `src-tauri/src/playback/scrobbler.rs` (the write); a chapter on a site Karasu does not name always asks (`scrobbler.rs` `cautious`, `a_generic_detection_always_asks_and_never_lifts_a_gap_block`), MANGA Plus does not; `README.md` "What is Karasu?" | confirmed |
| 3 | "Free · open source · built for AniList"; "AGPL-3.0 licensed, no paid tier"; "Every commit is public" | `LICENSE` (AGPL-3.0), public repository | confirmed |
| 4 | "Windows · Linux · Android" | `.github/workflows/release.yml` (NSIS, AppImage, two APKs) | confirmed |
| 5 | "No account needed to start"; "Start with a local list, no account" | `src/stores/auth.ts` `ProfileMode = "anilist" \| "local" \| "none"`, `enableLocal`; `src/components/shell/FirstRun.tsx` | confirmed |
| 7 | "No telemetry, no analytics, no backend, no account of ours" | exhaustive grep of `src/` and `src-tauri/src/` for sentry/posthog/plausible/mixpanel/amplitude/gtag/crashlytics/telemetry/analytics: no hits in code; `SECURITY.md` "no hosted backend"; `CLAUDE.md` hard constraint | confirmed |
| 8 | "AGPL-3.0 licensed · © 2026 Kyu and Karasu contributors" | `LICENSE` (AGPL-3.0), `README.md` "License", `src-tauri/tauri.conf.json` `copyright` | confirmed |
| 9 | "not affiliated with or endorsed by AniList" | no affiliation exists; public API with a public client id | confirmed |
| 10 | "SN Pro is used under the SIL Open Font License 1.1" | `site/public/fonts/OFL.txt` (from `@fontsource/sn-pro`) | confirmed |

## Detection, as the FAQ states it

| # | Claim | Evidence | Status |
|---|---|---|---|
| 13 | "A scrobble can raise your progress, never lower it, and it re-checks your list a moment before it writes." | `scrobbler.rs` `would_regress` and the pre-write re-check against the live cache (`Outcome::Refused(AlreadyWatched)`); `CLAUDE.md` "list_cache has one owner" | confirmed |
| 14 | "Turn on the confirmation toast and every update waits for one click on the desktop. A chapter from a site Karasu does not name always waits for one." | `src-tauri/src/alerts/notify.rs` action toast (Windows `tauri_winrt_notification` button, Linux `notify-rust` action); mobile returns "action toasts are desktop-only"; setting "Ask before updating" in `src/pages/settings/DetectionPane.tsx`; the chapter that always asks: `scrobbler.rs` `cautious` (`a_generic_detection_always_asks_and_never_lifts_a_gap_block`) | confirmed, desktop only (stated) |
| 17 | "After two thirds of the runtime … or the minutes you set" | `scrobbler.rs` threshold: setting in minutes, else 2/3 of episode length; `src/i18n/en.ts` "0 = automatic (two thirds of the episode length)" | confirmed |
| 23 | "Windows has all of these. Linux reads media sessions, mpv and Jellyfin, and no window titles; Android reads Jellyfin." | `detection/mod.rs` non-Windows `enumerate_windows` returns empty ("Wayland forbids…"); `mpv_ipc.rs` mobile stub; `src/pages/Settings.tsx` `ANDROID_DESKTOP_ONLY` | confirmed |

## Offline, as the FAQ states it

| # | Claim | Evidence | Status |
|---|---|---|---|
| 30 | List cached in a local SQLite database | `src-tauri/src/db.rs` `list_cache` | confirmed |
| 31 | Offline detail page with a working +1 for a title on your list; nothing for one that is not | `src/components/media/OfflineDetail.tsx` | confirmed |
| 32 | Edits queued, per account, inspectable and discardable in Settings, sent in order on return | `db.rs` `offline_queue` with `user_id` (schema v16); `src-tauri/src/commands/list.rs` drain paths; `QueueSection` (defined in `AdvancedPane.tsx`, rendered in the Import & export pane, `src/lib/settingsPanes.ts` `data`) | confirmed |
| 33 | "'Queued' is never 'saved' — the receipt says which" | `CLAUDE.md` invariant "Queued is not success", `Outcome::{Landed, Queued, Refused}`; `useListMutations.ts` receipt text | confirmed |

## Android, as the FAQ states it

| # | Claim | Evidence | Status |
|---|---|---|---|
| 48 | Android: sideloaded APK; the list, statistics, notifications, social pages; Jellyfin detection; four widgets from the cache with no network; background job with the app closed; share an anilist.co link | `release.yml` APK legs; `src-tauri/gen/android/.../Widgets.kt` + `src-tauri/src/widgets.rs`; `NotifJob.kt` + `src-tauri/src/background.rs`; `MainActivity.kt` SEND→VIEW; `AndroidManifest.xml` | confirmed |

## Platforms, as the downloads line and the FAQ state them

| # | Claim | Evidence | Status |
|---|---|---|---|
| 57 | Windows: installer, not code-signed (SmartScreen may warn), checksums | `release.yml` NSIS; `scripts/release/release-notes.ps1` "It is unsigned"; `SHA256SUMS.txt` published | confirmed |
| 58 | Windows: every detection source; streaming and manga sites; tray; autostart; updater; portable mode | `profiles.rs`; `lib.rs` tray/autostart; `commands/update.rs`; `portable.rs` | confirmed |
| 59 | Android: 7 and up; signed with the project key; arm64 and universal | `build.gradle.kts` `minSdk 24`; `release.yml` release signing; `rename-apk.ps1` | confirmed |
| 60 | Android: detection is Jellyfin only and can keep running with the screen off; the app updates itself (the APK downloads over Wi-Fi, opens the installer on a tap); no local library | `mpv_ipc.rs` mobile stub, no SMTC/MPRIS on mobile; `TrackingService.kt` (1.9); `src-tauri/src/apk_update.rs` + `UpdateInstaller.kt` (1.11; `updater_available()` false on mobile is the desktop plugin, not the APK path); `src/pages/Settings.tsx` hides the Library pane; `CLAUDE.md` "The Android updater" | confirmed |
| 61 | Linux: AppImage x86_64 that updates itself, or a .deb and an .rpm for the package manager; the AppImage carries its own WebKitGTK, the packages depend on webkit2gtk-4.1; MPRIS, mpv, Jellyfin; updater for a running AppImage; no window titles, no manga detection; tray needs a StatusNotifier host or closing quits | `release.yml` build-linux (ubuntu-22.04); `release-notes.ps1` boilerplate; `tauri.conf.json` `bundle.linux.{deb,rpm}.depends`, and the AppImage's own `usr/lib/libwebkit2gtk-4.1.so.0`; `tauri.conf.json` `bundle.targets` carries `deb` and `rpm` since 1.18.1, and `platforms.ts` draws their links only once a Stable release carries them (`release-info.mjs` leaves them null before); `mpris.rs`; `detection/mod.rs`; `lib.rs` `tray_present` | confirmed |
| 62 | "Stable … used every day by the maintainer; Experimental … built by CI, not used every day"; Linux Experimental | maintainer's statement, 2026-09-05; every Linux check in the repo is CI or a throwaway crate (`CLAUDE.md`) | confirmed (maintainer) |
| 63 | "Version 1.0.0, released 2026-09-05"; the four asset links and the checksums | `site/src/generated/release.json` ← GitHub `releases/latest` via `site/scripts/release-info.mjs` (run by `pages.yml` with the workflow token; the committed file is the fallback) | confirmed |

## AniList, open source, FAQ

| # | Claim | Evidence | Status |
|---|---|---|---|
| 65 | Reads and writes through the public GraphQL API; a token, never a password; no client secret | `src-tauri/src/anilist/client.rs`, `login.rs` (implicit grant) | confirmed |
| 66 | Token kept in the OS credential store; an encrypted file in portable mode; the Android Keystore; never handed back to the web view (the browser hand-off is `src/hooks/useAniListLogin.ts` `openUrl`; the manual fallback in `commands/auth.rs` `anilist_connect` takes a pasted token once, and nothing returns it — `anilist_session` answers the cached viewer only) | `src-tauri/src/anilist/auth.rs` (keyring; DPAPI/XChaCha20 portable files); `src-tauri/src/keystore.rs`; `CLAUDE.md` hard constraint | confirmed |
| 70 | FAQ "What does Karasu talk to?": AniList API and image servers; GitHub for updates; the relations data on GitHub at most weekly; your Jellyfin server; Discord's local socket; bio images through a bounded proxy so those hosts learn your IP | `anilist/client.rs`; `tauri.conf.json` CSP `img-src *.anilist.co`; `commands/update.rs`; `playback/relations.rs` (7-day cache); `detection/jellyfin.rs`; `discord.rs`; `commands/images.rs` + `net.rs` (bounded, no cookies/referer, private hosts refused) | confirmed |
| 71 | FAQ "Can Karasu work offline?" | rows 30–33 | confirmed |
| 72 | FAQ "Which platforms?" and "no macOS build" | rows 57–61; `CLAUDE.md` "macOS is deliberately not covered" | confirmed |
| 73 | FAQ "Why does Windows warn?" | row 57 | confirmed |

## Added in the copy review of 2026-09-06

A second pass read every sentence against this table and the app source.
Three sentences were wrong and were rewritten (rows 38, 72 and the meta
description in row 80); the rest below were true but had no row.

| # | Claim | Evidence | Status |
|---|---|---|---|
| 77 | FAQ "every release is built there from a tagged commit" | `.github/workflows/release.yml` `tags: ["v*"]` | confirmed |
| 78 | FAQ "Signing in happens on anilist.co in your browser, which hands Karasu a token" | `src/hooks/useAniListLogin.ts` `openUrl`; the paste fallback in `commands/auth.rs` `anilist_connect` for a browser that cannot call back | confirmed |
| 79 | The external links: Discord invite, the two issue templates, "Nightly builds" at `releases/tag/latest`, CONTRIBUTING, SECURITY, CHANGELOG, LICENSE | `site/src/site.config.ts` against `README.md` (invite), `.github/ISSUE_TEMPLATE/bug_report.yml` and `feature_request.yml`, `commands/update.rs` and `release.yml` (the `latest` tag), the four files at the repository root; every link answered 200 on 2026-09-06 | confirmed |
| 80 | The head: title, meta description ("notices what you play — and, on Windows, what you read"), Open Graph, JSON-LD `SoftwareApplication` (`UtilitiesApplication`, price 0, author Kyu, AGPL-3.0, `softwareVersion` from `release.json`) | `site/src/head.ts`, `site/src/site.config.ts`; rows 1–4, 8, 63; manga detection is window-title based and so Windows-only (`profiles.rs`), which is why the description names Windows | confirmed |
| 81 | Screenshot captions and alt texts: "Command palette (Ctrl+K)", "Monday-first" calendar, the Seasonal switcher, "Everything" on the calendar, the year in review's shape, format and size choices, the phone's status sheet over the community's scores | `src/components/shell/CommandPalette.tsx` (Ctrl+K), `src/lib/calendar.ts` (Monday first), `src/components/ui/season-picker.tsx`, the calendar's scope filter, `src/pages/Wrapped.tsx`, `StatusMenu` and `CommunityScore` (`lib/scoreDistribution`); `site/scripts/shots.config.mjs` is the source, `site/src/content/screenshots.ts` the generated copy | confirmed |
| 83 | FAQ "Windows has every feature. Android has the list, statistics, notifications, widgets, the social pages and its own updater, but no local library and no tray" | `src/pages/Settings.tsx` hides the Library and Desktop panes on Android; `src-tauri/src/apk_update.rs`; `lib.rs` tray is desktop-only; rows 48, 60 | confirmed |
| 88 | How it works: "From play to updated, without you"; "Six steps, all of them Karasu's. The only one you take is the first — and for a chapter from a site Karasu does not name, one confirmation." | `scrobbler.rs` `drive_session` writes once the threshold passes (rows 13, 17); a chapter from a site Karasu does not name always asks (`cautious`, `a_generic_detection_always_asks_and_never_lifts_a_gap_block`); MANGA Plus does not | confirmed |
| 89 | FAQ "What is Karasu?": "updates your progress on AniList by itself, asking once first for a chapter from a site it does not name" | row 88; the About text says the same (`src/i18n/en.ts` `about.description`) | confirmed |
| 90 | The social card (`site/public/og.png`, drawn by `site/scripts/og-image.mjs`) repeats the hero's sentence | row 2 | confirmed |
| 92 | FAQ "Does it update my AniList progress automatically?": two thirds, your minutes or a toast; "A chapter from a site Karasu does not name always asks first." | rows 14, 17 and 88 | confirmed |

## Screenshots

All twenty-two are captures on the maintainer's account: desktop from the
isolated rig at 1440×900, rendered at 2×, of build 1.32.8.771; phone from the
release APK of 1.32.6.769 over adb; both on 2026-10-03. The local library
shows a folder of empty files named like clean releases. The Now Playing
capture is a real mpv window under `--force-media-title`. Nothing is
composited or edited beyond resizing and encoding. Approved by the maintainer
on 2026-09-06; the 1.10.6 set on 2026-09-19; the 1.32 set on 2026-10-03.
