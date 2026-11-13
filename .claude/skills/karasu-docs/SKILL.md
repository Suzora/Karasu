---
name: karasu-docs
description: How Karasu's README and the other reader-facing Markdown files are written and laid out. Use when editing README.md, CONTRIBUTING.md, SECURITY.md, ROADMAP.md, PRODUCT.md, site/README.md or a packaging SUBMISSION.md, and when the maintainer asks to restructure, shorten or review one of them.
---

# Karasu docs

Each file has one reader. Write for that reader and move everything else to the file whose reader wants it.

| File | Reader | Holds |
| --- | --- | --- |
| README.md | someone deciding whether to install | what it is, screenshots, a feature overview, install |
| CONTRIBUTING.md | someone about to open a PR | setup, the gate, conventions |
| SECURITY.md | someone auditing or reporting | where tokens rest, how to report |
| CLAUDE.md | agents and the maintainer | measurements, decisions, history |

## The README's shape

Decided by the maintainer on 2026-11-13: less text on the surface, more pictures, the detail one click away.

1. Header: logo, name, tagline, two badge rows (project state, then platforms and community), one line of jump links.
2. One hero screenshot, then what Karasu is in a short paragraph.
3. Screenshots: four visible, the rest behind a fold.
4. Features: one overview table that stays visible, then one `<details>` per group holding the full list.
5. Platforms: one comparison table.
6. Installation: a download table, the first-start steps, the SmartScreen note visible, every platform's fine print behind a fold.
7. Development, Built with AI, Reporting a bug, Contact, License.

## Rules

- **A claim needs a proof.** Every feature sentence names something the app does today; if no file or test makes it true, it does not go in. `site/CONTENT-AUDIT.md` is the same rule for the website, and several of its rows point at README sections by their heading, so a renamed heading means a changed row.
- **Headings are headings.** A group title is `##` or `###`, never a bold line. One `#` per file.
- **What is visible is short.** A visible bullet or table cell is two lines at most and says what the user gets. Mechanisms, exceptions and version history go behind a `<details>` whose summary says what is inside, or into CLAUDE.md or SECURITY.md.
- **A fold needs blank lines.** One after `<summary>…</summary>` and one before `</details>`, or GitHub renders the Markdown inside as plain text.
- **Badges are facts a reader acts on:** the release, the build, downloads, the licence, the platforms, where to talk. One style (`flat-square`), no badge for a tool the reader does not install.
- **Never name** an unofficial streaming or reading site, a real release group, or a feature on CLAUDE.md's rejected list. The installer is unsigned and the README keeps saying so, visibly.
- **No em or en dashes**, in any Markdown file, CHANGELOG.md and its release headings (`## 1.2.3 - 2026-01-01`) included. Rewrite the sentence, or use a plain hyphen. Only the licence texts in THIRD-PARTY-NOTICES.md keep theirs.
- **English only**, sentence-case headings, no emoji in headings, relative links inside the repository.

## Procedure

1. Read the section being changed and the file's row in the table above.
2. Make the change, then run `npm run lint:md` and fix what it reports.
3. A change that moves or removes a README section is shown to the maintainer as before and after first.
