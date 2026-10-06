# Flathub submission

What is here and what the maintainer still has to do by hand. The repo side is
complete: `io.github.Suzora.Karasu.yml` is the manifest, built from source;
`io.github.Suzora.Karasu.metainfo.xml` the AppStream data;
`io.github.Suzora.Karasu.desktop` the launcher, installed from the tagged
source; and `flathub.json` limits the build to x86_64.
`scripts/release/flatpak-manifest.ps1 -Tag vX.Y.Z` fills all of it for one
release into `packaging/flatpak/out/`:

- the git source, pinned to the tag and its commit;
- `cargo-sources.json` and `node-sources.json`, every crate and npm package of
  that commit's lockfiles, written by flatpak-builder-tools at a pinned commit
  (run through `uv`), so the build needs no network;
- the metainfo's release and date;
- `shared-modules/`, flathub/shared-modules at a pinned commit, for the
  AppIndicator library the tray loads.

The `Flatpak` workflow runs that script, validates the metainfo with
`appstreamcli --pedantic`, lints the manifest and the built repository with
`flatpak-builder-lint` and builds the bundle on a GNOME 51 builder. A local
build that should pass the repository lint needs
`--mirror-screenshots-url=https://dl.flathub.org/media/ --compose-url-policy=full`
and the mirrored screenshots committed to the repository
(`ostree commit --branch=screenshots/x86_64 <builddir>/files/share/app-info/media`);
without the policy the screenshot and icon paths stay relative and two
appstream rules fail. The workflow's builder action passes both itself. It runs
by itself for every Stable tag; run it by hand against the tag before opening
the request, and again after every change to the files here.

`-Local` fills the same files for this clone's HEAD (or `-Commit`), with a
`file://` source a build in WSL can fetch; that is how the manifest was
checked before it ever met a tag.

## The one-time request

1. Fork <https://github.com/flathub/flathub>, branch from `new-pr`, and add the
   filled files from `packaging/flatpak/out/` at the repository root:
   the manifest, the metainfo, the two source lists and `flathub.json`.
   `shared-modules` goes in as a git submodule
   (`git submodule add https://github.com/flathub/shared-modules.git`), not as
   the copied folder.
2. Open the pull request against `new-pr`. The template asks for the app id
   (`io.github.Suzora.Karasu`), that the app is not already on Flathub, and
   that the submitter is the developer, which is the case.
3. Review answers what the manifest cannot. The reviewers may ask for the
   `--talk-name` and `--filesystem` lines to be justified; each is a feature,
   and the manifest says which: the tray (StatusNotifier), the media-session
   pass (MPRIS), the token (the Secret Service), the toasts (the notification
   daemon), Discord's rich presence (its socket, native and Flatpak), and the
   local library (the videos folder, read-only).

## The id, and the one that stays

A Flathub id must name a domain the developer controls, and the project's home
is its GitHub organisation, so the Flatpak is `io.github.Suzora.Karasu`.
Karasu's own identifier stays `dev.kyu.karasu`: it names the data folder
(inside the sandbox under `~/.var/app/io.github.Suzora.Karasu/`), the
credential entry and the hidden desktop file the `.deb` and the `.rpm` carry
for the shortcut portal. Inside the sandbox the single-instance bus name takes
the Flatpak id instead (`io.github.Suzora.Karasu.SingleInstance`), because a
sandboxed app may own names under its own id only.

## What changes under Flatpak, and what to say if asked

- **The updater** is off: the manifest sets `KARASU_NO_SELF_UPDATE` at build
  time, as the F-Droid recipe does, so the app never asks GitHub, not even
  from About's button, never installs, and shows no update settings; About
  says the store delivers the updates. Flathub is the update path.
- **Autostart and portable mode** are hidden in Settings. An autostart entry
  written from inside the sandbox lands in its own config and never runs, and
  portable mode keeps its data beside the binary, which `/app` does not allow.
  The Background portal is the right way to start at login and is not wired.
- **The tray** writes its icon into the app's cache folder, which the tray host
  outside the sandbox can read; the default, `$XDG_RUNTIME_DIR/tray-icon`, is
  private to the sandbox.
- **mpv's socket** defaults to `$XDG_RUNTIME_DIR/app/io.github.Suzora.Karasu/`,
  the one runtime folder both sides of the sandbox see at the same path. That
  folder exists only once Karasu has started in the current login, so a host
  mpv started before it cannot create the socket; the Settings hint says to
  start Karasu first. Playing a library file with mpv is not offered: the
  sandbox cannot start a host program, so the library uses the default opener.
- **The diagnostics report** names the host's distro (`/run/host/os-release`)
  rather than the runtime's, and says it is a Flatpak.
- **The local library**: the folder picker goes through the file-chooser
  portal and hands back a `/run/user/…/doc/` path; `--filesystem=xdg-videos:ro`
  covers the usual folder outright.
- **The summon hotkey** on Wayland goes through the GlobalShortcuts portal,
  which knows a Flatpak by its id without any registration.
- **The OAuth callback** listens on localhost; `--share=network` is what makes
  it reachable from the browser the portal opens.

## Updating a release

Run `flatpak-manifest.ps1 -Tag` for the new tag and open a pull request against
`flathub/io.github.Suzora.Karasu` with the regenerated files; the Flathub
buildbot builds and publishes on merge. `flatpak-external-data-checker` can be
enabled in that repository later so the bot opens the update itself.
