# Roadmap

**The complete list of what stands between the tree and the next milestone —
and nothing else.** This file is maintained by deletion: an item that ships
is removed, not annotated, and history lives where history already lives
(commit subjects, and CHANGELOG.md's tag-time curation). Settled decisions
and their reasons are CLAUDE.md's job. If an item is neither open work nor a
decision the next milestone waits on, it does not belong here.

**This file is not `CHANGELOG.md`, on purpose.** `scripts/release/release-notes.ps1`
slices that file between `## <version>` and the next `## `, so a stray heading
there truncates a published release body. Open work goes here; shipped work
goes there, at tag time.

For what will *never* be built, see the "Explicitly rejected" section of
`CLAUDE.md` — activity and playback-history expansion, manga cost tracking,
settings cloud-sync, Plex and Emby, RSS/torrent release feeds, and anything
needing a hosted backend.

---

## Before the stores

Flathub and F-Droid are submitted with the next Stable, whose date is not
set (maintainer, 2026-10-05). What stands between the tree and the two
requests, each detailed in its `packaging/*/SUBMISSION.md`:

- **F-Droid's own build of the recipe.** The update check, the Node pin, the
  scanner's four deletions, the `NonFreeNet` label and the rewritemeta form are
  settled and checked locally; the whole recipe, the Gradle wrapper's stand-in
  above all, runs only on F-Droid's build server after the submission.

## After v1.32.0

v1.0.0 was tagged on 2026-09-05 and v1.32.0, the next Stable, on
2026-10-03. The backlog, each item with its recorded reason:

### Carried over from the release audit

The audit's own reports are gone (they were a list of unfixed weaknesses in a
repository about to be public, which is a finding it raised against itself).
Everything it found at P1 and P2 is fixed, as is every P3 with a behavioural
consequence. What is left is recorded here rather than in a deleted folder:

Everything still listed here is blocked on something no amount of work in the
repository supplies — a device, a live API, or a decision that is the
maintainer's. Each says which, so none of them reads as unstarted work.

**Needs a user, or a decision already made:**

- **Browser detection's measurements, in every browser** — the maintainer's
  own task, taken up actively (2026-10-07), and the rest of browser detection
  waits on them: linking a playing media session to its tab, reading the
  series and episode from the tab's URL, the position and duration a session
  reports, the opt-in read of the browser's session file, and the Settings
  row that shows all of it. Run `node scripts/browser-measure.mjs --redact <brand>` in
  every browser Karasu might meet, on Windows and on Linux: Firefox,
  Waterfox, Zen, LibreWolf, Floorp, Chrome, Chromium, Edge, Brave, Vivaldi,
  Opera, Opera GX and Helium. For each, eleven scenarios: playing in the tab
  in front, fullscreen, another tab brought in front while it plays,
  picture-in-picture, the next episode by a click, the next one by autoplay
  after four idle minutes, two browsers open at once, the series' own page
  open in another window, a private window, a YouTube video in the same
  browser, and split view or workspaces where the browser has them. Each run
  answers six questions: whether the window title holds the session's title,
  whether a site fills artist and album, whether the URL names the series and
  the episode, whether it changes per episode, whether position and duration
  arrive, and whether the browser keeps its tabs in a session file Karasu can
  read. Before the Chromium family can be measured the script needs widening:
  it reads every media session already, but lists windows and reads session
  files for the Firefox family alone (`FAMILY`), and a Chromium browser keeps
  its tabs in its own `Sessions/` format. Raw output never enters the
  repository; CLAUDE.md records only the anonymised shapes.
- **User-installed CAs on Android** — the webpki-roots trade documented in
  `net.rs`. Revisit only if a user with such a setup actually asks.
- **`MediaSessionManager` detection on Android** — moot while the app is
  sideloaded: the notification-listener permission is a Play policy
  question, and Play distribution is itself not planned (maintainer,
  August 2026; sideload is the model, and since 1.11 the app fetches its
  own APK from the GitHub release — see "The Android updater" in
  CLAUDE.md).
