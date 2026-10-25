//! The facts a bug report needs, composed from the commands that already know them; never a token, a URL or a path.

use crate::db::Db;
use tauri::Manager;

/// The Linux-only half; `None` on Windows, so the shape says which platform produced it.
#[derive(Debug, Clone, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LinuxInfo {
    /// `PRETTY_NAME` from `/etc/os-release`.
    pub distro: Option<String>,
    /// `XDG_CURRENT_DESKTOP`; GNOME needs an extension before a tray icon appears at all.
    pub desktop: Option<String>,
    /// `XDG_SESSION_TYPE`; under Wayland one application cannot read another's window titles at all.
    pub session: Option<String>,
}

/// What only the WebView knows, sent with the request; every field is the app's own state, never the user's content.
#[derive(Debug, Clone, Default, PartialEq, serde::Deserialize, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase", default)]
pub struct ClientFacts {
    pub user_agent: String,
    /// The route as the hash router has it; `redact_route` drops a profile's name and every query.
    pub route: String,
    pub viewport: String,
    /// `desktop` or `phone`, the width-keyed shell, which can differ from the platform.
    pub shell: String,
    pub theme: String,
    pub contrast: String,
    pub reduced_motion: bool,
    pub language: String,
    pub online: bool,
}

/// One kind of warning or error and how often it came, so a report shows a pattern rather than a scroll.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct Problem {
    pub level: &'static str,
    pub target: String,
    /// The first line only; a stack, if any, is in the full log of the saved report.
    pub message: String,
    pub extra_lines: usize,
    pub count: u32,
    pub last_ms: i64,
}

/// An AniList request that did not end in an answer.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct FailedRequest {
    pub source: String,
    pub operation: String,
    pub status: Option<u16>,
    pub outcome: String,
    pub ago_secs: u64,
}

/// What detection is doing right now, without the title: a phase, where it came from and whether it matched.
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub struct NowState {
    pub phase: String,
    pub reason: Option<String>,
    pub source: String,
    pub media_type: String,
    pub streaming: bool,
    pub matched: bool,
    pub overridden: bool,
    pub episode_known: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct Diagnostics {
    pub generated_ms: i64,
    /// The four-part `MAJOR.MINOR.PATCH.COMMIT#`; the commit counter is the only precise build identifier.
    pub version: String,
    pub os: String,
    pub arch: String,
    pub app_image: bool,
    /// Inside a Flatpak, which changes the bus name, the tray folder, the mpv socket and what Settings offers.
    pub flatpak: bool,
    /// Built for a store that ships its own updates (F-Droid, the Flatpak), so the updater is compiled out.
    pub store_updates: bool,
    pub portable: bool,
    /// Where the database lives; redacted by `render`, not here, so the viewer can show the owner the real path.
    pub data_dir: String,
    pub uptime_secs: u64,
    pub tray: bool,
    pub close_hides: bool,
    /// The summon hotkey's backend and state; none on Android.
    pub hotkey: Option<String>,
    pub view_transitions: bool,
    /// The environment switches that change how the WebView or GTK draws, as they are set.
    pub env: Vec<(String, String)>,
    pub linux: Option<LinuxInfo>,
    pub run: crate::logging::RunCounts,
    pub problems: Vec<Problem>,
    /// Whether a token exists. Never the token.
    pub signed_in: bool,
    pub profile_mode: String,
    pub schema: u32,
    /// Which manifest the updater polls; the same four-part version can run on either channel.
    pub update_channel: String,
    pub queued: usize,
    pub queued_oldest_secs: Option<i64>,
    pub draining: bool,
    /// Each cached list and how long it is still served without a request.
    pub lists: Vec<(String, u64)>,
    /// The limiter's last measured headroom, `remaining/limit`, or none before the first header.
    pub anilist_budget: Option<(u32, u32)>,
    pub throttled_for_secs: Option<u64>,
    /// AniList requests per source since the app started; the budget is shared, so a report has to say who spent it.
    pub anilist_requests: Vec<(String, u32)>,
    /// HTTP 429 answers since the app started.
    pub anilist_throttled: u32,
    pub in_flight: usize,
    pub recent_requests: usize,
    pub failed_requests: Vec<FailedRequest>,
    pub media_sessions: bool,
    pub jellyfin: bool,
    /// Which Jellyfin address the last successful request went to, `local` or `external`; it names no host.
    pub jellyfin_base: Option<String>,
    /// The mpv IPC pipe; it outranks every other source, so a report has to say whether it was on.
    pub mpv: bool,
    pub scrobble_enabled: bool,
    pub scrobble_confirm: bool,
    pub scrobble_delay_min: u32,
    pub scrobble_gap_auto: bool,
    pub detection_overrides: usize,
    pub now: Option<NowState>,
    pub library_configured: bool,
    pub library_files: usize,
    pub library_matched: usize,
    pub library_unmatched: usize,
    pub library_overrides: usize,
    pub passes: Vec<crate::schedule::ScheduledPass>,
    pub ui_language: String,
    pub title_language: String,
    pub content_filter: String,
    pub blur_adult: bool,
    pub airing_notify: bool,
    pub discord: bool,
    pub backups_enabled: bool,
    pub backups_keep: usize,
    pub log_debug: bool,
    pub db_bytes: Option<u64>,
    pub log_bytes: Option<u64>,
    pub backups_count: usize,
    pub newest_backup_age_secs: Option<u64>,
}

// --- Pure parsing ------------------------------------------------------------

/// `PRETTY_NAME` out of an `/etc/os-release`.
// Outside the `#[cfg]` so it is tested on both platforms, which a Windows release build reads as unused.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn parse_os_release(text: &str) -> Option<String> {
    for line in text.lines() {
        let Some(value) = line.strip_prefix("PRETTY_NAME=") else {
            continue;
        };
        let value = value.trim().trim_matches('"');
        if !value.is_empty() {
            return Some(value.to_string());
        }
    }
    None
}

/// Replaces the user's own name in a path with a placeholder; the rest of the path is the diagnostic part.
pub fn redact_home(path: &str) -> String {
    for marker in ["\\Users\\", "/Users/", "/home/"] {
        let Some(start) = path.find(marker) else {
            continue;
        };
        let after = start + marker.len();
        let sep = if marker.contains('\\') { '\\' } else { '/' };
        let end = path[after..]
            .find(sep)
            .map(|i| after + i)
            .unwrap_or(path.len());
        if end > after {
            return format!("{}<user>{}", &path[..after], &path[end..]);
        }
    }
    path.to_string()
}

/// How many kinds of problem the report lists; the saved report carries the whole log beside it.
const PROBLEM_KINDS: usize = 15;

/// Groups warnings and errors by level, subsystem and first line, newest kind first.
pub fn problems(entries: &[crate::logging::LogEntry]) -> Vec<Problem> {
    let mut out: Vec<Problem> = Vec::new();
    for e in entries.iter().rev() {
        let mut lines = e.message.lines();
        let first = lines.next().unwrap_or("").trim().to_string();
        let extra = lines.count();
        let level = match e.level {
            crate::logging::Level::Error => "error",
            _ => "warn",
        };
        if let Some(p) = out
            .iter_mut()
            .find(|p| p.level == level && p.target == e.target && p.message == first)
        {
            p.count += 1;
        } else {
            out.push(Problem {
                level,
                target: e.target.clone(),
                message: first,
                extra_lines: extra,
                count: 1,
                last_ms: e.ms,
            });
        }
    }
    out.truncate(PROBLEM_KINDS);
    out
}

/// A route without its query and without a profile's name, which is the one segment that names a person.
pub fn redact_route(route: &str) -> String {
    let path = route.split(['?', '#']).next().unwrap_or("");
    let mut parts: Vec<&str> = path.split('/').collect();
    for i in 1..parts.len() {
        if parts[i - 1] == "user" && !parts[i].is_empty() {
            parts[i] = ":name";
        }
    }
    parts.join("/")
}

/// The engine and its version out of a user agent: WebView2 names Edge, Android's names Chrome, WebKitGTK its WebKit.
pub fn webview_from_ua(ua: &str) -> String {
    let token = |key: &str| {
        ua.split_whitespace()
            .find_map(|t| t.strip_prefix(key))
            .map(|v| v.trim_end_matches(';').to_string())
    };
    if let Some(v) = token("Edg/") {
        return format!("WebView2 {v}");
    }
    if ua.contains("Android") {
        if let Some(v) = token("Chrome/") {
            return format!("Android WebView {v}");
        }
    }
    if let Some(v) = token("AppleWebKit/") {
        return format!("WebKit {v}");
    }
    if ua.is_empty() { "unknown".into() } else { "other".into() }
}

/// A span of seconds in the largest two units, as a person reads an age.
pub fn age(secs: u64) -> String {
    let (d, h, m) = (secs / 86_400, secs / 3600 % 24, secs / 60 % 60);
    if d > 0 {
        format!("{d} d {h} h")
    } else if h > 0 {
        format!("{h} h {m} min")
    } else if m > 0 {
        format!("{m} min")
    } else {
        format!("{secs} s")
    }
}

/// A table cell: no pipe may end the cell early and no newline may end the row.
fn cell(s: &str) -> String {
    s.replace('|', "\\|").replace(['\n', '\r'], " ")
}

/// A UTC time to the minute, as a person reads it; the seconds are in the saved log.
fn utc_minute(ms: i64) -> String {
    let full = crate::logging::format_utc(ms);
    format!("{} UTC", full.get(..16).unwrap_or(&full).replace('T', " "))
}

fn bytes(n: u64) -> String {
    if n >= 1 << 20 {
        format!("{:.1} MiB", n as f64 / (1u64 << 20) as f64)
    } else {
        format!("{} KiB", n.div_ceil(1024))
    }
}

// --- Platform probes ---------------------------------------------------------

/// A cfg'd pair rather than a cfg'd statement, which is stripped on Windows and never compiled here.
#[cfg(target_os = "linux")]
fn linux_info() -> Option<LinuxInfo> {
    let env = |key: &str| {
        std::env::var(key)
            .ok()
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty())
    };
    Some(LinuxInfo {
        distro: os_release_paths(crate::portable::flatpak_id().is_some())
            .iter()
            .find_map(|p| std::fs::read_to_string(p).ok())
            .as_deref()
            .and_then(parse_os_release),
        desktop: env("XDG_CURRENT_DESKTOP"),
        session: env("XDG_SESSION_TYPE"),
    })
}

#[cfg(not(target_os = "linux"))]
fn linux_info() -> Option<LinuxInfo> {
    None
}

/// Where the distro is named; a sandbox's own `/etc/os-release` names its runtime, the host's sits under `/run/host`.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
fn os_release_paths(flatpak: bool) -> &'static [&'static str] {
    if flatpak {
        &["/run/host/os-release", "/etc/os-release"]
    } else {
        &["/etc/os-release"]
    }
}

// --- Gathering ---------------------------------------------------------------

/// The switches that change how GTK and the WebView draw; set by a user, a launcher or Karasu itself.
const ENV_SWITCHES: [&str; 6] = [
    "GDK_BACKEND",
    "WEBKIT_DISABLE_DMABUF_RENDERER",
    "WEBKIT_DISABLE_COMPOSITING_MODE",
    "GTK_IM_MODULE",
    "LIBGL_ALWAYS_SOFTWARE",
    "WAYLAND_DISPLAY",
];

fn env_switches() -> Vec<(String, String)> {
    ENV_SWITCHES
        .iter()
        .filter_map(|k| {
            let v = std::env::var(k).ok()?;
            // Whether a Wayland socket exists is the fact; its name is the user's session, not a setting.
            let shown = if *k == "WAYLAND_DISPLAY" { "set".to_string() } else { v };
            Some((k.to_string(), shown))
        })
        .collect()
}

/// Every backup file beside the database and the age of the newest; the backups module names them by date.
fn backup_facts(data_dir: &std::path::Path) -> (usize, Option<u64>) {
    let Ok(read) = std::fs::read_dir(data_dir.join("backups")) else {
        return (0, None);
    };
    let mut count = 0;
    let mut newest: Option<std::time::SystemTime> = None;
    for e in read.flatten() {
        if e.path().extension().is_some_and(|x| x == "db") {
            count += 1;
            if let Ok(m) = e.metadata().and_then(|m| m.modified()) {
                newest = Some(newest.map_or(m, |n| n.max(m)));
            }
        }
    }
    let age = newest.and_then(|t| t.elapsed().ok()).map(|d| d.as_secs());
    (count, age)
}

fn file_bytes(path: std::path::PathBuf) -> Option<u64> {
    std::fs::metadata(path).ok().map(|m| m.len())
}

/// What detection is doing now, read from the same two states the card is drawn from.
fn now_state(app: &tauri::AppHandle) -> Option<NowState> {
    use crate::sync::LockExt;
    let playing = app.state::<crate::playback::scrobbler::PlaybackState>().0.guard().clone()?;
    let (phase, reason) = crate::playback::scrobbler::phase_words(app);
    Some(NowState {
        phase,
        reason,
        source: playing.process.clone(),
        media_type: playing.media_type.clone(),
        streaming: playing.streaming,
        matched: playing.media_id.is_some(),
        overridden: playing.overridden,
        episode_known: playing.episode.is_some(),
    })
}

pub async fn collect(app: &tauri::AppHandle) -> Diagnostics {
    let db = app.state::<Db>();
    let api = app.state::<crate::anilist::client::AniList>();
    // From the command the library screen already uses, rather than reaching into `LibraryIndex` a second way.
    let library = crate::library::get_library_status(
        app.state::<Db>(),
        app.state::<crate::library::LibraryIndex>(),
    );
    let portable = crate::portable::is_portable();
    let traffic = api.traffic_snapshot();
    let rate = api.rate_snapshot().await;
    let log = api.request_log().await;
    let data_path = if portable {
        crate::portable::portable_data_dir()
    } else {
        app.path().app_data_dir().ok()
    };
    let data_dir = data_path
        .as_ref()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let (backups_count, newest_backup_age_secs) =
        data_path.as_deref().map_or((0, None), backup_facts);
    let tray = app.state::<crate::TrayPresent>().0;
    let viewer = crate::commands::viewer_id(&db);
    let now_secs = crate::commands::unix_now();
    let scrobble = crate::commands::read_scrobble_settings(&db);
    let lists = viewer
        .map(|user_id| {
            ["ANIME", "MANGA"]
                .iter()
                .filter_map(|t| {
                    let at = db.cached_list_fetched_at(user_id, t)?;
                    let fresh = (at + crate::commands::LIST_FRESH_SECS - now_secs).max(0) as u64;
                    Some((t.to_string(), fresh))
                })
                .collect()
        })
        .unwrap_or_default();

    Diagnostics {
        generated_ms: crate::commands::now_ms(),
        version: crate::commands::app_version_string(),
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        app_image: crate::portable::running_from_appimage(),
        flatpak: crate::portable::flatpak_id().is_some(),
        store_updates: crate::commands::self_update_disabled(),
        portable,
        data_dir,
        uptime_secs: crate::logging::uptime().as_secs(),
        tray,
        close_hides: crate::commands::close_hides_window(
            db.kv_get(crate::commands::CLOSE_TO_TRAY_KEY).as_deref(),
            tray,
        ),
        hotkey: app.try_state::<crate::hotkey::HotkeyStatusState>().map(|s| {
            use crate::sync::LockExt;
            let st = s.0.guard().clone();
            format!("{:?}, {:?}", st.backend, st.state).to_lowercase()
        }),
        view_transitions: crate::commands::platform_info().view_transitions,
        env: env_switches(),
        linux: linux_info(),
        run: crate::logging::run_counts(),
        problems: problems(&crate::logging::problem_entries()),
        // A boolean. The token itself must never leave the backend.
        signed_in: crate::anilist::auth::load_token().is_some(),
        profile_mode: db.kv_get("profile_mode").unwrap_or_else(|| "none".to_string()),
        schema: db.schema_version(),
        update_channel: crate::commands::stored_channel(&db),
        // This account's, matching the pending badge; another account's rows are neither drained nor counted.
        queued: crate::commands::pending(&db),
        queued_oldest_secs: viewer
            .and_then(|u| db.queue_all(u).into_iter().map(|r| r.created_at).min())
            .map(|at| (now_secs - at).max(0)),
        draining: crate::commands::drain_in_flight(),
        lists,
        anilist_budget: traffic.remaining.zip(traffic.limit),
        throttled_for_secs: rate.throttled_for_ms.map(|ms| ms / 1000),
        anilist_requests: traffic.sources.iter().map(|s| (s.source.clone(), s.total)).collect(),
        anilist_throttled: traffic.throttled,
        in_flight: api.in_flight().len(),
        recent_requests: log.len(),
        failed_requests: log
            .iter()
            .filter(|r| r.outcome != "ok")
            .take(8)
            .map(|r| FailedRequest {
                source: r.source.clone(),
                operation: r.operation.clone(),
                status: r.status,
                outcome: r.outcome.to_string(),
                ago_secs: r.started_ago_ms / 1000,
            })
            .collect(),
        media_sessions: crate::commands::read_media_detection(&db),
        jellyfin: crate::commands::jellyfin_config(&db).is_some(),
        jellyfin_base: crate::commands::jellyfin_config(&db).map(|_| {
            use crate::playback::detection::jellyfin::{active_base, Base};
            match active_base() {
                Base::Local => "local".to_string(),
                Base::External => "external".to_string(),
            }
        }),
        mpv: crate::commands::mpv_ipc_config(&db).is_some(),
        scrobble_enabled: scrobble.enabled,
        scrobble_confirm: scrobble.confirm,
        scrobble_delay_min: scrobble.delay_min,
        scrobble_gap_auto: scrobble.gap_auto,
        detection_overrides: db.detection_overrides().len(),
        now: now_state(app),
        // The path itself names a person and says what they watch; whether one is set and the counts are enough.
        library_configured: library.path.is_some(),
        library_files: library.files_seen,
        library_matched: library.matched,
        library_unmatched: db.library_unmatched().len(),
        library_overrides: db.library_overrides().len(),
        passes: crate::schedule::snapshot(),
        ui_language: db.kv_get(crate::i18n::LANGUAGE_KEY).unwrap_or_else(|| "system".into()),
        title_language: db.kv_get(crate::titles::TITLE_LANGUAGE_KEY).unwrap_or_else(|| "default".into()),
        content_filter: crate::commands::read_content_filter(&db),
        blur_adult: crate::commands::read_blur_adult(&db),
        airing_notify: db.kv_get("airing_notify").as_deref() != Some("0"),
        discord: db.kv_get("discord_enabled").as_deref() == Some("1"),
        backups_enabled: crate::backups::read_enabled(&db),
        backups_keep: crate::backups::read_keep(&db),
        log_debug: crate::logging::debug_enabled(),
        db_bytes: data_path.as_ref().and_then(|p| file_bytes(p.join("karasu.db"))),
        log_bytes: data_path.as_ref().and_then(|p| file_bytes(p.join("karasu.log"))),
        backups_count,
        newest_backup_age_secs,
    }
}

// --- Rendering -----------------------------------------------------------------

/// A collapsed section; GitHub draws the table inside only with a blank line on each side.
fn section(out: &mut String, title: &str, rows: &[(String, String)]) {
    out.push_str(&format!("<details><summary><b>{title}</b></summary>\n\n| | |\n|---|---|\n"));
    for (k, v) in rows {
        out.push_str(&format!("| {} | {} |\n", cell(k), cell(v)));
    }
    out.push_str("\n</details>\n\n");
}

fn yn(b: bool) -> String {
    if b { "yes" } else { "no" }.to_string()
}

fn sources(d: &Diagnostics) -> String {
    let mut s: Vec<&str> = Vec::new();
    // Listed in the order `detect_playback` asks them.
    if d.mpv {
        s.push("mpv IPC");
    }
    if d.os == "windows" {
        s.push("window titles");
    }
    if d.media_sessions && d.os != "android" {
        s.push(if d.os == "linux" { "MPRIS" } else { "media sessions" });
    }
    if d.jellyfin {
        s.push("Jellyfin");
    }
    if s.is_empty() { "none enabled".into() } else { s.join(", ") }
}

fn install(d: &Diagnostics) -> &'static str {
    match d.os.as_str() {
        "android" if d.store_updates => "F-Droid build",
        "android" => "APK",
        _ if d.flatpak => "Flatpak",
        _ if d.app_image => "AppImage",
        "linux" if d.store_updates => "store build",
        "linux" => ".deb, .rpm or source build",
        _ => "installer",
    }
}

fn now_words(n: &Option<NowState>) -> String {
    match n {
        None => "nothing playing".into(),
        Some(n) => {
            let mut s = format!(
                "{}{} via {}, {}",
                n.phase,
                n.reason.as_deref().map(|r| format!(" ({r})")).unwrap_or_default(),
                n.source,
                if n.matched { "matched" } else { "not matched" },
            );
            if n.overridden {
                s.push_str(" by a correction");
            }
            if !n.episode_known {
                s.push_str(", no episode number");
            }
            s
        }
    }
}

/// The block a reporter pastes into an issue: a summary that is always open and the rest folded under it.
pub fn render(d: &Diagnostics, client: Option<&ClientFacts>, redact: bool) -> String {
    let dir = if redact { redact_home(&d.data_dir) } else { d.data_dir.clone() };
    let when = utc_minute(d.generated_ms);
    let mut out = String::from("**Karasu diagnostics**\n\n");
    out.push_str(&format!(
        "`{}` · {} · {} {} · {} · up {} · {}\n\n",
        d.version,
        d.update_channel,
        d.os,
        d.arch,
        install(d),
        age(d.uptime_secs),
        when
    ));

    let r = d.run;
    let failed = d.failed_requests.len();
    let mut glance: Vec<(String, String)> = vec![
        (
            "Problems this run".into(),
            format!(
                "{} errors · {} warnings · {} panics · {} loop restarts",
                r.errors, r.warnings, r.panics, r.restarts
            ),
        ),
        (
            "AniList".into(),
            format!(
                "{} · {} · {} of the last {} requests failed · {} × 429{}",
                if d.signed_in { format!("signed in ({})", d.profile_mode) } else { format!("not signed in ({})", d.profile_mode) },
                d.anilist_budget.map_or("budget not measured yet".into(), |(a, b)| format!("{a}/{b} left")),
                failed,
                d.recent_requests,
                d.anilist_throttled,
                d.throttled_for_secs.map(|s| format!(" · waiting {s} s")).unwrap_or_default(),
            ),
        ),
        (
            "Sync".into(),
            {
                let mut s = format!("{} queued edits", d.queued);
                if let Some(o) = d.queued_oldest_secs {
                    s.push_str(&format!(", oldest {}", age(o as u64)));
                }
                if d.draining {
                    s.push_str(", sending now");
                }
                for (t, fresh) in &d.lists {
                    s.push_str(&format!(
                        " · {} list {}",
                        t.to_lowercase(),
                        if *fresh > 0 { format!("fresh for {}", age(*fresh)) } else { "due for a refresh".into() }
                    ));
                }
                s
            },
        ),
        ("Detection".into(), format!("{} · now {}", sources(d), now_words(&d.now))),
    ];
    if let Some(c) = client {
        glance.push((
            "Screen".into(),
            format!(
                "{} · {} {} · {} theme{}",
                redact_route(&c.route),
                c.shell,
                c.viewport,
                c.theme,
                if c.online { "" } else { " · offline" }
            ),
        ));
    }
    out.push_str("| At a glance | |\n|---|---|\n");
    for (k, v) in &glance {
        out.push_str(&format!("| {} | {} |\n", cell(k), cell(v)));
    }
    out.push('\n');

    if !d.problems.is_empty() {
        out.push_str(&format!(
            "<details><summary><b>Problems this run</b> ({} {})</summary>\n\n| Last | Level | Where | × | Message |\n|---|---|---|---|---|\n",
            d.problems.len(),
            if d.problems.len() == 1 { "kind" } else { "kinds" }
        ));
        for p in &d.problems {
            let msg = if redact { redact_home(&p.message) } else { p.message.clone() };
            let more = if p.extra_lines > 0 { format!(" (+{} lines)", p.extra_lines) } else { String::new() };
            out.push_str(&format!(
                "| {} | {} | {} | {} | {}{} |\n",
                utc_minute(p.last_ms),
                p.level,
                cell(&p.target),
                p.count,
                cell(&msg),
                more
            ));
        }
        out.push_str("\n</details>\n\n");
    }

    let mut system: Vec<(String, String)> = vec![
        ("Version".into(), d.version.clone()),
        ("Update channel".into(), d.update_channel.clone()),
        ("OS".into(), format!("{} {}", d.os, d.arch)),
    ];
    if let Some(linux) = &d.linux {
        system.push(("Distro".into(), linux.distro.clone().unwrap_or_else(|| "?".into())));
        system.push(("Desktop".into(), linux.desktop.clone().unwrap_or_else(|| "?".into())));
        system.push(("Session".into(), linux.session.clone().unwrap_or_else(|| "?".into())));
    }
    system.push(("Install".into(), install(d).into()));
    system.push(("Portable".into(), yn(d.portable)));
    if let Some(c) = client {
        system.push(("WebView".into(), webview_from_ua(&c.user_agent)));
        system.push(("User agent".into(), format!("`{}`", c.user_agent)));
    }
    if d.os == "linux" {
        system.push(("GPU compositing (page transitions)".into(), yn(d.view_transitions)));
    }
    system.push((
        "Environment switches".into(),
        if d.env.is_empty() {
            "none".into()
        } else {
            d.env.iter().map(|(k, v)| format!("`{k}={v}`")).collect::<Vec<_>>().join(", ")
        },
    ));
    system.push(("Tray".into(), yn(d.tray)));
    system.push(("Closing hides to tray".into(), yn(d.close_hides)));
    if let Some(h) = &d.hotkey {
        system.push(("Summon hotkey".into(), h.clone()));
    }
    if let Some(c) = client {
        system.push(("Shell and window".into(), format!("{} {}", c.shell, c.viewport)));
        system.push((
            "Theme".into(),
            format!("{}, contrast {}, reduced motion {}", c.theme, c.contrast, yn(c.reduced_motion)),
        ));
    }
    system.push(("Data folder".into(), format!("`{dir}`")));
    system.push(("Uptime".into(), age(d.uptime_secs)));
    section(&mut out, "System", &system);

    let mut anilist: Vec<(String, String)> = vec![
        ("Signed in".into(), format!("{} ({})", yn(d.signed_in), d.profile_mode)),
        ("Queued edits".into(), d.queued.to_string()),
        ("Oldest queued edit".into(), d.queued_oldest_secs.map_or("—".into(), |s| age(s as u64))),
        ("Sending the queue now".into(), yn(d.draining)),
    ];
    for (t, fresh) in &d.lists {
        anilist.push((
            format!("{} list", t.to_lowercase()),
            if *fresh > 0 { format!("cached, fresh for {}", age(*fresh)) } else { "cached, refreshes on next read".into() },
        ));
    }
    anilist.push((
        "Budget".into(),
        d.anilist_budget.map_or("not measured yet".into(), |(a, b)| format!("{a}/{b} left")),
    ));
    anilist.push(("Rate limited (429)".into(), d.anilist_throttled.to_string()));
    if let Some(s) = d.throttled_for_secs {
        anilist.push(("Waiting out a limit".into(), format!("{s} s")));
    }
    anilist.push(("In flight".into(), d.in_flight.to_string()));
    anilist.push((
        "Requests this run".into(),
        if d.anilist_requests.is_empty() {
            "none".into()
        } else {
            d.anilist_requests.iter().map(|(s, n)| format!("{s} {n}")).collect::<Vec<_>>().join(", ")
        },
    ));
    for f in &d.failed_requests {
        anilist.push((
            format!("Failed {} ago", age(f.ago_secs)),
            format!(
                "{} · {} · {}{}",
                f.source,
                f.operation,
                f.outcome,
                f.status.map(|s| format!(" (HTTP {s})")).unwrap_or_default()
            ),
        ));
    }
    section(&mut out, "AniList and sync", &anilist);

    let mut detection: Vec<(String, String)> = vec![
        ("Sources".into(), sources(d)),
        ("Now".into(), now_words(&d.now)),
        (
            "Updating".into(),
            format!(
                "{}{}, after {}, gap block lifts itself: {}",
                if d.scrobble_enabled { "on" } else { "off" },
                if d.scrobble_confirm { ", asks first" } else { "" },
                if d.scrobble_delay_min == 0 { "2/3 of the episode".to_string() } else { format!("{} min", d.scrobble_delay_min) },
                yn(d.scrobble_gap_auto)
            ),
        ),
        ("Detection corrections".into(), d.detection_overrides.to_string()),
    ];
    if let Some(base) = &d.jellyfin_base {
        detection.push(("Jellyfin address in use".into(), base.clone()));
    }
    detection.push((
        "Library".into(),
        if d.library_configured {
            format!(
                "{} files, {} matched, {} unplaced, {} corrections",
                d.library_files, d.library_matched, d.library_unmatched, d.library_overrides
            )
        } else {
            "not configured".into()
        },
    ));
    section(&mut out, "Detection and library", &detection);

    let passes: Vec<(String, String)> = d
        .passes
        .iter()
        .map(|p| {
            (
                p.pass.clone(),
                if p.off {
                    "off".into()
                } else if p.running {
                    "running now".into()
                } else {
                    p.due_in_ms.map_or("not planned".into(), |ms| format!("next in {}", age(ms / 1000)))
                },
            )
        })
        .collect();
    if !passes.is_empty() {
        section(&mut out, "Background passes", &passes);
    }

    let mut settings: Vec<(String, String)> = vec![
        ("App language".into(), client.map_or(d.ui_language.clone(), |c| format!("{} ({})", d.ui_language, c.language))),
        ("Title language".into(), d.title_language.clone()),
        ("Content filter".into(), format!("{}, blur explicit art: {}", d.content_filter, yn(d.blur_adult))),
        ("New-episode notifications".into(), yn(d.airing_notify)),
        ("Discord presence".into(), yn(d.discord)),
        ("Verbose logging".into(), yn(d.log_debug)),
    ];
    settings.push(("Daily backups".into(), if d.backups_enabled { format!("on, keeping {}", d.backups_keep) } else { "off".into() }));
    section(&mut out, "Settings that change behaviour", &settings);

    let storage: Vec<(String, String)> = vec![
        ("Schema".into(), format!("v{}", d.schema)),
        ("Database".into(), d.db_bytes.map_or("?".into(), bytes)),
        ("Log file".into(), d.log_bytes.map_or("none".into(), bytes)),
        (
            "Backups".into(),
            format!(
                "{}{}",
                d.backups_count,
                d.newest_backup_age_secs.map(|s| format!(", newest {} old", age(s))).unwrap_or_default()
            ),
        ),
    ];
    section(&mut out, "Storage", &storage);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn os_release_yields_the_pretty_name() {
        let sample = "NAME=\"Ubuntu\"\nVERSION_ID=\"22.04\"\nPRETTY_NAME=\"Ubuntu 22.04.4 LTS\"\nID=ubuntu\n";
        assert_eq!(
            parse_os_release(sample).as_deref(),
            Some("Ubuntu 22.04.4 LTS")
        );
        // Arch ships it unquoted.
        assert_eq!(
            parse_os_release("ID=arch\nPRETTY_NAME=Arch Linux\n").as_deref(),
            Some("Arch Linux")
        );
        assert_eq!(parse_os_release("ID=weird\n"), None);
        assert_eq!(parse_os_release("PRETTY_NAME=\"\"\n"), None);
    }

    /// The report is pasted in public, so the one thing in it that names a person has to go.
    #[test]
    fn a_home_directory_loses_the_user_name() {
        assert_eq!(
            redact_home(r"C:\Users\Kyu\AppData\Roaming\dev.kyu.karasu"),
            r"C:\Users\<user>\AppData\Roaming\dev.kyu.karasu"
        );
        assert_eq!(
            redact_home("/home/kyu/.local/share/dev.kyu.karasu"),
            "/home/<user>/.local/share/dev.kyu.karasu"
        );
        // Portable beside an AppImage: no home segment, nothing to redact.
        assert_eq!(redact_home("/opt/karasu/data"), "/opt/karasu/data");
        assert_eq!(redact_home(""), "");
    }

    fn sample() -> Diagnostics {
        Diagnostics {
            generated_ms: 1_786_000_000_000,
            version: "1.67.0.926".into(),
            os: "linux".into(),
            arch: "x86_64".into(),
            app_image: true,
            flatpak: false,
            store_updates: false,
            portable: false,
            data_dir: "/home/kyu/.local/share/dev.kyu.karasu".into(),
            uptime_secs: 2 * 3600 + 14 * 60,
            tray: false,
            close_hides: false,
            hotkey: Some("portal, bound".into()),
            view_transitions: false,
            env: vec![("WEBKIT_DISABLE_DMABUF_RENDERER".into(), "1".into())],
            linux: Some(LinuxInfo {
                distro: Some("Arch Linux".into()),
                desktop: Some("GNOME".into()),
                session: Some("wayland".into()),
            }),
            run: crate::logging::RunCounts { errors: 1, warnings: 3, panics: 0, restarts: 0 },
            problems: vec![Problem {
                level: "error",
                target: "list".into(),
                message: "save failed | HTTP 500 for /home/kyu/x".into(),
                extra_lines: 2,
                count: 3,
                last_ms: 1_786_000_000_000,
            }],
            signed_in: true,
            profile_mode: "anilist".into(),
            schema: 21,
            update_channel: "prerelease".into(),
            queued: 2,
            queued_oldest_secs: Some(3 * 3600),
            draining: false,
            lists: vec![("ANIME".into(), 12 * 60), ("MANGA".into(), 0)],
            anilist_budget: Some((27, 30)),
            throttled_for_secs: None,
            anilist_requests: vec![("list".into(), 2), ("airing".into(), 1)],
            anilist_throttled: 0,
            in_flight: 0,
            recent_requests: 41,
            failed_requests: vec![FailedRequest {
                source: "list".into(),
                operation: "SaveMediaListEntry".into(),
                status: Some(500),
                outcome: "error".into(),
                ago_secs: 90,
            }],
            media_sessions: true,
            jellyfin: false,
            jellyfin_base: None,
            mpv: false,
            scrobble_enabled: true,
            scrobble_confirm: false,
            scrobble_delay_min: 0,
            scrobble_gap_auto: false,
            detection_overrides: 1,
            now: Some(NowState {
                phase: "watching".into(),
                reason: None,
                source: "mpv".into(),
                media_type: "ANIME".into(),
                streaming: false,
                matched: true,
                overridden: false,
                episode_known: true,
            }),
            library_configured: true,
            library_files: 1200,
            library_matched: 980,
            library_unmatched: 4,
            library_overrides: 2,
            passes: vec![crate::schedule::ScheduledPass {
                pass: "airing".into(),
                due_in_ms: Some(40 * 60 * 1000),
                running: false,
                off: false,
            }],
            ui_language: "de".into(),
            title_language: "english".into(),
            content_filter: "moderate".into(),
            blur_adult: true,
            airing_notify: true,
            discord: false,
            backups_enabled: true,
            backups_keep: 7,
            log_debug: false,
            db_bytes: Some(3 * 1024 * 1024),
            log_bytes: Some(200 * 1024),
            backups_count: 7,
            newest_backup_age_secs: Some(5 * 3600),
        }
    }

    fn client() -> ClientFacts {
        ClientFacts {
            user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15".into(),
            route: "/user/Kyusetzu?tab=followers".into(),
            viewport: "1232×800 @2x".into(),
            shell: "desktop".into(),
            theme: "dark".into(),
            contrast: "standard".into(),
            reduced_motion: false,
            language: "de".into(),
            online: true,
        }
    }

    #[test]
    fn the_report_names_the_linux_facts_that_decide_a_bug() {
        let out = render(&sample(), Some(&client()), true);
        assert!(out.contains("Arch Linux"), "{out}");
        assert!(out.contains("wayland"), "{out}");
        assert!(out.contains("GNOME"), "{out}");
        // Wayland plus no tray is the pair that explains most Linux reports.
        assert!(out.contains("| Tray | no |"), "{out}");
        assert!(out.contains("WEBKIT_DISABLE_DMABUF_RENDERER=1"), "{out}");
        // MPRIS, not "window titles" — those are Windows-only.
        assert!(out.contains("MPRIS"), "{out}");
        assert!(!out.contains("window titles"), "{out}");
    }

    #[test]
    fn the_report_redacts_the_home_directory_by_default() {
        let d = sample();
        assert!(render(&d, None, true).contains("/home/<user>/"));
        assert!(!render(&d, None, true).contains("/home/kyu/"));
        // And hands over the real path when explicitly asked.
        assert!(render(&d, None, false).contains("/home/kyu/"));
    }

    /// Whatever else changes, no rendering of this may carry a credential.
    #[test]
    fn the_report_says_whether_signed_in_and_never_more() {
        let out = render(&sample(), Some(&client()), true);
        assert!(out.contains("| Signed in | yes (anilist) |"), "{out}");
        let json = serde_json::to_string(&client()).unwrap();
        assert!(!json.to_lowercase().contains("token"), "{json}");
        // The struct has no field that could hold one in the first place.
        let json = serde_json::to_string(&sample()).unwrap();
        for forbidden in ["token", "password", "secret", "Bearer"] {
            assert!(
                !json.to_lowercase().contains(forbidden),
                "diagnostics gained a {forbidden}-shaped field"
            );
        }
    }

    /// Inside a Flatpak the host's file names the distro, and the sandbox's own is only the fallback.
    #[test]
    fn a_flatpak_reads_the_host_distro_first() {
        assert_eq!(os_release_paths(true), ["/run/host/os-release", "/etc/os-release"]);
        assert_eq!(os_release_paths(false), ["/etc/os-release"]);
    }

    #[test]
    fn a_windows_report_has_no_linux_block() {
        let mut d = sample();
        d.os = "windows".into();
        d.linux = None;
        d.app_image = false;
        let out = render(&d, None, true);
        assert!(!out.contains("Session"), "{out}");
        assert!(out.contains("window titles"), "{out}");
    }

    /// The same warning a hundred times is one row with a count, newest kind first, and only its first line.
    #[test]
    fn problems_group_by_kind_newest_first() {
        use crate::logging::{Level, LogEntry};
        let e = |ms, level, target: &str, message: &str| LogEntry { ms, level, target: target.into(), message: message.into() };
        let out = problems(&[
            e(1, Level::Warn, "airing", "check failed"),
            e(2, Level::Error, "ui", "TypeError: x is undefined\n at a\n at b"),
            e(3, Level::Warn, "airing", "check failed"),
        ]);
        assert_eq!(out.len(), 2);
        assert_eq!((out[0].target.as_str(), out[0].count, out[0].last_ms), ("airing", 2, 3));
        assert_eq!(out[1].message, "TypeError: x is undefined");
        assert_eq!(out[1].extra_lines, 2);
    }

    /// A profile's name is the one route segment that names a person, and a query can carry a search term.
    #[test]
    fn a_route_keeps_its_shape_and_loses_the_person() {
        assert_eq!(redact_route("/user/Kyusetzu?tab=followers"), "/user/:name");
        assert_eq!(redact_route("/media/154587"), "/media/154587");
        assert_eq!(redact_route("/search?q=frieren"), "/search");
        assert_eq!(redact_route(""), "");
    }

    #[test]
    fn the_webview_is_named_from_its_user_agent() {
        assert_eq!(
            webview_from_ua("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.86"),
            "WebView2 131.0.2903.86"
        );
        assert_eq!(
            webview_from_ua("Mozilla/5.0 (Linux; Android 16; NX809J Build/X; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.81 Mobile Safari/537.36"),
            "Android WebView 131.0.6778.81"
        );
        assert_eq!(webview_from_ua(&client().user_agent), "WebKit 605.1.15");
        assert_eq!(webview_from_ua(""), "unknown");
    }

    #[test]
    fn an_age_reads_in_its_two_largest_units() {
        assert_eq!(age(42), "42 s");
        assert_eq!(age(12 * 60 + 5), "12 min");
        assert_eq!(age(2 * 3600 + 14 * 60), "2 h 14 min");
        assert_eq!(age(3 * 86_400 + 5 * 3600), "3 d 5 h");
    }

    /// A message with a pipe or a path must not break the table or name the user.
    #[test]
    fn a_problem_row_stays_one_cell_and_redacted() {
        let out = render(&sample(), None, true);
        assert!(out.contains("save failed \\| HTTP 500 for /home/<user>/x (+2 lines)"), "{out}");
        assert!(out.contains("| error | list | 3 |"), "{out}");
    }

    /// The summary is what a reader sees first, so each of its rows must say what went wrong at a glance.
    #[test]
    fn the_summary_names_problems_budget_sync_detection_and_screen() {
        let out = render(&sample(), Some(&client()), true);
        assert!(out.contains("| Problems this run | 1 errors · 3 warnings · 0 panics · 0 loop restarts |"), "{out}");
        assert!(out.contains("27/30 left · 1 of the last 41 requests failed"), "{out}");
        assert!(out.contains("2 queued edits, oldest 3 h 0 min · anime list fresh for 12 min · manga list due for a refresh"), "{out}");
        assert!(out.contains("now watching via mpv, matched"), "{out}");
        assert!(out.contains("| Screen | /user/:name · desktop"), "{out}");
        assert!(!out.contains("Kyusetzu"), "{out}");
    }

    /// Every section folds, so a paste stays short in the issue and opens where the reader wants it.
    #[test]
    fn the_sections_fold_with_a_blank_line_around_each_table() {
        let out = render(&sample(), Some(&client()), true);
        for title in ["Problems this run", "System", "AniList and sync", "Detection and library", "Background passes", "Settings that change behaviour", "Storage"] {
            assert!(out.contains(&format!("<summary><b>{title}</b>")), "{title} missing:\n{out}");
        }
        assert_eq!(out.matches("<details>").count(), out.matches("</details>").count());
        assert!(!out.contains("</summary>\n|"), "a table must not touch its summary:\n{out}");
    }

    /// The whole table, pinned: a moved row or a renamed label shows up as a diff in review instead of a feeling.
    #[test]
    fn the_report_reads_as_it_did() {
        insta::assert_snapshot!("report_redacted", render(&sample(), Some(&client()), true));
        insta::assert_snapshot!("report_unredacted", render(&sample(), Some(&client()), false));
    }
}
