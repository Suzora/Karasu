---
paths:
  - "site/**"
  - "src/app/index.css"
  - "CHANGELOG.md"
---

# The website

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## The website

The public site lives in `site/` and deploys to
https://suzora.github.io/Karasu/ through `.github/workflows/pages.yml` - on
a push to `main` that touches `site/**`, `src/app/index.css` or `CHANGELOG.md`
(the page's "What changed" card reads it at build time), on a dispatch, or on
a release published by hand. It is its own npm project with its own
lockfile and `node_modules`; nothing under `site/` is imported by the app, and
the app's vitest projects cannot see it (`src/**` only). Layout, stack and the
review checkpoints are in `site/README.md`.

**A Stable tag reaches the site through a dispatch, not the release event.**
`release.yml` publishes with `GITHUB_TOKEN`, and an event that token causes
starts no workflow, so `pages.yml`'s `release: published` trigger never fired
for v1.32.0 (2026-10-03): the release went out and the page kept naming 1.0.0
until a hand dispatch. The publish job's last step now runs `gh workflow run
pages.yml` for a non-prerelease (dispatch is exempt from that rule; the job
holds `actions: write` for it), and the step after it dispatches the Flatpak
and Reproducible checks the same way (see "Packaging beyond the release
page"). The `release` trigger stays for a release someone publishes by hand.

- **Site-only commits do not bump the version and do not run the app loop.**
  The gate is `npm --prefix site run check` (typecheck, the token
  freshness check and the changelog reader's tests), then a prose commit with the `Co-Authored-By` trailer.
  `scripts/changelog.mjs` drops `site/` paths by itself, so no
  `Changelog: skip` is needed. A commit that touches both the app and the
  site goes through the normal six commands, and its changelog line describes
  the app half.
- **A site commit must not build a Nightly.** `release.yml` and `ci.yml`
  carry `paths-ignore: ["site/**", ".github/workflows/pages.yml"]`; keep it
  that way. Push `pages.yml` and the `site/` folder together - the workflow
  runs `npm ci` in `site/` and fails on a tree without it.
- **The app's Tailwind build must not see the site.** `src/app/index.css`
  carries `@source not "../../site";` under the import, measured on
  2026-09-05: with a probe class under `site/src/` the emitted
  `dist/assets/index-*.css` was byte-identical to the baseline with the line
  and 71 bytes larger without it. Re-run that diff whenever the line, the
  import or Tailwind moves; the header of `index.css` carries the numbers.
  `@source not "../../scripts";` sits beside it since 2026-09-25, when the
  style audit's fixtures started naming classes: the emitted CSS lost 254
  bytes, five classes named only in `scripts/`, and nothing the app uses.
  `src-tauri`, `.claude` (agent worktrees, whole copies of the tree), the root
  `*.md` and the test files joined them on 2026-10-06: 1,476 bytes and 15
  classes went, every one a bare form named only in a doc or a test (the
  banned `rounded-lg`, `transition-all`, `text-white` among them), while the
  variants the app uses (`md:text-hero-lg`, `focus:z-skip`) stayed.
- **Tokens are generated, never copied.** `site/src/styles/tokens.generated.css`
  is written by `node site/scripts/sync-tokens.mjs` from the `@theme`,
  `@keyframes`, `@utility`, `:root` and `[data-theme]` blocks of
  `src/app/index.css`, plus the default accent evaluated through
  `src/lib/contrast.ts` - the `@theme` fallbacks are not the colours a user
  sees. The app's high-contrast rules, keyed on `data-contrast="more"`, come
  across as `@media (prefers-contrast: more)`, nested ones included, and a
  selector list the rewrite cannot keep exact stops the sync. The site may add
  page-only steps in its own `@theme` (fluid type, the device corner, the
  screenshot shadow) but never redefines an app token. Changing any of those
  blocks means re-running the sync in the same
  commit; the site's `check` fails when the file is stale, and `pages.yml`
  watches `index.css` so drift fails in the open.
- **The UI primitives under `site/src/components/ui` are copies, on purpose.**
  The site's Tailwind scan cannot see `src/`, and an app refactor must not
  break the deploy. `sync-tokens.mjs --report-copies` shows the drift and
  enforces nothing.
- **Every claim on the site has a row in `site/CONTENT-AUDIT.md`** naming the
  file or test that makes it true. No row, no sentence - the site advertises
  the app that exists, not the one that is planned.
- **A site pull request is checked by `site-ci.yml`, not `ci.yml`.** CI ignores
  `site/**`; the Site workflow runs the site's `check` and `build` on a PR that
  touches `site/**` or `src/app/index.css`, and is what the auto-merge below
  listens to for a site dependency bump.
