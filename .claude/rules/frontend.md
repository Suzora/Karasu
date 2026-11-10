---
paths:
  - "src/**"
  - "index.html"
  - "vite.config.ts"
  - "DESIGN.md"
  - "scripts/screens/**"
  - "scripts/screens.mjs"
  - "scripts/style-audit.mjs"
---

# The frontend: layout, design language, conventions and measured invariants

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## Layout: `src/`

```
src/
  app/               App.tsx, main.tsx, index.css — the entry — plus lazyRoute.tsx,
                     the pages one click away that load on idle
  api/               AniList GraphQL client, queries, types, franchise, library,
                     social (the whole profile/follow/forum surface: `social.ts`
                     re-exports the eight files under `social/`, one per
                     subject, so every import still names `@/api/social`);
                     bindings.ts is GENERATED from the Rust command signatures
                     and tauri.ts is `unwrap`, the one seam over it — see
                     "The bindings are generated"
  components/
    ui/              primitives with no app knowledge (kebab-case files);
                     popover is the anchored dropdown / phone sheet the list
                     toolbar's panels open in
    shell/           the window frame and global machinery — titlebar, sidebar,
                     bottom bar, back button, the account button (the
                     titlebar's avatar and name, the desktop's one way to the
                     own profile), bell (the titlebar's glance, the
                     phone's NotifSheet and the NotifFeed rows both share with
                     the notifications page), command palette, keyboard
                     sheet, global keys, toast, first run, session expired, the
                     what's-new gate (the changelog once after an update), the
                     sync panel, the pull-to-sync indicator, the detection pill
                     and the floating detection window, PageColumn (the column
                     pages' one frame and title, `ColumnPage` and
                     `PageTitle`, and their parts: `columnRow`,
                     `ColumnLabel`, `ColumnRule`, the phone's
                     `PickerField`), and the action host,
                     which owns right-click and long press and renders the context
                     menu or the action sheet over one resolved list of actions
                     (actionIcons/actionLabels are its two lookup tables)
    media/           anything that renders a title or edits an entry (the
                     detail page's DetailHero and ProgressBand among them)
    overlays/        modal flows (confirm, preset, random pick, sign-in merge,
                     profile edit, match picker, favourites, new thread,
                     season split, cover viewer, review composer, what's new,
                     the stack sheet and its rename)
    list/            the parts MediaList draws (StatusNav, the status column
                     and the phone's StatusPicker, the ListToolbar and
                     the phone's ListMoreMenu, virtual grid, rows, bulk bar)
                     plus VirtualRows, the flat-list twin of VirtualGrid — the
                     local library runs several of them in one scroller, so
                     each measures its own `scrollMargin`
    stats/           the parts Statistics draws — panels, ranked list, Charts
                     (the sunburst), the insight cards and `CardPack`
                     (insights), AreaChart, DotPlot, GradientBars,
                     Heatmap
    dashboard/       the parts the Overview draws — banner with search and
                     48-hour strip, list shelves, catch-up row (aired episodes
                     not yet watched), continue row, coming up
                     (the week as a grid is the calendar's), the right rail (detection, figures, own
                     activity, birthdays) and the phone's two-page pager;
                     every decision is `lib/overview`
    social/          the parts UserProfile, Social and Thread draw — the
                     markdown renderer, follow button, user and activity and
                     thread rows, and the two composers
    season/          the season page's column — the year with its arrows,
                     the four seasons as one choice, the formats with their
                     counts and the two switches, and the phone's format
                     field; the filters live in the URL (`lib/seasonView`)
    search/          the parts Search draws with nothing typed — the browse
                     sections, the ranked top list and the portrait cards
    EmptyState · Skeleton · KarasuMark · FilteredNotice · ErrorBoundary ·
    RichText — cross-cutting, belong to no group; FilteredNotice is the
    content filter's one disclosure line, so the three surfaces that show it
    cannot drift apart
  hooks/             shared hooks (useListMutations, usePrimedLists,
                     useColumnCount, useRowTier, useListSummary, usePanZoom,
                     useCachedEntry, usePresence, useViewTransitions,
                     useAniListLogin, useFollow, useSocialActions,
                     useFavourite, useActivityPost, useUpdateUser,
                     usePhoneShell, useShortViewport, useElementWidth,
                     useBackClose, useNotifBadge, useNotifications,
                     useDialogFocus,
                     useGridRoving, useSyncStatus, useManualSync,
                     usePullToSync, useActionRunner, useCachedMedia, useDiscoveryEntry,
                     useCoverWidth,
                     useDetectionMedia, useDetectionDrag, useElementSize,
                     useTabSwipe, useSeasonArt, useSettingLanding,
                     useFlickDismiss, useCustomListAdmin, useUrlState,
                     useScrollMemory, useFloatInset, useGreeting,
                     useRemoveFollower)
  i18n/              index.ts (setup) + en.ts + de.ts; `de: typeof en` enforces
                     key parity across the two files. locales/ holds the 38
                     machine-translated languages and native/ the flat
                     catalogs Rust and the Android widgets read
  lib/               pure logic + its *.test.ts — the place testable code goes
  pages/             one per route; settings/ holds the pane files — the seven
                     pane ids live in `lib/settingsPanes.ts` (the account pane
                     holds the AniList one's sections too), and the desktop
                     and data panes are sections exported from AdvancedPane
  stores/            Zustand stores (auth, theme, library, nowPlaying,
                     overviewRail, stacks, tagColours, airingMutes, …)
  assets/            karasu-mark.svg, the one asset the bundle inlines
  test/              render.tsx — the provider wrapper and sign-in helpers for
                     the jsdom project, and nothing in the node project imports it
```

## Notes that have cost real time

- **A missing i18n key renders as the key.** i18next does not throw and does not
  fall back, so `entry.scoreHint` appears on screen and nothing reports it.
  `src/lib/i18nKeys.test.ts` resolves every literal `t("…")` in the source; the
  `de: typeof en` type covers the other direction.
- **Never point Tailwind's scanner at a hand-written `@source` list without
  diffing the emitted CSS.** `@import "tailwindcss" source(none);` plus explicit
  globs made the build ~30× faster and emitted **6,560 bytes instead of
  62,178** — every utility silently gone, no error, no warning. Nothing else was
  learned for free either: the default scan is not the bottleneck. Vite's
  `[PLUGIN_TIMINGS]` blames `@tailwindcss/vite:generate:build`, but the walk only
  ever sees 285 tracked files (155 scannable, ~50 ms); the ~8 s is *generation*.
  The one real hazard there is the walk's reliance on `.gitignore` — the root one
  did not mention `src-tauri/target/`, so ~100 GB across ~195k files was kept out
  by the nested ignore file alone. It is listed in both now.
- **The CSP needs `img-src data:`, and dropping it makes the bird disappear.**
  `assets/karasu-mark.svg` is 2,966 bytes, under Vite's 4,096-byte
  `assetsInlineLimit`, so the build inlines it as
  `data:image/svg+xml,%3c?xml…` — verified by grepping `dist/`, not by reasoning
  about it. Without `data:` the mark vanishes from the titlebar, About, first
  run, the Wrapped footer and several empty states, and nothing else breaks, so
  it looks like a styling regression rather than a policy one.
- **`csp` and `devCsp` are separate, and dev genuinely needs the looser one.**
  Vite injects `<style>` elements at runtime and serves HMR over a websocket;
  the production bundle does neither. A single strict `csp` therefore breaks
  `tauri dev` while the shipped app is fine — which is the worst way round to
  find out.
- **Tauri rewrites the CSP at compile time**, parsing the frontend assets and
  injecting nonce and hash sources into `script-src` and `style-src`
  (`dangerousDisableAssetCspModification` turns that off — don't). Two
  consequences: never add `'unsafe-eval'` or `'unsafe-inline'` to `script-src`
  in production, because Tauri's nonce is what makes it work; and
  `'unsafe-inline'` in `style-src` is *inert* whenever a hash is present, since
  CSP tells browsers to ignore it then. It is kept only as a fallback for the
  case where Tauri injects nothing.
- **A CSP cannot be checked from the Vite dev server** — it applies to the Tauri
  webview, so the browser-pane tooling is blind to it. Only a real
  `tauri dev`/`tauri build` run proves it.
- **A trailer plays in a loopback page, because YouTube refuses a `tauri://` referrer.** Measured on
  2026-11-01: a youtube-nocookie embed framed straight from the app's page answered error 153 ("player
  configuration"), and so did the embed URL opened top-level with no referrer, while the same embed inside a
  page on `http://127.0.0.1` played. So `trailer.rs` binds a random loopback port on the first click, serves
  one page per `/<token>/<site>/<id>` (a 128-bit token, an id of URL-safe characters only, a CSP of its own
  whose `frame-ancestors` names the app's origins) and closes after five idle minutes; the app's `frame-src`
  names `http://127.0.0.1:*` and the two hosts. Before the click only the video's still loads, through the bio-image proxy
  (`fetchBioImage`), so the host sees the IP on every detail page with a trailer, which the maintainer chose
  on 2026-11-01 for the preview; the card carries an "Open on YouTube" link beside it. Played in a release build on KDE Plasma Wayland the same
  day; Dailymotion and Android were not tried.
- **Bio images are proxied through Rust, and `img-src` is still not widened.**
  Across 89 real bios holding 350 images, **6 (2%) were on `*.anilist.co`**; the
  rest were imgur (147), tumblr (57), pinimg, postimg, catbox and discord — so no
  allowlist covers that tail without handing an unbounded set of third parties
  the user's IP and which profile they opened, *from the page, on every render*.
  `commands::fetch_bio_image` makes one bounded request in Rust instead and
  returns a `data:` URI, which the existing `img-src 'self' data:` already
  permits: size cap, the format sniffed from the bytes (png/jpeg/gif/webp/avif/ico
  — never SVG, it is a scripting context — and the declared `Content-Type` is
  not consulted, because hosts send `octet-stream`, nothing, or the wrong
  one), timeout, no cookies, no `Referer` on any hop (`referer(false)`;
  reqwest's default sets one on redirects), and local/private hosts refused on
  the URL *and every redirect hop* so a crafted bio cannot probe the LAN, by
  name and by answer: the client is `net::public_client_builder`, whose
  resolver drops every local address a name resolves to, since a public name
  may point anywhere and the spelling check alone let such a name through
  until 1.78.3. A system proxy resolves for itself and is outside that. The
  frontend fetches each URL once per session (`lib/promiseCache`). The
  host still learns the user's IP; that is unavoidable in any design that shows
  the image, and it is the residue rather than the part that was solved. Anything
  that fails falls back to the chip. **Do not "simplify" this into a CSP
  change** — that is the thing the measurement rejected.

## Design language

`DESIGN.md` at the root is the brief for how Karasu looks and moves, and it
outranks any design skill, library default or mockup: the principles ("dark,
dense, quiet"), the token vocabulary and what each step is for, the contrast
obligations every theme must meet, the primitive to use for each recurring
shape, the libraries approved and declined, and the dated decision log. The
conventions below that touch styling (accent, motion registers, exits, banners)
stay here as rules; DESIGN.md says what they add up to. A change to how a screen
is *arranged* gets three mockups before code, and the choice goes into that log.

**`scripts/style-audit.mjs` is the vocabulary's gate**, the comment audit's twin
and the third phase of `npm run verify`. It parses every app `.ts`/`.tsx` with
`oxc-parser` (the parser knip already carried, now a direct dev dependency,
because TypeScript 7 no longer ships a JS compiler API) and counts, per file and
rule, what DESIGN.md calls drift: bracketed radii, sizes, tracking, z-index,
shadows and motion values; radii and shadows named by size rather than by
role; hex and rgb in a class; a shade the theme does not
define (read from `index.css`'s `--color-*` names, so `ink-200` is caught and
renders nothing); Tailwind's own palette; broad transitions; `animate-spin`
outside the spinner; `outline-none` with no focus style beside it or on a
`focus-within:` wrapper; a class cut at a template `${}`; icons off the
14/16/20/32 scale; an uppercase eyebrow (`tracking-eyebrow`, gone since the
redesign of 2026-10-17); and Base UI imported outside its wrappers.
`scripts/style-baseline.json` is a ratchet, not a licence: `--check` fails when
a count rises above it *and* when it falls below, so the commit that removes
drift also runs `--tighten` and the room cannot be spent again. `--record`
rewrites it outright and is for a deliberate raise, which the diff then shows.
`scripts/style-allowlist.json` holds the permanent exceptions, each with its
reason, and an entry nothing matches fails the check. Recorded on 2026-09-25:
380 findings in 91 of 281 files; emptied on 2026-09-26, so every finding now
fails the gate outright. Half a second a run.

**`scripts/screens.mjs` shows the real app, and it is how a UI change is
proven.** It serves `scripts/screens/` (the whole `App`, shell included, over
`mockIPC` answers and fixture lists) and drives Chromium: `shoot` renders every
screen in its `SCREENS` table (or the `--only` subset) per style and theme, and a
screen may name a `mock` the fixtures branch on, `board` lays them
out for the maintainer, `clip` records motion side by side, and `hash` takes
still frames at a fixed clock with motion off. Two `hash` runs agree, so an
unchanged hash is the proof that a mechanical refactor moved no pixel.
`--lang qps` runs any mode in a pseudo-locale built from English on the spot
(`scripts/screens/pseudo.ts`: accented, 40% longer in short words, bracketed),
and `shoot` then lists every bare text on screen as `bare` in `report.json`: a
bracket missing is a text that skipped `t()`. `overflow` opens each screen and exits 1 when `<main>`, or any
`overflow-y-auto` box inside it (a page's own scroller, a dialog's body),
scrolls sideways, naming the elements
whose removal frees the width (removal, because a reach past the edge alone can
be paint), and every `shoot` records the same figure as `sideways` in its
`report.json`. Search scrolls its own div, so until 2026-10-16 the check could
not see it: a people heading beside its link ran 8 to 12 px past a 320 px
phone while every Search screen read 0. On Windows `CHROMIUM_PATH` points it at Edge
(`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`), and a cold
dev server spends the better part of a minute on the stylesheet before the
first page settles. The
banners and covers of a handful of real titles (`ART`, one of them a new season
without a banner, and its prequel) and a catalog of about 120 more (`CATALOG`:
the list, search, season, calendar and franchise titles, each with its leading
characters and their Japanese voices, plus the first title's cast and staff)
are fetched from AniList into `scripts/screens/.cache/` on first use and never
committed; a fixture falls back to a generated gradient where the cache has no
entry. `site` shoots the website's set (the `SITE` table, in English, at the
site's sizes) straight into `site/captures/`, which
`site/scripts/process-screenshots.mjs` turns into what the page ships; the stand-in faces
are Roboto for Android and Open Sans for Segoe UI, which Linux lacks. The
project skill `.claude/skills/karasu-mockups` holds the procedure the
maintainer expects: three mockups before an arrangement changes, the boards'
shape, and the question that follows them.

## Conventions

- **Accent colours** derive shades + a readable ink colour (`src/lib/contrast.ts`);
  use `text-accent-ink` on accent-filled controls rather than hard-coded
  `text-white`. The accent has two sources: the user's hex (`karasu-accent`)
  and the OS's, chosen by `karasu-accent-source` and read through
  `system_accent` in `commands/system.rs` — `UISettings::GetColorValue(Accent)`
  on Windows, the settings portal's `org.freedesktop.appearance accent-color`
  on Linux (GNOME 47+, KDE; older portals answer an error, so `None`), and
  `android.R.color.system_accent1_500` through `SystemAccent.kt` on Android
  12+. The store keeps the user's colour underneath (`effectiveAccent`),
  re-reads on window focus only while following the system, and the
  Appearance toggle is disabled with a hint where the answer is `None`. On
  the rig on 2026-09-20 the switch painted Windows' `#0078d4` and came back
  to the saved colour, and on 2026-10-31 on KDE Plasma Wayland it took KDE's
  accent, followed a change on focus and came back the same way, and on the
  NX809J (Android 16) it took the wallpaper's Material You accent.
  Contrast is its own setting beside the theme (`karasu-contrast`: system,
  standard, high; `lib/contrast` `resolveContrast`): high sets
  `data-contrast="more"`, which swaps the palette in `index.css`, and passes
  `contrast: "high"` to `accentShades`, which lifts the accent to 7:1. Never
  key a high-contrast rule on `@media (prefers-contrast)` in the app — that
  would override a user who chose Standard; the site, which has no setting,
  gets the media query from the token sync.
- **Overlays carry `data-overlay`.** Screen-level key handlers check for it and
  stand down, so a dialog owns the keyboard instead of the list behind it acting
  on the same press. `GlobalKeys` honours it too.
- **Overlays also register with `useBackClose`**, so the Android back gesture
  (and the browser back button) closes them instead of leaving the page.
  `ui/modal.tsx` does it once for every dialog; an overlay that rolls its own
  chrome adds the one line. The protocol — one same-URL history entry per
  overlay, a single popstate listener, a one-shot swallow when closing by
  other means — is `lib/backStack`, pure and tested; Escape and backdrop
  closing must keep working on their own, because the back path is additive
  and the tests assume net-zero history entries either way. **A URL `replace`
  must never land while an overlay's entry is current** — React Router
  overwrites the marker, the stack no longer recognises it, and the next back
  press undoes the write. `afterBackSettles` (the stack's `whenSettled`) runs a
  callback once no overlay holds an entry and no unwind is due; `MediaList`'s
  `setView` goes through it and merges what queues up in call order, and the
  toolbar's panels edit a draft the list draws at once and `setView` writes on
  close. `Popover`'s `closeThen` is the same wait for anything a panel opens.
- **A banner is shown whole, and its own edges fill the rest.** AniList banners
  are a fixed strip: of Summer 2026's 36, 34 measured exactly 1900 × 400
  (4.75 : 1) on 2026-09-25, the others 3.33 and 2.22. `BannerImage` contains
  the picture (`lib/bannerFit` places it), feathers each edge that meets a gap,
  and fills the gap with the picture's outermost rows or columns stretched and
  blurred, so the colours carry on and nothing repeats. Two fills were tried
  and dropped: a blurred centre crop (its colours did not continue the edge,
  which drew a hard seam top and bottom) and a mirrored copy (it repeats a face
  or an eye as a ghost). Since the redesign of 2026-10-17 the detail banner is a fixed `h-72` on the
  desktop and `h-80` on the phone, where it holds the cover, the titles and the
  facts, so the picture is shown whole and its blurred edges fill the rest
  (the earlier width-following height and its 83 px jump are history).
  `components/media/detailFrame` holds the banner, the body, the side column
  and the cover for the page and `DetailSkeleton` alike, so the page arrives
  where the skeleton stood; the screens harness's `detail-pending` mock holds
  the query to check it.
- **A title without a banner borrows a relative's, and never shows a blurred
  poster.** AniList adds banners weeks into a season: on 2026-10-04, 31 of the
  Fall 2026 top 50 had none, and the blurred cover the header and the hero drew
  for them was the "banners are just blurry" report from the phone. So
  `lib/bannerSource` picks the title's own banner, else the nearest relative's
  (the order and the never-lenders are its `LENDERS` list; 20 of the 31 had
  one), else a `cover-wash` in AniList's `coverImage.color`, and `MediaBanner`
  draws the choice in both places. Content rules stay in `lib/contentFilter`:
  `canLendArt` refuses a hidden relative and explicit art for a title that is
  not, and a borrowed banner takes the title's own veil. It costs no request:
  `DETAIL_QUERY` already carried the relations and now asks each for its
  banner, and `SEASON_HERO_QUERY` carries its ten titles' relations, which took
  its answer from 6,850 to 12,838 bytes on a six-hour cache.
- **The detail page stands on a side column on the desktop and one column on the phone** (DESIGN.md,
  2026-10-17; the floated phone cover of 2026-09-25 is gone). The order of every part below the banner
  and the progress band is `lib/detailLayout`'s `detailSections`, the one place to change it. The band
  (`ProgressBand`) holds the status control, a tick per episode and the next episode. Cast, episodes,
  trend and reviews stay folds that load when opened, so a visit still costs the detail request alone.
  The status button (`StatusMenu`) is the page's whole entry editor, in the progress band, over a sheet
  on the phone and a dropdown on the desktop; there is no editor card any more.
  `QuickEditor` saves status, progress steps and the score as they are touched (receipts and Undo come
  from `useListMutations`), a typed count when its field is left or the sheet closes on it, and
  rewatches, tags and notes together behind "More". The score is `CommunityScore`: AniList's own
  histogram from `DETAIL_QUERY` (no extra request) as the bars, folded onto the account's format by
  `lib/scoreDistribution`, with the community mean marked beneath. A first add goes through
  `saveListEntry` with the media object, because a new local entry is refused without it; a save's echo
  reaches the page only through `lib/listEcho`, since the local echo names no status. Count fields
  everywhere are `ui/number-input`: an emptied field reports 0 and a stored 0 shows as the placeholder.
- **A title is spelt in the user's title language, and two functions spell
  it.** `displayTitle` (`api/types`, over `lib/titleLanguage`'s `pickTitle`)
  reads the active choice — English, Romaji or Native, set in Appearance and
  kept per device under `karasu-title-language` — and `titles::pick` /
  `pick_json` in Rust read the copy `stores/titleLanguage` mirrors into kv
  `title_language`, so notifications, bell rows, the tray, the widgets,
  Discord and the now-playing card spell a title the way the lists do. Each
  choice falls back in its own order (Native → romaji → English), the line
  under a title is `secondLine` (the native one unless it is shown, else the
  romaji), and whichever line is native takes `font-brand-jp`. The setting
  changes only on `/settings` and every route remounts after it, so a render
  that calls `displayTitle` needs nothing more; what can stay on screen across
  a change subscribes to `useTitleLanguage` (the bell's `useNotifications`,
  the palette, the setting's own example), and detection follows Rust's
  re-emitted `now-playing` (`set_title_language` → `retitle_now_playing`,
  which re-spells `matched_title` and never touches the running session). The
  matcher keeps its romaji-first `titles`; `Candidate.display` is the shown
  one. Strings stored before a change keep their spelling, as bell rows keep
  their language: notification rows, the label of a detection correction
  whose entry is off the list, and the title a new-episode mute was made
  under once its entry has left the list. Never write `title.english ?? title.romaji` by
  hand again — that is how the detection path came to show romaji while every
  other screen showed English, and how the AniList pane's note came to promise
  a setting nobody had built (#50).
- **A settings deep link lands on the row, not just the pane.**
  `?setting=<id>` beside `?pane=` makes `useSettingLanding` wait for the
  `data-setting` element (`Row`'s and `Toggle`'s `setting` prop, or a wrapper
  with `landingClass`), centre it, focus its control and outline it until the
  first press; the parameter is then cleared with `replace` through
  `afterBackSettles`. `LOCAL_OVERRIDES` names a pane (typed `PaneId`) and a
  setting for each AniList note, and `overrideLinks.dom.test.tsx` renders the
  real Settings page for each one and fails when a note points at a row its
  pane does not render.
- **Local text matching goes through `lib/fuzzy`.** Exact > substring >
  word-prefix > trigram containment, scored per title — per-title docs are
  what make a query structurally unable to match across two adjacent names
  (the straddle bug the old NUL-joined haystack guarded by construction).
  Don't reintroduce a bare `.includes` filter or a joined haystack; the
  AniList search *page* stays server-side `SEARCH_MATCH` and is not this
  module's business.
- **Content-filter rules live only in `lib/contentFilter`.** `blockReason`
  names *why* a title is hidden (adult wins over suggestive, so nothing
  counts twice), `isBlocked` is its boolean face, and `FilteredNotice` is the
  one disclosure line every surface renders — the settings pane's vocabulary,
  linking to `/settings?pane=appearance`. On search the adult bucket is 0 by
  construction (the server strips adult before it arrives); the split is
  carried anyway so the sentence stays honest.
- **The bell is one stream, and its grouping is presentation only.**
  `lib/notifGroups` unifies Karasu rows (milliseconds) with AniList rows
  (seconds), collapses runs by actor or by media in a 48h window, and is
  recomputed over the loaded set — nothing persists, which is what keeps it
  inside the no-local-activity-store line. The one cross-source group
  (airing) leans on `alerts/airing.rs` never writing a local row AniList
  already covers; site unread is a snapshot of the count taken before the
  page-1 mark-seen reset, an honest approximation and labelled as one. An
  activity row's press opens the activity; the actor's name is its own link.
  `useNotifications` holds all of it once for the three surfaces — the
  titlebar's dropdown (the newest three), the phone's tall sheet and
  `/notifications` — and today/earlier (`sectionByDay`) is presentation too.
  A row that navigates goes through the surface's `leave`, so an overlay's
  back entry has unwound before the destination's is pushed.
  The notifications page narrows the loaded set by source and by kind
  (`notifKind`: episodes, likes, replies, follows, forum, notices) from its
  column, before grouping and never with a request.
  An activity or forum row also names its subject in a quote block under the
  verb (`SubjectLine`): a list activity as a caption in the title language
  with AniList's smallest cover, a post or a comment as a quote through
  `renderPlain`, its spoilers named and never shown. A reply notification
  carries the activity replied to and never the reply, which is why a liked
  reply reads "liked your reply to" over the parent. A forum row's comment
  rides on the notification (`NOTIF_COMMENT`); an activity does not, since
  nested there a list activity's `media` and `user` resolve null (see the
  notes). So the
  notification queries carry `activityId` alone, and `siteNotifications`
  asks for the page's activities by id in one more request,
  `NOTIF_SUBJECTS_QUERY` under the source `siteNotifSubjects`, made only when
  the page holds an activity row and inside the page's own fetch, so a row
  and its subject arrive together. `subjectOf` reads the activity by the
  row's `activityId`; one the answer lacks names nothing and keeps the row,
  and a failed subjects request leaves the page's rows without subjects
  rather than failing them — page 1 has already spent AniList's count — and
  is never retried. So does one that has not answered within
  `SUBJECTS_WAIT_MS`, because the limiter can pace a request or sit out a
  `Retry-After` far longer than rows already in hand should wait; a late
  answer is dropped. Within one group, `groupSubjects` takes an activity's
  subject from whichever row has it, since each page asks for its own. `MESSAGE` is absent from that `type_in` and the request
  has no `MessageActivity` fragment, so a reply on private mail names
  nothing — the exclusion's fourth guard. A page with an activity row costs
  two requests, three when the detailed answer is refused, "Load more"
  included; the trim to one retained page on close keeps a reopen at two.
  The subject's title lives only in `subject.media`, never in `row.media`,
  so the row filter, the lead line and the airing group key do not move; a
  filtered title takes the subject away and never the row, whose unread dot
  is positional, and the viewer's own name is never written in front of the
  viewer's own activity. When AniList refuses the detailed answer for any
  reason but the token, the budget or the connection — a comment that
  errors is the case it guards — `siteNotifications` asks once more with
  `SITE_NOTIFICATIONS_PLAIN_QUERY` under its own source, `siteNotifsPlain`,
  so "Requests by source" says how often; the plain answer still carries
  `activityId`, so it loses the comments alone. That fallback is the
  query's one retry, and only a lost connection gets another. None of the
  three sources is ever added to `CACHEABLE`.
- **The system notification names the newest AniList notification and never
  quotes anyone.** `alerts/site.rs` asks, for the newest row only, for the
  names that word it — the actor, a thread's title, a title with its filter
  fields — and never for `text`, `comment`, `context` or `reason`, because a
  lock screen shows the toast to anyone; a test pins every query to that. A
  like or a reply carries `activityId` and its activity's `__typename` alone,
  since nested there a list activity's `media` resolves null (see the notes);
  only once `subject_wanted` says that row is about a list activity and
  about to be announced does the check ask for it by id,
  `SITE_SUBJECT_QUERY` (`type_in: [ANIME_LIST, MANGA_LIST]`, status,
  progress and the title with its filter fields, source `siteSubject`), and
  `attach_subject` puts it where `describe` reads it. That peek reads the
  cursor through `should_announce` and never moves it. A failed or empty
  answer drops the caption, keeps the sentence and is never retried, nor
  answered with the plain query. `describe` words it in the user's
  language (`i18n.rs`, from the native catalogs) and title language. A caption rides only on a like or a reply,
  the two kinds AniList sends about the viewer's own activity, and only for
  a status Karasu can word. A title the filter hides is never named, nor an
  explicit one while the blur is on, since a notification cannot blur; a row
  led by such a title falls back to the count, as does an AIRING row the
  airing watcher already toasted (its `aired:` key) or one about a title the
  user muted. A mute is an `airing_mute:<id>` kv row holding the title, a
  device setting that survives an account change and inert while the
  new-episode switch is off (Settings lists the mutes under that switch).
  `alerts/airing.rs` skips a muted title without writing its `aired:` key but
  still wakes for it and still asks about it, so the checkpoint passes its
  episode and an unmute has no aired window to replay. The desktop pass and
  Android's job both ask for the caption's activity the same way and both
  end in `announcement`, so the two cannot word it differently, and the job
  reads each raw answer through `job_verdict`. A refused detailed answer
  earns one plain retry under the source `sitePlain` — never for a token, a
  rate limit or a lost connection — and the job writes a 429's `Retry-After`
  into `rate_state` (`retry_after_secs`), so the live app's limiter waits it
  out at its next start instead of spending the next request into the wall.
  A check therefore costs one request, two when the newest is a due like or
  reply on a list entry or the detailed answer is refused, and never three:
  the plain answer carries no `activityId`. `siteSubject` stays out of `CACHEABLE` like every activity.
- **A thread can land on one comment.** `/thread/:id?comment=<id>` rides the
  same uncapped `ThreadComment(id:)` tree route as the newest-jump — one
  request at any thread size, including comments past the 5,000-entry paging
  cap. `ThreadTarget` in `lib/threadJump` is the whole state machine, the
  param is cleared with `replace` by every way of leaving the view so it
  cannot outlive it, and `visibleAnchor` in `lib/comments` returns
  `{ id, exact }` — a pure function that says whether its own answer is the
  clicked comment or its nearest drawable ancestor, so the highlight can
  degrade honestly instead of pointing at the wrong row.
- **Back returns to the page as it was left, per history entry.** `<main
  key={pathname}>` remounts every page, so what a page shows lives in its URL
  (`useUrlState` where the state must act live under an open popover, a plain
  `replace` otherwise) and where it was scrolled lives in `lib/scrollMemory`,
  keyed by `location.key`. A page that scrolls its own `overflow-y-auto` div
  calls `useScrollMemory` once on that div — `MainPlace` in `App` covers
  `<main>` — and never once per virtualized child; a virtualized list passes a
  `PlaceReader` that stores the entry at the top and how far into its row,
  because rows above it are estimates again on return. A URL write that can
  run while an overlay is open — MediaList's view, Search, Seasonal, Forum's
  query — goes through `useSettledWrite`, which waits out the overlay's entry
  and drops a write once the browser has moved to an entry the page has not
  rendered; Calendar's week and lens are written only from its own buttons. A
  page never replaces its URL on arrival, since a replace ends a running
  restore: `writeSearchView` writes its keys in one order, so writing a URL
  again changes nothing, and Forum writes `?q=` only when the term moved. A
  link to the page that is already open starts it over (the sidebar), so a key
  meant to refine it — "/" on Search — focuses the field instead of
  navigating. An overlay's history entry carries the router state of the entry
  it covers (`lib/backStack`); without it a stale one reads as the app's first
  entry, key `default`. Search's infinite queries refetch on return only when
  invalidated (`staleTime: Infinity`, which invalidation still overrides),
  because a stale refetch asks again for every page they had loaded. A
  discovery card (`MediaCard`) reads the viewer's cached list first, then
  what this session's own adds and removals said (`lib/sessionEntries`), and
  the response's stub last — never a title's absence from the list as a
  removal, since an entry hidden from the status lists is absent too.
- **Paging is a button, never a scroll.** Every paginated list — followers,
  following, user search, activities, threads, comments — uses
  `useInfiniteQuery` with `fetchNextPage` on a click and no `IntersectionObserver`
  anywhere. The reason is the limiter in `anilist/client.rs`: it is a ~30/min
  brake shared with the scrobbler and the four alert passes, and it reads its
  budget then drops the lock *before* any response header lands, so it cannot see
  a burst it has not sent. A feed that fetches because the user scrolled spends
  that budget with nobody asking. Two further traps, worth knowing before
  touching an infinite query: `refetch()` refetches **every** retained page —
  six loaded pages are six requests, which is why `UserList` keeps a long
  `staleTime` and never calls it — and `maxPages` evicts from the far end, so
  the pages being read are the ones that vanish.
- **The season page is the one list that pages by itself, and it is
  bounded.** Its sections count each format, so the counts are the season's
  only if every title is there: page one (50 by popularity) held 6 of Fall
  2026's 13 movies and 2 of its 15 TV shorts (#76). Measured on 2026-10-18,
  unauthenticated: Winter to Fall 2026 and Fall 2025 held 95 to 109 titles,
  two or three pages each. `seasonalAnime` asks page after page until
  `hasNextPage` is false, at most `SEASON_MAX_PAGES` (6), each page an
  allowlisted `seasonal` answer cached for six hours, so a season costs two
  or three requests once and none on a revisit.
- **Two queries per mount, at most.** Same cause. The profile spends its two on
  the user and the follower totals; everything else arrives when a tab is
  activated, which is a second user-initiated moment rather than a fourth
  concurrent request clearing a pre-flight check that has not been updated yet.
- **A person page's year list is its second request, and the one list there
  that pages.** `STAFF_ROLES_QUERY` asks `Staff.characterMedia`,
  `CHARACTER_MEDIA_QUERY` `Character.media` and `STUDIO_MEDIA_QUERY`
  `Studio.media`, each by `START_DATE_DESC`, so an undated title comes
  first and `lib/roleYears` files it under "No date yet"; `Person` holds
  the page's one in a `useInfiniteQuery` paged by a button, sources
  `staffRoles`, `characterMedia` and `studioMedia`, each allowlisted for a
  day. Measured on 2026-10-20: all three connections serve 25 a page
  whatever `perPage` asks, and `pageInfo.total` is not a count — a prolific
  actor's (staff 105071) read 500 on page 1, 475 on page 20 and 329 on
  page 14, the real last page, and a character's (40) and a studio's (11)
  both read 500 on page 1 — so the count is never shown while
  `hasNextPage` holds and the button is the countless one. The sort is the
  title's start date, not when the person joined, so a long-running series
  files under its first year, as on the website. The grouping dedupes by
  edge id, since AniList can repeat an edge across two pages fetched
  minutes apart. The studio's detail query carries no media any more; the
  character's keeps its popularity edges for the "Voiced by" row alone.
- **The statistics page shows each measurement once, and adds none of its
  own requests.** Every insight card (`components/stats/insights`) reads
  `lib/localStats` over the cached list the page already holds, or the
  `activityHistory` the statistics request already carries: the scatter of
  every scored title (`scorePairs`), harsher and kinder per genre
  (`genreDeltas`), what gets finished (`genreOutcomes`), taste over time
  (`genreDrift`), the rhythm (`weekdayTotals`, `completionMonths`), the pace
  (`completionPace`, days counted inclusively), the watch time
  (`timeShare`, progress × runtime × every viewing) and the rewatches. A new
  card names the figure no other card shows; the radar, the tag treemap and
  the formats card went on 2026-10-22 because the ranked lists and the
  sunburst's outer ring already carried theirs. `CardPack` lays the cards in
  CSS columns at their own height, so no card stretches to a neighbour; a
  wide grid such as the day heatmap stays outside it as a block, because a
  grid or column track grows to its widest child's min-content and scrolled
  the phone's Years tab sideways by 99 px. The screens harness's
  `stats-rich` mock (72 entries over eight years) is what the `d105`–`d108`
  and `p76`–`p79` rows shoot.
- **Search with nothing typed browses, in one cached request per scope.**
  `lib/browseSections` is the table: each medium's sections in AniList's own
  order, each an alias of one aliased-`Page` query (`ANIME_BROWSE_QUERY`,
  `MANGA_BROWSE_QUERY`, and a test holds the aliases to the table), a cover
  row asking for the covers-per-row setting plus four (`rowRequestSize`, 12
  to 50) and the top list for ten, under the source `browse` for an hour.
  Measured live on 2026-10-16: 52.7 KB for anime at 12 a row, 180 KB at 50.
  Characters and staff share `PEOPLE_BROWSE_QUERY` (source `browsePeople`,
  13.5 KB), whose variables carry a `day` the query never declares: AniList
  accepts it, and the cache key then carries AniList's UTC day, so a cached
  birthday answer ends with that day. "Show all" is a link to the section's
  own search view (`showAllView`), so Back returns to the sections, and
  `sectionOfView` names the section over the grid with the way back. A sort
  alone now counts as a search with nothing typed; the four lens chips this
  replaced set a sort alone for three of them, and those three fetched
  nothing at all. A people section's "Show all" is the view's `browse` key,
  paged on a button. A hidden title keeps AniList's rank on every row after
  it rather than moving them up, and the content filter's notice counts only
  the titles a section would have drawn (`cutSection`). Its answers, like
  the season page's and the recommendations', carry the viewer's list
  entries under no media id, so `cache_forget_entry_id` drops all three
  sources whenever it forgets an entry, and a delete drained from the offline
  queue reaches it through `mirror_drained` as a live one does. A term too short to search shows its
  prompt rather than the sections, which would read as its answer. A manga
  has no season, so the top list asks for `startDate { year }` and falls back
  to it, and the Year filter asks a manga for its start date
  (`yearVariables`, `startDate_like: "2020%"`): AniList leaves a manga's
  `seasonYear` null, and a year asked as one had matched no manga at all.
  Measured live on 2026-10-16: `startDate_like` and the range
  `startDate_greater: 20199999, startDate_lesser: 20210000` return the same
  titles, a start known only by its year (`20200000`) included, and both
  bounds of the range are exclusive. Anime keep `seasonYear`.
- **A pure function returns an i18n *key*, never a sentence.**
  `src/lib/i18nKeys.test.ts` only sees literal `t("…")` calls, so
  `` t(`social.verb${v}`) `` is invisible to it — and AniList makes this matter
  rather than academic: it composes activity sentences itself, in English only, so
  a German feed would read half-translated. `listActivityVerb`, `relationBadgeKey`,
  `validatePost` and the twenty notification labels all return closed unions that
  a component maps through a literal switch, which is the shape `receiptText` in
  `useListMutations` established. A key built from an enum (`format.${format}`,
  `status.${type}.${status}`, `sort.${sort}`) is the other allowed shape, on
  two conditions: its prefix is listed in `DYNAMIC_PREFIXES` in that test, or
  the keys read as dead, and the call site closes the set before it builds the
  key, as `formatLabel`'s `KNOWN` does, because AniList can add an enum value
  and a missing key renders as the key.
- **Two motion registers, and the default is the quiet one.** *Surface* motion —
  hover, focus, background and border — stays on `transition-surface` and the
  140ms `--ease-karasu`; `transition-colors`, `transition-all` and a bare
  `transition` fail the style audit. *Feature* motion, for the few moments
  worth noticing (a dialog arriving, a scrobble landing, a chart drawing), may
  use `--ease-spring-soft`, `--ease-out-expo` and `--duration-expressive`.
  Reach for the first unless there is a reason; springs everywhere is how an
  app starts feeling slow.
- **Exit animations go through `usePresence`, or through the wrapper's own
  exit.** React unmounts before CSS can animate, so `{open && <Modal/>}` can
  only ever have an entrance. The hook holds the node for the exit and reports
  `leaving`; keep emitting `data-overlay` while it does. What Base UI draws
  (menus, the popover, the tooltip, sheets) exits through its own
  `data-closed` / `data-ending-style`, and the toast through `usePresentValue`.
- **Motion that CSS cannot see must ask `lib/motion.ts`.** The reduce-motion
  rules in `index.css` are `!important` overrides on animation and transition
  properties — they do nothing to a View Transition, a scroll handler, a WAAPI
  call or a `setTimeout`. Those read `prefersReducedMotion()` /
  `motionDuration()` themselves. Staggers use `staggerDelay`, which also zeroes
  the *delay*: collapsing only the duration turns a stagger into a staggered
  wait.
- **Scores live in the account's `scoreFormat`, end to end.** Reads pass
  `$scoreFormat` (never a pinned `POINT_10`), writes go through `scoreRaw` —
  the format-independent 0–100 int — because a bare `score: Float` is
  interpreted in the account's format and silently corrupted non-ten-point
  accounts for years. `lib/scoreFormat.ts` is the one vocabulary
  (`toRaw`/`fromRaw`/`formatScore`/`scoreScale`); local mode stays ten-point.
- **Statistics scores are normalized in `userStatistics`.** AniList mixes a
  hundred-point `meanScore` with a distribution in the user's *display* format,
  and says so nowhere. `normalizeStatsBlock(stats, format)` brings everything
  onto the display scale at the boundary; chart domains take
  `scoreScale(format).max`, not a literal 10.

## Performance invariants

Each of these looks like cruft and is not. They were measured; don't "tidy"
them away without re-measuring.

- **`@font-face` is hand-written in `index.css`.** Importing the `@fontsource`
  stylesheets instead pulls a woff fallback neither WebView2 nor WebKitGTK will
  ever use — the Kosugi Maru woff is 1,876,732 B (1.79 MiB), carried by the
  installer and every auto-update on top of the 1.44 MB woff2 that is actually
  used. Not the `400.css` variant either: 121 unicode-range subsets, ~4.37 MB
  of woff2 if all of them ship. (The 7.9 MB figure this note used to give is the
  size of the whole `files/` directory — every weight and both formats — not of
  anything a build would emit. The decision was always right; the arithmetic
  was not.)
- **The 1.44 MB Japanese subset cannot be trimmed.** It backs `font-brand-jp`,
  which renders arbitrary `title.native` in `TitleLockup` (itself used by five
  call sites, including every virtualized row), `AnimeDetail`, `Franchise` and
  `CommandPalette`. A fixed-glyph subset would fall back to Yu Gothic UI per
  missing glyph — mixed typefaces inside one title, which is worse than either
  whole font.
- **The status tabs never wrap.** `status-tabs.tsx` is one row that scrolls
  sideways (hidden scrollbar, an edge fade only while it overflows, the wheel
  mapped to `scrollLeft`), and the underline is measured against that inner
  `w-max` row, not the page. The wrapping version needed a `+14` offset
  calibrated to the consumer's bottom padding and correct on the last row
  only — it struck through the second row's labels — and it cost the phone two
  header rows. Do not bring the wrap back; a narrow window scrolls the strip,
  and the active tab is scrolled into view on every change, a swipe's included.
  The underline takes the active tab's `color` (a colour the consumer passes,
  the accent without one) and carries `data-keep-colors`, so High Contrast
  keeps it. The media lists left the strip on 2026-10-17 for `StatusNav`, a
  column on the desktop and a picker on the phone; the statistics left it
  for `SectionNav` the same day and the profile on 2026-10-18, and the
  favourites still use it.
- **Progress under a cover is one component, `ProgressMarks`.** A tick per
  episode where they fit and a bar past that (`lib/overview` `progressMarks`),
  under the title in the caption, on the list's cards and the profile's lists
  alike. The line inside the cover went on 2026-10-18; the Overview's continue
  row and the detail page's band keep their own larger forms.
- **`hit-area` needs `relative` on the same element, and two gates say so.**
  The utility is an `::after` positioned absolutely and sized
  `max(100%, 2.75rem)` of its containing block, so on an element with no
  position of its own it takes the nearest positioned ancestor: the season
  page's status pills, `coarse:hit-area` without `relative`, each grew to
  the phone's whole scroller, and the last card in DOM order took every tap
  on the page, so a tap on the title, a gap or an arrow opened that card's
  entry editor (the maintainer's Android report, 2026-10-20; reproduced in
  the harness's phone shell, where `elementFromPoint` at the page title
  answered the fifth card's pill). The style audit's `hit-area-unanchored`
  fails a class list that carries `hit-area` without `relative`, and every
  `shoot` reports `unanchored`, the hit-area elements whose computed
  position is static, as a problem beside `sideways`.
- **`min-w-0`, not `shrink-0`, on a row's trailing text block.** `DigestRow`'s
  (the calendar's agenda row until 2026-10-17) right side was pinned at max-content by `shrink-0`, and one long German note
  handed the whole page a sideways scroll (`<main>`'s `overflow-y-auto`
  computes `overflow-x: auto`, so any too-wide element scrolls everything).
  The same lesson as `SectionHeader`'s h2.
- **The detail page's grids are `grid-cols-1` below their breakpoint, a score
  column is `min-w-0`, and its label goes through `compactCount`.** A grid
  with no column template is one implicit `auto` track, which grows to its
  widest item's min-content, and `min-w-0` on flex items does not lower a flex
  row's min-content — so the community chart's ten raw counts pushed its card
  past the column. Measured with `screens.mjs overflow` on 2026-10-04: Attack
  on Titan's counts (3180 … 196515) scrolled `<main>` 25 px at 360 px and
  65 px at 320, and a bannerless title's unclipped `scale-110` wash 20 px at
  405 — the `@container` wrapper's containment does not stop it. Afterwards
  0 of 104 screens. German `Intl` compact notation leaves thousands alone
  ("106.581"), which is why the label has its own formatter; the exact count
  stays in the column's `title`. The harness's fixture carries those counts,
  because its old three-digit ones are why no shot ever showed the overflow.
- **The community cards pair up by their section's width, never the
  window's.** `CommunitySection` is the query container and its grid takes two
  columns at `@chart-pair` (48rem); `StatusBar`'s legend does the same at
  `@legend-pair` (20rem). The viewport `sm:` this replaced paired them in any
  window from 640 px, and at 768 px with the sidebar open each card got
  240 px: measured with the screens harness on 2026-10-04, neighbouring counts
  overlapped by 2.4 px (1.7 px apart at 850) and the legend cut every German
  status to "Ab…", "Gep…". A card needs ~306 px for 4 px between its widest
  counts, and the two-column legend ~356 px for "Abgeschlossen" beside
  "889497" in Open Sans, the harness's stand-in for Segoe UI. 48rem keeps every
  paired card at 376 px or more, the width the 2xl column already gave them,
  and 20rem leaves 4 px of slack there. So the cards pair up from a 1040 px
  window with the sidebar open and from 900 px with it collapsed. The one-column
  legend also fixed phones under ~394 px, where "Abgeschlossen" was cut at 360
  and 320, and the statistics page at 320. The 320 px phone's counts stay
  2.8 px apart; the maintainer chose stacking over thinning them (DESIGN.md,
  2026-10-04). `d64`–`d66` shoot the section at 768, 1000 and 1232. The fixture
  carries the title's real status counts, because without them the score card
  stood alone and no shot ever showed the legend.
- **Every cover is one width, `--cover-w`, and the grid fills by it.**
  `media-grid` is `repeat(auto-fill, minmax(min(var(--cover-w), 100%), 1fr))`,
  and `useCoverWidth` (run by `MainPlace` in `App`) writes `--cover-w` on
  `<main>` from `lib/coverWidth`: the covers-per-row setting splits a
  full-width page, gutters and gaps out, never under `COVER_MIN_PX`. So a
  grid beside a column draws fewer covers of the same size rather than the
  same count squeezed, which was the search page's crowded score and button
  (decided by the maintainer on 2026-10-18). The setting is one token written
  by the theme store, defaulting by platform at first run (10 desktop, 4
  Android — UA-keyed, since the store boots before `platform_info` answers)
  with a one-time migration from the old s/m/l keys. Two shapes died here and
  should stay dead: fixed-size tracks (could not tell medium from large on a
  phone) and an unlayered phone override of them (silently beat the utility
  layer and killed the setting). `VirtualGrid`'s `watch={coverCols}`
  re-measure is load-bearing — a setting change moves `--cover-w` and
  re-flows the tracks without resizing the probe, which the ResizeObserver
  cannot see. The Overview's shelves and continue row keep their own measured
  counts, and the people grids on Search their portrait cards. A cover's one
  corner control sits bottom right and moves top right from
  `@cover-corner` (8.5rem), where the score and it fit side by side.
- **The list view's columns are fixed tracks, sized in `components/list/columns.ts`.**
  `VirtualGrid` makes every visual row its own grid container, so `subgrid` is
  unavailable and an `auto`/`fr` track resolves differently per row — only
  identical fixed tracks line up down the page. A fixed track also overflows
  rather than shrinking, which is why the column *set* changes with the measured
  container width (`useRowTier`) instead of a `2xl:` breakpoint. Never put a
  width on a list cell at the call site: a fixed width nobody checked against
  its worst case is what clipped every `★ 10` score and every `500 / 500`
  progress, and `columns.test.ts` is what keeps the widths honest — including two
  assertions that the *old* widths still do not fit, so a green suite cannot mean
  the measurement drifted.
- **The list and grid queries must not ask for `coverImage.extraLarge` or
  `bannerImage`** — nothing renders them there. They belong to `DETAIL_QUERY`,
  and to the Overview hero's ten titles, which draw them and their relatives'.
  **`synonyms` must stay**: local mode re-serves the stored media object and
  `MediaList` spreads it.
- **`RecommendedSection` sorts `seedIds` before using them as a query key.**
  `pickSeeds` orders by score then `updatedAt`, so an unsorted array reshuffles
  on any save and mints a new key, defeating its own cache.
- **`usePrimedLists` dates the primed entry as Rust dates it:**
  `setQueryData(..., { updatedAt: cached.fetchedAt * 1000 })`, never `0`. A
  copy Rust would serve anyway is then not refetched for the sake of a stale
  stamp, and the list still moves, because the hook listens for
  `list-refreshed` and invalidates the list Rust refreshed behind it.
  Backdating to `0` was the shape before the list had its fifteen-minute
  window, and it costs a list read on every mount.
- **`mediaList` invalidation is scoped to the media type that changed.** The
  `scrobble-done` listener reads that type from the store at fire time (not
  from a closure) and **must** keep its fallback to the broad key — otherwise an
  absent type leaves one list silently never refreshing.
- **The Wrapped poster is laid out in `em` and measured twice** — once at
  `em = 1` for its natural height, then drawn at the size that fills the
  preset's crop. `drawMark` places the mark by its **centre**: corner anchoring
  is what once left 52% of the bird outside the page.
