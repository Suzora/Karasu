# F-Droid submission

What is here, and what the maintainer does by hand. F-Droid builds every app
itself from source on its own servers and publishes either its own signature
or, when the rebuild is bit-identical to the developer's, the developer's.
**Karasu takes the first, decided by the maintainer on 2026-10-03:** F-Droid
forbids a self-updating app, so its build compiles the updater out
(`KARASU_NO_SELF_UPDATE`, read with `option_env!`) while the GitHub APK keeps
it, and two different binaries can never be bit-identical. The F-Droid install
and the GitHub sideload therefore carry different signatures and do not update
over each other; a user who switches uninstalls first.

## What the repository provides

- `dev.kyu.karasu.yml` — the fdroiddata recipe, with `Builds:` doing what the
  release job does: the pinned Rust (`rust-toolchain.toml`, checked against
  every workflow by `src/lib/toolchain.test.ts`), NDK r27b (27.1.12297006 in
  CI), `npm ci`, `npx tauri android build --apk --target aarch64
  --split-per-abi`. `scripts/release/fdroid-recipe.ps1 -Tag vX.Y.Z` fills the
  version name, the code (`1000000 + COMMIT_NUMBER`, the formula in
  `build.gradle.kts`) and the commit.
- Two build-time switches the recipe sets, both honoured by the tree:
  `KARASU_NO_SELF_UPDATE` (the APK updater is compiled out, so it neither
  checks nor installs) and `KARASU_UNSIGNED` (`build.gradle.kts` emits an
  unsigned release APK instead of falling back to debug signing, which F-Droid
  then signs).
- `fastlane/metadata/android/{en-US,de-DE}` — the store listing: title, short
  and full description in both, and the icon and three phone screenshots under
  `en-US` only, which F-Droid reads from the repository at the tagged commit.
- The `Reproducible` workflow (dispatch, input `tag`) is not F-Droid's check
  but the GitHub release's: it rebuilds the arm64 APK from the tag exactly as
  the release job does (signing aside), downloads the release's, and runs
  `apksigcopier compare --unsigned`. Run against v1.32.0 *with* the F-Droid
  switch on 2026-10-03, 965 of 966 entries were identical, the zip order and
  metadata too, and only `libkarasu_lib.so`'s `.text` differed, by the
  1,040 bytes the switch compiles out. Without the switch, the same day, the
  rebuild verified under the release's signature.

## The one-time request

1. `fdroid-recipe.ps1 -Tag vX.Y.Z` fills `packaging/fdroid/out/`.
2. Fork <https://gitlab.com/fdroid/fdroiddata>, add the filled file as
   `metadata/dev.kyu.karasu.yml`, open a merge request. Their CI runs
   `fdroid build` on it; expect a round of questions about the `sudo:` steps
   (Node and Rust are not in the base image) and the anti-feature list.

## Why each step of the recipe is there

The recipe carries no comments, because fdroiddata's CI runs `fdroid
rewritemeta` and fails a file it would rewrite; it is kept in exactly that
form, so the reasons are here.

- **`subdir: src-tauri/gen/android/app`** is four levels deep, so every step
  that needs the repository root climbs `../../../..`.
- **`sudo`** installs the build tools and Node 22 from nodejs.org, checked
  against its published sha256: `engines.node` asks for 22, and the build
  server's Debian ships an older Node.
- **`init`** installs the pinned Rust as the build user with the Android
  target, runs `npm ci` at the root, and deletes four files `npm ci` brings
  that fdroidserver's scanner flags: Playwright's WebAssembly codec, TypeScript
  7's native `tsc`, react-scan's Astro compiler and the bundle visualizer's
  source-map WebAssembly. None of them runs in the build; the frontend built
  without them, and the scan counted 0 with them gone (fdroidserver 2.4.5, on
  2026-10-06). `rm -f` rather than `scandelete`, because a `scandelete` entry
  that no longer matches fails the build, while a file that moves or leaves is
  nothing to `rm -f`; a newly flagged file still fails the scan.
- **`build`** sources Cargo's environment and exports `KARASU_NO_SELF_UPDATE`,
  `KARASU_UNSIGNED` and the path remap in the same command list as the build,
  because fdroidserver runs every phase in a shell of its own. It stands a link
  to the build server's `gradle` in for the Gradle wrapper, which fdroidserver
  deletes from every Gradle project before building and which
  `tauri android build` calls, then builds the arm64 APK.
- **No `gradle:` key.** With `output:` set the build method is raw, so
  fdroidserver takes the APK `tauri android build` wrote instead of running its
  own `assembleRelease` across every Rust target in a fresh shell.
- **`UpdateCheckData` and `VercodeOperation`** read the version code from
  `COMMIT_NUMBER` plus the 1,000,000 base `build.gradle.kts` adds and the name
  from `FULL_VERSION` in `src-tauri/src/commands/update.rs`; F-Droid's build
  refuses an APK whose name or code differs from the recipe's.
- **`NonFreeNet`**: Karasu depends on AniList, a proprietary network service.
  Jellyfin is free software and adds nothing.

## What only F-Droid's build server can show

Checked locally: `fdroid lint` and `fdroid rewritemeta` (clean against
fdroiddata's categories and anti-features), the update check applied to
`update.rs` (`1000806` / `1.40.1.806` for that commit), `npm ci` under Node
22.23.3 and the frontend build without the four files, and the scan. Not
checked, because only the build server runs it: the `sudo` steps on its Debian,
the `gradle` link standing in for the wrapper (that `gradle` is on the build
user's `PATH` there is derived, not seen), and the whole Android build. The
merge request's CI is that check; run `fdroid rewritemeta dev.kyu.karasu` and
`fdroid lint dev.kyu.karasu` on the filled file in an fdroiddata checkout before
opening it, and expect no diff.

## What to know before the first build

- The release job remaps paths (`RUSTFLAGS`) since 1.18.3. It has never set
  `SOURCE_DATE_EPOCH`; the rebuild and the recipe do, and the measurement
  above found no build time in the output either way.
- `tauri.properties` is generated by the CLI and gitignored; the version code
  is read from `COMMIT_NUMBER`, so it does not matter.
- R8 is deterministic for one toolchain; the Gradle wrapper pins 8.14.3 and
  AGP 8.11.0 in the tree, so the F-Droid build uses the same.
- Every later release is a one-line change in fdroiddata (`AutoUpdateMode:
  Version` with `UpdateCheckMode: Tags` lets their bot open it).
