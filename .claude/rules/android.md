---
paths:
  - "src-tauri/gen/android/**"
  - "src-tauri/src/apk_update.rs"
  - "src-tauri/src/background.rs"
  - "src-tauri/src/keystore.rs"
  - "src-tauri/src/widgets.rs"
  - "src-tauri/capabilities/**"
  - "scripts/android-check.ps1"
  - "scripts/phone-measure.ps1"
  - "fastlane/**"
---

# Android: the build, the updater, the tracking service and the device measurements

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## Notes that have cost real time

- **Android gets two plugins of its own, and the battery plugin was
  rejected.** `attach_mobile` in `lib.rs` (a cfg pair on `target_os =
  "android"`, with the crates in the Android dependency table so no desktop
  build compiles them) registers `tauri-plugin-haptics` and
  `tauri-plugin-sharekit`, and `capabilities/mobile.json` - `platforms:
  ["android"]`, because a desktop build refuses a capability naming a
  permission it cannot resolve - grants exactly `haptics:allow-selection-
  feedback` and `sharekit:allow-share-text`. `lib/haptics.ts` `tick()` is the
  one vibration, fired when the long-press sheet opens and when a pull arms,
  and a no-op off Android. The `share` action (`lib/actions`, group `link`,
  `ActionContext.share`) hands `lib/anilistUrl`'s `mediaUrl` to the system
  share sheet from the context menu, the sheet and a button on the detail
  page; sharekit was chosen over `tauri-plugin-sharesheet` because the latter
  had not moved since August 2024. `tauri-plugin-android-battery-optimization`
  (0.1.4, two stars, JS-only API) was looked at on 2026-09-20 and not taken:
  `get_jellyfin_background` reads the exemption in Rust for its
  `battery_exempt` field, which a JS-only plugin cannot serve, and the JNI
  pair in `TrackingService.kt` was measured on the phone; do not re-propose
  it. Both plugins compiled into a debug APK on 2026-09-20 (`tauri.settings.
  gradle` lists both projects), and on 2026-10-31 the release APK 1.68.2.928
  on the maintainer's NX809J opened the system share sheet with the AniList
  link from the action sheet and the detail page, and ticked on the long
  press and the armed pull. The tick follows the system's touch-feedback
  switch, which was off on that phone, so "no vibration" is first a question
  about that switch (`settings get system haptic_feedback_enabled`).
- **Android-only code compiles nowhere on this machine except through
  `scripts/android-check.ps1`** (a cargo check for aarch64-linux-android with
  the NDK toolchain exported) and the real `tauri android build`. Treat it
  exactly like the Linux rule below: `npm run verify` proves nothing about it.
- **The Gradle daemon caches SDK-package resolution.** Installing an SDK
  package after a failed build does nothing until `gradlew --stop` - the
  daemon keeps answering "not installed" from memory. Four rebuilds were lost
  to a licence error that was already fixed.
- **`sdkmanager.bat --licenses` accepts only via cmd file redirection**
  (`< yes.txt`); both pipe forms feed it EOF and it exits silently having
  accepted nothing. Never run an installer with its output discarded.
- **`tauri android build` rewrites `app/build.gradle.kts` on every run**, so a
  hand edit there - an `applicationIdSuffix` for a side-by-side debug install,
  say - is gone before the APK exists. Put such a local-only change in
  `~/.gradle/init.d/*.gradle` instead (an init script sees the `android`
  block of every project it builds); a debug APK under `dev.kyu.karasu.debug`
  installs beside the release app, keeps its own data, and is what the
  device test of 2026-09-19 ran on. Its WebView is debuggable - `adb forward
  tcp:9223 localabstract:webview_devtools_remote_<pid>` plus Playwright's
  `connectOverCDP` reads the DOM, and `adb shell run-as dev.kyu.karasu.debug`
  reads its `karasu.log`. Neither works on the release package.
- **Debug-signed and release-signed APKs do not install over each other.**
  Android refuses the signature change; the other one must be uninstalled
  first, which wipes app-local data. This is why CI publishes only
  release-signed APKs (and only when the four `ANDROID_*` secrets exist), why
  the debug APK stays a workflow artifact, and why the phone should only ever
  see release builds once one is installed. A nightly builds the arm64 APK
  alone; the universal one (four cargo targets plus R8 over all of them, nine
  minutes measured on 2026-09-14) is a tag build's, since the 32-bit phones and
  emulators it serves can wait for a release.
- **The Android updater is `apk_update.rs`, not the Tauri plugin.**
  `updater_available()` stays false on mobile: that is the desktop plugin,
  which cannot install an APK. Android's own path, built deliberately on
  2026-09-14: `latest.json` carries `platforms.android-arm64` and
  `android-universal` (`url`, `sha256`, `size` and an empty `signature` - the
  desktop plugin parses every platform entry as `{url, signature}` and
  rejects the whole manifest when the key is missing, which is what the
  `the_desktop_updater_still_reads_a_manifest_with_android_legs` test
  pins; written by
  `generate-update-manifest.ps1` from the same artifacts the checksum step
  hashes); `check_for_updates` keeps the leg for `Build.SUPPORTED_ABIS[0]`
  in kv `apk_pending`; `apk_download` streams it into
  `<cacheDir>/updates/<version>.apk.part` (Range-resumed, sha256 over the
  whole file, then `UpdateInstaller.inspect` must answer the installed
  app's signing certificates and a higher `versionCode`) and renames it
  into place; `apk_install` opens the system installer through the
  FileProvider Tauri already ships (`cache-path "."`). It runs only in a
  release build (`cfg!(debug_assertions)` - a debug build is signed
  differently and the install would fail after the download), only while the
  activity is in front, only on an unmetered network unless kv
  `apk_download_metered` says otherwise (a nightly is 23 MB, several a
  day), and only with room for two copies. `sweep` at start deletes every
  file under `updates/` except the pending upgrade. The consent the app
  cannot give itself is the per-app "install unknown apps" switch;
  `apk_open_install_permission` leads to it, About explains it. The start
  prompt (`apk_prompt_if_ready`) opens the installer once per version, kv
  `apk_prompted_version`, so a cancel holds. Verification is two nightlies:
  install the first by hand, watch it fetch and install the second. Done on
  2026-10-31 on the NX809J: 1.68.2.928 offered, fetched and installed
  1.68.9.935 through the system installer.
- **Android keeps `usesCleartextTraffic` in release** deliberately - a LAN
  Jellyfin over plain HTTP is a supported setup, and (see `net.rs`) on Android
  a *self-signed* Jellyfin needs plain HTTP anyway.
- **Jellyfin sessions need a heartbeat, and the Android tracking service
  was measured, not assumed.** `GET /Sessions` does not refresh a session's
  `LastActivityDate`; an empty `POST /Sessions/Capabilities` does, on
  Jellyfin 10.11.11 (2026-09-11: the rig's own row read `activeAgoSec: 0`
  on every look while it tracked a playback, and the phone's read 6 s from
  the desktop). That row is how two Karasus on one account see each other
  (`jellyfin::yield_to`), so a "the phone never yields" report starts with
  Test connection: is the desktop's row there, and how old is it. On the
  maintainer's NX809J (nubia, REDMAGIC OS 11, Android 16) with the release
  APK, 2026-09-12: **the service record is not the process.** `dumpsys
  activity services` kept showing `TrackingService … isForeground=true
  types=0x40000000` (that is `specialUse`) while `dumpsys activity
  processes` said `isFrozen=true` and the events log had `am_freeze` 37 s
  after the screen lock - with the process at `prcp F/A/FGS`, adj 200,
  far under AOSP's `freezer_cutoff_adj=900`, so it is the ROM
  (`OomAdjusterZteHook`), not Android. The phone's own log showed the
  five-minute poll line simply missing until the unlock, and the Jellyfin
  row aged past `FRESH`. The battery-optimisation exemption (bucket 5,
  Doze whitelist) did **not** prevent it; the ROM's per-app rule did:
  system app settings → "Läuft im Hintergrund" → "Zugelassen" (and
  "Auto-Start" → "Zugelassen" for the notification job). With that set, a
  45-minute locked run logged `20 polls in the last 5 min` on every line
  (the 15 s hidden cadence), no `am_freeze`, the desktop wrote at its due
  point and the phone logged `due, yielding to Karasu on KYU-PC for
  180 s` ten seconds later. It wrote once the grace was spent - and that
  was right, not a duplicate: the maintainer had reset the entry to 2 by
  hand in between, the live check in `perform_update` read that 2, and a
  due episode 3 against a list at 2 is a scrobble. Read the live-check
  line before calling a second write a bug. So a "the phone stops
  tracking" report is answered by `scripts/phone-measure.ps1`'s frozen
  line and freeze events first, and by the vendor rule second; the
  notification job being absent from `dumpsys jobscheduler` while the
  interval setting is 0 is not a failure. And
  Windows sends a limited broadcast from a wildcard UDP socket out of one
  interface of its own choosing - with a Hyper-V switch present, that one -
  which is why `discovery::broadcast` also binds to the default route's
  address (measured on the maintainer's PC: the wildcard socket heard
  nothing, the Ethernet-bound one heard the server twice).
- **`am force-stop` cancels the package's JobScheduler jobs**, so a "force-stop,
  then `cmd jobscheduler run`" procedure answers "Could not find job 46231"
  whatever the code did. The dead-app state is Home, then `am kill` (leaves
  `stopped=false`). The job's registration itself was refused for the whole
  life of the feature until 0.193.9: a job with a connectivity constraint
  needs `ACCESS_NETWORK_STATE` in the manifest, or `schedule()` throws a
  `SecurityException` that the old code caught and logged to logcat only.
  The job's Rust log lines never reach `karasu.log` (no `logging::init` in
  that process); logcat tag `KarasuNotifJob` is the only channel. A forced run
  posts nothing unless the interval is on, the last check is older than it,
  and a seen-id baseline already exists - the first run only arms.
- **The Android sign-in is slow at the network, not at the Keystore.**
  Measured on the phone on 2026-09-05 with verbose logging:
  `connect timings: viewer 5237ms, kv 6ms, token save 27ms` - and the
  viewer figure included AniList answering the first fetch with HTTP 502
  and `connect_with_token`'s one bounded retry (1.5 s sleep) covering it.
  The hardware-key generation everyone suspected costs 27 ms. Do not move
  `save_token` off the sign-in path on the strength of the old guess.
