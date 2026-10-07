//! Detection of running media playback via visible windows, Karasu's counterpart to Taiga's Anisthesia.

pub mod audio;
pub(crate) mod browser;
pub mod discovery;
pub mod jellyfin;
pub mod media_session;
pub mod mpv_ipc;
pub mod profiles;

#[cfg(windows)]
use windows::core::BOOL;
#[cfg(windows)]
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM};
#[cfg(windows)]
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
    PROCESS_QUERY_LIMITED_INFORMATION,
};
#[cfg(windows)]
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowTextLengthW, GetWindowTextW, GetWindowThreadProcessId,
    IsWindowVisible,
};

#[derive(Debug, Clone, PartialEq)]
pub struct WindowInfo {
    /// Lower-case process name, e.g. "mpv.exe"
    pub process: String,
    pub title: String,
}

/// Candidate from a player or browser window.
#[derive(Debug, Clone, PartialEq, serde::Serialize, specta::Type)]
pub struct Playback {
    pub process: String,
    /// Cleaned media title (file name or streaming/reading title)
    pub media_title: String,
    /// true if detected from a browser/streaming window
    pub streaming: bool,
    /// true if this is manga reading (chapters instead of episodes)
    pub manga: bool,
    /// Found by a site-neutral rule rather than a known player or site, so the scrobbler always asks before it writes.
    #[serde(skip)]
    pub generic: bool,
    /// Set when the source already knows the series, so the parser is skipped: Jellyfin's API and series-only sites.
    pub parsed: Option<crate::playback::recognition::parser::Parsed>,
    /// Playback position in seconds when the source reports one; a window title never does, so the wall clock steps in.
    pub position_sec: Option<u32>,
    /// The file's duration in seconds from the same source, more exact than the entry's rounded minutes.
    pub duration_sec: Option<u32>,
}

/// Lists all visible top-level windows with title and process name.
#[cfg(windows)]
pub fn enumerate_windows() -> Vec<WindowInfo> {
    let mut result: Vec<WindowInfo> = Vec::new();
    unsafe {
        let _ = EnumWindows(
            Some(enum_callback),
            LPARAM(&mut result as *mut Vec<WindowInfo> as isize),
        );
    }
    result
}

/// Windows-only by design: Wayland forbids reading another application's windows, so Linux has no window rung.
#[cfg(not(windows))]
pub fn enumerate_windows() -> Vec<WindowInfo> {
    Vec::new()
}

#[cfg(windows)]
unsafe extern "system" fn enum_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let result = unsafe { &mut *(lparam.0 as *mut Vec<WindowInfo>) };

    if !unsafe { IsWindowVisible(hwnd) }.as_bool() {
        return BOOL(1);
    }
    let len = unsafe { GetWindowTextLengthW(hwnd) };
    if len <= 0 {
        return BOOL(1);
    }
    let mut buf = vec![0u16; (len + 1) as usize];
    let read = unsafe { GetWindowTextW(hwnd, &mut buf) };
    if read <= 0 {
        return BOOL(1);
    }
    let title = String::from_utf16_lossy(&buf[..read as usize]);

    let mut pid = 0u32;
    unsafe { GetWindowThreadProcessId(hwnd, Some(&mut pid)) };
    if pid == 0 {
        return BOOL(1);
    }

    if let Some(process) = process_name(pid) {
        result.push(WindowInfo { process, title });
    }
    BOOL(1)
}

#[cfg(windows)]
pub(super) fn process_name(pid: u32) -> Option<String> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 1024];
        let mut size = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            windows::core::PWSTR(buf.as_mut_ptr()),
            &mut size,
        );
        let _ = CloseHandle(handle);
        ok.ok()?;
        let path = String::from_utf16_lossy(&buf[..size as usize]);
        Some(path.rsplit('\\').next()?.to_lowercase())
    }
}

/// One sweep's answer: the source that won, or when none did, every chapter tab front first for the scrobbler to judge.
#[derive(Debug, Default)]
pub struct Sweep {
    pub found: Option<Playback>,
    pub chapter_tabs: Vec<Playback>,
}

/// Scans visible windows for playback or reading: what it found, and whether it passed a known player or site as paused.
fn windows_rung(windows: &[WindowInfo]) -> (Option<Playback>, bool) {
    // A COM round trip, so it runs at most once a sweep and only once a window has matched; empty suppresses nothing.
    let mut playing: Option<audio::PlayStates> = None;
    scan_windows(windows, |process| audio::is_paused(playing.get_or_insert_with(audio::play_states), process))
}

/// The window rung with its pause check handed in, so a test can pause a player without an audio session.
fn scan_windows(windows: &[WindowInfo], mut paused: impl FnMut(&str) -> bool) -> (Option<Playback>, bool) {
    let mut held = false;
    // Local players take precedence over browser detection
    for w in windows {
        if let Some(media) = profiles::match_player(&w.process, &w.title) {
            if paused(&w.process) {
                held = true;
                continue;
            }
            return (Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: false,
                manga: false,
                generic: false,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            }), held);
        }
    }
    for w in windows {
        if let Some(media) = profiles::match_streaming(&w.process, &w.title) {
            if paused(&w.process) {
                held = true;
                continue;
            }
            return (Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: true,
                manga: false,
                generic: false,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            }), held);
        }
    }
    // No pause check on the manga rung: a reader tab makes no sound, so its process reads Inactive whenever nothing plays.
    for w in windows {
        if let Some(media) = profiles::match_manga(&w.process, &w.title) {
            return (Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: true,
                manga: true,
                generic: false,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            }), held);
        }
    }
    (None, held)
}

/// Every browser window on a chapter at a site with no rule of its own, front first; kept only for a manga being read.
pub fn chapter_tabs(windows: &[WindowInfo]) -> Vec<Playback> {
    windows
        .iter()
        .filter_map(|w| {
            let (media_title, parsed) = browser::match_chapter_tab(&w.process, &w.title)?;
            Some(Playback {
                process: w.process.clone(),
                media_title,
                streaming: true,
                manga: true,
                generic: true,
                parsed: Some(parsed),
                position_sec: None,
                duration_sec: None,
            })
        })
        .collect()
}

/// The last rung, unless a player or session was only paused: a pause outranks a chapter tab, as a paused mpv does.
fn last_rung(held: bool, windows: &[WindowInfo]) -> Vec<Playback> {
    if held {
        Vec::new()
    } else {
        chapter_tabs(windows)
    }
}

/// Full sweep, most-knowing source first: playing mpv IPC, Jellyfin, windows, media sessions, a paused mpv, chapter tabs.
pub async fn detect_playback(
    media_detection: bool,
    jellyfin: Option<jellyfin::JellyfinConfig>,
    mpv: Option<mpv_ipc::MpvConfig>,
) -> Sweep {
    let mut paused_mpv: Option<Playback> = None;
    if let Some(cfg) = mpv {
        if let Some((p, paused)) = mpv_ipc::detect(&cfg).await {
            if !paused {
                crate::logging::debug_changed("detect", "source", format!("mpv ipc: {:?}", p.media_title));
                return Sweep { found: Some(p), ..Sweep::default() };
            }
            paused_mpv = Some(p);
        }
    }
    if let Some(cfg) = jellyfin {
        if let Some(p) = jellyfin::detect(&cfg).await {
            crate::logging::debug_changed("detect", "source", format!("jellyfin: {:?}", p.media_title));
            return Sweep { found: Some(p), ..Sweep::default() };
        }
    }
    // Blocking Win32/WinRT and D-Bus work; keep it off the runtime's worker thread.
    let (found, tabs) = tokio::task::spawn_blocking(move || {
        // Said at each rung rather than once afterwards: `Playback` carries no source field, so nothing later knows which won.
        let windows = enumerate_windows();
        let (found, held) = windows_rung(&windows);
        if let Some(p) = found {
            crate::logging::debug_changed("detect", "source", format!("window title: {:?}", p.media_title));
            return (Some(p), Vec::new());
        }
        // Read here, where the windows are, and used last: of every rung the chapter tab knows the least.
        if !media_detection {
            return (None, last_rung(held, &windows));
        }
        let sessions = media_session::sessions();
        let found = media_session::detect(&sessions);
        match &found {
            Some(p) => crate::logging::debug_changed("detect", "source", format!("media session: {:?}", p.media_title)),
            None => crate::logging::debug_changed(
                "detect",
                "browser_tabs",
                browser::unlinked_line(&sessions, &windows).unwrap_or_else(|| "no playing session left unrecognised".into()),
            ),
        }
        let tabs = match found {
            Some(_) => Vec::new(),
            None => last_rung(held || media_session::paused_watchable(&sessions), &windows),
        };
        (found, tabs)
    })
    .await
    .unwrap_or_default();

    // Nothing live anywhere: a paused pipe is still what is on this machine, and the chapter tabs come after even that.
    if found.is_none() {
        if let Some(p) = &paused_mpv {
            crate::logging::debug_changed(
                "detect",
                "source",
                format!("mpv ipc (paused): {:?}", p.media_title),
            );
        } else if !tabs.is_empty() {
            crate::logging::debug_changed("detect", "source", format!("{} chapter tab(s)", tabs.len()));
        }
    }
    let found = found.or(paused_mpv);
    let chapter_tabs = if found.is_none() { tabs } else { Vec::new() };
    Sweep { found, chapter_tabs }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn window(process: &str, title: &str) -> WindowInfo {
        WindowInfo { process: process.into(), title: title.into() }
    }

    #[test]
    fn a_chapter_tab_is_a_generic_manga_reading() {
        let windows = [
            window("explorer.exe", "Kusuriya no Hitorigoto - Ch. 45"),
            window("firefox.exe", "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Mozilla Firefox"),
        ];
        let tabs = chapter_tabs(&windows);
        assert_eq!(tabs.len(), 1);
        let p = &tabs[0];
        assert_eq!(p.process, "firefox.exe");
        assert!(p.manga && p.generic && p.streaming);
        let parsed = p.parsed.as_ref().unwrap();
        assert_eq!((parsed.title.as_str(), parsed.episode), ("Kusuriya no Hitorigoto", Some(45)));
    }

    #[test]
    fn every_chapter_window_is_offered_front_first() {
        let windows = [
            window("firefox.exe", "Berserk - Ch. 380 - ExampleReader — Mozilla Firefox"),
            window("zen.exe", "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Zen Browser"),
        ];
        let titles: Vec<String> = chapter_tabs(&windows).into_iter().map(|p| p.parsed.unwrap().title).collect();
        assert_eq!(titles, vec!["Berserk", "Kusuriya no Hitorigoto"]);
    }

    /// A paused player still outranks a chapter tab, or reading in a window behind it would replace the paused episode.
    #[test]
    fn a_paused_player_holds_back_every_chapter_tab() {
        let windows = [
            window("vlc.exe", "[Group] Sousou no Frieren - 05.mkv - VLC media player"),
            window("firefox.exe", "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Mozilla Firefox"),
        ];
        let (found, held) = scan_windows(&windows, |_| true);
        assert!(found.is_none() && held);
        assert!(last_rung(held, &windows).is_empty());
        let (found, held) = scan_windows(&windows, |_| false);
        assert_eq!(found.map(|p| p.process), Some("vlc.exe".to_string()));
        assert!(!held);
        assert_eq!(last_rung(false, &windows).len(), 1);
    }

    #[test]
    fn the_windows_rung_never_answers_with_a_chapter_tab() {
        let windows = [window("firefox.exe", "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Mozilla Firefox")];
        assert_eq!(scan_windows(&windows, |_| false), (None, false));
    }
}

/// Manual live tests: run one with `--ignored --nocapture` and a player or a browser playing to print what it sees.
#[cfg(test)]
mod live_tests {
    #[test]
    #[ignore]
    fn live_detect() {
        for w in super::enumerate_windows() {
            println!("FENSTER: {} | {}", w.process, w.title);
        }
        println!("ERKANNT: {:?}", super::windows_rung(&super::enumerate_windows()));
    }

    /// The browser half of a measurement: which browser windows hold the title of each playing media session.
    #[test]
    #[ignore]
    fn live_browser_windows() {
        let windows = super::enumerate_windows();
        let sessions = super::media_session::sessions();
        for w in windows.iter().filter(|w| super::profiles::is_browser(&w.process)) {
            println!("BROWSER: {} | {}", w.process, w.title);
        }
        for s in &sessions {
            println!("SESSION: {} {}/{} | {:?} | {:?} | url {:?}", s.app_id, s.playback_type, s.status, s.title, s.artist, s.url);
        }
        println!("LINK: {:?}", super::browser::unlinked_line(&sessions, &windows));
    }
}
