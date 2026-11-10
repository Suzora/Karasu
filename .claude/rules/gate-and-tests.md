---
paths:
  - "scripts/**"
  - "package.json"
  - "vite.config.ts"
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
  - ".github/**"
  - ".githooks/**"
  - "src-tauri/Cargo.toml"
  - "src-tauri/deny.toml"
  - ".oxlintrc.json"
  - "knip.json"
---

# The gate, the test suites, the scripts and CI

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## Layout: `scripts/`

```
scripts/             bump-version.mjs (every commit), anilist-query.mjs
                     (validate a query live), android-check.ps1 (the fast
                     cfg(mobile) gate — cargo check for aarch64 with the NDK
                     env exported), windows-check.sh (the same idea for
                     cfg(windows) from a Linux box — a whole-crate cross-check
                     is impossible because aws-lc-sys needs the MSVC headers,
                     so it copies the module into a throwaway crate and checks
                     that), virtual-rows-check.mjs (VirtualRows in a real
                     Chromium — jsdom has no layout, so it mounts zero rows
                     and a unit test there passes vacuously), back-place-check.mjs
                     (the same harness for Back: scroll, open a title, go
                     Back, and the list, Search, Seasonal, Overview,
                     Calendar, Library and Forum must come back at their
                     place and view), changelog.mjs
                     (appends the Unreleased section from the commits since
                     its `generated-through` marker; a `Changelog:` trailer
                     overrules the subject), changelog-read.mjs (the same
                     file read back as data for the What's new dialog, served
                     as `virtual:changelog` at build time), ratelimit-probe.mjs (re-measures
                     the shape of AniList's rate window — stepped, see the
                     notes — one unauthenticated request per sample, needs
                     real egress to graphql.anilist.co), browser-measure.mjs
                     with browser-measure-core.mjs (what a Firefox-family
                     browser tells the desktop while it plays: media
                     sessions, its windows on Windows, and the session file
                     of every profile found, listing only the tabs that hold
                     a playing session's title, hosts and brands redacted;
                     the core is tested in `src/lib/browserMeasure.test.ts`),
                     phone-measure.ps1
                     (the adb side of the Android tracking-service
                     measurement: service state, standby bucket, Doze, the
                     notification job, the Kotlin logcat tags, and polls per
                     hour from an exported diagnostics file — the Rust log
                     never reaches logcat, and a release APK is not
                     debuggable, so the export is the only way at it),
                     sample-markdown.mjs and gen-entities.mjs (the markdown
                     fixtures and the entity table, see the notes),
                     comment-audit.mjs, comment-strip-check.mjs,
                     comment-lexer.mjs and comment-allowlist.json (the
                     one-line-comment rule: the gate, the comment-only proof,
                     the shared scanner and the allowed exceptions — see
                     "Comments: one line each"), style-audit.mjs with
                     style-baseline.json and style-allowlist.json (the class
                     vocabulary's ratchet, see "Design language"),
                     bundle-budget.mjs and bundle-budget.json (the gzipped
                     bundle against its budget, a push-gate phase),
                     screens.mjs with screens/ (the real app over a mocked
                     backend in Chromium: shots, boards, clips, pixel
                     hashes and the sideways-overflow check, see "Design
                     language"),
                     verify.mjs (the gate, see
                     "The commit loop") with verify-scope.mjs (which
                     suites a change can reach) and version-patterns.mjs
                     (what a bump rewrites, shared with bump-version),
                     toml-check.mjs (taplo over the
                     TOML files, one per stdin — see the same section),
                     mutants.mjs (cargo-mutants in a copy tauri-build can
                     still configure, see "Three Cargo tools"),
                     clean-target.mjs (reclaims the
                     stale incremental sessions every version bump leaves
                     under `src-tauri/target`, see the notes);
                     release/ holds the ten PowerShell scripts
                     the release workflow runs (installer, AppImage, Linux
                     package and APK renamers are deliberate near-twins,
                     slim-appimage and smoke-appimage — see "The commit
                     loop" —,
                     release-notes, flatpak-manifest, fdroid-recipe, and
                     generate-update-manifest, whose Android legs feed the
                     APK updater — see "The Android updater")
```

## The gate in detail

**`npm run verify`** is `scripts/verify.mjs`, the whole gate and what CI runs,
so the two cannot drift. Typecheck, the comment audit, the style audit, the
site tokens' freshness and the native strings' go first and stop the run on a
failure; then vitest and `cargo test` run at the same time — **each only when
the change can reach
it**. A plain local run asks `scripts/verify-scope.mjs` (pure, tested by
`src/lib/verifyScope.test.ts`) what changed since HEAD, untracked files
included, or in HEAD's own commit on a clean tree: `cargo test` runs for
anything under `src-tauri/` outside `gen/` and for `rust-toolchain.toml`;
vitest runs for everything except Rust-side files and docs that no test reads
raw; and a version bump alone reaches neither, judged by the very patterns
`bump-version` writes (`scripts/version-patterns.mjs`, shared by both). A
skipped suite prints a `skip` line saying so, never silence, and `--all` runs
both. CI, `--full` and so the pre-push hook always run both, which is where a
version bump's cold compile now lands: once per push, not once per commit. It
was the gate's biggest cost — the package version is part of Cargo's metadata
hash, so every bump recompiled the crate from scratch, about 26 s, where a
real source edit costs 3 to 9 s. Measured on 2026-10-08: a commit touching
only the frontend went from 66 s of gate to 13.5 s. The tests that read files
through `import.meta.glob(…?raw)` are invisible to an import graph, so the
scope keeps their globs in `RAW_READ_GLOBS`, and the guard test fails when a
test adds a glob the list lacks. Every
phase is captured, and a green run prints one line per phase — counts, seconds,
any compiler warning — and nothing else, which is the point: the loop runs
many times a day and its output is read by an agent. A failed phase prints its
failure section (vitest's "Failed Tests", cargo's "failures:") and only that;
`--verbose` streams everything as the tools print it. `verify:frontend` and
`verify:rust` are the halves, for the commit that touched only one. Between
the audit and the suites sits **oxlint**
(`npm run lint`, `.oxlintrc.json`): the correctness category plus
`react-hooks`, `jsx-a11y`, `import` and `vitest`, warnings denied. The rules
switched off there are switched off on purpose — the React Compiler set
(`refs`, `purity`, `set-state-in-effect`) flags the live-ref and
derived-state patterns this code uses knowingly, `prefer-tag-over-role` and
`no-autofocus` argue with decisions the overlays document, and the rest is
style — so a new warning is a finding, not a formatting opinion. Before oxlint sit two
more cheap phases: **typos** (`_typos.toml`; the German copy is excluded by
file (the German locale, greetings and native catalog) and by a regex over
German fixture strings, because typos knows
English, and the anime vocabulary — cours, ADN — is in `extend-words`; the
binary comes from `cargo install typos-cli`, and a machine without it gets a
visible `skip` line, never silence, while CI runs the `crate-ci/typos` action
before `verify`) and **toml** (`scripts/toml-check.mjs`, taplo's npm build fed
one file at a time over stdin, because its WASM globbing finds nothing on
Windows; `taplo.toml` names the files and the style, `--fix` rewrites them).
Looked at for the gate on
2026-09-19 and left out: `cargo-nextest` (a one-second suite gains nothing),
`msw` (HTTP lives in Rust, so there is no fetch to mock), and a formatter (one
tree-wide diff for nothing). `npm run test:coverage` answers a question rather
than gating (four summary lines, the per-file map under `coverage/`).
Run it bare and read the exit code — see the note below on piping. The same rule holds for every script the loop runs:
`bump-version` prints the version, `changelog` one line, `comment-audit` one
line when clean and the offending lines when not.

**`npm run verify:full`** is the same script with `--full`, the push gate: the
commit gate, and then everything else the repository can check, in one run
with the same one-line-per-phase output. After the gate's own phases it runs
the cheap, independent checks at once — **knip** (unused files, exports and
dependencies, `knip.json`), **versions** (`bump-version --check`, the five
version files agree), the **site**'s typecheck,
**npm audit** at `high` over the production graph, the **bundle budget**
(`scripts/bundle-budget.mjs`: a fresh `vite build`, then four gzipped figures —
what the window waits for, the stylesheet, the largest lazy chunk, all the
script — against `scripts/bundle-budget.json`, each set 3 % over the larger of
the two build targets' measurement when it was last set; on 2026-10-06 the
Linux target, the larger in all four, read 316.4, 17.5, 27.0 and 507.0 KiB, and
three budgets came down to 326, 28 and 523 after the startup work of that week
(no top-level await, the pages one click away loaded on idle, Motion replaced
by CSS, entities decoded by the browser) took the window's wait from 405.1 KiB.
The stylesheet's stays at 18, since 3 % over its reading rounds up past it.
On 2026-10-12 the day's sync panel, entry dialog and copy took the figures to
329.8, 17.9, 28.4 and 527.1 KiB, and the maintainer set the window's budget to
500 KiB and all script to 700, with the largest lazy chunk at 30, to leave room
for a while. On 2026-10-17 the redesign took the stylesheet to 18.2 KiB, and
the maintainer set its budget to 50 KiB for the screens still to come. On 2026-10-22 the statistics page's insight cards took the German
copy, the largest lazy chunk, to 30.3 KiB, and its budget went to 32. On
2026-11-09 the 38 machine-translated languages became a fifth figure,
`largestLocale` (one language's texts or greetings, 40 KiB over Greek's
37.6), and left the largest lazy chunk and all script, since a user only
ever loads their own and the sum would have tripled with nothing more
reaching anyone. A
raise names its reason in the commit) — then
the three cargo tools
one after another because they share the target directory's lock: **clippy**
with warnings denied, **cargo deny** (advisories, licences, bans, sources
against `deny.toml`), **machete** (dependencies nothing uses). Then the two
builds, last because they are the slow part: the **android check**
(`scripts/android-check.ps1`, a cargo check for aarch64 with the NDK exported —
Windows only; elsewhere the phase says so and CI's android job is the check)
and **tauri build**, the real bundle, whose rustc warnings the phase prints
because `cargo test` cannot see them. The final phase is **clean tree**: `git
status --porcelain` must be empty, so nothing uncommitted — and no bindings
regenerated by the run — rides along with a push; in `--full` a regenerated
`bindings.ts` is a failure, not a note. Measured on 2026-09-20: 1 m 32 s of
work, 66 s of it the bundle. `.githooks/pre-push` runs it on every push once
`git config core.hooksPath .githooks` has been set on the clone — do that
once; the hook is committed, the setting is not. A tool that is not installed
(typos, cargo-deny, machete) is a visible `skip` line here as in the gate.
The single-tool scripts (`lint`, `lint:rust`, `deny`, `deps:unused`, `knip`,
`lint:typos`, `lint:toml`) remain for running one of them alone; the push
gate is the one place they all run together, and CI runs the same pieces on
its own jobs.

For build-affecting changes — dependencies, `tauri.conf.json`, anything in the
bundle — also run `npm run tauri build` as a smoke check. On Windows only the
NSIS bundle builds and the three Linux targets are correctly skipped; the
AppImage, the `.deb` and the `.rpm` are built by the `linux-build` job in CI,
which is also the only place Linux-only code is compiled at all. The AppImage
stays the updater's format; the packages install through a package manager and
carry explicit `depends` (webkit2gtk-4.1, gtk3 and the ayatana appindicator,
which `ldd` cannot see because it is dlopen'd), and every place that names a
release file — the renamer twins under `scripts/release`, the checksum step,
the Nightly's prune list, `release-info.mjs` on the site — walks the
`karasu-linux` artifact recursively, because three bundle folders make the
download keep its `appimage/`, `deb/` and `rpm/` subfolders where one did not.

**Two kinds of test that are not examples.** `proptest` runs the parser and the
matcher over thousands of generated inputs a run (`parser.rs` and `matcher.rs`,
`mod props` inside each `tests`): nothing panics, the episode and season never
exceed their digit counts, a plain fansub or chapter name round-trips, and the
prepared matcher agrees with the reference copy on random candidate sets. A
failing case is minimised and written to `src-tauri/proptest-regressions/`,
which is committed so the case stays a test. `insta` pins the text blocks
nobody used to check — the diagnostics report (both redactions) and the widget
projection (both locales) — as `src-tauri/src/snapshots/*.snap`; the MAL XML
and the JSON backup are pinned the same way by vitest's `toMatchFileSnapshot`
under `src/lib/__snapshots__/`. A snapshot diff is the review: accept a wanted
change with `INSTA_UPDATE=always cargo test` (or `cargo insta review`) and
`npx vitest run -u`, and commit the file with the change that caused it.

## The test suites

**Two vitest projects, and the filename picks one.** Everything runs in **node**
by default; only `*.dom.test.tsx` boots jsdom and Testing Library, via the
`projects` block in `vite.config.ts`. That split is what keeps the suite fast
(about 2,400 tests; the timings are below), and it is a *name* rather than an inference on purpose:
`components/stats/Charts.test.tsx` renders with `renderToStaticMarkup` and needs
no DOM, so an extension rule (`.tsx` ⇒ jsdom) dragged it into one and the suite
went from 2.0 s to **14.1 s**. Needing a DOM is a decision, so it is spelled out
in the filename. `src/test/render.tsx` holds the provider wrapper and the
sign-in helpers; it imports Testing Library, so nothing in the node project may
import it. `src/test/fixtures.ts` holds the complete, typed `media`, `entry`,
`listResult`, `nowPlaying`, `idleScrobble`, `changeSection` and `changelog` builders both projects use — a
test overrides the field it is about rather than spelling a sixteen-field
literal — and `src/test/{markdown,markup,actions}.ts` the readers the split
suites share. The node project runs on worker threads without isolation (one
module graph for every file) because its modules are pure; a node test that
needs a fresh module must say so with a `.dom.` name or `vi.resetModules`. The
dom project runs on **VM threads** (`pool: "vmThreads"`): one jsdom per
worker and a fresh context per file, where plain threads booted jsdom once per
file, about 750 ms each. Measured on 2026-10-08 (76 dom files, 1,885 tests,
all green both ways): the whole suite went from 20.5 s to 9.8 s, and the peak
worker process from 2.0 to 3.4 GB, which the default `vmMemoryLimit` (memory
over cores) leaves alone. `isolate: false` on the dom project was faster again
and broke 35 tests in 12 files through shared module state, so it is not the
lever. A hover, tooltip or timer a test waits for goes on a fake clock
(`vi.useFakeTimers({ shouldAdvanceTime: true })`, then
`vi.advanceTimersByTimeAsync`) rather than a real sleep — `StatusMenu.dom`
went from 4.7 to 2.4 s that way — and each one was shown to fail when the
behaviour it guards was broken. `vitest-axe` costs the whole suite about
0.8 s, measured the same day and left alone: not worth moving nine
components' own a11y checks away from the states they build. **Vitest 5**
(5.0.3, the same day, no test needing a change) took the suite from 9.8 to
7.5 s with coverage unchanged (72.56 against 72.55 % of statements); the dom
project alone is 6.4 s on VM threads against 19.2 s on plain threads. Its
`clearMocks` is on by default, so every test starts with its mocks' calls
cleared, and `vi.mock` must sit at the top level of a file. Transforms are
kept between local runs (`fsModuleCache`, under `node_modules/.vitest-cache`):
a warm run 7.0 s against 7.5 s, a cold one 9.0 s, which is why CI, cold every
time, leaves it off. Outside GitHub Actions the config names no reporter,
so an agent's own `npx vitest run` gets Vitest's failures-only `agent`
reporter; `verify.mjs` asks for `default` because it parses that. `npm run
test:changed` (and `vitest related`) follow imports only, so the tests that
read files through `import.meta.glob(…?raw)` — `i18nKeys`, `tokens`,
`notices`, `toolchain` and the rest, every one of them named by a glob in
`RAW_READ_GLOBS` — never come along for
a change to the files they read; the commit gate's scope (above) is the
selection that knows them. A `slowTestThreshold` of 300 ms marks the tests to look at. `happy-dom` was
measured against jsdom on 2026-09-19 and lost: tests 5.9 → 2.9 s, but the
environment boot 19.7 → 34.6 s across 29 small files, 7.0 → 8.5 s in all —
the suite is boot-bound, not test-bound, so the faster DOM is the slower run.
The dom setup stubs `ResizeObserver` and `matchMedia` (desktop-shaped), mocks
`react-i18next` (a key back, never the English copy), the opener and event
plugins, and loads `@testing-library/jest-dom`, so a DOM assertion says what it
means — `toBeInTheDocument()`, `toBeDisabled()`, `toHaveAttribute()` — and fails
with the reason rather than "expected null to be truthy"; `toBeTruthy()` on an
element is the old idiom, not a choice. Where a test types or presses keys as a
person would (the composers, Tab through a dialog) it goes through
`@testing-library/user-event` with `delay: null`, because `fireEvent.change`
fires one event and a field hears focus, keydown, input and change; the
pointer and long-press tests stay on `fireEvent`, which is the only way to
dispatch a `pointerType: "touch"` sequence against a timer. The a11y lint rules
that argue with our role patterns are off in oxlint; **axe grades the rendered
result instead**: `components/{overlays,shell}/a11y.dom.test.tsx` render every
overlay and every piece of the frame once and expect `toHaveNoViolations()`
(`vitest-axe`, options in `src/test/a11y.ts` — `color-contrast` and `region`
are off there because jsdom has no layout and a fragment has no landmarks, and
nowhere else). Its first run found two real ones: a cover link with no name and
a palette listbox holding headings and `<ul>`s where only groups and options may
sit. A new overlay is a new row in that table. A test that wants
`isTauri` true mocks `@/api/anilist` itself. Import
`act` from `@testing-library/react`, never from `react`: Testing Library's
copy raises the act environment flag around the call, React's own prints a
warning per update, and the flag must not be set globally — with it on, every
async update the real code makes after an await warns instead.

## Notes that have cost real time

- **vitest has failed twice under `verify` and never alone.** Both times
  (2026-09-19 and 2026-09-20) a handful of tests in one file failed while
  `cargo test` compiled beside it, and eight consecutive bare runs afterwards
  were green. Nothing is known beyond that; the suspects, in order, are CPU
  starvation against the dom project's timeouts and the node project's
  `isolate: false`. Re-run `npm run verify` once before reading a failure that
  a bare `npm test` does not reproduce as a regression, and write down the
  file if it happens again.
- **`npm run verify` cannot see every warning `npm run tauri build` can.**
  `cargo test` compiles `#[cfg(test)]`, so a function whose only non-Linux caller
  is a test stays alive there and is dead code in a release build —
  `diagnostics::parse_os_release` is exactly that, and the gate was green for as
  long as it took to run a bundle build. Read the warnings from a `tauri build`
  before assuming there are none.
- **Every version bump mints a new incremental session under
  `src-tauri/target/debug/incremental`, and cargo never reclaims one.** The
  package version is part of Cargo's metadata hash, so 566 bumps had left
  2,810 session directories — 175 GB of a 269 GB `debug/` — of which the
  current build reads one. `node scripts/clean-target.mjs` reports them and
  `--apply` deletes every session older than a day (`--keep-days`), and
  `--android` adds the cross-compile trees for a cold Android build's price.
  Run it when the disk asks; it costs nothing but the next build's few
  seconds of incremental warm-up.
- **`cargo test` costs compile time, not test time, and a bump made that cold.**
  Measured on 2026-10-08 on the maintainer's machine (8 threads): the 523
  lib tests run in about 1 s. The same metadata hash as above makes the first
  `cargo test` after a version bump recompile the crate from scratch — 16 s
  alone, 34 s beside vitest — where an edit costs 6.6–6.9 s and no change at
  all 1.65 s; that is why the commit gate's scope (see "The commit loop")
  takes a bump for no change. The no-change figure was 2.3 s until `[lib]
  doctest = false`: the crate has no doc examples, and rustdoc's empty pass
  took about a second of every run. Tried and dropped the same day:
  `[profile.dev.package."*"] debug = false` (edit runs 6.4–7.3 s, noise, for
  a 73 s rebuild of every dependency). Left alone, each for its reason:
  dropping `staticlib` (measured as no speed change, see `Cargo.toml`, and
  mobile needs it), rust-lld (still not the default for MSVC,
  rust-lang/rust#71520, and this build passes manifest arguments to the
  linker), one test binary (`tests/bindings.rs` needs the comctl manifest,
  which `rustc-link-arg-tests` cannot hand to the lib's own unit tests), and
  cargo-nextest and sccache (neither speeds the incremental compile of the
  crate being edited). Once, the first run of a freshly linked test binary
  took 5.4 s instead of 1.0 s; an antivirus scan of the new executable is the
  likely cause, and a `target/` exclusion or a Dev Drive is a security
  setting for the maintainer, not a change for an agent.
- **MSVC writes an 11 MB `karasu.pdb` on every release build and there is no
  flag reaching the linker to stop it.** `debug = 0` and `strip = true` are
  already set, `cargo build --release -v` shows no `/DEBUG`, no `-Cdebuginfo=`
  and no `/PDB` — and the file is still produced and hardlinked into `deps/`.
  It is not bundled, so this is target-dir disk and nothing else. Looked at
  once; don't spend the afternoon on it again.
- **`hydrate` is not a startup cost, and the numbers are in the tree.** It was
  filed as one without a measurement. In a release build the re-parse of every
  indexed path is 49 ms for 20,000 files, and the other half nobody had looked
  at — deserializing the cached list to recompute the overflow chips — is 76 ms
  for 8,000 entries on a 2 MB blob. A pathological install pays about an eighth
  of a second before the window appears; a normal one pays under twenty
  milliseconds. Moving it off `setup` would buy that back and cost a window
  where the Library screen renders empty and every correction command needs a
  "not ready" state it does not have. `library::hydrate_cost` and
  `db::tests::measure_the_cache_read` are the measurements, `#[ignore]`d — run
  them with `cargo test --release --lib <name> -- --ignored --nocapture`.
- **An agent shell launched from the Claude desktop app sees a virtualized
  AppData.** That app is an MSIX package (`Claude_pzs8sxrjxfjjc`), and every
  child process inherits its file-system virtualization: any path under
  `%APPDATA%` / `%LOCALAPPDATA%` that has a shadow under
  `…\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\{Roaming,Local}\`
  is served *from* the shadow and written *into* it. The real install's
  `karasu.db` was shadowed by a stale copy a Claude-launched run left on
  8 Aug, so the "truncate the database" recovery test wrote to the shadow and
  changed nothing — "boots fine, file unchanged, nothing logged" was that,
  not a wrong path. The Android SDK, NDK and licences exist *only* in that
  shadow (the real `%LOCALAPPDATA%\Android\Sdk` is empty), so `tauri android
  build`, `android-check.ps1` and `apksigner` run only from such a shell.
  Read the real data dir via `\\localhost\C$\Users\…` (the loopback share
  bypasses the filter), never launch the installed app from that shell, and
  keep every test instance's data under `src-tauri\target\`.
- **The desktop test rig.** A release exe with a `karasu.portable` marker
  beside it keeps db, log, backups and a DPAPI `token.dat` under
  `target\release\data\` and starts signed out; launched with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`, its
  WebView is scriptable through Playwright's `connectOverCDP` (the app is a
  `HashRouter`, so navigate by `location.hash`). Three traps: the marker does
  not isolate the single-instance mutex, so the installed app must be quit
  first (the tell is its window popping up); `Abmelden` in the rig calls
  `delete_token`, which clears the *shared* Windows Credential Manager entry
  the installed app uses; and the Jellyfin token has no portable branch, so a
  seed copied from a real backup polls the real server unless its
  `jellyfin*` kv rows are deleted first.
- **A 0-byte `karasu.db` is a valid empty database**, so truncating it does
  not exercise the backup fallback — the app starts empty with no error line,
  which reads as the failure it is not. Clobber the 16-byte header instead;
  the transcript is then `ERROR db: cannot open the database: Migration
  failed: file is not a database`, `INFO  backups: restored the database from
  karasu-YYYYMMDD.db`, and the broken file kept as `karasu.db.unreadable`
  (measured 2026-09-03).

## The dependency graph is checked, not trusted

`src-tauri/deny.toml` is what `cargo deny check` (`npm run deny`, and the
Linux PR job, where it blocks a Dependabot PR, which merges itself on a green
run, and only shows on a person's) holds the Rust graph to: the RustSec
advisories, a licence allow-list that is the spread THIRD-PARTY-NOTICES.md
describes — a crate under anything else fails here before it can ship
unlisted — crates.io as the only source, and duplicates allowed because they
are the ecosystem's business. It found `h2` under RUSTSEC-2026-0258 the day
it was added; `cargo update -p h2` was the fix. Dependabot keeps the npm and
cargo graphs moving; knip and cargo-deny say when something in them is dead
or wrong.

## The dev loop has eyes

Three things a dev build shows that a release never carries. **TanStack Query
devtools** mount in `main.tsx` under `import.meta.env.DEV` (lazy, so the
production graph never sees the package — proven by grepping `dist/assets`),
with the button bottom-left because the detection window owns the other
corner; every request-budget question ("what refetched, what is stale") reads
off it before anyone adds a log line. **react-scan** highlights renders live,
but only when asked: `KARASU_SCAN=1` in the dev server's environment makes
`vite.config.ts` inject `src/app/scan.ts` as the first module script, which is
the one way to load it before `react-dom` (an inline script cannot resolve a
bare specifier, a static import would ship it, and a dynamic one is too late
for the DevTools hook). It slows the app and is off by default for that reason.
`npm run build:analyze` is `rollup-plugin-visualizer` on rolldown — it works —
writing a treemap of every chunk to `dist-stats/index.html` (ignored); open it
before guessing what the index chunk is made of.

## Three Cargo tools that answer questions, run by hand

`npm run deps:unused` is cargo-machete over the crate (it does not read
`build.rs`, so `tauri-build` sits in `[package.metadata.cargo-machete]`);
its first run on 2026-09-20 found `windows-future` declared and unused — the
`join()` it was kept for reaches `smtc.rs` through `windows`' own re-export, so
the line went. `npm run bloat` is cargo-bloat over the release exe, and the
answer on 2026-09-20 was not the suspected one: of a 23.3 MiB file, `.text` is
16.4 MiB and the `windows` crate is not in the top sixty (its bindings inline
into `karasu_lib`); the weight is tauri 2.6 MiB, std 2.6, karasu_lib 2.2,
tokio 1.3, the HTTP stack (reqwest, rustls, h2, hyper) ~1.5, and the regex
family ~0.8. The one oddity was two crypto backends at once — `ring` (125 KiB)
beside `aws_lc_sys` (197 KiB), because `tauri-plugin-updater`'s default
`rustls-tls` feature asked for rustls with `ring` and installed it as the
process default at its first check. Since 2026-10-06 the updater runs with
`default-features = false` (and no `zip`, since the release ships the bare
`.exe` and `.AppImage`), shares our reqwest and its aws-lc-rs,
and `ring` is out of the build: re-measured that day, `aws_lc_sys` 200 KiB and
no `ring` in a 24.2 MiB file with 17.1 MiB of `.text` (the app grew since the
first run). The live update over the new path ran on 2026-10-31: the
maintainer's Linux install took the Nightly 1.68.9.935 from 1.63.1.921,
download, signature and restart included. The shipped desktop builds set
`CARGO_PROFILE_RELEASE_LTO=fat` and `CODEGEN_UNITS=1` in `release.yml` (the
maintainer's call, 2026-10-06): measured that day on Windows the exe fell from
25.4 to 22.6 MiB, and a cold local build took 4 min 31 s; the release jobs'
timeouts went to 75 and 90 minutes because the shared cache cannot hold the
bitcode. Run it from `src-tauri/`
(`cargo bloat --release --crates -n 40`): the npm script's
`--manifest-path` is refused on Windows. `npm run mutants` is cargo-mutants through
`scripts/mutants.mjs` (the copy holds `src-tauri` alone, so the wrapper drops
the `../THIRD-PARTY-NOTICES.md` resource through `TAURI_CONFIG` or
tauri-build refuses to configure it); `src-tauri/.cargo/mutants.toml`
excludes the arms that do not compile here. First run, 2026-09-20, `scrobbler.rs` alone with four jobs: 182 mutants in
16 minutes, 151 caught, 19 missed, 10 unviable, 2 timeouts. Eight of the
misses were the `* 60` in the duration constants (a constant has no test but
its value), three were `emit_session` (a window event, unobservable from a unit
test), and six pointed at real gaps that got tests the same day: `season_key`'s
`-1`, `detection_override`'s three-part key, `cached_user_id` and
`candidates_from_cache`. Read the misses as questions, not as a score to push.

## The browser checks run weekly, not on a push

`.github/workflows/browser-checks.yml` runs the three checks that need a real
layout engine every Wednesday and by hand: `virtual-rows-check.mjs`,
`back-place-check.mjs` and `screens.mjs overflow`, on the runner's own Chrome
through `CHROMIUM_PATH`. Until 2026-11-10 nothing in CI opened the app in a
browser, so a sideways scroll or a lost scroll position reached a Nightly
unseen. It gates nothing: a red run is the workflow's own notification. Each
step runs whatever the one before it found. The Windows build is still
started nowhere in CI before it ships; the AppImage is the only artifact with
a smoke test.

## Links are checked weekly, not trusted

`.github/workflows/links.yml` runs lychee every Monday (and by hand) over the
markdown, the issue forms, the website's copy and the i18n files, with
`lychee.toml` carrying the exclusions: the POST-only GraphQL endpoint, the dev
server, private addresses (the Settings hint's example Jellyfin URL), and 429 as
an accepted answer because GitHub throttles a burst of HEADs. The first run on
2026-09-20 found 84 links alive and 10 redirecting for good reasons
(`releases/latest`, the issue-form links that bounce through login), so a
redirect is not a finding here; a failed run is, and it lands in Kyu's inbox as
the workflow's own notification. `cargo install lychee` and `lychee --config
lychee.toml -- '*.md'` reproduce it locally.

## The Actions cache is 10 GB, and a PR must not spend it

Measured on 2026-09-19: the Nightly ran with no Rust cache at all because four
Dependabot PRs two days earlier had each saved a ~1 GB Windows cache under
their own `refs/pull/N/merge` key, and the store evicts oldest-first. So every
rust-cache step names a `shared-key` per platform (`windows`, `linux`,
`android`) that `ci.yml` and `release.yml` share, and the PR jobs carry
`save-if: github.ref == 'refs/heads/main'` — a PR restores main's cache and
never writes one. A PR that changes `Cargo.lock` therefore compiles on top of
main's nearest cache and saves nothing, which is the intended price. Both
workflows also ignore `*.md`, `assets/screenshots/**` and the issue forms, so a
changelog-marker commit builds nothing, and `release.yml` also ignores
`.claude/**`, `.githooks/**` and the screens harness, which no build reads
(CI does not, since a test reads the agent settings); every job has a
`timeout-minutes` and
every artifact a `retention-days`; and every workflow but the three that build
the app (`ci.yml`, `release.yml` and `reproducible.yml`, on `ubuntu-22.04`)
pins `ubuntu-24.04` rather than ride `ubuntu-latest` into the 26.04 migration.

## Dependabot merges itself

`.github/workflows/dependabot-automerge.yml` merges a Dependabot PR when the
check workflow for it — CI for the app, Site for the website — finishes green
on the PR's current head. It runs on `workflow_run`, so it cannot fire before a
build has spoken and needs no branch protection to wait, which is what keeps
direct pushes to `main` as they are. It refuses a PR not opened by
`dependabot[bot]`, one from another repository, or one whose head moved after
the tested commit. Three consequences to know:

- **The merge builds no Nightly and bumps no version.** It is made with
  `GITHUB_TOKEN`, and a push made with that token starts no workflow by
  design. The dependency sits on `main` until the next real commit, which
  carries the version bump and the Nightly for both — the same way a
  hand-merged Dependabot PR always worked here (they never bumped either).
- **A PR neither workflow runs for is never merged automatically** — a change
  outside both path lists waits for a person. Dependabot never opens a
  semver-major PR for npm or cargo (`dependabot.yml`), so the workflow grades
  nothing; if that ignore list ever loosens, this is the place to add a
  `fetch-metadata` gate.
- **Re-running a PR's CI is the way to merge it by hand through the
  automation** (`gh run rerun <id>`); the re-run keeps Dependabot as the
  run's actor, the merge follows.

**A Tauri minor moves by hand, the npm package and its crate in one commit.**
`tauri build` refuses an `@tauri-apps/*` package and its Rust crate on
different minor versions (`Found version mismatched Tauri packages`), and
Dependabot opens npm and cargo as separate PRs, so neither half of a minor
could ever pass alone. The cargo side used to ignore `tauri` and `tauri-*`
for every update type while npm moved their minors: #61 (2026-10-08) took
`plugin-opener` to 2.7 and `plugin-deep-link` to 2.6 against crates still on
2.6 and 2.5, and both CI jobs failed in the bundle step. Since 2026-10-09
npm ignores `@tauri-apps/*` minors, cargo ignores `tauri`/`tauri-*` minors
and majors, and patches flow on both sides, since the check compares
major.minor only. A minor is `npm install @tauri-apps/<x>@<v>` plus `cargo
update -p tauri-<x>`, checked by `verify:full`'s `tauri build`.
