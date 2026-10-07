#!/usr/bin/env node
/**
 * Captures what a Firefox-family browser tells the desktop while it plays, for the browser-detection measurements.
 *
 *   node scripts/browser-measure.mjs                     one snapshot: media sessions, browser windows, linked tabs
 *   node scripts/browser-measure.mjs --redact <brand>    also replace a site's name with <SITE> (repeatable)
 *   node scripts/browser-measure.mjs --match "<words>"   also show tabs and windows whose title holds these words
 *   node scripts/browser-measure.mjs --title "<text>"    link tabs against this title as if a session had reported it
 *   node scripts/browser-measure.mjs --watch 5           re-read every 5 s and print whatever changed, with the time
 *   node scripts/browser-measure.mjs --json              the snapshot as JSON, redacted the same way
 *   node scripts/browser-measure.mjs --root <dir>        also search this folder for a profiles.ini
 *   node scripts/browser-measure.mjs --keep-hosts        leave URL hosts as they are (they read <host> by default)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { mozLz4, norm, profilesOf, redactText, relation, tabsOf, unvariant } from "./browser-measure-core.mjs";

const WINDOWS = process.platform === "win32";
const FAMILY = ["firefox", "waterfox", "zen", "librewolf", "floorp"];
const PREFS = ["privacy.exposeContentTitleInWindow", "taskbar.grouping.useprofile", "media.hardwaremediakeys.enabled"];

const opts = { redact: [], match: [], titles: [], roots: [], watch: 0, json: false, keepHosts: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const next = () => {
    if (i + 1 >= argv.length) throw new Error(`${argv[i]} needs a value`);
    return argv[++i];
  };
  switch (argv[i]) {
    case "--redact": opts.redact.push(next()); break;
    case "--match": opts.match.push(next()); break;
    case "--title": opts.titles.push(next()); break;
    case "--root": opts.roots.push(next()); break;
    case "--watch": opts.watch = Math.max(1, Number(next()) || 5); break;
    case "--json": opts.json = true; break;
    case "--keep-hosts": opts.keepHosts = true; break;
    default: throw new Error(`unknown argument ${argv[i]}`);
  }
}

const redact = (s) => redactText(s, { brands: opts.redact, keepHosts: opts.keepHosts, home: homedir() });

/** Applies `redact` to every string of a JSON value. */
function redactDeep(v) {
  if (typeof v === "string") return redact(v);
  if (Array.isArray(v)) return v.map(redactDeep);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redactDeep(x)]));
  return v;
}

const matches = (title) => opts.match.some((m) => norm(title).includes(norm(m)));

// --- Media sessions ----------------------------------------------------------------

const SMTC = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' } | Select-Object -First 1
function Await($op, [Type]$t) { $k = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $k.Wait(-1) | Out-Null; $k.Result }
$M = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$P = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$mgr = Await ($M::RequestAsync()) $M
$out = @(foreach ($s in $mgr.GetSessions()) {
  $p = Await ($s.TryGetMediaPropertiesAsync()) $P
  $t = $s.GetTimelineProperties()
  [ordered]@{ app = $s.SourceAppUserModelId; title = $p.Title; artist = $p.Artist; album = $p.AlbumTitle;
    type = "$($p.PlaybackType)"; status = "$($s.GetPlaybackInfo().PlaybackStatus)";
    position = $t.Position.TotalSeconds; end = $t.EndTime.TotalSeconds; updated = $t.LastUpdatedTime.ToUnixTimeMilliseconds() }
})
ConvertTo-Json -InputObject $out -Compress -Depth 3
`;

const WINDOW_LIST = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type -TypeDefinition @"
using System; using System.Text; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class KarasuWindows {
  public delegate bool Proc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(Proc p, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  public static List<string> All() {
    var r = new List<string>();
    EnumWindows((h, l) => {
      var t = new StringBuilder(2048); var c = new StringBuilder(256); uint pid;
      GetWindowText(h, t, 2048); GetClassName(h, c, 256); GetWindowThreadProcessId(h, out pid);
      if (t.Length > 0) r.Add(pid + "\\u001f" + IsWindowVisible(h) + "\\u001f" + c + "\\u001f" + t);
      return true;
    }, IntPtr.Zero);
    return r;
  }
}
"@
$names = @{}
Get-Process -Name ${FAMILY.join(",")} -ErrorAction SilentlyContinue | ForEach-Object { $names[[uint32]$_.Id] = $_.ProcessName }
$out = @([KarasuWindows]::All() | ForEach-Object {
  $p = $_.Split([char]0x1f, 4)
  if ($names.ContainsKey([uint32]$p[0])) { [ordered]@{ process = $names[[uint32]$p[0]]; visible = $p[1] -eq 'True'; class = $p[2]; title = $p[3] } }
})
ConvertTo-Json -InputObject $out -Compress -Depth 3
`;

/** Runs a script in Windows PowerShell 5.1, the one with WinRT; pwsh 7 cannot load the media-session types. */
function powershell(script) {
  const encoded = Buffer.from(script, "utf16le").toString("base64");
  const out = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(out.trim() || "[]");
  return Array.isArray(parsed) ? parsed : [parsed];
}

function busctl(...args) {
  return execFileSync("busctl", ["--user", ...args], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}

/** The properties of one MPRIS interface, or an empty object when the player does not answer for it. */
function mprisProps(name, iface) {
  try {
    const reply = unvariant(JSON.parse(busctl("--json=short", "call", name, "/org/mpris/MediaPlayer2", "org.freedesktop.DBus.Properties", "GetAll", "s", iface)));
    return reply[0] ?? {};
  } catch {
    return {};
  }
}

function mprisSessions() {
  const lines = busctl("list", "--no-legend", "--no-pager").split("\n");
  const sessions = [];
  for (const line of lines) {
    const [name, pid, process] = line.trim().split(/\s+/);
    if (!name?.startsWith("org.mpris.MediaPlayer2.") || pid === "-") continue;
    const player = mprisProps(name, "org.mpris.MediaPlayer2.Player");
    const root = mprisProps(name, "org.mpris.MediaPlayer2");
    const meta = player.Metadata ?? {};
    const artist = meta["xesam:artist"];
    sessions.push({
      app: name,
      process,
      identity: root.Identity ?? "",
      desktopEntry: root.DesktopEntry ?? "",
      title: meta["xesam:title"] ?? "",
      artist: Array.isArray(artist) ? artist.join(", ") : (artist ?? ""),
      album: meta["xesam:album"] ?? "",
      url: meta["xesam:url"] ?? "",
      status: String(player.PlaybackStatus ?? ""),
      position: typeof player.Position === "number" ? player.Position / 1e6 : null,
      end: typeof meta["mpris:length"] === "number" ? meta["mpris:length"] / 1e6 : null,
      updated: Date.now(),
    });
  }
  return sessions;
}

/** The first line the failing tool wrote to stderr, which says more than Node's "Command failed". */
const reason = (e) => String(e.stderr || e.message || e).trim().split("\n")[0];

function mediaSessions() {
  try {
    return { list: WINDOWS ? powershell(SMTC) : mprisSessions() };
  } catch (e) {
    return { list: [], error: reason(e) };
  }
}

function browserWindows() {
  if (!WINDOWS) return { list: [], note: "no window titles on Linux" };
  try {
    return { list: powershell(WINDOW_LIST) };
  } catch (e) {
    return { list: [], error: reason(e) };
  }
}

// --- Profiles --------------------------------------------------------------------

function candidateRoots() {
  const home = homedir();
  const appdata = process.env.APPDATA ?? join(home, "AppData", "Roaming");
  const roots = WINDOWS
    ? [
        ["firefox", join(appdata, "Mozilla", "Firefox")],
        ["waterfox", join(appdata, "Waterfox")],
        ["waterfox", join(appdata, "Waterfox", "Waterfox")],
        ["zen", join(appdata, "zen")],
        ["librewolf", join(appdata, "librewolf")],
        ["floorp", join(appdata, "Floorp")],
      ]
    : [
        ["firefox", join(home, ".mozilla", "firefox")],
        ["firefox", join(home, ".config", "mozilla", "firefox")],
        ["firefox", join(home, "snap", "firefox", "common", ".mozilla", "firefox")],
        ["firefox", join(home, ".var", "app", "org.mozilla.firefox", ".mozilla", "firefox")],
        ["waterfox", join(home, ".waterfox")],
        ["waterfox", join(home, ".config", "waterfox")],
        ["waterfox", join(home, ".var", "app", "net.waterfox.waterfox", ".waterfox")],
        ["zen", join(home, ".zen")],
        ["zen", join(home, ".config", "zen")],
        ["zen", join(home, ".var", "app", "app.zen_browser.zen", ".zen")],
        ["zen", join(home, ".var", "app", "app.zen_browser.zen", "config", "zen")],
        ["librewolf", join(home, ".librewolf")],
        ["librewolf", join(home, ".config", "librewolf")],
        ["librewolf", join(home, ".var", "app", "io.gitlab.librewolf-community", ".librewolf")],
        ["floorp", join(home, ".floorp")],
        ["floorp", join(home, ".var", "app", "one.ablaze.floorp", ".floorp")],
      ];
  return [...roots, ...opts.roots.map((r) => ["custom", r])].filter(([, dir]) => existsSync(join(dir, "profiles.ini")));
}

function prefsOf(dir) {
  const out = {};
  let text = "";
  try {
    text = readFileSync(join(dir, "prefs.js"), "utf8");
  } catch {
    return { "prefs.js": "missing" };
  }
  for (const pref of PREFS) {
    const m = text.match(new RegExp(`user_pref\\("${pref.replace(/\./g, "\\.")}",\\s*([^)]*)\\);`));
    out[pref] = m ? m[1].trim() : "(default)";
  }
  return out;
}

function fileInfo(path) {
  try {
    const st = statSync(path);
    return { exists: true, modified: st.mtimeMs, bytes: st.size };
  } catch {
    return { exists: false };
  }
}

// --- Snapshot ---------------------------------------------------------------------

const PLAYING = new Set(["playing", "Playing"]);

function snapshot() {
  const sessions = mediaSessions();
  const titles = [
    ...sessions.list
      .map((s, i) => ({ id: `#${i + 1}`, title: s.title, url: s.url ?? "", playing: PLAYING.has(String(s.status)) }))
      .filter((t) => t.playing),
    ...opts.titles.map((t, i) => ({ id: `--title ${i + 1}`, title: t, url: "" })),
  ];
  const linkOf = (title, url) => {
    for (const t of titles) {
      if (url && t.url && url === t.url) return `url=${t.id}`;
      const rel = relation(title, t.title);
      if (rel) return `${rel}-title=${t.id}`;
    }
    return null;
  };

  const windows = browserWindows();
  const shownWindows = windows.list
    .map((w) => ({ ...w, link: linkOf(w.title, ""), match: matches(w.title) }))
    .filter((w) => w.link || w.match);

  const installHashes = new Map();
  const profiles = [];
  for (const [browser, root] of candidateRoots()) {
    let list = [];
    try {
      list = profilesOf(root, readFileSync(join(root, "profiles.ini"), "utf8"));
    } catch (e) {
      profiles.push({ browser, root, error: String(e.message ?? e) });
      continue;
    }
    for (const p of list) {
      for (const hash of p.installs) installHashes.set(hash.toUpperCase(), browser);
      const recoveryPath = join(p.dir, "sessionstore-backups", "recovery.jsonlz4");
      const recovery = fileInfo(recoveryPath);
      const entry = {
        browser,
        root,
        name: p.name,
        dir: p.dir,
        default: p.installs.length > 0 || p.legacyDefault,
        recovery,
        cleanShutdownFile: fileInfo(join(p.dir, "sessionstore.jsonlz4")),
        zenSessions: fileInfo(join(p.dir, "zen-sessions.jsonlz4")),
        prefs: prefsOf(p.dir),
      };
      if (recovery.exists) {
        try {
          const started = performance.now();
          const tabs = tabsOf(JSON.parse(new TextDecoder().decode(mozLz4(readFileSync(recoveryPath)))));
          entry.decodeMs = Math.round(performance.now() - started);
          entry.windows = new Set(tabs.map((t) => t.window)).size;
          entry.tabs = tabs.length;
          entry.shown = tabs
            .map((t) => ({ ...t, link: linkOf(t.title, t.url), match: matches(t.title) }))
            .filter((t) => t.link || t.match);
        } catch (e) {
          entry.decodeError = String(e.message ?? e);
        }
      }
      profiles.push(entry);
    }
  }

  for (const s of sessions.list) {
    const hash = String(s.app ?? "").toUpperCase();
    if (installHashes.has(hash)) s.installOf = installHashes.get(hash);
  }
  return { at: Date.now(), platform: process.platform, sessions, windows: { ...windows, total: windows.list.length, list: shownWindows }, profiles };
}

// --- Output ------------------------------------------------------------------------

const clock = (ms) => new Date(ms).toTimeString().slice(0, 8);
const q = (s) => JSON.stringify(redact(String(s ?? "")));

function render(snap, { volatile }) {
  const out = [];
  const playing = snap.sessions.list.filter((s) => PLAYING.has(String(s.status))).length;
  out.push(`media sessions: ${snap.sessions.list.length} (${playing} playing)${snap.sessions.error ? `, unavailable: ${snap.sessions.error}` : ""}`);
  snap.sessions.list.forEach((s, i) => {
    const pos = s.position != null && s.end ? `  position ${Math.round(s.position)}/${Math.round(s.end)} s` : "";
    const who = s.installOf ? ` (the install hash of a ${s.installOf} profile)` : "";
    const ident = s.identity ? `  identity ${q(s.identity)} desktop ${q(s.desktopEntry)} process ${q(s.process)}` : "";
    out.push(`  #${i + 1} ${s.status}  type=${s.type ?? "-"}  app=${redact(s.app)}${who}${volatile ? pos : ""}${ident}`);
    out.push(`     title ${q(s.title)}  artist ${q(s.artist)}  album ${q(s.album)}`);
    if (s.url) out.push(`     url   ${q(s.url)}`);
  });
  if (snap.windows.error || snap.windows.note) out.push(`browser windows: ${snap.windows.error ?? snap.windows.note}`);
  else {
    out.push(`browser windows: ${snap.windows.total} (${snap.windows.list.length} shown: linked or --match)`);
    for (const w of snap.windows.list) {
      out.push(`  ${w.process} ${w.visible ? "visible" : "hidden"} class=${w.class} ${w.link ?? ""}${w.match ? " match" : ""}`);
      out.push(`     ${q(w.title)}`);
    }
  }
  out.push(`browser profiles with a session file: ${snap.profiles.length}`);
  for (const p of snap.profiles) {
    if (p.error) {
      out.push(`  ${p.browser} ${redact(p.root)}: ${p.error}`);
      continue;
    }
    out.push(`  ${p.browser} ${q(p.name)}${p.default ? " [default]" : ""}  ${redact(p.dir)}`);
    const r = p.recovery;
    if (!r.exists) out.push("     recovery.jsonlz4 missing");
    else if (p.decodeError) out.push(`     recovery.jsonlz4 written ${clock(r.modified)}, unreadable: ${p.decodeError}`);
    else {
      const timing = volatile ? `, decoded in ${p.decodeMs} ms` : "";
      out.push(`     recovery.jsonlz4 written ${clock(r.modified)}: ${p.windows} windows, ${p.tabs} tabs${timing}`);
      for (const t of p.shown) {
        const flags = [t.selected ? "selected" : "", t.hidden ? "hidden" : "", t.link ?? "", t.match ? "match" : ""].filter(Boolean).join(" ");
        const seen = t.lastAccessed ? ` last accessed ${clock(t.lastAccessed)}` : "";
        out.push(`     window ${t.window} tab ${t.tab} ${flags}${seen}`);
        out.push(`        title ${q(t.title)}`);
        out.push(`        url   ${q(t.url)}`);
      }
    }
    const extra = [
      p.cleanShutdownFile.exists ? `sessionstore.jsonlz4 written ${clock(p.cleanShutdownFile.modified)}` : "",
      p.zenSessions.exists ? `zen-sessions.jsonlz4 written ${clock(p.zenSessions.modified)}` : "",
    ].filter(Boolean);
    if (extra.length) out.push(`     ${extra.join(", ")}`);
    out.push(`     prefs: ${Object.entries(p.prefs).map(([k, v]) => `${k}=${v}`).join("  ")}`);
  }
  return out.join("\n");
}

if (opts.json) {
  console.log(JSON.stringify(redactDeep(snapshot()), null, 2));
} else if (!opts.watch) {
  const hosts = opts.keepHosts ? "hosts kept" : "hosts read <host>";
  console.log(`browser-measure ${new Date().toISOString()} on ${process.platform}; ${hosts}, only linked or --match tabs listed\n`);
  console.log(render(snapshot(), { volatile: true }));
} else {
  let last = "";
  for (;;) {
    const text = render(snapshot(), { volatile: false });
    if (text !== last) {
      console.log(`\n=== ${clock(Date.now())}\n${text}`);
      last = text;
    }
    await new Promise((r) => setTimeout(r, opts.watch * 1000));
  }
}
