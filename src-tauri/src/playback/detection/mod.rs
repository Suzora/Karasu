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

/// Scans visible windows for anime playback or manga reading; the media-session pass is async and runs after this.
pub fn detect_windows_in(windows: &[WindowInfo]) -> Option<Playback> {
    // A COM round trip, so it runs at most once a sweep and only once a window has matched; empty suppresses nothing.
    let mut playing: Option<audio::PlayStates> = None;
    let mut paused = |process: &str| audio::is_paused(playing.get_or_insert_with(audio::play_states), process);
    // Local players take precedence over browser detection
    for w in windows {
        if let Some(media) = profiles::match_player(&w.process, &w.title) {
            if paused(&w.process) {
                continue;
            }
            return Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: false,
                manga: false,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            });
        }
    }
    for w in windows {
        if let Some(media) = profiles::match_streaming(&w.process, &w.title) {
            if paused(&w.process) {
                continue;
            }
            return Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: true,
                manga: false,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            });
        }
    }
    // No pause check on the manga rung: a reader tab makes no sound, so its process reads Inactive whenever nothing plays.
    for w in windows {
        if let Some(media) = profiles::match_manga(&w.process, &w.title) {
            return Some(Playback {
                process: w.process.clone(),
                media_title: media,
                streaming: true,
                manga: true,
                parsed: None,
                position_sec: None,
                duration_sec: None,
            });
        }
    }
    None
}

/// Full sweep, most-knowing source first: playing mpv IPC, Jellyfin, window titles, media sessions, then a paused mpv.
pub async fn detect_playback(
    media_detection: bool,
    jellyfin: Option<jellyfin::JellyfinConfig>,
    mpv: Option<mpv_ipc::MpvConfig>,
) -> Option<Playback> {
    let mut paused_mpv: Option<Playback> = None;
    if let Some(cfg) = mpv {
        if let Some((p, paused)) = mpv_ipc::detect(&cfg).await {
            if !paused {
                crate::logging::debug_changed("detect", "source", format!("mpv ipc: {:?}", p.media_title));
                return Some(p);
            }
            paused_mpv = Some(p);
        }
    }
    if let Some(cfg) = jellyfin {
        if let Some(p) = jellyfin::detect(&cfg).await {
            crate::logging::debug_changed("detect", "source", format!("jellyfin: {:?}", p.media_title));
            return Some(p);
        }
    }
    // Blocking Win32/WinRT and D-Bus work; keep it off the runtime's worker thread.
    let found = tokio::task::spawn_blocking(move || {
        // Said at each rung rather than once afterwards: `Playback` carries no source field, so nothing later knows which won.
        let windows = enumerate_windows();
        if let Some(p) = detect_windows_in(&windows) {
            crate::logging::debug_changed("detect", "source", format!("window title: {:?}", p.media_title));
            return Some(p);
        }
        if !media_detection {
            return None;
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
        found
    })
    .await
    .unwrap_or(None);

    // Nothing live anywhere: a paused pipe is still what is on this machine.
    if found.is_none() {
        if let Some(p) = &paused_mpv {
            crate::logging::debug_changed(
                "detect",
                "source",
                format!("mpv ipc (paused): {:?}", p.media_title),
            );
        }
    }
    found.or(paused_mpv)
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
        println!("ERKANNT: {:?}", super::detect_windows_in(&super::enumerate_windows()));
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
