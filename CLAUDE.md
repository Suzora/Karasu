# CLAUDE.md

Guidance for AI coding agents (and humans) working in this repository. Karasu is
developed with heavy AI assistance; this file records the conventions and
guardrails those tools are expected to follow. Every change is reviewed and
verified by a human maintainer before it lands.

Where this file and a user's own preferences disagree, this file decides what
lands in the repository (code, comments, commit messages, the changelog, tests,
the build and release steps) and the user's preferences decide the
conversation: its language, its tone, its length.

## Project

**Karasu** is a modern anime & manga tracker built **exclusively for
[AniList](https://anilist.co)**, inspired by the wonderful
[Taiga](https://github.com/erengy/taiga). It detects what you play/read locally
and in the browser and scrobbles your AniList progress automatically.

- **Shell:** Tauri 2 (Rust backend; WebView2 on Windows, WebKitGTK on Linux,
  the system WebView on Android)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **State:** TanStack Query (server), Zustand (client), i18next (i18n)
- **Charts:** drawn by hand in SVG/JSX; `d3-array`, `d3-scale` and `d3-shape`
  supply the maths only — there is no chart library and the renderer stays ours
- **Rendering:** `@tanstack/react-virtual` virtualizes the media lists. Rows are
  chunked by hand, so anything that renders one needs a column count — take it
  from `useColumnCount`, which reads the browser's resolved
  `grid-template-columns` rather than recomputing the CSS in JS
- **Storage:** SQLite via rusqlite (bundled); tokens in the OS credential store
- **Detection:** system media sessions (SMTC on Windows, MPRIS on Linux) +
  Win32 window enumeration (Windows only, with WASAPI pause detection) + an
  optional Jellyfin `/Sessions` source + an opt-in mpv JSON IPC socket (the
  real file path and a live position), with a custom release-name parser
- **Platforms:** Windows and Linux (x86_64), plus Android (sideloaded APK;
  arm64 is the one that matters). Window-title detection is Windows only —
  there is no X11/Wayland enumerator and Wayland forbids one — so on Linux the
  media-session pass and Jellyfin are the whole of detection, and browser *tab*
  titles are only seen where the browser publishes MPRIS. On Android detection
  is Jellyfin alone, decided in the first device round: the desktop detection
  machinery is greyed out in Settings under a "desktop only" badge, never
  hidden. Two different keys, and they must not swap: the *shell shape* is
  width-keyed (`usePhoneShell`, 767px), while *capability* gating — the badge,
  the hidden Library/Desktop panes, the bottom bar's missing library — is
  platform-keyed (`isAndroid` over `platform_info`), because a narrowed
  desktop window still has SMTC and a filesystem, and an Android tablet at
  desktop width still has neither.

## Where things go


**Where things go.** `lib/` is pure logic with tests beside it; `hooks/` is
React glue; a component's folder is its answer to "what am I" — a `ui/`
primitive knows nothing about Karasu, `shell/` is the frame around every screen,
`media/` renders titles, `overlays/` opens over things. On the Rust side a
folder exists only when it holds more than one file, and a command's file is
its subject, not its age.

## Hard constraints (do not violate)

- **No hosted backend, ever.** Karasu is a local app talking directly to the
  AniList GraphQL API. Never introduce a server we would have to run.
- **AniList client secret is never embedded.** Login uses the implicit OAuth
  grant only. A built-in *client id* (`BUILTIN_ANILIST_CLIENT_ID` in
  `commands/auth.rs`) is fine; a *secret* is not.
- **The access token stays in the Rust backend.** It must never be exposed to
  the WebView / frontend JS. Where it rests differs by platform and is written
  down in SECURITY.md: OS credential store on desktop, DPAPI/XChaCha20 files
  in portable mode, and on Android a Keystore-sealed file (`keystore.rs` +
  `TokenCipher.kt`, `KRSA1 || iv || ct`, key hardware-backed; a plaintext
  token from an older build migrates in place on first read).
- **i18n key parity.** `de` is typed `de: typeof en`, so every English key needs
  a German counterpart. Add both, or `tsc` fails. The other 38 languages (the
  registry is `lib/languages`) are machine translations typed `PartialLocale`
  in `src/i18n/locales/<code>.ts`: a key may be missing and English (for a
  regional variant first its parent: pt-BR → pt) shows in its place, but
  `i18nCoverage.test.ts` fails an invented key, an empty text or a placeholder
  English does not have. `node scripts/i18n-missing.mjs --all` prints each
  language's coverage and `… <code>` its gaps as JSON, the input of a
  translation batch. Counted texts are i18next plural keys (`x_one`,
  `x_other`, and `_few`/`_many` where a language has them), never a pair of
  hand-picked keys. The texts Rust composes and the widget strings live in
  `src/i18n/native/<code>.json` the same way.
- **AniList rate limit (~30 req/min).** Batch requests (`Page.media(id_in:)`,
  ≤50 ids) and bound BFS/traversal work; never fan out unboundedly. The
  budget is one shared pool, so every request names its spender and the
  cheap answer is the cached one — see "The request budget" below.

### Explicitly rejected — never implement (or propose)

Activity/playback-history expansion, **manga cost tracking** (what a collection
was worth or what it was bought for), settings cloud-sync, and anything that
would require a hosted backend. If a requested feature depends on any of these,
flag the dependency rather than silently building around it.

Two more, decided by the maintainer in August 2026:

- **Plex and Emby integration.** The maintainer uses Jellyfin (free, open
  source) and has no use for supporting a paid product he doesn't run.
  Revisit only if actual users ask for it — do not propose it unprompted.
- **Windows code signing through SignPath, and a winget manifest.** Both were
  on the tooling backlog and were struck by the maintainer on 2026-09-20 for
  good: the installer stays unsigned (the README, the release notes and the
  website say so, and keep saying so), and there is no winget package. Do not
  propose either again; the SmartScreen paragraph in the README is the
  answer to the question it raises.
- **RSS/torrent release feeds, and anything piracy-adjacent.** New releases
  are already reported through AniList's own airing data. The local library
  is the user's own files; how they got there is not the app's business, and
  nothing in Karasu may track, fetch, or point at torrents or release feeds.
  This closes the classic Taiga feature deliberately.
- **Naming an unofficial streaming or reading site, anywhere.** Decided by the
  maintainer on 2026-10-07: browser detection is **site-neutral**. It works
  through mechanisms that do not name a site (the media session linked to
  the tab that plays it, the playing tab's URL, the session file), and no
  unofficial site appears in code, tests, fixtures, docs, the website, the
  changelog or a commit message. Measurements from such sites are anonymised
  before they are shared (`browser-measure.mjs --redact`). The unofficial
  manga readers left `profiles.rs` the same day, including the one that
  hosts fan translations ("everything unofficial goes"); MANGA Plus is the
  one reader still named, and a chapter anywhere else goes through the
  generic rule below. Release groups go the same way, decided the same day:
  a release name in a test, a fixture or an example carries `[Group]` (and
  `[Other-Group]` beside it), never a real group's name.
- **A browser extension or a native-messaging host for detection.** Also
  decided on 2026-10-07: Karasu reads only what the system and the browser
  already publish — media sessions, window titles and, opt-in, the browser's
  own session file. Every tracker that knows the playing tab otherwise
  (PreMiD, MAL-Sync, WebNowPlaying, KDE's browser integration) ships an
  extension; Taiga's UI Automation reader is the one exception, and it wakes
  the browser's accessibility engine for the whole browser session.
- **A Flathub submission.** Decided by the maintainer on 2026-10-12, after
  reading Flathub's Generative AI policy: a Flathub manifest must not contain
  AI-generated or AI-assisted content, disclosure or not, and no AI tool may
  open the submission pull request or write its text, commits or replies.
  Karasu's manifest was written in agent sessions, and writing it again by
  hand was judged not worth it. The Flatpak build stays as it is (the
  manifest, `flatpak-manifest.ps1`, the `Flatpak` workflow on every Stable
  tag, the sandbox branches keyed on `portable::flatpak_id`) and is published
  nowhere. Do not propose the submission again unless the maintainer reopens
  it. F-Droid has no such rule (its interim policy, fdroid/admin#699, is
  Debian's "neither endorses nor prohibits"), so its submission stands.
- **Promoting Karasu on AniList itself.** Decided by the maintainer on
  2026-10-30, after AniList's changelog of that day widened its community
  guidelines to nearly all AI-generated content, naming "Apps or Websites
  whose development or functionality heavily relies on generative AI".
  Karasu is developed that way and says so above, so no forum thread,
  bio link, status update or video about Karasu goes onto anilist.co, and
  no agent drafts one. The rule governs what is shared on the site, not the
  API: the app keeps talking to AniList as before, and whether AniList
  ever acts on API clients is unknown — the built-in client id is the
  residual risk. Do not propose posting there unless the maintainer
  reopens it.

**The log is a deliberate exception to the first of those, decided by the
maintainer.** With verbose logging on, `karasu.log` records what detection saw —
window and session titles, the parsed release name, the matched id and score,
each redirect, and every scrobble phase change. That is a playback history by
construction. It was raised as a conflict and kept on purpose: an unreportable
bug is worse than a local file the user controls. Do not delete the debug lines
on the strength of the line above; they are what makes the toggle, its hint and
the diagnostics report true.

What is *not* carved out: no history UI, nothing queryable, nothing that
survives log rotation (~1 MB, one kept generation), and nothing uploaded
anywhere. And the volume is bounded on purpose — the detection poll runs every
5 s, so the per-tick lines go through `logging::debug_changed`, which records a
line only when it differs from the last one under the same key. A plain `debug`
in `detect_playback` or `media_session::detect` is 17,280 lines a day and
rotates the interesting part off disk; that is a bug, not a style preference.

**The AniList social surface is the second deliberate exception, also decided by
the maintainer.** Karasu reads AniList's own activity feed on `/social` and on
every profile — list activities, text activities, replies and likes — and can
post a status update through `SaveTextActivity`. That is activity expansion by
construction. It was raised as a conflict with the line above, the narrower
read-only option was offered and declined, and the whole surface was kept on
purpose: this is AniList's data rendered by an AniList client, and a tracker that
can read a friend's list but cannot show that they finished the show is a worse
client than the website it replaces. **Do not delete the feed, the composer or
the activity queries on the strength of the line above.** `/activity/:id`
renders one activity through the same fragments and normalizer as the feed —
the bell's activity notifications land there, names go to profiles — and
`MessageActivity` stays excluded on that page the same three ways.

What is *not* carved out, and these are the load-bearing half of the exception:

- **No local activity store.** Nothing in SQLite, no schema version, nothing
  that survives a restart. Every activity on screen came from a
  `Page.activities` request in this session and goes when the query cache does.
- **Playback history is still what the rejection means, and is still rejected.**
  The scrobbler does not write activities, `karasu.log` remains the only record
  of what detection saw, and nothing correlates the two. A "what did I watch
  last month" screen built from either is the thing being refused.
- **`MessageActivity` is never rendered.** It is private mail between two users,
  and it is excluded three ways — absent from `type_in`, given no inline
  fragment, and normalised to null with a test that says so. The bell's and
  the toast's requests for activities by id repeat all three: no `MESSAGE` in
  their `type_in`, no fragment, and a reader (`subjectOf`, `caption`) that
  names nothing for any other typename.
- **Paging is user-initiated by design.** A feed that fetches on scroll spends a
  ~30/min budget shared with the scrobbler and the alert passes without anyone
  asking it to, and the limiter cannot see a burst it has not sent. Every page
  past the first is a button; see the Conventions note.

Read *volumes* (`progressVolumes`) is not on this list and never was — it is one
of AniList's own list fields, it costs nothing to carry, and the local list has
stored it since schema v7. The rejected idea is tracking **purchases**, which
would need price data the app has no source for.

## Versioning (every commit)

Four-part scheme **`MAJOR.MINOR.PATCH.COMMIT#`**:

- **MAJOR** — breaking changes
- **MINOR** — new backward-compatible features
- **PATCH** — bug fixes / patches
- **COMMIT#** — a monotonically increasing commit counter (`+1` on every
  commit that changes what a build contains)

The three manifests (`package.json`, `src-tauri/Cargo.toml`,
`src-tauri/tauri.conf.json`) carry the `MAJOR.MINOR.PATCH` semver core. The 4th
segment lives in `COMMIT_NUMBER` in `src-tauri/src/commands/update.rs`, and
`FULL_VERSION` beside it spells all four segments out once, for F-Droid's
update check, which can match one string but cannot add two numbers (a test
holds it to the crate version and the counter, and `bump-version --check` to
the files); `app_version()` returns that full `MAJOR.MINOR.PATCH.COMMIT#` string, which the
About window always displays. **Bump the appropriate segment and the
`COMMIT_NUMBER` on every commit that changes what a build contains** — via
`scripts/bump-version.mjs`, which also keeps `Cargo.lock` in step; see "The
commit loop" below. A commit no build reads carries no bump: docs alone,
`site/` alone, tooling alone (the screens harness, `.claude/`), and the
merges Dependabot makes. The update check compares all four segments,
COMMIT# included, so two builds of one semver core still register as an
update; the script always moves a segment and the counter together.

**`latest.json` spells the commit number as semver build metadata**
(`0.23.2+90`), not as a fourth dotted segment — see
`scripts/release/generate-update-manifest.ps1`. `tauri-plugin-updater` parses
that field with `semver::Version::from_str`, which rejects `0.23.2.90` outright and makes
every install fail with *"unexpected character '.' after patch version number"*.

That fix alone isn't enough, so `download_pending_update` also supplies an
explicit `version_comparator`. The plugin's default compares the manifest
against `package_info().version` — which comes from `Cargo.toml` and therefore
has **no commit number** — so the running `0.23.2.90` reaches it as a bare
`0.23.2`, and the manifest for that same build (`0.23.2+90`) sorts above it:
the app would download and reinstall itself on a loop. The comparator supplies
`COMMIT_NUMBER` as the running commit number instead. `version_parts` in
`commands/update.rs` treats `+` and `.` alike so both spellings compare equal.
**Don't "tidy" that `+` back into a dot, and don't drop the comparator.**

**The repository is `Suzora/Karasu`; it was `Kyusetzu/Karasu` until September
2026, and every build before 1.30.8.760 still asks the old address for its
updates** (`update_channel_manifest_url`, compiled in). They reach the new one
only through GitHub's rename redirect — measured on 2026-09-30: both manifest
URLs answer 301 to `Suzora`, then 200. That redirect holds only while no
repository named `Karasu` exists under the `Kyusetzu` account, so **never
create one there, and never fork `Suzora/Karasu` into that account** (a fork
takes the name by default): every older install would stop finding updates,
silently, and has no other way to learn the new address. GitHub Pages does not
redirect at all — `kyusetzu.github.io/Karasu/` answered 404 the same day —
which is why the site, the README and both store listings moved with the code.

## The request budget

One ~30/min pool serves every screen, the scrobbler and the alert passes, so
the rule is: **name the spender, cache the answer, wake for a reason.**

- **Every request names its source.** `AniList::query_from(source, …)`; the
  passthrough takes it from `gql(query, vars, { source, ttlSec, mediaId })`
  and falls back to `gql:<root field>`. The tallies land in three places: a
  verbose line every five minutes (`N requests in the last 5 min: list 3,
  airing 1; 429s 0, min remaining 17`, zero included), the diagnostics
  report's three rows, and the sync panel's "Requests by source". Start any
  budget question by reading those, never by guessing.
- **The limiter's last measurement outlives the process** (kv `rate_state`,
  restored when younger than the window, a pending `Retry-After` re-parked).
  A build swap used to seed a full thirty and earn a burst of 429s.
- **The own list has a fifteen-minute window** in `fetch_media_list`: inside
  it the SQLite copy answers with no request; past it the copy answers at
  once and one background fetch refreshes it, emitting `list-refreshed` so
  the frontend re-reads the fresh copy for nothing. `force` (the sync button,
  the merge) always fetches. `fetched_at` is stamped only by `cache_list` —
  a patch is our own edit, not a fetch, so `edit_cached_list` must never
  touch it — and a first add, which no patch can invent, calls
  `cache_mark_stale` so the next read fetches.
- **The passthrough caches allowlisted answers** (schema v20, above).
- **The airing watcher wakes for the next episode** (`plan_next_wake`),
  clamped to [1 min, 6 h], re-timed by `replan()` after a list refresh. A
  replan re-times the sleep; it must never force a check, or every list
  refresh costs a request.
- **The bucket is per IP, not per token** (measured, see the window note), so
  the phone and the PC share one budget on one network.
- **The sync panel reads all of this and asks for none of it.** It polls
  `sync_status` once a second while open: the limiter's snapshot, the
  requests in flight (`AniList::in_flight`, a drop guard per request), the
  plan of the passes (`schedule.rs`) and each list's freshness, read as the
  fetch stamp alone (`cached_list_fetched_at`). Every source is put into
  words by `lib/syncSources`, and `syncSources.test.ts` fails on a source
  the code sends without a label.

Measured on the rig on 2026-09-13: a cold start fell from 8 requests in the
first 30 s to 2 (the bell count and one airing check); a restart inside the
window plus four screen changes cost no list request; a reopened detail and
the whole Wrapped page cost none.

## The commit loop, and the push gate

Five commands per commit, in this order, and one more before a push. Don't do
any of it by hand.

```sh
node scripts/bump-version.mjs patch   # minor for features, major for breaks
npm run verify                        # typecheck, audits and lints, then vitest and cargo test side by side
git commit                            # message ends with the Co-Authored-By trailer
node scripts/changelog.mjs            # after the commit — it reads the commit
git commit --amend --no-edit          # fold the changelog in
npm run verify:full                   # before a push: every check the repository owns, once
```

**`scripts/bump-version.mjs`** moves the version in all five places at once —
the three manifests, `COMMIT_NUMBER`, and `Cargo.lock`. It prints the resulting
four-part version on stdout (so a commit subject can be filled without a second
grep) and refuses to run when the tree holds nothing but version files, since a
bump with nothing to describe is a mistake or a double-run. `--force` overrides
that, `--print` just reports the current version.

**`scripts/changelog.mjs`** runs *after* the commit, because it reads it.
Folding the generated entry back in with `--amend` rewrites the sha the marker
just recorded, and in a fresh clone or after a squash merge that sha is no
commit at all. So the script takes the marker's commit only while HEAD
descends from it (`resolveSince`), and otherwise reads on from the commit
that wrote that marker line into CHANGELOG.md, which is the last one
described: the amended commit, or the squash. Whether the old commit still
exists is not the test, since a clone keeps a pre-amend commit in its reflog
and reading from it listed the entry twice. The committed marker is therefore
a pre-amend sha by construction and needs no repair, and the tree is clean
for `verify:full`; `--marker-head` remains for a marker nothing in the
history wrote. Skip the amend and commit the changelog separately if you
prefer. It
appends to `CHANGELOG.md`'s `## Unreleased` section from every commit since the
`generated-through` marker, so nobody writes that file by hand — the maintainer
declined to, and a changelog kept by hand is one that silently goes stale. The
commit subject is the changelog line; add a `Changelog: Fixed: …` trailer when
the subject describes the change and the reader needs the effect, or
`Changelog: skip` to leave a commit out. Version-only, docs-only, CI-only and
scripts-only commits drop out without a trailer, and so does one confined to
`.claude/` or `.githooks/`. The gate's scope counts a marker-only change of
CHANGELOG.md as bookkeeping, like a version bump, so it starts no suite.

**The app shows that file, word for word and in English.** After an update
Karasu opens What's new once over the first screen, and About's Changelog
button opens the same view: `scripts/changelog-read.mjs` parses CHANGELOG.md
at build time into `virtual:changelog` (Unreleased, the two newest releases,
and `newestCut` naming the first one left out; older ones are a link to
GitHub), a lazy chunk of about 10 KiB, and `lib/whatsNew` decides what a
start shows. So every line is read on its own, out of its commit's context:
write subjects and `Changelog:` trailers that make sense to someone using the
app. A line's id is a hash of its plain text (case, spacing, markup and the
final full stop evened out), which is how a Nightly shows only the lines it
has not shown before; rewording a line that already shipped in a Nightly
shows it again to Nightly users. The reader takes the headings
`release-notes.ps1` takes and throws on anything else: a `### ` that is not
Added, Changed, Fixed, Removed or Security, text in a group that is not a
`- ` bullet or its two-space continuation, or releases out of order. That
fails the build, so `changelogRead.test.ts` reads the real file to say so
first; CI ignores `*.md`, so a hand edit is checked by the gate and the push
gate, not by a CI run of its own.

**Every changelog line, trailer and curated release follows the project
skill `.claude/skills/karasu-changelog`**, decided by the maintainer on
2026-10-13: it holds the procedure he expects for a commit's subject or
`Changelog:` trailer, for curating a Stable (the range named by its tag,
since the `latest` tag breaks `git describe`, and an audit for commits left
out) and for F-Droid's fastlane changelog. Load it before writing any of
them. The short store text is drafted with the global `app-store-changelog`
skill and then fitted to the house rules, which that skill does not know.

Prefer extracting pure logic into `src/lib/*.ts` (or a pure Rust fn) and unit
testing it. Untestable-by-construction logic in a component is the usual reason
a regression here is invisible until it ships.

## Superpowers in this repository

The Superpowers skills (obra/superpowers) are installed per machine, in
`~/.agents/skills`, never in this repository, and they are welcome here. This
file outranks them wherever the two disagree, and they disagree in four places:

- **Specs and plans stay local.** brainstorming and writing-plans save to
  `docs/superpowers/{specs,plans}/`, and a clone keeps that folder in
  `.git/info/exclude`, so nothing there is committed: the repository is public,
  and a plan is a working note, not a document. Never `git add -f` it. The
  bundle is safe from it too, because Tailwind's scan honours
  `.git/info/exclude`. Measured on 2026-10-11: a probe class under
  `docs/superpowers/` left the emitted CSS byte-identical (102,355 bytes, same
  hash), while the same file one folder up added both of its classes
  (+379 bytes). A clone without the exclude line would carry class names from
  its plans into a local build, so add the line before the first plan.
- **A plan's tasks do not commit; the feature commits, once.** Where
  writing-plans or executing-plans says "Commit", read "run the tests this task
  touches and see them green". The feature lands as one commit through the loop
  above: bump, verify, commit with the trailer, changelog, amend, marker. Every
  commit is a version and a changelog line, so twelve task commits would be
  twelve releases of nothing.
- **Test-first means the test is seen failing first.** `npx vitest run <file>`
  or `cargo test <name>` fails for the reason the change addresses before the
  change exists. A new test file takes the `.dom.` name only when it needs a
  DOM (see the two vitest projects below).
- **Worktrees and finishing.** using-git-worktrees puts a worktree under
  `.claude/worktrees/`, which Tailwind already skips (`@source not
  "../../.claude"`). finishing-a-development-branch means the push gate
  `npm run verify:full`, a pull request merged by squash, and a commit or a push
  only when the maintainer asks for one.

## Impeccable in this repository

Impeccable (pbakaus/impeccable, installed on 2026-10-12) is the design
skill: `critique` and `audit` to review a surface, `shape` to plan UX before
code, and the refinement commands (`clarify`, `distill`, `layout`, `polish`,
`harden`, `quieter`, `adapt`, `typeset`) to act on what a review found. Like
the Superpowers it lives per machine in `~/.agents/skills`, never in this
repository. DESIGN.md and this file outrank it, and they disagree in five
places:

- **Refinement, never redesign.** Karasu is an evolution of one identity
  (DESIGN.md, "Principles"), so Impeccable works on the incumbent code as
  its authority. Its redesign path, which replaces DESIGN.md, and the
  commands that argue with "dark, dense, quiet" (`bolder`, `overdrive`,
  `delight`, `colorize`) run only on the maintainer's word. A finding that
  contradicts an entry in DESIGN.md's decision log is a question for that
  log, not a fix.
- **The app is an Operate surface, the website a Persuade one.** Name the
  mode when a review starts, since the heuristics it scores differ.
- **Arrangement changes still get three mockups.** `shape` may come before
  them and `live` or `generate` may explore, but what the maintainer
  chooses from is the boards of the `karasu-mockups` skill.
- **Its files stay local.** `.impeccable/` (critique snapshots, detector
  config) is in `.git/info/exclude` like `docs/superpowers/`, and Tailwind's
  scan honours that file. PRODUCT.md at the root is committed: who Karasu is
  for, in which order, and why, written with the maintainer on 2026-10-12;
  `init` updates it rather than writing a second one.
- **A command does not commit.** The change it leads to lands as one commit
  through the commit loop, with its screens shot before and after.

The detector runs on its own: `impeccable detect --json <dir-or-url>` over
`src/components` and `src/pages`, over the screens harness while it serves,
or over `npm --prefix site run preview`. Its findings are leads, checked
against the style audit and DESIGN.md before anything changes.

## Enforced by `.claude/settings.json`

A rule in this file is context an agent can misread; the few that must never
break are also settings Claude Code enforces itself, in every session of this
repository, cloud ones included. The permissions deny a forced push, a push
of tags, a push past the hook, `git add -f`, creating, forking or renaming a
repository, a release made by hand, a write to the remote that skips git, a
hand edit of a generated file (the bindings, the site tokens, the widget
strings, the entity table, snapshots, proptest regressions, the lockfiles),
reading key material and editing the installed app's data. There is no ask
rule, decided by the maintainer on 2026-11-10: a prompt stalls a session
nobody is watching, so a rule here either refuses or stays prose. Two hooks run `scripts/agent-guard.mjs`
(its decisions are `agent-guard-core.mjs`, tested by `agentGuard.test.ts`):
before a file is written it refuses text shaped like a credential, naming the
rule and never the match; before a command runs it refuses the gate in a
pipe, a forced push in any spelling, a push of a version tag, `tauri dev`
without the `karasu.portable` marker, and a commit whose change holds a
credential, key material by file name, or a path under `docs/superpowers/`,
`.impeccable/` or `audit/`. A guard that fails by itself lets the call
through. Two more hooks hold "tests before done". A green `npm run verify`
(not `--rust`, not CI) writes a stamp into the git directory: a fingerprint of
the tree's content that a commit, a version bump and the changelog amend leave
unchanged (`treeState`), with the phases that ran. When a session wants to
stop, the stop hook lets it when the tree is as the session found it, or when
a stamp for this exact state covers the suites the change can reach, in a
cloud session as anywhere (the crate builds there once the Linux packages
`ci.yml` installs are present, measured on 2026-11-10 in an Ubuntu 24.04
container, and the cloud environment's setup script installs them);
otherwise it sends the session back once per state, to run the gate or to say
plainly that the state is unverified. It never runs a test itself. The
session-start hook records that starting state, adds `docs/superpowers/` and
`.impeccable/` to `.git/info/exclude`, and reports, without setting it, a
clone whose `core.hooksPath` is not `.githooks`. Add a rule there when a "never" in this file is one a command or a
path can express; a deny pattern on a command is not a boundary, which is why
the hook reads the same cases off the whole command.

Three more of these rules are the gate's, so they hold for a person and for CI as
well: oxlint refuses an import of `@tauri-apps/api/core` (commands go through
the bindings) and any use of `IntersectionObserver` (paging is a button), and
clippy refuses `println!`, `eprintln!` and `dbg!` outside tests
(`[lints.clippy]` in `Cargo.toml`, with `clippy.toml` leaving tests alone and
`build.rs` allowed its cargo directives). Clippy runs in the push gate and on
a pull request, not in the commit gate. The linter has no rule for a
property, so a test holds the fourth: `clipboardUse.test.ts` fails when the
browser's clipboard is named outside `lib/clipboard`.

## Comments: one line each

Decided by the maintainer on 2026-09-12 and applied to the whole tree the same
weekend: **every comment in a code file is one physical line** — `//`, `///`,
`//!`, `#`, `/* */`, JSDoc, KDoc, a `{/* */}` in JSX, all of them. One sentence
that says what the code does, or the one reason it is this way; when both will
not fit, keep the why. Numbers, dates, sizes, timings, rejected alternatives and
bug history stay out of comments — this file is where a measurement lives.
Adjacent comment-only lines are one block, so stacking one-liners is not a way
around the rule; a trailing comment on a code line is never a block. Hard limit
120 characters of comment text, aim for 100. No comment may point at another
comment ("see the note above"); point at a function, a test or this file. The
only allowed multi-line shape is a script header's list of example invocations,
and each of those sits in `scripts/comment-allowlist.json` with its reason —
an entry nothing matches fails the check, so the list cannot go stale.

Three scripts hold the rule, and `npm run verify` runs the first:

```sh
node scripts/comment-audit.mjs --check           # exit 1 on any block, long line, desync or stale allowlist entry
node scripts/comment-audit.mjs --stats           # the per-area table
node scripts/comment-audit.mjs --files a b       # only these paths, for a batch
node scripts/comment-strip-check.mjs --base HEAD # proves a change touched only comments
```

`comment-lexer.mjs` is the shared scanner (strings, regexes, raw strings,
templates, heredocs and YAML block scalars are all understood, and a file that
ends inside one is reported as a desync rather than passed). The strip check
compares base and working copy with every comment removed — the proof a
comment-only commit needs, and the only proof available for the Windows-only
and Linux-only Rust arms and the Kotlin, which do not compile here. A rewrite
that deletes a comment outright is legal under the rule but against the
intent: prefer one good line.

## Notes that have cost real time

- **`npm test` already means `vitest run`.** `npm test -- --run` is redundant.
- **Control characters in source must be written as an escape and then
  verified.** An editing tool can emit a literal control byte where `\u0000`
  was intended; the file then reads back looking correct while every subsequent
  exact-match edit on that line mysteriously fails to apply. Check with `grep -c $'\0' <file>` after writing. (The NUL
  that used to live in `src/lib/search.ts` died with the fuzzy refactor; the
  lesson did not.)
- **A suite that finishes far faster than usual failed early, it did not get
  faster.** The Rust suite takes ~1 s; a 0.02 s run means something bailed.
- **Never pipe `npm run verify` through `grep`.** The pipe reports *grep's*
  exit status, so a `tsc` failure sails through and gets committed. Run it bare
  and read the exit code.
- **PRs merge by squash.** The repo refuses merge commits server-side;
  `gh pr merge N --squash`. A local `git pull --no-rebase` afterwards may
  still create a local merge commit — that is fine, the restriction is
  GitHub's. A lockfile conflict resolves by taking the merged `package.json`
  and regenerating with `npm install`, never by rebasing twelve version bumps.
- **Linux-only code does not compile on Windows**, so `cargo test` here proves
  nothing about it. Either let CI's `linux-build` job be the check, or — for a
  pure-Rust dependency like zbus or chacha20poly1305 — paste the module into a
  throwaway crate and `cargo check` it locally. That caught two real errors in
  the MPRIS backend that would otherwise have gone to CI. For the same reason,
  never put `#[cfg(target_os = "linux")]` on a *statement*: it is stripped here,
  so nothing inside it is ever checked. Write a cfg'd pair of functions instead
  (`protect`/`unprotect`, `delete_portable_key`) so the call site still compiles.
  From a Linux box the other two platforms are a cargo check away:
  `scripts/windows-check.sh` (the whole crate on the GNU target, with MinGW)
  and `scripts/android-check.sh` (aarch64 with the NDK), both phases of the
  push gate where their toolchain is installed. On its first run, on
  2026-11-10, the Android one found a lock trait imported for the desktop
  only, in a tree the commit gate and both pull-request jobs had passed.
- **`eprintln!` reaches nobody in a shipped build.** `main.rs` sets
  `windows_subsystem = "windows"`, so a release binary on Windows has no console
  and stderr is discarded; a Linux AppImage started from a desktop file is no
  better. Use `logging::{error,warn,info,debug}` — and never log a command
  argument, a request header or a response body: `anilist_connect` takes the raw
  token and `jellyfin_sign_in` takes a plaintext password. `logging::scrub`
  replaces credentials with a labelled `<CREDENTIAL_…>` on write, and has a
  catch-all so an unforeseen shape fails closed, but it is a backstop rather
  than a licence.
- **Run the dev app isolated, or it edits the real install's data.** Debug and
  release share the identifier, so they share `%APPDATA%\dev.kyu.karasu` *and*
  the `dev.kyu.karasu-sim` single-instance mutex: starting `tauri dev` while the
  installed build runs makes the dev process hand over its argv and `exit(0)`,
  and without isolation it would otherwise open the real `karasu.db`, append to
  and rotate the real `karasu.log`, and read the real tokens. Drop a
  `karasu.portable` marker beside `src-tauri/target/debug/karasu.exe` and
  `portable::data_dir` sends all three to `target/debug/data/` instead. The
  marker is inside the ignored `target/`, so it is invisible in git and
  `cargo clean` deletes it — recreate it before trusting a dev run. A debug
  build also starts hidden in the tray (`hide_window_in_dev`); relaunching the
  exe shows the running one through the single-instance callback.
- **Never round-trip source text through `encode("utf-8").decode("unicode_escape")`.**
  A script inserting i18n keys did, over text Python had already decoded, and
  every em-dash, arrow and umlaut came back a byte at a time as latin-1 —
  `Kontoänderungen` became `KontoÃ¤nderungen` in seven strings across both files.
  Worse, `grep` reported the files clean because the console codepage hid it. If
  non-ASCII is ever in question, compare **codepoints** (`hex(ord(c))`), not
  glyphs, and write literal UTF-8 rather than escapes.

## Where the rest lives

Most of what this file used to hold moved, word for word, into `.claude/rules/`
on 2026-11-10. Claude Code loads each of those files by itself when a session
touches a path its header names, so the Android notes cost nothing in a session
that edits a chart. A comment in the code that says "see CLAUDE.md" may mean a
section that now lives there; this is the map. Read the file yourself when a
task is about its subject and no matching path has been opened yet.

- **`.claude/rules/frontend.md`** — The frontend: layout, design language, conventions and measured invariants: Layout: `src/`; Notes that have cost real time; Design language; Conventions; Performance invariants.
- **`.claude/rules/backend.md`** — The Rust backend: layout, the bindings, the data model and its notes: Layout: `src-tauri/src/`; The data model, and the decisions inside it; The bindings are generated, never written; Notes that have cost real time; Performance invariants.
- **`.claude/rules/android.md`** — Android: the build, the updater, the tracking service and the device measurements: Notes that have cost real time.
- **`.claude/rules/anilist-api.md`** — What AniList's API does, as measured: Notes that have cost real time.
- **`.claude/rules/detection.md`** — Detection: what browsers and streaming sites publish: Notes that have cost real time.
- **`.claude/rules/gate-and-tests.md`** — The gate, the test suites, the scripts and CI: Layout: `scripts/`; The gate in detail; The test suites; Notes that have cost real time; The dependency graph is checked, not trusted; The dev loop has eyes; Three Cargo tools that answer questions, run by hand; Links are checked weekly, not trusted; The Actions cache is 10 GB, and a PR must not spend it; Dependabot merges itself.
- **`.claude/rules/release-and-packaging.md`** — The AppImage, Flatpak, F-Droid and the release workflows: The AppImage; Packaging beyond the release page.
- **`.claude/rules/site.md`** — The website: The website.

## Invariants the release audit established

Each of these closed a group of real defects, and each is the kind of rule that
comes back the moment it is only remembered rather than enforced. They are
written as rules because that is what the audit found: the same mistake in
four or five places, made by careful code, because nothing said it once.

- **`list_cache` has one owner.** `db::edit_cached_list` does read, edit and
  write under a single lock, and `cache_patch_entry` / `cache_forget_entry_id`
  are the only ways an entry changes. *Every* write path calls them — the live
  save, the bulk chunks, the delete, the queue drain — because the scrobbler's
  two anti-regression guards read this table as truth. Fed a stale copy, they
  let a scrobble overwrite the user's own newer edit, and a deleted entry stayed
  a scrobble candidate that `SaveMediaListEntry(mediaId:)` then recreated.
- **`Queued` is not success.** `save_entry_core` answers `queued` for anything
  that could still work later, and no caller may treat that as landed: no
  `Phase::Updated`, no cache patch, no `scrobble-done`, no green receipt.
  `Outcome::{Landed, Queued, Refused}` exists so the compiler asks. A
  *skipped* drain takes the same exit as a failed one, in all three mutating
  commands.
- **A queued save yields to a newer change on AniList.** Before a drain sends
  anything it asks once per fifty titles when AniList last changed the
  entries its queued saves are about (`remote_updates`, source `drainCheck`,
  `Page.mediaList(userId:, mediaId_in:)`, validated live on 2026-11-10: an id
  not on the list drops out of the answer). A save queued before that change
  (`is_overtaken`, with two minutes of slack for a clock that trails
  AniList's) is removed unsent and reported through the bell, because
  replaying it set an entry back that another device or the website had
  moved on since. An entry AniList does not hold overtakes nothing, so a
  queued first add still lands, and queued deletes are not checked. A check
  AniList refuses for good is logged and the saves go out as before; one
  worth retrying stops the drain like any other.
- **Identity changes only through `commands::auth::switch_identity`.** It
  forgets the outgoing account first and writes the identity *before* the
  credential. The order is the point: a failure then leaves "this account, no
  credential", where the drain finds nothing, rather than "new credential, old
  identity", which sends one account's queued edits under another's bearer.
  `refresh_viewer` is deliberately outside it — same account, fresher data.
- **The tick re-reads what the tick decides on.** `settings.enabled`, the gap
  grace and play state are read at the due point, not at session creation. A
  session survives `EMPTY_TICK_GRACE` empty polls, because on any source that
  reports only playing sessions a pause is indistinguishable from a stop. No
  phase carrying a write in flight may arm — that invariant is what makes
  spawning the write safe, and it has a test of its own.
- **Validate by parsing, never by spelling.** `net::host_is_local` canonicalises
  to an `IpAddr` before any range test. Three spellings of loopback walked
  through the string-matching version it replaced. `to_ipv4` is not the tool:
  it converts IPv4-compatible addresses too, turning `::1` into `0.0.0.1`.
- **The limiter reads its own deadline.** A `Retry-After` outranks the local
  budget, and `MAX_PACE` bounds only our own pacing. One retry layer, not two:
  429 answers with the stable code `RATE_LIMITED` so the frontend can refuse it
  without re-implementing the classification in TypeScript.
- **A partial result is a value, not an absence.** A failed list query is not an
  empty list, and a query in the error state has `isLoading === false` with no
  data — so destructure `isError` wherever `data` is used, or the screen states
  the opposite of the truth as settled fact.
- **The five version files must agree.** `node scripts/bump-version.mjs --check`
  proves it and the release workflow runs it before building. A mismatch between
  `package.json` and `COMMIT_NUMBER` makes every install re-download its own
  update forever.

## Conventions

- **One commit per feature.** The maintainer commits per feature; keep changes
  scoped. Commit messages end with the `Co-Authored-By:` trailer.
- **Validate AniList queries live** before wiring new fields (introspection /
  a throwaway Node script), since the schema is the source of truth. A *mutation*
  cannot be validated by running it — that means editing real entries — so use
  schema introspection (`__type(name: "Mutation")`) for its argument list
  instead; that is how `UpdateMediaListEntries` was widened past status/score.
  Scalars on `LIST_QUERY` (`startedAt`, `completedAt`, `private`) are cheap and
  fine; nested edge lists like `studios` are not, and belong to `DETAIL_QUERY`.
- **DB changes go through a new `MIGRATION_V*`** guarded by PRAGMA
  `user_version`; add a `mem_db()` test. Run it through `apply`, which wraps the
  step in a transaction so the schema change and its `user_version` bump land
  together — `execute_batch` alone commits each statement separately, and a
  crash in between leaves a database that is migrated but not labelled as such.
  Prefer `CREATE TABLE IF NOT EXISTS` so a step is re-runnable anyway; `ALTER
  TABLE ADD COLUMN` is not, which is why v7 has to ask whether the column is
  already there.
- **Platform-specific Rust is `#[cfg(...)]`-gated**, and both Windows and Linux
  are real implementations rather than one plus a stub. Keep the pure decisions
  out of the gated modules — `media_session/mod.rs` is the pattern: the backends
  supply data, the shared module decides, and its tests then run on both
  platforms instead of only in the Linux CI job. macOS is deliberately *not*
  covered: the keyring dependency is declared for `cfg(windows)` and
  `cfg(target_os = "linux")` only, so a macOS build fails at the manifest
  rather than compiling a Secret Service backend that cannot work there.
