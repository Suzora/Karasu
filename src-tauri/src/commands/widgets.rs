//! The home-screen widgets' settings: which widgets are placed, and what each one was told to show.

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::Db;
use crate::widgets::{ACCENT_KEY, CONFIG_PREFIX};

/// One placed widget as Android names it: its id and which of the seven kinds it is.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, specta::Type)]
pub struct PlacedWidget {
    pub id: i32,
    pub kind: String,
}

/// What one placed widget shows; Widgets.kt reads the same field names out of the projection.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, specta::Type)]
#[serde(default)]
pub struct WidgetConfig {
    /// `current` or `planning`, for the two continue widgets.
    pub list: String,
    /// `anime` or `manga`, for the statistics widgets.
    pub media: String,
    /// Leaves the small rows under the large title out.
    pub compact: bool,
    /// `app` follows Karasu's accent, `system` Android's.
    pub accent: String,
    /// The background's opacity in percent.
    pub opacity: u8,
    /// `title` opens the tapped title, `list` the list it is on.
    pub tap: String,
}

impl Default for WidgetConfig {
    fn default() -> Self {
        Self {
            list: "current".into(),
            media: "anime".into(),
            compact: false,
            accent: "app".into(),
            opacity: 100,
            tap: "title".into(),
        }
    }
}

/// The lowest opacity a widget may take, under which its text stops being readable over a light wallpaper.
pub const MIN_OPACITY: u8 = 70;

/// A setting brought back inside what the widgets can draw, so a hand-made call cannot store nonsense.
pub fn sanitized(config: WidgetConfig) -> WidgetConfig {
    let one_of = |value: String, allowed: [&str; 2]| {
        if allowed.contains(&value.as_str()) { value } else { allowed[0].to_string() }
    };
    WidgetConfig {
        list: one_of(config.list, ["current", "planning"]),
        media: one_of(config.media, ["anime", "manga"]),
        compact: config.compact,
        accent: one_of(config.accent, ["app", "system"]),
        opacity: config.opacity.clamp(MIN_OPACITY, 100),
        tap: one_of(config.tap, ["title", "list"]),
    }
}

/// `#rrggbb` and nothing else, since the value is parsed as a colour by Kotlin.
pub fn is_hex_colour(text: &str) -> bool {
    text.len() == 7 && text.starts_with('#') && text[1..].chars().all(|c| c.is_ascii_hexdigit())
}

/// The widgets on the home screen right now; off Android there are none. Settings of removed widgets go with the read.
#[tauri::command]
#[specta::specta]
pub fn placed_widgets(db: State<'_, Db>) -> Vec<PlacedWidget> {
    let Some(placed) = read_placed() else {
        return Vec::new();
    };
    for (key, _) in db.kv_prefixed(CONFIG_PREFIX) {
        if !placed.iter().any(|w| w.id.to_string() == key[CONFIG_PREFIX.len()..]) {
            db.kv_delete(&key);
        }
    }
    placed
}

#[cfg(target_os = "android")]
fn read_placed() -> Option<Vec<PlacedWidget>> {
    serde_json::from_str(&crate::background::placed_widgets().ok()?).ok()
}

#[cfg(not(target_os = "android"))]
fn read_placed() -> Option<Vec<PlacedWidget>> {
    None
}

/// One widget's settings, or the defaults for a widget nobody has configured.
#[tauri::command]
#[specta::specta]
pub fn widget_config(db: State<'_, Db>, id: i32) -> WidgetConfig {
    db.kv_get(&format!("{CONFIG_PREFIX}{id}"))
        .and_then(|raw| serde_json::from_str::<WidgetConfig>(&raw).ok())
        .map(sanitized)
        .unwrap_or_default()
}

/// Stores one widget's settings and redraws the widgets from them.
#[tauri::command]
#[specta::specta]
pub fn set_widget_config(app: tauri::AppHandle, db: State<'_, Db>, id: i32, config: WidgetConfig) -> Result<(), String> {
    let raw = serde_json::to_string(&sanitized(config)).map_err(|e| e.to_string())?;
    db.kv_set(&format!("{CONFIG_PREFIX}{id}"), &raw)?;
    crate::widgets::refresh(&app);
    Ok(())
}

/// Mirrors the app's accent into kv, because a widget set to follow the app cannot read the theme store.
#[tauri::command]
#[specta::specta]
pub fn set_widget_accent(app: tauri::AppHandle, db: State<'_, Db>, hex: String) -> Result<(), String> {
    if !is_hex_colour(&hex) {
        return Err("not a colour".into());
    }
    if db.kv_get(ACCENT_KEY).as_deref() == Some(hex.as_str()) {
        return Ok(());
    }
    db.kv_set(ACCENT_KEY, &hex)?;
    crate::widgets::refresh(&app);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_setting_outside_the_vocabulary_falls_back_and_the_opacity_keeps_its_floor() {
        let odd = WidgetConfig { list: "everything".into(), accent: "#fff".into(), opacity: 5, tap: "list".into(), ..WidgetConfig::default() };
        let clean = sanitized(odd);
        assert_eq!(clean.list, "current");
        assert_eq!(clean.accent, "app");
        assert_eq!(clean.opacity, MIN_OPACITY);
        assert_eq!(clean.tap, "list");
    }

    #[test]
    fn a_stored_setting_missing_a_field_reads_with_the_default_for_it() {
        let parsed: WidgetConfig = serde_json::from_str(r#"{"opacity":80}"#).unwrap();
        assert_eq!(parsed, WidgetConfig { opacity: 80, ..WidgetConfig::default() });
    }

    #[test]
    fn only_a_six_digit_hex_is_a_colour() {
        assert!(is_hex_colour("#8b9dff"));
        assert!(!is_hex_colour("8b9dff0"));
        assert!(!is_hex_colour("#8b9dfg"));
        assert!(!is_hex_colour("#fff"));
    }
}
