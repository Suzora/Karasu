//! The desktop's own media session as a detection source; the backends supply sessions and every decision lives here.

use super::Playback;

#[cfg(target_os = "linux")]
mod mpris;
#[cfg(windows)]
mod smtc;

// Only the MPRIS backend calls these, but they are pure decisions kept platform-neutral so their tests run on both.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
/// Audio-only extensions, for telling a music player from a video one.
const AUDIO_EXTENSIONS: &[&str] = &[
    ".mp3", ".flac", ".m4a", ".aac", ".ogg", ".oga", ".opus", ".wav", ".wma", ".aiff",
    ".m4b", ".ape", ".wv",
];

/// Music-only players by shortened app name with `.exe` stripped, so one list covers MPRIS, executable and Store package.
const MUSIC_PLAYERS: &[&str] = &[
    "spotify", "spotifyd", "spotifymusic", "ncspot", "rhythmbox", "clementine",
    "strawberry", "audacious", "elisa", "lollypop", "amberol", "mpd", "cmus",
    "moc", "quodlibet", "deadbeef", "tauon", "gnome-music", "sayonara",
];

/// One media session as the desktop sees it, serialized straight into the Settings diagnostic.
#[derive(Debug, Clone, PartialEq, serde::Serialize, specta::Type)]
pub struct MediaSession {
    /// Source app: an executable path or package family name on Windows, a D-Bus bus name on Linux.
    #[serde(rename = "appId")]
    pub app_id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    /// "music" | "video" | "image" | "unknown"
    #[serde(rename = "playbackType")]
    pub playback_type: String,
    /// "playing" | "paused" | "stopped" | "changing" | "opened" | "closed"
    pub status: String,
    /// What is being played, when the source says; MPRIS publishes `xesam:url`, SMTC has no equivalent.
    pub url: String,
}

impl MediaSession {
    pub(crate) fn is_playing(&self) -> bool {
        self.status == "playing"
    }

    /// A known music player, whose sessions are never playback whatever their titles say.
    pub(crate) fn is_music_player(&self) -> bool {
        MUSIC_PLAYERS.contains(&short_app_name(&self.app_id).trim_end_matches(".exe"))
    }

    /// Music stays out, but a "music" label yields to a title spelling out an episode unless the app is a known music player.
    fn is_watchable(&self) -> bool {
        if self.playback_type != "music" {
            return true;
        }
        if self.is_music_player() {
            return false;
        }
        let composed = compose_title(&self.artist, &self.title, &self.album);
        // A series-only site's own tab is video whatever the label; an episode site still has to spell its episode.
        self.site().is_some_and(|s| s.carries == super::profiles::Carries::SeriesOnly)
            || crate::playback::recognition::parser::parse(&composed).episode_marked
    }

    /// The streaming site this session's title names; a series-only one only as the browser's bare tab title.
    fn site(&self) -> Option<super::profiles::SiteTitle> {
        let site = super::profiles::match_site(&compose_title(&self.artist, &self.title, &self.album))?;
        // A page that sets its own metadata (a YouTube upload of a trailer) names a channel, which the tab never does.
        let bare_tab = self.artist.trim().is_empty() && self.album.trim().is_empty();
        (site.carries == super::profiles::Carries::Episode || bare_tab).then_some(site)
    }
}

/// Joins show and title for the parser only when they are distinct, since several players repeat the show in both fields.
pub fn compose_title(artist: &str, title: &str, album: &str) -> String {
    let title = title.trim();
    let artist = artist.trim();
    let album = album.trim();

    // Some players leave `artist` empty and put the show in `album` instead.
    let show = if artist.is_empty() { album } else { artist };

    if show.is_empty() {
        return title.to_string();
    }
    if title.is_empty() {
        return show.to_string();
    }
    // Already self-describing ("Frieren - Episode 5"): don't prefix it again.
    if title.to_lowercase().contains(&show.to_lowercase()) {
        return title.to_string();
    }
    format!("{show} - {title}")
}

/// Trims an app id (executable path, package family name or MPRIS bus name) down to a process-like name.
pub fn short_app_name(app_id: &str) -> String {
    let id = app_id.trim();
    if id.is_empty() {
        return String::new();
    }
    // An MPRIS bus name, checked first because it has no underscore and would otherwise reduce to its instance suffix.
    if let Some(rest) = id.strip_prefix("org.mpris.MediaPlayer2.") {
        return rest.split('.').next().unwrap_or(rest).to_lowercase();
    }
    if id.contains('\\') || id.contains('/') {
        // A path: the file name is already the right shape.
        let tail = id.rsplit(['\\', '/']).next().unwrap_or(id);
        return tail.to_lowercase();
    }
    // A package family name, "Publisher.App_8wekyb3d8bbwe".
    let without_hash = id.split('_').next().unwrap_or(id);
    without_hash
        .rsplit('.')
        .next()
        .unwrap_or(without_hash)
        .to_lowercase()
}

/// Every playing, non-music session worth reporting, those declaring video first.
fn watchable<'a>(sessions: &'a [MediaSession]) -> impl Iterator<Item = &'a MediaSession> + 'a {
    let eligible = |s: &&MediaSession| s.is_playing() && s.is_watchable();
    sessions
        .iter()
        .filter(move |s| eligible(s) && s.playback_type == "video")
        .chain(
            sessions
                .iter()
                .filter(move |s| eligible(s) && s.playback_type != "video"),
        )
}

/// The best playing non-music session; only the tests take one at a time, since `detect` needs the whole ordering.
#[cfg(test)]
fn pick(sessions: &[MediaSession]) -> Option<&MediaSession> {
    watchable(sessions).next()
}

/// The percent-decoded file name behind a `file://` URL, lossily since a bad name is still worth a guess; else `None`.
pub fn local_file_name(url: &str) -> Option<String> {
    let path = url.strip_prefix("file://")?;
    // Strip the (usually empty) authority: file://host/path.
    let path = {
        let i = path.find('/')?;
        &path[i..]
    };
    let last = path.rsplit('/').find(|s| !s.is_empty())?;
    let decoded = percent_encoding::percent_decode_str(last)
        .decode_utf8_lossy()
        .to_string();
    let decoded = decoded.trim();
    (!decoded.is_empty()).then(|| decoded.to_string())
}

/// The kind for sources that do not say: the URL beats the player's name, and the fallback is "unknown", never "video".
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn infer_playback_type(url: &str, app_id: &str) -> &'static str {
    // The path only — a query string must not defeat the extension check.
    let path = url.split(['?', '#']).next().unwrap_or(url).to_lowercase();
    if super::profiles::VIDEO_EXTENSIONS.iter().any(|e| path.ends_with(e)) {
        return "video";
    }
    if AUDIO_EXTENSIONS.iter().any(|e| path.ends_with(e)) {
        return "music";
    }
    let name = short_app_name(app_id);
    if MUSIC_PLAYERS.contains(&name.as_str()) {
        return "music";
    }
    "unknown"
}

/// One session as a playback candidate, split out of `detect` so the mapping is testable without a live session manager.
pub fn playback_from(session: &MediaSession) -> Option<Playback> {
    // A local file is the good case: the real release name beats any composition of artist and title as parser input.
    if let Some(name) = local_file_name(&session.url) {
        crate::logging::debug_changed(
            "session",
            "chosen",
            format!("{}: local file {:?}", session.app_id, name),
        );
        return Some(Playback {
            process: short_app_name(&session.app_id),
            media_title: name,
            streaming: false,
            manga: false,
            parsed: None,
            position_sec: None,
            duration_sec: None,
        });
    }

    let composed = compose_title(&session.artist, &session.title, &session.album);
    // A browser tab carries its site's name, which must not reach the parser as the episode's name.
    let site = session.site();
    let media_title = site.as_ref().map_or(composed, |s| s.media.clone());
    if media_title.trim().is_empty() {
        // From the outside a `None` looks exactly like "nothing is playing", so the rejection is worth a line.
        crate::logging::debug_changed(
            "session",
            "skipped",
            format!("{}: no usable title, skipped", session.app_id),
        );
        return None;
    }
    let parsed = match site {
        Some(s) if s.parsed.is_some() => s.parsed,
        // An episode site's title whose number is not spelled out is the series page's own number, never an episode.
        Some(_) => Some(crate::playback::recognition::parser::parse(&media_title))
            .filter(|p| !p.episode_marked)
            .map(|p| crate::playback::recognition::parser::Parsed {
                // The whole title, since the bare-number rule also cut that number off the series.
                title: media_title.trim().to_string(),
                episode: None,
                episode_title: None,
                ..p
            }),
        None => None,
    };
    // A composed title whose parse is empty is not playback; it matches nothing and would key a correction that never fires.
    if parsed.is_none()
        && crate::playback::recognition::parser::parse(&media_title)
            .title
            .trim()
            .is_empty()
    {
        crate::logging::debug_changed(
            "session",
            "skipped",
            format!("{}: {media_title:?} has no title once parsed", session.app_id),
        );
        return None;
    }
    crate::logging::debug_changed(
        "session",
        "chosen",
        format!("{}: composed {:?}", session.app_id, media_title),
    );
    Some(Playback {
        process: short_app_name(&session.app_id),
        media_title,
        // Not a local file, and the UI's "streaming" icon is the honest one for something known only through the OS.
        streaming: true,
        manga: false,
        parsed,
        position_sec: None,
        duration_sec: None,
    })
}

/// What detection made of each playing session that is not a music player, for the verbose log; rejected ones included.
fn verdicts(sessions: &[MediaSession]) -> String {
    let music = sessions.iter().filter(|s| s.is_playing() && s.is_music_player()).count();
    let mut parts: Vec<String> = sessions
        .iter()
        .filter(|s| s.is_playing() && !s.is_music_player())
        .map(|s| {
            let composed = compose_title(&s.artist, &s.title, &s.album);
            let site = if s.site().is_some() { "a known site" } else { "no known site" };
            let episode = if crate::playback::recognition::parser::parse(&composed).episode_marked {
                "an episode spelled out"
            } else {
                "no episode spelled out"
            };
            let verdict = if s.is_watchable() { "considered" } else { "dropped as music" };
            format!("{} {}: {composed:?}, {site}, {episode}, {verdict}", s.app_id, s.playback_type)
        })
        .collect();
    if music > 0 {
        parts.push(format!("{music} music player(s) left out"));
    }
    if parts.is_empty() {
        "nothing playing".to_string()
    } else {
        parts.join("; ")
    }
}

/// The best session that yields something; one `playback_from` rejects falls through instead of ending the sweep.
pub fn detect(sessions: &[MediaSession]) -> Option<Playback> {
    // What the desktop publishes, through `debug_changed` since this runs on every poll; the log outlives the diagnostic.
    crate::logging::debug_changed(
        "session",
        "sessions",
        format!(
            "{} session(s): [{}]",
            sessions.len(),
            sessions
                .iter()
                .map(|s| format!(
                    "{} {}/{}",
                    s.app_id, s.playback_type, s.status
                ))
                .collect::<Vec<_>>()
                .join(", ")
        ),
    );
    crate::logging::debug_changed("session", "verdict", verdicts(sessions));
    watchable(sessions).find_map(playback_from)
}

/// What the platform reports, or why it could not be asked; the diagnostic must tell "no session" from "no service".
#[cfg(windows)]
pub fn sessions_result() -> Result<Vec<MediaSession>, String> {
    smtc::read_sessions().map_err(|e| e.to_string())
}

#[cfg(target_os = "linux")]
pub fn sessions_result() -> Result<Vec<MediaSession>, String> {
    mpris::read_sessions().map_err(|e| e.to_string())
}

/// No media-session API on this platform.
#[cfg(not(any(windows, target_os = "linux")))]
pub fn sessions_result() -> Result<Vec<MediaSession>, String> {
    Ok(Vec::new())
}

/// The list alone for the detection pass; a failure is empty but logged through `debug_changed`, never a `warn` per poll.
pub fn sessions() -> Vec<MediaSession> {
    match sessions_result() {
        Ok(list) => list,
        Err(e) => {
            crate::logging::debug_changed("detect", "sessions_error", &e);
            Vec::new()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn session(artist: &str, title: &str, kind: &str, status: &str) -> MediaSession {
        MediaSession {
            app_id: "C:\\Program Files\\Jellyfin Media Player\\jellyfinmediaplayer.exe".into(),
            title: title.into(),
            artist: artist.into(),
            album: String::new(),
            playback_type: kind.into(),
            status: status.into(),
            url: String::new(),
        }
    }

    #[test]
    fn joins_show_and_episode() {
        assert_eq!(
            compose_title("Frieren", "Episode 5", ""),
            "Frieren - Episode 5"
        );
    }

    #[test]
    fn does_not_repeat_a_show_already_in_the_title() {
        assert_eq!(
            compose_title("Frieren", "Frieren - Episode 5", ""),
            "Frieren - Episode 5"
        );
    }

    #[test]
    fn falls_back_to_album_when_artist_is_empty() {
        assert_eq!(compose_title("", "Episode 5", "Frieren"), "Frieren - Episode 5");
    }

    #[test]
    fn tolerates_missing_pieces() {
        assert_eq!(compose_title("", "Episode 5", ""), "Episode 5");
        assert_eq!(compose_title("Frieren", "", ""), "Frieren");
        assert_eq!(compose_title("  ", "  ", "  "), "");
    }

    /// A browser's music-typed session with no episode spelled out is the case the verbose log has to explain.
    #[test]
    fn the_verdict_says_why_a_browser_session_was_dropped() {
        let mut tab = session("", "The Hero's Party", "music", "playing");
        tab.app_id = "308046B0AF4A39CB".into();
        let mut song = session("Some Band", "Some Song", "music", "playing");
        song.app_id = "SpotifyAB.SpotifyMusic_zpdnekdrzrea0".into();
        let line = verdicts(&[tab, song, session("Frieren", "Episode 5", "video", "paused")]);
        assert_eq!(
            line,
            "308046B0AF4A39CB music: \"The Hero's Party\", no known site, no episode spelled out, dropped as music; \
             1 music player(s) left out"
        );
        assert_eq!(verdicts(&[]), "nothing playing");
    }

    #[test]
    fn music_is_never_picked() {
        let sessions = vec![session("Some Band", "Some Song", "music", "playing")];
        assert!(pick(&sessions).is_none());
    }

    fn browser_session(title: &str, kind: &str, status: &str) -> MediaSession {
        MediaSession {
            app_id: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe".into(),
            title: title.into(),
            artist: String::new(),
            album: String::new(),
            playback_type: kind.into(),
            status: status.into(),
            url: String::new(),
        }
    }

    /// A Bilibili tab loses the site's name before the parser sees it, or "BiliBili" would become the episode's name.
    #[test]
    fn a_site_tab_loses_its_site_name() {
        let s = browser_session("Rakshasa Street S4 E1 - BiliBili", "music", "playing");
        assert!(s.is_watchable());
        let p = playback_from(&s).unwrap();
        assert_eq!(p.media_title, "Rakshasa Street S4 E1");
        assert!(p.parsed.is_none(), "an episode site still goes through the parser");
    }

    /// Disney+ names the series alone, so the session is watchable despite the label and arrives already parsed.
    #[test]
    fn a_series_only_tab_arrives_parsed_without_an_episode() {
        let s = browser_session("Mob Psycho 100 | Disney+", "music", "playing");
        assert!(s.is_watchable());
        let parsed = playback_from(&s).unwrap().parsed.unwrap();
        assert_eq!((parsed.title.as_str(), parsed.episode), ("Mob Psycho 100", None));
        assert!(pick(&[browser_session("Mob Psycho 100 | Disney+", "music", "paused")]).is_none());
    }

    /// A trailer uploaded to YouTube carries the channel as its artist, so its "| Disney+" title is not the site's tab.
    #[test]
    fn a_trailer_with_a_channel_is_not_a_series_only_tab() {
        let mut s = browser_session("Andor Season 2 | Official Trailer | Disney+", "music", "playing");
        s.artist = "Disney Plus".into();
        assert!(!s.is_watchable());
    }

    /// An episode site's tab with only the series page's own number arrives with no episode at all.
    #[test]
    fn an_unspelt_number_on_an_episode_site_is_no_episode() {
        let s = browser_session("Mob Psycho 100 - Watch on Crunchyroll", "unknown", "playing");
        let parsed = playback_from(&s).unwrap().parsed.unwrap();
        assert_eq!((parsed.title.as_str(), parsed.episode), ("Mob Psycho 100", None));
        assert!(!browser_session("Mob Psycho 100 - Watch on Crunchyroll", "music", "playing").is_watchable());
    }

    /// HIDIVE's tab names only the episode, which leaves no series to match.
    #[test]
    fn an_episode_name_alone_is_not_playback() {
        let s = browser_session("E3 - Fencer Ordinaire", "music", "playing");
        assert!(playback_from(&s).is_none());
    }

    /// The carve-out's fixture is the real thing: an anime episode in a tab that the browser reported as `type: music`.
    #[test]
    fn a_browsers_music_label_yields_to_an_episode_title() {
        let s = browser_session(
            "That Time I Got Reincarnated as a Slime: Visions of Coleus - Episode 1 | Re:ANIME",
            "music",
            "playing",
        );
        let sessions = vec![s];
        let p = watchable(&sessions).find_map(playback_from).unwrap();
        assert!(p.streaming);
        assert_eq!(p.process, "chrome.exe");
    }

    /// Windows names browsers by opaque AUMIDs, so the override must work with an app id nothing can classify.
    #[test]
    fn an_opaque_app_id_cannot_hide_a_spelled_out_episode() {
        let mut s = browser_session(
            "That Time I Got Reincarnated as a Slime: Visions of Coleus - Episode 2 | Re:ANIME",
            "music",
            "playing",
        );
        s.app_id = "6F940AC27A98DD61".into();
        let sessions = vec![s];
        let p = watchable(&sessions).find_map(playback_from).unwrap();
        assert!(p.streaming);
    }

    /// The override needs a spelled-out episode; a bare trailing number in a song name is inference, not a marker.
    #[test]
    fn real_music_stays_invisible_without_a_marker() {
        let sessions = vec![
            browser_session("Some Band - Some Song", "music", "playing"),
            browser_session("Some Band - Great Song 2", "music", "playing"),
        ];
        assert!(pick(&sessions).is_none());
    }

    /// A known music-only player is believed outright, even about a song that happens to be called like an episode.
    #[test]
    fn a_music_apps_episode_titled_song_stays_invisible() {
        let mut s = session("Yorushika", "Episode 3", "music", "playing");
        s.app_id = "C:\\Users\\x\\AppData\\Roaming\\Spotify\\Spotify.exe".into();
        let sessions = vec![s];
        assert!(pick(&sessions).is_none());
    }

    #[test]
    fn video_wins_over_an_untyped_session() {
        let sessions = vec![
            session("A", "1", "unknown", "playing"),
            session("B", "2", "video", "playing"),
        ];
        assert_eq!(pick(&sessions).unwrap().artist, "B");
    }

    #[test]
    fn untyped_still_counts_when_nothing_declares_video() {
        // A player that never sets a playback type must not be invisible.
        let sessions = vec![session("A", "1", "unknown", "playing")];
        assert_eq!(pick(&sessions).unwrap().artist, "A");
    }

    #[test]
    fn paused_is_not_playback() {
        let sessions = vec![session("A", "1", "video", "paused")];
        assert!(pick(&sessions).is_none());
    }

    #[test]
    fn app_id_shortens_to_a_process_like_name() {
        assert_eq!(
            short_app_name("C:\\Program Files\\Jellyfin Media Player\\jellyfinmediaplayer.exe"),
            "jellyfinmediaplayer.exe"
        );
        assert_eq!(
            short_app_name("Microsoft.ZuneMusic_8wekyb3d8bbwe"),
            "zunemusic"
        );
        assert_eq!(short_app_name(""), "");
    }

    /// An MPRIS bus name has an instance suffix and no underscore, so the package-family branch would misread it.
    #[test]
    fn an_mpris_bus_name_shortens_to_the_player() {
        assert_eq!(short_app_name("org.mpris.MediaPlayer2.mpv.instance1234"), "mpv");
        assert_eq!(short_app_name("org.mpris.MediaPlayer2.firefox.instance_1_25"), "firefox");
        assert_eq!(short_app_name("org.mpris.MediaPlayer2.VLC"), "vlc");
        assert_eq!(
            short_app_name("org.mpris.MediaPlayer2.plasma-browser-integration"),
            "plasma-browser-integration"
        );
    }

    #[test]
    fn a_session_with_no_usable_title_is_not_playback() {
        assert!(playback_from(&session("  ", "  ", "video", "playing")).is_none());
    }

    /// An empty playing session must fall through, or an idle MPRIS player listed ahead of the real one hides the episode.
    #[test]
    fn an_empty_session_falls_through_to_the_next_one() {
        let sessions = vec![
            session("  ", "  ", "unknown", "playing"),
            session("Frieren", "Episode 5", "unknown", "playing"),
        ];
        assert_eq!(
            watchable(&sessions).find_map(playback_from).map(|p| p.media_title),
            Some("Frieren - Episode 5".to_string())
        );
    }

    /// Video is considered before anything untyped, whatever the bus order.
    #[test]
    fn video_is_still_considered_before_untyped() {
        let sessions = vec![
            session("A", "Untyped", "unknown", "playing"),
            session("B", "Video", "video", "playing"),
        ];
        let order: Vec<_> = watchable(&sessions).map(|s| s.title.clone()).collect();
        assert_eq!(order, vec!["Video", "Untyped"]);
    }

    /// The URL is evidence about the file, so the extension wins even for a browser, and a query string must not defeat it.
    #[test]
    fn the_media_kind_is_inferred_from_the_url_before_the_player() {
        assert_eq!(infer_playback_type("file:///a/Frieren%20-%2005.mkv", ""), "video");
        assert_eq!(infer_playback_type("file:///a/song.flac", ""), "music");
        assert_eq!(
            infer_playback_type("https://x/v.mp4?token=1", "org.mpris.MediaPlayer2.firefox"),
            "video"
        );
        // Spotify streams, so there is no extension to read and the bus name is all there is to go on.
        assert_eq!(
            infer_playback_type("https://open.spotify.com/track/1", "org.mpris.MediaPlayer2.spotify"),
            "music"
        );
    }

    /// Anything unrecognised stays unknown: guessing "video" gains nothing and guessing "music" hides a whole player.
    #[test]
    fn an_unrecognised_source_stays_unknown() {
        assert_eq!(infer_playback_type("", ""), "unknown");
        assert_eq!(
            infer_playback_type("https://x/watch", "org.mpris.MediaPlayer2.chromium"),
            "unknown"
        );
    }

    #[test]
    fn a_file_url_yields_the_release_name() {
        assert_eq!(
            local_file_name("file:///srv/anime/%5BSubsPlease%5D%20Frieren%20-%2005.mkv").unwrap(),
            "[SubsPlease] Frieren - 05.mkv"
        );
        // Multi-byte UTF-8 survives the decode.
        assert_eq!(
            local_file_name("file:///a/%E8%91%AC%E9%80%81%E3%81%AE.mkv").unwrap(),
            "葬送の.mkv"
        );
        // A trailing slash has no file to name.
        assert_eq!(local_file_name("file:///a/b/"), Some("b".to_string()));
    }

    #[test]
    fn a_url_that_is_not_a_local_file_has_no_name() {
        assert!(local_file_name("https://example.com/x.mkv").is_none());
        assert!(local_file_name("").is_none());
        assert!(local_file_name("file://").is_none());
    }

    /// A local file goes to the parser as the name on disk and is not called streaming.
    #[test]
    fn a_local_file_beats_the_composed_title() {
        let mut s = session("Some Artist", "Track 5", "video", "playing");
        s.url = "file:///srv/[Group]%20Frieren%20-%2005.mkv".into();
        let p = playback_from(&s).unwrap();
        assert_eq!(p.media_title, "[Group] Frieren - 05.mkv");
        assert!(!p.streaming);
    }

    #[test]
    fn a_playing_session_becomes_a_streaming_candidate() {
        let p = playback_from(&session("Frieren", "Episode 5", "video", "playing")).unwrap();
        assert_eq!(p.media_title, "Frieren - Episode 5");
        assert_eq!(p.process, "jellyfinmediaplayer.exe");
        assert!(p.streaming);
        assert!(!p.manga);
    }
}
