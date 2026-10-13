---
name: karasu-changelog
description: How Karasu's changelog lines, curated releases and store texts are written. Use when writing a commit subject or a `Changelog:` trailer for an app commit, when curating CHANGELOG.md's Unreleased section into a Stable release, when writing F-Droid's fastlane changelog for a release, and when the maintainer asks for release notes, a "What's new" text or a review of the changelog.
---

# Karasu changelog

CHANGELOG.md is read by people in three places, and all three take its lines word for word:

- **The app.** After an update, Karasu shows once what changed. About's Changelog button shows the same view. Both read CHANGELOG.md at build time (`scripts/changelog-read.mjs`). A Nightly user sees only the Unreleased lines they have not seen before.
- **GitHub.** `scripts/release/release-notes.ps1` cuts a Stable's release notes out of its `## <version>` section.
- **F-Droid.** It reads `fastlane/metadata/android/<locale>/changelogs/<versionCode>.txt` at the tag.

So every line is read on its own, out of its commit's context, by someone using the app. CLAUDE.md ("The commit loop", and the paragraph after `scripts/changelog.mjs`) and the header of CHANGELOG.md are binding. This skill only puts their rules in order.

## A line

- **Write for someone using the app.** Present tense, saying what is different for them: "Back from a title returns you to the list as you left it." Do not write the change made to the code.
- **No code paths.** No function names, file names or internal jargon.
- **No unofficial site and no release group's name, ever.** This is a hard constraint in CLAUDE.md.
- **One sentence where it fits, ending with a full stop.**
- **Reference issues and PRs at the end:** `([#62](https://github.com/Suzora/Karasu/issues/62))`.
- **Inline markup:** `**bold**`, `*em*`, `` `code` `` and `https://` links are rendered. Anything else stays literal text.
- **Rewording costs something.** A line's id is a hash of its plain text, with case, spacing, markup and the final full stop evened out. Once a line has shipped in a Nightly, changing its wording shows it again to every Nightly user. Reword only when that is wanted.

## A commit (Nightly lines)

`scripts/changelog.mjs` turns the commit into the Unreleased line, after the commit.

- **Every app commit carries a trailer:**
  - `Changelog: Added|Changed|Fixed|Removed|Security: <line>`, or
  - `Changelog: skip`.

  Without a trailer the subject becomes the line, `(x.y.z.n)` version suffix included.
- **`skip` is for commits a user would not notice:** refactors, tests, internal tooling.
- **These drop out without a trailer:** docs-only, CI-only, scripts-only and `site/`-only commits. A commit touching only `.claude/` is not one of them, so it needs `Changelog: skip`.

## Curating a Stable

1. **Collect the range** with the tag named explicitly. The non-version tag `latest` breaks `git describe`:

   ```sh
   git log v<previous>..HEAD --no-merges --format='%h %s'
   ```

   `app-store-changelog`'s `scripts/collect_release_changes.sh v<previous> HEAD` gives the same list with the files touched.
2. **Run an omission audit.** Every commit in the range is either covered by a line or genuinely internal. Say which commits you left out, and why.
3. **Rewrite the Unreleased section into the release section** using the header's three steps:
   - Rename it to `## <version> — <YYYY-MM-DD>`. No brackets and no fourth number, or the tag build throws.
   - Open a fresh `## Unreleased` above it, carrying the `<!-- generated-through: <sha> -->` marker.
   - Check that `package.json` already says that version.
4. **Shape the section:**
   - One or two intro paragraphs: what the release is about, in the user's words.
   - Then `### Added`, `### Changed`, `### Fixed` (and `### Removed` or `### Security` when there is something to say).
   - Any other `###`, or text inside a group that is not a `- ` bullet or its two-space continuation, fails the build.
   - Merge lines about the same thing.
   - Keep the issue and PR references.
5. **Check the result:**

   ```sh
   npx vitest run src/lib/changelogRead.test.ts
   ```

   It parses the real file. Then show the maintainer the draft before it lands. A Stable commit, its tag and its push are the maintainer's.

## F-Droid's changelog

- **Location:** `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt` and `.../de-DE/...`.
- **The versionCode** is `1000000 + COMMIT_NUMBER` of the tagged build. For example, 1.44.0.873 is `1000873`.
- **Commit them in the curate commit.** F-Droid reads the metadata at the tag.
- **At most 500 characters each, plain text.** Put the strongest change first, and shorten rather than cut in mid-sentence.
- **German in the du form**, the voice of `fastlane/metadata/android/de-DE/full_description.txt`.
- **Draft with `app-store-changelog`,** giving it the range and the 500-character limit. Then fit the draft to the rules above: it writes App Store bullets, starts them with a verb, and knows neither this repository's format nor German.
- **Update the F-Droid merge request** if one is still open when a Stable is tagged. `scripts/release/fdroid-recipe.ps1 -Tag v<version>` fills the recipe for it, and `packaging/fdroid/SUBMISSION.md` has the rest.
