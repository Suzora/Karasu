//! Discord Rich Presence: the playing title once detection fires, and the viewed page while idle unless switched off.

use crate::db::Db;
use crate::sync::LockExt;
use crate::playback::scrobbler::{NowPlaying, PlaybackState, ScrobbleSession};
use discord_rich_presence::{
    activity::{Activity, ActivityType, Assets, Button, StatusDisplayType, Timestamps},
    DiscordIpc, DiscordIpcClient,
};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Built-in Discord application ID (public, not a secret); empty would make the feature require a custom ID.
pub const BUILTIN_DISCORD_APP_ID: &str = "1527934275356332133";

const REPO_URL: &str = "https://github.com/Suzora/Karasu";

/// The kv switch that leaves Discord empty while nothing plays; off by default.
pub const WATCHING_ONLY_KEY: &str = "discord_watching_only";

pub struct Discord(pub Mutex<Option<DiscordIpcClient>>);

/// What the presence last sent: identical payloads are skipped, then re-sent so a dead pipe is still noticed.
pub struct Shown {
    fingerprint: String,
    at: std::time::Instant,
    /// The timer's start second under the key of the playback it was computed for.
    anchor: Option<(String, i64)>,
}

pub struct LastPresence(pub Mutex<Shown>);

/// How long an identical presence may coast before it is re-sent anyway.
const RESEND_SECS: u64 = 60;

/// How far a position-derived start may wander before the timer is moved; a poll's own jitter stays under it.
const DRIFT_SECS: i64 = 3;

impl Default for LastPresence {
    fn default() -> Self {
        LastPresence(Mutex::new(Shown {
            fingerprint: String::new(),
            at: std::time::Instant::now(),
            anchor: None,
        }))
    }
}

/// The page the user is currently looking at, shown as the idle presence.
pub struct UiPage(pub Mutex<String>);

impl Default for UiPage {
    fn default() -> Self {
        UiPage(Mutex::new("Overview".to_string()))
    }
}

/// Effective app ID: user override from the settings or the built-in one.
pub fn effective_app_id(custom: &str) -> String {
    let custom = custom.trim();
    if custom.is_empty() {
        BUILTIN_DISCORD_APP_ID.to_string()
    } else {
        custom.to_string()
    }
}

fn disconnect(app: &AppHandle, guard: &mut Option<DiscordIpcClient>) {
    if let Some(mut client) = guard.take() {
        let _ = client.clear_activity();
        let _ = client.close();
    }
    // Whatever was showing is gone with the connection.
    let state = app.state::<LastPresence>();
    let mut shown = state.0.guard();
    shown.fingerprint.clear();
    shown.anchor = None;
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Start of the running session in epoch seconds if it matches the playback, else now so the timer starts fresh.
fn session_start(app: &AppHandle, np: &NowPlaying) -> i64 {
    let state = app.state::<ScrobbleSession>();
    let guard = state.0.guard();
    match guard.as_ref() {
        Some(s) if Some(s.media_id) == np.media_id => s.started_ms / 1000,
        _ => now_secs(),
    }
}

/// The presence's timer: running from a start second, or stopped where playback stands.
#[derive(Debug, PartialEq, Eq)]
enum Clock {
    Running { start: i64, end: Option<i64> },
    Paused { at_sec: Option<u32> },
}

/// A reported position puts the timer where playback stands; without one the session's start stays the anchor.
fn clock(
    now: i64,
    session_start: i64,
    position_sec: Option<u32>,
    duration_sec: Option<u32>,
    duration_min: Option<u32>,
    paused: bool,
    manga: bool,
) -> Clock {
    if manga {
        return Clock::Running { start: session_start, end: None };
    }
    if paused {
        return Clock::Paused { at_sec: position_sec };
    }
    let length = duration_sec
        .or(duration_min.map(|m| m.saturating_mul(60)))
        .map(i64::from);
    let start = match position_sec {
        Some(p) => now - i64::from(p),
        None => session_start,
    };
    Clock::Running { start, end: length.map(|l| start + l) }
}

/// Keeps the start already showing while a fresh one stays within the drift, so an unchanged playback is not re-sent.
fn anchored(showing: Option<i64>, fresh: i64) -> i64 {
    match showing {
        Some(s) if (fresh - s).abs() <= DRIFT_SECS => s,
        _ => fresh,
    }
}

/// A position as a player shows it: minutes and seconds, with hours only when there are any.
fn clock_text(sec: u32) -> String {
    let (h, m, s) = (sec / 3600, sec / 60 % 60, sec % 60);
    if h > 0 {
        format!("{h}:{m:02}:{s:02}")
    } else {
        format!("{m}:{s:02}")
    }
}

/// What the presence shows: the playing title, the page the app is on, or nothing at all.
#[derive(Debug, PartialEq, Eq)]
enum Presence {
    Playing,
    Idle,
    Clear,
}

/// Idle is shown unless the user asked for a presence only while something plays.
fn presence_kind(playing: bool, watching_only: bool) -> Presence {
    match (playing, watching_only) {
        (true, _) => Presence::Playing,
        (false, false) => Presence::Idle,
        (false, true) => Presence::Clear,
    }
}

/// The title's AniList page, where the cover, the title line and the button all lead.
fn media_url(media_type: &str, id: i64) -> String {
    let kind = if media_type == "MANGA" { "manga" } else { "anime" };
    format!("https://anilist.co/{kind}/{id}")
}

/// The crow's tooltip and link: the signed-in AniList account, or just the app's name without one.
fn crow_badge(name: Option<&str>) -> (String, Option<String>) {
    match name.map(str::trim).filter(|n| !n.is_empty()) {
        Some(n) => (format!("{n} on AniList"), Some(format!("https://anilist.co/user/{n}"))),
        None => ("Karasu".to_string(), None),
    }
}

/// The signed-in account's name from the cached viewer.
fn viewer_name(db: &Db) -> Option<String> {
    let viewer: serde_json::Value = serde_json::from_str(&db.kv_get("anilist_viewer")?).ok()?;
    viewer.get("name")?.as_str().map(str::to_string)
}

/// Re-syncs the presence from the current playback state, for callers with no NowPlaying at hand.
pub fn sync_current(app: &AppHandle) {
    let now = app.state::<PlaybackState>().0.guard().clone();
    sync(app, now.as_ref());
}

/// Syncs the presence with the current playback or the idle page, on every detection, page and settings change.
pub fn sync(app: &AppHandle, now: Option<&NowPlaying>) {
    let db = app.state::<Db>();
    let enabled = db.kv_get("discord_enabled").as_deref() == Some("1");
    let watching_only = db.kv_get(WATCHING_ONLY_KEY).as_deref() == Some("1");
    let app_id = effective_app_id(&db.kv_get("discord_app_id").unwrap_or_default());

    let state = app.state::<Discord>();
    let mut guard = state.0.guard();

    if !enabled || app_id.is_empty() {
        disconnect(app, &mut guard);
        return;
    }

    // Connect lazily; if Discord is not running, stay quiet and retry later.
    if guard.is_none() {
        // discord-rich-presence 1.x returns the client directly (no Result).
        let mut client = DiscordIpcClient::new(&app_id);
        if client.connect().is_ok() {
            *guard = Some(client);
        } else {
            return;
        }
    }

    // Never broadcast a title the content filter hides; the presence is the one surface other people see.
    let level = crate::commands::read_content_filter(&db);
    let now = now.filter(|np| {
        match np.media_id {
            Some(id) => !crate::commands::media_id_blocked(&db, id, &level),
            // With the filter on, an unmatched detection is not broadcast: that is where adult content lands.
            None => level == "off",
        }
    });

    if presence_kind(now.is_some(), watching_only) == Presence::Clear {
        let last = app.state::<LastPresence>();
        let mut last = last.0.guard();
        // Cleared once per change, so an idle app does not talk to Discord on every page turn.
        if last.fingerprint != "clear" {
            *last = Shown { fingerprint: "clear".into(), at: std::time::Instant::now(), anchor: None };
            if let Some(client) = guard.as_mut() {
                if client.clear_activity().is_err() {
                    disconnect(app, &mut guard);
                }
            }
        }
        return;
    }

    // The clock rides along for the fingerprint: it pins the timer, so it is part of the identity.
    let mut anchor = None;
    let (details, state_text, timestamps, kind, fingerprint_clock) = match now {
        Some(np) => {
            let title = np
                .matched_title
                .clone()
                .unwrap_or_else(|| np.parsed_title.clone());
            let is_manga = np.media_type == "MANGA";
            let base = match np.episode {
                Some(e) if is_manga => format!("Chapter {e}"),
                Some(e) => match np.total_episodes {
                    Some(total) => format!("Episode {e} / {total}"),
                    None => format!("Episode {e}"),
                },
                None if is_manga => "Reading".to_string(),
                None => "Watching".to_string(),
            };
            // Elapsed timer, plus a progress bar when the episode length is known; a pause stops it and names the spot.
            let fresh = clock(
                now_secs(),
                session_start(app, np),
                np.position_sec,
                np.duration_sec,
                np.duration_min,
                np.paused,
                is_manga,
            );
            let key = format!("{:?}|{}|{:?}", np.media_id, np.raw_title, np.episode);
            let showing = app
                .state::<LastPresence>()
                .0
                .guard()
                .anchor
                .as_ref()
                .filter(|(k, _)| *k == key)
                .map(|(_, start)| *start);
            let shown = match fresh {
                Clock::Running { start, end } => {
                    let kept = anchored(showing, start);
                    anchor = Some((key, kept));
                    Clock::Running { start: kept, end: end.map(|e| e + kept - start) }
                }
                paused => paused,
            };
            crate::logging::debug_changed("discord", "clock", format!("{shown:?}"));
            let (state_text, timestamps) = match shown {
                Clock::Running { start, end: Some(end) } => (base, Timestamps::new().start(start).end(end)),
                Clock::Running { start, end: None } => (base, Timestamps::new().start(start)),
                Clock::Paused { at_sec: Some(at) } => (format!("{base} · Paused at {}", clock_text(at)), Timestamps::new()),
                Clock::Paused { at_sec: None } => (format!("{base} · Paused"), Timestamps::new()),
            };
            // "Watching X" reads better than "Playing Karasu" for video; Discord has no Reading type, so manga keeps Playing.
            let kind = if is_manga {
                ActivityType::Playing
            } else {
                ActivityType::Watching
            };
            (title, state_text, timestamps, kind, format!("{shown:?}"))
        }
        None => {
            let page = app.state::<UiPage>().0.guard().clone();
            (
                format!("Looking at {page}"),
                "Idle".to_string(),
                Timestamps::new(),
                ActivityType::Playing,
                String::new(),
            )
        }
    };

    // Up to two buttons; the AniList one only appears when detection matched a real entry.
    let anilist_url = now.and_then(|np| np.media_id.map(|id| media_url(&np.media_type, id)));
    let mut buttons = vec![Button::new("Get Karasu here", REPO_URL)];
    if let Some(url) = anilist_url.as_deref() {
        buttons.push(Button::new("View on AniList", url));
    }

    // The cover goes in `large_image` as a plain URL; unmatched states keep "logo", which must stay uploaded in the portal.
    let cover = now.and_then(|np| np.cover_url.as_deref());
    let (crow_text, profile_url) = crow_badge(viewer_name(&db).as_deref());
    let assets = match cover {
        Some(url) => {
            let mut assets = Assets::new().large_image(url).large_text(&details).small_image("logo").small_text(&crow_text);
            if let Some(page) = anilist_url.as_deref() {
                assets = assets.large_url(page);
            }
            if let Some(profile) = profile_url.as_deref() {
                assets = assets.small_url(profile);
            }
            assets
        }
        None => Assets::new().large_image("logo").large_text("Karasu"),
    };

    // Skip a payload identical to the one showing; the clock carries the end timestamp, so the length is in it.
    let fingerprint = format!(
        "{details}|{state_text}|{cover}|{buttons}|{fingerprint_clock}|{crow_text}",
        cover = cover.unwrap_or(""),
        buttons = anilist_url.as_deref().unwrap_or(""),
    );
    {
        let last = app.state::<LastPresence>();
        let mut last = last.0.guard();
        last.anchor = anchor;
        if last.fingerprint == fingerprint && last.at.elapsed().as_secs() < RESEND_SECS {
            return;
        }
        last.fingerprint = fingerprint;
        last.at = std::time::Instant::now();
    }

    let mut activity = Activity::new()
        .activity_type(kind)
        .details(&details)
        .state(&state_text)
        .assets(assets)
        .timestamps(timestamps)
        .buttons(buttons);
    // While something plays the member list names the title, not "Karasu", and the title line opens its page.
    if now.is_some() {
        activity = activity.status_display_type(StatusDisplayType::Details);
    }
    if let Some(page) = anilist_url.as_deref() {
        activity = activity.details_url(page);
    }

    if let Some(client) = guard.as_mut() {
        if client.set_activity(activity).is_err() {
            disconnect(app, &mut guard);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_idle_app_shows_its_page_unless_the_user_wants_watching_only() {
        assert_eq!(presence_kind(true, false), Presence::Playing);
        assert_eq!(presence_kind(true, true), Presence::Playing);
        assert_eq!(presence_kind(false, false), Presence::Idle);
        assert_eq!(presence_kind(false, true), Presence::Clear);
    }

    #[test]
    fn the_cover_and_title_link_to_the_anilist_page() {
        assert_eq!(media_url("ANIME", 21), "https://anilist.co/anime/21");
        assert_eq!(media_url("MANGA", 30013), "https://anilist.co/manga/30013");
    }

    #[test]
    fn the_crow_names_the_account_and_links_its_profile() {
        assert_eq!(crow_badge(Some("Kyusetzu")), ("Kyusetzu on AniList".to_string(), Some("https://anilist.co/user/Kyusetzu".to_string())));
        assert_eq!(crow_badge(None), ("Karasu".to_string(), None));
        assert_eq!(crow_badge(Some("  ")), ("Karasu".to_string(), None));
    }

    #[test]
    fn a_known_position_starts_the_timer_where_playback_stands() {
        // 12:34 into a 24-minute file: the bar starts 754 s ago and ends with the file, not with the session.
        assert_eq!(
            clock(10_000, 5_000, Some(754), Some(1440), Some(23), false, false),
            Clock::Running { start: 9_246, end: Some(10_686) }
        );
        // The entry's rounded minutes stand in when the source has no length of its own.
        assert_eq!(
            clock(10_000, 5_000, Some(754), None, Some(24), false, false),
            Clock::Running { start: 9_246, end: Some(10_686) }
        );
    }

    #[test]
    fn a_pause_stops_the_timer_at_the_position() {
        assert_eq!(clock(10_000, 5_000, Some(754), Some(1440), Some(24), true, false), Clock::Paused { at_sec: Some(754) });
        assert_eq!(clock(10_000, 5_000, None, None, Some(24), true, false), Clock::Paused { at_sec: None });
    }

    #[test]
    fn without_a_position_the_session_start_stays_the_anchor() {
        // A window title reports no position, so the timer keeps running from the session as before.
        assert_eq!(clock(10_000, 5_000, None, None, Some(24), false, false), Clock::Running { start: 5_000, end: Some(6_440) });
        assert_eq!(clock(10_000, 5_000, None, None, None, false, false), Clock::Running { start: 5_000, end: None });
    }

    #[test]
    fn a_manga_keeps_the_session_timer() {
        assert_eq!(clock(10_000, 5_000, Some(30), Some(60), None, true, true), Clock::Running { start: 5_000, end: None });
    }

    #[test]
    fn poll_jitter_keeps_the_start_and_a_seek_moves_it() {
        assert_eq!(anchored(Some(9_246), 9_248), 9_246);
        assert_eq!(anchored(Some(9_246), 9_243), 9_246);
        assert_eq!(anchored(Some(9_246), 9_200), 9_200);
        assert_eq!(anchored(Some(9_246), 9_400), 9_400);
        assert_eq!(anchored(None, 9_246), 9_246);
    }

    #[test]
    fn a_position_reads_like_a_player_clock() {
        assert_eq!(clock_text(0), "0:00");
        assert_eq!(clock_text(754), "12:34");
        assert_eq!(clock_text(3_723), "1:02:03");
    }

    #[test]
    fn a_blank_override_means_the_built_in_app_id() {
        assert_eq!(effective_app_id(""), BUILTIN_DISCORD_APP_ID);
        assert_eq!(effective_app_id("   "), BUILTIN_DISCORD_APP_ID);
        assert_eq!(effective_app_id(" 123 "), "123");
    }
}
