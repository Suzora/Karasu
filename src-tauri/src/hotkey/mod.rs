//! The summon hotkey's two backends: a key grab, and on a Wayland session the desktop's GlobalShortcuts portal.

#[cfg(target_os = "linux")]
mod portal;

use serde::Serialize;

/// Which mechanism holds the summon hotkey in this session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum HotkeyBackend {
    Grab,
    Portal,
}

/// How far the binding got; a grab is settled the moment it registers, the portal answers later.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum HotkeyState {
    Off,
    Pending,
    Bound,
    NoPortal,
    NoAppId,
    Denied,
    Failed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyStatus {
    pub backend: HotkeyBackend,
    pub state: HotkeyState,
    /// The desktop's own spelling of the bound key, which need not be the one Karasu proposed.
    pub trigger: Option<String>,
    /// Whether the desktop can open its own dialog to change the key (the portal's second version).
    pub configurable: bool,
}

impl HotkeyStatus {
    pub fn new(backend: HotkeyBackend, state: HotkeyState) -> Self {
        Self { backend, state, trigger: None, configurable: false }
    }
}

/// The kv key holding a key the desktop declined, so a launch does not ask again until the user sets one.
pub const DECLINED_KEY: &str = "global_hotkey_declined";

/// Where the status waits between the task that learns it and the Settings row that reads it.
pub struct HotkeyStatusState(pub std::sync::Mutex<HotkeyStatus>);

/// Stores the status and announces it, so the Settings row and a later read cannot disagree.
#[cfg(desktop)]
pub fn publish(app: &tauri::AppHandle, status: HotkeyStatus) {
    use crate::sync::LockExt;
    use tauri::{Emitter, Manager};
    if let Some(state) = app.try_state::<HotkeyStatusState>() {
        *state.0.guard() = status.clone();
    }
    let _ = app.emit("hotkey-status", &status);
}

/// A grab cannot reach other apps' windows on a Wayland session, so there the desktop's portal holds the key.
#[cfg_attr(not(desktop), allow(dead_code))]
pub fn choose_backend(os: &str, session_type: Option<&str>, wayland_display: Option<&str>) -> HotkeyBackend {
    if os != "linux" {
        return HotkeyBackend::Grab;
    }
    match session_type.map(str::trim) {
        Some(t) if t.eq_ignore_ascii_case("wayland") => HotkeyBackend::Portal,
        Some(t) if t.eq_ignore_ascii_case("x11") => HotkeyBackend::Grab,
        _ if wayland_display.is_some_and(|d| !d.trim().is_empty()) => HotkeyBackend::Portal,
        _ => HotkeyBackend::Grab,
    }
}

/// This session's backend, from the environment the desktop started Karasu with.
#[cfg(desktop)]
pub fn session_backend() -> HotkeyBackend {
    let session = std::env::var("XDG_SESSION_TYPE").ok();
    let display = std::env::var("WAYLAND_DISPLAY").ok();
    choose_backend(std::env::consts::OS, session.as_deref(), display.as_deref())
}

/// The id a host app registers with the portal, which accepts it only with that desktop file installed.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
const DESKTOP_ID: &str = "dev.kyu.karasu";

/// The app id to register, when its desktop file sits where the portal looks for one; else none.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn host_desktop_id(
    data_home: Option<&std::path::Path>,
    data_dirs: Option<&str>,
    exists: impl Fn(&std::path::Path) -> bool,
) -> Option<&'static str> {
    let system = data_dirs.filter(|d| !d.trim().is_empty()).unwrap_or("/usr/local/share:/usr/share");
    let dirs = data_home
        .map(std::path::Path::to_path_buf)
        .into_iter()
        .chain(system.split(':').filter(|d| !d.is_empty()).map(std::path::PathBuf::from));
    let file = format!("{DESKTOP_ID}.desktop");
    dirs.into_iter().any(|d| exists(&d.join("applications").join(&file))).then_some(DESKTOP_ID)
}

/// The stored accelerator in the XDG shortcuts spelling the portal takes, such as `CTRL+SHIFT+k`.
#[cfg(desktop)]
pub fn portal_trigger(accel: &str) -> Result<String, String> {
    use std::str::FromStr;
    use tauri_plugin_global_shortcut::{Modifiers, Shortcut};
    let shortcut = Shortcut::from_str(accel).map_err(|e| e.to_string())?;
    let mut parts: Vec<String> = [
        (Modifiers::CONTROL, "CTRL"),
        (Modifiers::ALT, "ALT"),
        (Modifiers::SHIFT, "SHIFT"),
        (Modifiers::SUPER, "LOGO"),
    ]
    .into_iter()
    .filter(|(flag, _)| shortcut.mods.contains(*flag))
    .map(|(_, name)| name.to_string())
    .collect();
    let code = shortcut.key.to_string();
    parts.push(keysym(&code).ok_or_else(|| format!("{code} cannot be offered to the desktop as a shortcut"))?);
    Ok(parts.join("+"))
}

/// A key code's xkb keysym name, unshifted; our own table, since global-hotkey's maps a few keys wrongly.
#[cfg(desktop)]
fn keysym(code: &str) -> Option<String> {
    if let Some(c) = code.strip_prefix("Key").filter(|c| c.len() == 1) {
        return Some(c.to_ascii_lowercase());
    }
    if let Some(d) = code.strip_prefix("Digit").filter(|d| d.len() == 1) {
        return Some(d.to_string());
    }
    if let Some(n) = code.strip_prefix("Numpad").filter(|n| n.len() == 1 && n.chars().all(|c| c.is_ascii_digit())) {
        return Some(format!("KP_{n}"));
    }
    if code.strip_prefix('F').and_then(|n| n.parse::<u8>().ok()).is_some_and(|n| (1..=24).contains(&n)) {
        return Some(code.to_string());
    }
    let name = match code {
        "Enter" => "Return",
        "Space" => "space",
        "Tab" => "Tab",
        "Backspace" => "BackSpace",
        "Escape" => "Escape",
        "Delete" => "Delete",
        "Insert" => "Insert",
        "Home" => "Home",
        "End" => "End",
        "PageUp" => "Page_Up",
        "PageDown" => "Page_Down",
        "ArrowUp" => "Up",
        "ArrowDown" => "Down",
        "ArrowLeft" => "Left",
        "ArrowRight" => "Right",
        "Minus" => "minus",
        "Equal" => "equal",
        "BracketLeft" => "bracketleft",
        "BracketRight" => "bracketright",
        "Backslash" => "backslash",
        "Semicolon" => "semicolon",
        "Quote" => "apostrophe",
        "Backquote" => "grave",
        "Comma" => "comma",
        "Period" => "period",
        "Slash" => "slash",
        "NumpadAdd" => "KP_Add",
        "NumpadSubtract" => "KP_Subtract",
        "NumpadMultiply" => "KP_Multiply",
        "NumpadDivide" => "KP_Divide",
        "NumpadDecimal" => "KP_Decimal",
        "NumpadEnter" => "KP_Enter",
        "PrintScreen" => "Print",
        "ScrollLock" => "Scroll_Lock",
        "Pause" => "Pause",
        "NumLock" => "Num_Lock",
        "CapsLock" => "Caps_Lock",
        "MediaPlayPause" => "XF86AudioPlay",
        "MediaStop" => "XF86AudioStop",
        "MediaTrackNext" => "XF86AudioNext",
        "MediaTrackPrevious" => "XF86AudioPrev",
        "AudioVolumeUp" => "XF86AudioRaiseVolume",
        "AudioVolumeDown" => "XF86AudioLowerVolume",
        "AudioVolumeMute" => "XF86AudioMute",
        _ => return None,
    };
    Some(name.to_string())
}

/// Hands the key to the desktop's portal; only Linux has one, so elsewhere this reports it missing.
#[cfg(all(desktop, not(target_os = "linux")))]
pub fn bind_portal(app: &tauri::AppHandle, _accel: Option<String>) {
    publish(app, HotkeyStatus::new(HotkeyBackend::Portal, HotkeyState::NoPortal));
}

/// Hands the key to the desktop's portal, which may ask the user first; the verdict arrives as a status.
#[cfg(target_os = "linux")]
pub fn bind_portal(app: &tauri::AppHandle, accel: Option<String>) {
    portal::bind(app.clone(), accel);
}

/// Opens the desktop's own dialog for changing the key, which only the portal's second version has.
#[cfg(all(desktop, not(target_os = "linux")))]
pub async fn configure_portal() -> Result<(), String> {
    Err("the desktop offers no shortcut dialog here".into())
}

#[cfg(target_os = "linux")]
pub async fn configure_portal() -> Result<(), String> {
    portal::configure().await
}

#[cfg(mobile)]
pub async fn configure_portal() -> Result<(), String> {
    Err("global shortcuts are not available on this platform".into())
}

/// Whether a portal error means there is no portal to talk to, rather than one that refused.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn means_no_portal(error: &str) -> bool {
    ["ServiceUnknown", "NameHasNoOwner", "was not provided by any .service files", "A portal frontend implementing"]
        .iter()
        .any(|marker| error.contains(marker))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn a_missing_portal_service_is_told_from_a_refusal() {
        assert!(means_no_portal("org.freedesktop.DBus.Error.ServiceUnknown: The name is not activatable"));
        assert!(means_no_portal("org.freedesktop.DBus.Error.NameHasNoOwner: Could not get owner"));
        assert!(!means_no_portal("org.freedesktop.portal.Error.NotAllowed: An app id is required"));
        assert!(!means_no_portal("org.freedesktop.portal.Error.Failed: Session already has bound shortcuts"));
    }

    #[test]
    fn a_wayland_session_hands_the_key_to_the_portal() {
        assert_eq!(choose_backend("linux", Some("wayland"), None), HotkeyBackend::Portal);
        assert_eq!(choose_backend("linux", Some("x11"), Some("wayland-0")), HotkeyBackend::Grab);
        assert_eq!(choose_backend("linux", None, Some("wayland-0")), HotkeyBackend::Portal);
        assert_eq!(choose_backend("linux", Some("tty"), None), HotkeyBackend::Grab);
        assert_eq!(choose_backend("linux", None, Some("  ")), HotkeyBackend::Grab);
        assert_eq!(choose_backend("windows", Some("wayland"), Some("wayland-0")), HotkeyBackend::Grab);
    }

    #[test]
    fn the_accelerator_is_spelt_the_way_the_portal_reads_it() {
        assert_eq!(portal_trigger("Ctrl+Shift+K").unwrap(), "CTRL+SHIFT+k");
        assert_eq!(portal_trigger("super+alt+Space").unwrap(), "ALT+LOGO+space");
        assert_eq!(portal_trigger("CmdOrCtrl+F12").unwrap(), "CTRL+F12");
        assert_eq!(portal_trigger("Alt+Digit1").unwrap(), "ALT+1");
        assert_eq!(portal_trigger("Shift+Quote").unwrap(), "SHIFT+apostrophe");
        assert_eq!(portal_trigger("Ctrl+NumLock").unwrap(), "CTRL+Num_Lock");
        assert!(portal_trigger("Ctrl+Nonsense").is_err());
    }

    #[test]
    fn the_app_id_is_offered_only_with_its_desktop_file_installed() {
        let at = |path: &'static str| move |p: &Path| p == Path::new(path);
        assert_eq!(
            host_desktop_id(None, None, at("/usr/share/applications/dev.kyu.karasu.desktop")),
            Some("dev.kyu.karasu")
        );
        assert_eq!(
            host_desktop_id(Some(Path::new("/home/k/.local/share")), Some("/opt/share"), at("/home/k/.local/share/applications/dev.kyu.karasu.desktop")),
            Some("dev.kyu.karasu")
        );
        assert_eq!(host_desktop_id(None, Some("/opt/share"), at("/usr/share/applications/dev.kyu.karasu.desktop")), None);
        assert_eq!(host_desktop_id(None, None, |_| false), None);
    }
}
