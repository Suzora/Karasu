---
paths:
  - "scripts/release/**"
  - "packaging/**"
  - "fastlane/**"
  - ".github/workflows/**"
  - "src-tauri/tauri.conf.json"
---

# The AppImage, Flatpak, F-Droid and the release workflows

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## The AppImage

**The AppImage leaves the display stack to the host, on purpose.** linuxdeploy
bundles the build host's libraries (ubuntu-22.04), the AppRun puts them first
on `LD_LIBRARY_PATH`, and the host's Mesa, which comes from the host because
libEGL/libGL/libgbm/libdrm are on the AppImage excludelist, then loads the
bundled copies of whatever it links. With Mesa 26 that broke twice. 1.19.1.664
bundled wayland 1.20's `libwayland-client`, which lacks symbols `libEGL_mesa`
needs: `Could not create default EGL display: EGL_BAD_PARAMETER. Aborting...`
and a black window (Fedora 44, 2026-09-23). 1.19.2.665 removed only that
library and was checked on WSLg alone, which has no DRM render node, and a
Fedora 44 user reported a segfault shortly after the window opened
(2026-09-24). `scripts/release/slim-appimage.ps1` now removes thirteen
libraries after the build, repacks with a digest-pinned `appimagetool` over
the runtime cut from Tauri's own file, and re-signs with the updater key,
because the `.sig` covers the file's bytes. The rule behind the list, measured
on 2026-09-25: a bundled soname goes when Fedora 44's Mesa 26.2 (`libEGL_mesa`,
`libGLX_mesa`, `libgallium`, `libgbm`, `gbm/`, `dri/`) links it — `libXau`,
`libXext`, `libelf`, `libffi`, `liblzma`, `libxcb-randr`, `libxcb-shm`,
`libzstd` — or it is one of the X11/Wayland siblings tauri-apps/tauri#15976
found on real Fedora 44 hardware — `libwayland-{client,cursor,egl}`,
`libxkbcommon`, `libxcb-render`, `libXdmcp` — **and** every one of Fedora 44,
Arch, Ubuntu 22.04/24.04/26.04 and Debian 12 with gtk3 and Mesa installed
carries it. Two fail that test and stay bundled: `libwayland-server` (the
bundled WebKit links it, Mesa ≥ 25.2 no longer does, and Ubuntu 24.04/26.04
lack it — removing it gave `libwayland-server.so.0: cannot open shared object
file` on WSL) and `libxml2.so.2` (Mesa links it, but Arch and Ubuntu 26.04
ship only `.so.16`). Every pattern must match or the script throws, so a
linuxdeploy that stops bundling one fails the build instead of leaving a stale
list; widen it only by re-running that measurement. That guard is what caught
Tauri CLI 2.12 (linuxdeploy `07333c6`, taken on 2026-09-30): it no longer
bundles `libwayland-client` at all, so the list lost it and is thirteen.

**The display backend is GDK's own choice since CLI 2.12, decided on
2026-09-30.** Tauri's GTK hook no longer exports `GDK_BACKEND=x11`, and the
AppImage follows it: a Wayland session runs it natively, an X11 session on X11,
exactly as the `.deb`, the `.rpm` and the Flatpak (`--socket=wayland`,
`--socket=fallback-x11`) always did, and `GDK_BACKEND=x11` is the way back
through XWayland. X11 had been forced only to dodge the bundled
`libwayland-client` meeting the host's Mesa (tauri-apps/tauri#8541), and that
library is gone at the root now. Native Wayland buys sharp fractional scaling
and native input methods; it costs the window's position, which Wayland does
not let a client set, so there `tauri-plugin-window-state` brings back size and
maximised state only. The summon hotkey is the one part that needs more than
GDK: `global-hotkey` 0.8 grabs keys over its own `x11rb` connection, and on a
Wayland session XWayland only sees keys meant for X11 windows, so a grab there
was never global. Since 2026-10-06 a Wayland session (`XDG_SESSION_TYPE`, else
`WAYLAND_DISPLAY`; `hotkey::choose_backend`) hands the key to the desktop's
GlobalShortcuts portal through `ashpd` on a connection of its own
(`hotkey/portal.rs`): the stored accelerator is offered as the XDG shortcut
`preferred_trigger` (`portal_trigger`, our own keysym table), the desktop may
show a dialog and answers later, so the portal path stores first and reports
through the `hotkey-status` event and `global_hotkey_status`, which Settings
shows as one line. A host app needs an app id: since xdg-desktop-portal 1.21
`CreateSession` refuses a caller without one, and `Registry.Register`
accepts an id only when its `.desktop` file is installed, so the `.deb` and
the `.rpm` carry a hidden `dev.kyu.karasu.desktop` (`packaging/linux/`),
registered before any other portal call on that connection (it carries no
`StartupWMClass`, so `Karasu.desktop` alone claims the window); a bare AppImage
has none and reports `noAppId`, a Flatpak takes its id from the sandbox. Short
of a refusal, every failure — a missing portal (wlroots, COSMIC, an older
GNOME, or no portal service at all, which only the first call reveals), no
app id, a failed bind — falls back to the X11 grab with a hint. A refusal
(any non-success answer, since GNOME reports a cancel as "other", or a reply
without the shortcut) is remembered in kv `global_hotkey_declined`, so a
launch does not put the dialog up again; setting a key clears it, and Enter
on the same key asks again. Once bound the desktop keeps the key, so a
change goes through its own dialog (`configure_global_hotkey`, portal v2). The `Activated` signal's activation token is handed to GTK
(`set_startup_id`) before the window is toggled, or GNOME refuses the focus.
Measured on KDE Plasma 6.8 Wayland (CachyOS, xdg-desktop-portal 1.22) on
2026-10-31: the registry, the dialog, the binding and the `Activated` signal
all work, but KDE sends no activation token, and without one KWin will not
raise an already mapped window while it does focus a freshly mapped one, so
`raise` in `hotkey/portal.rs` hides an unfocused visible window first. The
registry also refuses an id whose `.desktop` file's `Exec=` is not on `PATH`
(GLib drops such an entry), which the packages satisfy with `/usr/bin/karasu`
and a hand-run binary does not; GNOME is still unmeasured. On the same machine
(RTX 5090 beside an AMD iGPU) native Wayland ran with sharp text, the tray and
every page, so a Wayland graphics report still starts with `GDK_BACKEND=x11`
as the comparison, but no longer for want of a real GPU. The script throws if the hook forces a
backend again, because that would be a decision to take again, not a line to
patch.

What the script still adds to the hook is one guard: it unsets a
`GTK_IM_MODULE=wayland*` unless GDK is headed for Wayland (`GDK_BACKEND`, else
`WAYLAND_DISPLAY`), because the bundled `im-wayland.so` dereferences a null
display under X11 (`gdk_wayland_display_get_wl_display: assertion … failed`,
then SIGSEGV in `wl_proxy_get_version`). Reproduced with 1.19.2.665 in a Fedora
44 container, and again on 2026-09-30 with an unslimmed CLI 2.12 build: `rc=139`
in the X11 pass on both smoke images, while the same build ran natively on
Wayland. It also opens every mode before the repack (`chmod -R
u+rwX,go+rX,go-w`) and throws if the repacked tree holds a file others cannot
read or run: Tauri writes `AppRun.wrapped` as `0770`, which the FUSE runtime
never shows because it mounts for the calling user, but `firejail --appimage`
and AppImageHub's test mount the image as root, and the catalog's bot
(AppImage/appimage.github.io#6557, 2026-09-29) failed v1.0.0 with
`AppRun.wrapped: Permission denied`. The mode comes from Tauri's tool cache,
where `~/.cache/tauri/AppRun-x86_64` sits as `0770`; CLI 2.12's linuxdeploy
already stores it as `755`, and the `chmod` stays as the guard. After the repack only
*files* are graded, because the check reads an `--appimage-extract` and the
runtime's extractor stopped keeping directory modes: type2-runtime `75849dc`
(v1.0.0, the Nightly of 2026-09-26) extracts the stored `755`, while `8f39b89`,
which appimagetool fetched for a build on 2026-09-30, creates every directory
`0700` whatever the image stores (`unsquashfs -lln` shows `755` in both).

`scripts/release/smoke-appimage.ps1` runs right after it in both workflows and
blocks: it unpacks the AppImage's squashfs as root with `unsquashfs`, which
keeps the stored modes that the runtime's own extractor drops for directories,
and starts it as an unprivileged user (the firejail shape; real firejail inside
Docker sees a sandbox and skips its root mount, so it proves nothing there) in
Fedora 44 and Ubuntu 26.04 containers, twice: on X11 under Xvfb, then natively
on Wayland under headless Weston, both with `GTK_IM_MODULE=wayland`. It fails
unless every bundled ELF resolves, the main process and `WebKitWebProcess` are
alive after 25 s in both passes and every log is free of
`EGL_BAD_PARAMETER`, `cannot open shared object`, `undefined symbol`,
`Permission denied` and panics. Replayed on 2026-09-25 it failed 1.19.2.665 (the
segfault), and the same checks failed a tree with 664's `libwayland-client`
put back (the EGL abort). Replayed on 2026-09-30 it failed v1.0.0 and an
unslimmed 1.30.6 on both images with the bot's own `AppRun.wrapped: Permission
denied`, and passed the slimmed 1.30.6. The Wayland pass sets no `DISPLAY`,
and without a compositor it fails with `Failed to initialize GTK` (measured the
same day), which is the proof it cannot fall back to X11. It runs llvmpipe, so it cannot see a crash on a real GPU's
DRI3/GBM path; a Linux graphics report still needs the reporter's
`coredumpctl info`. A red smoke test in `release.yml` publishes Windows alone
(the Linux download is `continue-on-error`), and the Nightly's prune step then
drops the old Linux files until the next green build. An image that cannot be
pulled or installed into is a warning, not a failure, and installing has one
budget per image across every attempt (`-InstallSeconds`, three minutes), so a
crawling mirror ends in that warning instead of the step's twelve-minute
timeout; each `docker pull` attempt is bounded the same way (`-PullSeconds`,
two and a half minutes, two attempts), the one stage that had no deadline. Measured on 2026-10-07: a plain `ubuntu:26.04` took 189 s for
`apt-get update` and 358 s for the install, two PR runs timed out before the
AppImage ever started while Fedora passed in under two minutes, and a normal
install takes well under one. The script ends in an explicit `exit 0`:
GitHub's `pwsh` step wrapper exits with the last native `$LASTEXITCODE`, so
the first run that ever reached the warning (the same evening) went red on
docker's leftover 100. Tauri stopped forcing X11
with CLI 2.12; drop the library list once it ships
`bundle.linux.appimage.excludeLibraries` (tauri-apps/tauri#15662). The `.deb`, the
`.rpm` and the Flatpak link against the host's libraries and never had the
problem.

## Packaging beyond the release page

`packaging/` holds what other channels need and the repository can prepare;
the submissions themselves are the maintainer's. **Flatpak**, since
2026-10-06 built from source under the Flathub id `io.github.Suzora.Karasu`
(a Flathub id names a domain the developer controls; Karasu's own identifier
stays `dev.kyu.karasu`): `packaging/flatpak/io.github.Suzora.Karasu.yml` is
the manifest (GNOME 51 with the rust-stable and node22 SDK extensions, the
AppIndicator library from flathub/shared-modules, then `npm ci --offline`,
`npm run build` and `cargo --offline build --release --locked --features
tauri/custom-protocol`, which is what `tauri build` passes and no CLI is
needed for), with its metainfo, desktop file and `flathub.json` beside it.
`scripts/release/flatpak-manifest.ps1 -Tag vX.Y.Z` fills a release into
`packaging/flatpak/out/`: the git source at the tag and its commit, the cargo
and npm sources from that commit's lockfiles through flatpak-builder-tools and
the shared modules, each at a pinned commit, and the metainfo's release.
`-Local` (with `-Commit`, for a `git stash create` of the working tree on a
throwaway branch) does the same for this clone with a `file://` source WSL can
fetch. The npm generator joins its paths with the host's separator, so on
Windows the script runs it inside WSL; every one of its 1,304 entries came out
with backslashes when it ran natively, and the build then failed on
`flatpak-node\setup_sdk_node_headers.sh`. The `Flatpak` workflow (dispatch,
input `tag`, and `release.yml` starts it for every Stable tag) validates the
metainfo with `appstreamcli --pedantic`, lints the manifest and the built
repository with `flatpak-builder-lint`, and builds the bundle in the GNOME 51
builder image. The `finish-args` are each a feature — StatusNotifier for the
tray, `org.mpris.MediaPlayer2.*` for the media-session pass,
`org.freedesktop.secrets` for the token, `org.freedesktop.Notifications` for
the toasts, Discord's IPC socket (native and Flatpak) for rich presence, the
videos folder read-only for the library, network for AniList and the OAuth
callback — and the settings portal is left out because a portal needs no
name. The sandbox changes four things in the code, each keyed on
`portable::flatpak_id`: the single-instance bus name takes the Flatpak id (a
sandbox may own names under its own id only, and the plugin starts a second
instance when it cannot own one), the tray writes its icon into the cache
folder the tray host can read (the default, `$XDG_RUNTIME_DIR/tray-icon`, is
the sandbox's own), mpv's default socket moves to
`$XDG_RUNTIME_DIR/app/<id>/` (a folder the host has only once Karasu ran in
that login, so the Settings hint says to start Karasu before mpv), and
Settings hides autostart, portable mode and the mpv library launch, which
cannot start a host program (`PlatformInfo.flatpak`); the diagnostics report
reads the host's `/run/host/os-release` and has a Flatpak row.
`KARASU_NO_SELF_UPDATE` in the manifest's build environment turns the updater
off as for F-Droid, and since 2026-10-06 that means every path: the check
returns before any request even from About's button, About says the store
delivers the updates, and the Updates card is hidden
(`PlatformInfo.storeUpdates`).
Built and linted in WSL on 2026-10-06 (Ubuntu 26.04, flatpak 1.16.6,
flatpak-builder 1.4.8, and once more with Flathub's own `org.flatpak.Builder`):
the manifest lint reports only the `file://` source a local build uses (and,
on GNOME 50, that 51 was out); the repository lint passes once the build ran with
`--mirror-screenshots-url=https://dl.flathub.org/media/ --compose-url-policy=full`
and the screenshots were committed to the repository, while without the policy
the compose left the media paths relative and two appstream rules failed (the
workflow's builder action passes both, so CI needs no exception);
`appstreamcli --pedantic`
passes with one pedantic note on the upper-case id, and that build is the first
place the Linux-only Rust ever compiled outside CI. The move to GNOME 51 (on
freedesktop 26.08) came the same evening at the maintainer's word, "if
compatible and functional": its runtime still carries `webkit2gtk-4.1`,
`javascriptcoregtk-4.1`, GTK 3 and libsoup 3 (seen in the installed runtime,
and in gnome-build-meta's gnome-51 `sdk-platform.bst`), the shared
AppIndicator module built on 26.08, both lints came back clean with no runtime
note left, and the WSLg checks below all held on 51 too. Started under WSLg the same
day, the window and its WebKit process were alive after 25 s, the bus name was
`io.github.Suzora.Karasu.SingleInstance`, a second start handed over and
exited within a second, the tray icon file lay in
`~/.var/app/io.github.Suzora.Karasu/cache/dev.kyu.karasu/`, and the data
folder sat under `~/.var/app/io.github.Suzora.Karasu/data/dev.kyu.karasu/`.
WSLg has no tray host, no Secret Service and no real GPU, so the tray menu,
the token and the GPU path were not exercised there. They were on 2026-10-31,
built from source on KDE Plasma Wayland (CachyOS, Flathub's `org.flatpak.Builder`,
GNOME 51, the user installation): the tray menu, the token kept across a
restart through the secret portal, a second start handing over, the hidden
Settings rows and mpv's sandbox socket path all held. `flatpak-manifest.ps1`
needs PowerShell, which that machine lacks, so its `-Local` steps were run
by hand there (the pinned generators through `uv`). `SUBMISSION.md` there has
the request's steps and what the sandbox changes. **F-Droid**: `packaging/fdroid/dev.kyu.karasu.yml`
is the fdroiddata recipe, `scripts/release/fdroid-recipe.ps1 -Tag` fills its
version, code and commit, `fastlane/metadata/android/{en-US,de-DE}` is the
listing F-Droid reads at the tag. Every Stable tag carries
`changelogs/<versionCode>.txt` in both locales (`1000000 + COMMIT_NUMBER`
of the tagged build), at most 500 characters, German in the du form,
written in the curate commit because F-Droid reads the metadata at the tag
(decided on 2026-10-13; the `karasu-changelog` skill has the procedure). The recipe sets two build-time switches:
`KARASU_NO_SELF_UPDATE` (`self_update_disabled` in `commands/update.rs`;
F-Droid forbids self-updating apps, so the check and the install both stand
down) and `KARASU_UNSIGNED` (`build.gradle.kts` emits an unsigned release
instead of falling back to debug signing). Its update check reads the tags
(`UpdateCheckData`: the code from `COMMIT_NUMBER` plus the 1,000,000 base
through `VercodeOperation`, the name from `FULL_VERSION`), since F-Droid's
build refuses an APK whose version name or code differs from the recipe's by
a character. Node, npm and rustup come from the build server's Debian
(trixie), as F-Droid's reviewer asked on 2026-10-12: trixie's Node 20.19 sits
below the 22.12 `engines.node` names, `npm ci` only warns, and the frontend
built byte-identical under it. Run over the tree after
`npm ci` as `fdroid build` does after `init`, fdroidserver 2.4.5's scanner
flagged four files on 2026-10-06, all tooling the build never runs (a
Playwright codec, TypeScript 7's native `tsc`, react-scan's Astro compiler and
the visualizer's source-map), and a fifth on 2026-10-12 over `v1.44.0`
(`oxc-parser`'s WebAssembly fallback, which the style audit's parser began to
ship), and the frontend built without them, so the recipe's `scandelete:
node_modules` lets the scanner delete and log them; F-Droid's reviewer asked
for that over the `rm -f` in `init` the recipe first had, and narrowed our five
package entries to the one folder himself. That entry fails the build only if
nothing under `node_modules` is flagged at all. With it the scan counted 0. The recipe is written in the form
`fdroid rewritemeta` produces (no comments, its key order, its line wrapping),
as fdroiddata's CI runs it (fdroidserver `master`, Debian's `ruamel.yaml`
0.18.10, which wraps differently from the PyPI 2.4.5 the recipe was first
checked with), because that CI fails a file it would rewrite; the reasons live in
`packaging/fdroid/SUBMISSION.md`. A review of 2026-10-06 found the recipe had
never been able to build: `subdir` is four levels deep and `init` climbed three,
so `npm ci` ran in `src-tauri`; the switches were exported in `prebuild`, and
every phase is its own shell, so they never reached the build (while the lines
of one phase share a shell, so a second `cd ../../../..` in `init` climbed out of
the tree and the deletions missed, which the first merge request's build
showed on 2026-10-12); and `gradle: yes`
beside `output:` made fdroidserver run a second `assembleRelease` for every
Rust target. **F-Droid signs its own build,
decided by the maintainer on 2026-10-03**, so the recipe carries no
`AllowedAPKSigningKeys` and the F-Droid and GitHub installs do not update over
each other. The reason is the first switch: it is read with `option_env!`, so
it compiles the updater out, and an F-Droid build can never be bit-identical
to the GitHub APK that keeps it. Measured the same day against v1.32.0 with
the switch on: 965 of 966 entries identical, zip order and metadata included,
and only `libkarasu_lib.so`'s `.text` differed, by 1,040 bytes. So the
`Reproducible` workflow (dispatch, input `tag`) checks the GitHub release
rather than F-Droid's build: it rebuilds the arm64 APK from the tag as the
release job does, with only the signing left out, and runs `apksigcopier
compare --unsigned` with the signed release first (its `do_compare` copies
that signature onto the second APK), keeping the rebuild as an artifact for a
diff. Its first run in that shape, on v1.32.0 the same day, verified: the
GitHub APK is the tag's source, byte for byte. Reproducibility rests on what the tree fixes: `rust-toolchain.toml`
pins the exact version (and `src/lib/toolchain.test.ts` fails the gate when a
workflow's `dtolnay/rust-toolchain` step or the recipe names another — CI
passes the pin as `toolchain:` because the action does not read the file, and
rustup's auto-install would otherwise leave the Android targets on the wrong
toolchain), and the Android job remaps `RUSTFLAGS --remap-path-prefix` for
the workspace and `~/.cargo`. The release job has never set
`SOURCE_DATE_EPOCH`; the rebuild and the recipe do, and the measurement above
shows no build time reaching the output. Bumping the Rust pin means the
toolchain file, every `dtolnay/rust-toolchain` step and the recipe in one
commit; the test says so. Nothing under `packaging/` is built by the release; it reads the
release.

**The two packaging workflows had never run against a real tag before
v1.32.0**, and the first runs failed on four things no other check could
see: `SHA256SUMS.txt` arrived as octet-stream bytes with CRLF lines in pwsh 7,
`bsdtar` in the flatpak-builder sandbox ran as root and could not chown to the
packager's uid, the `.deb` kept the notices under the product name, and
`apksigner` is not on the runner's `PATH`. The first three went with the
`.deb` when the Flatpak moved to a source build on 2026-10-06. So
`release.yml`'s publish job dispatches both, from `main` with the tag as input,
for every Stable tag, beside the website: the Flatpak check always, since it
builds from the tag's source and needs nothing the release carries, the
reproducibility check only when it carries an arm64 APK, with a `::warning::`
in the publish log when it skipped. A
red run reaches the maintainer as that workflow's own notification; the
release itself is already out by then and is not held back by either.
