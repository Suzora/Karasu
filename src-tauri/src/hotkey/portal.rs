//! The GlobalShortcuts portal half of the summon hotkey, for a Wayland session where no app may grab a key itself.

use super::{host_desktop_id, publish, HotkeyBackend, HotkeyState, HotkeyStatus};
use crate::sync::LockExt;
use ashpd::desktop::global_shortcuts::{GlobalShortcuts, NewShortcut, Shortcut};
use ashpd::desktop::Session;
use futures_util::StreamExt;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// The one shortcut id Karasu binds; the desktop keeps the user's key under it.
const SUMMON: &str = "summon";

/// The running binding, aborted by the next one, which also clears `LIVE` and with it the session's connection.
static TASK: Mutex<Option<tauri::async_runtime::JoinHandle<()>>> = Mutex::new(None);
/// The live portal and session, kept for a request to open the desktop's own shortcut dialog.
static LIVE: tokio::sync::Mutex<Option<(GlobalShortcuts, Session<GlobalShortcuts>)>> = tokio::sync::Mutex::const_new(None);

pub(super) fn bind(app: AppHandle, accel: Option<String>) {
    let mut task = TASK.guard();
    if let Some(old) = task.take() {
        old.abort();
    }
    let Some(accel) = accel else {
        tauri::async_runtime::spawn(async { LIVE.lock().await.take() });
        publish(&app, HotkeyStatus::new(HotkeyBackend::Portal, HotkeyState::Off));
        return;
    };
    publish(&app, HotkeyStatus::new(HotkeyBackend::Portal, HotkeyState::Pending));
    *task = Some(tauri::async_runtime::spawn(run(app, accel)));
}

pub(super) async fn configure() -> Result<(), String> {
    let live = LIVE.lock().await;
    let Some((portal, session)) = live.as_ref() else {
        return Err("no shortcut is bound with the desktop".into());
    };
    portal
        .configure_shortcuts(session, None, Default::default())
        .await
        .map_err(|e| e.to_string())
}

/// Gives up on the portal; short of a refusal the key goes back to the X11 grab, which still works in XWayland windows.
fn give_up(app: &AppHandle, accel: &str, state: HotkeyState, why: &str) {
    crate::logging::warn("hotkey", format!("the desktop's shortcut portal: {why}"));
    publish(app, HotkeyStatus::new(HotkeyBackend::Portal, state));
    if state == HotkeyState::Denied {
        // Remembered, or every launch would put the desktop's dialog in front of the user again.
        let _ = app.state::<crate::db::Db>().kv_set(super::DECLINED_KEY, accel);
        return;
    }
    if matches!(state, HotkeyState::NoPortal | HotkeyState::NoAppId | HotkeyState::Failed) {
        let (handle, accel) = (app.clone(), accel.to_string());
        let _ = app.run_on_main_thread(move || {
            if let Err(e) = crate::grab_global_hotkey(&handle, Some(&accel)) {
                crate::logging::warn("hotkey", format!("global hotkey '{accel}' failed to register: {e}"));
            }
        });
    }
}

/// The desktop's spelling of the summon key, or none where it leaves the key to its own settings.
fn trigger_of(shortcuts: &[Shortcut]) -> Option<String> {
    shortcuts
        .iter()
        .find(|s| s.id() == SUMMON)
        .map(|s| s.trigger_description().trim().to_string())
        .filter(|t| !t.is_empty())
}

async fn run(app: AppHandle, accel: String) {
    LIVE.lock().await.take();
    let trigger = match super::portal_trigger(&accel) {
        Ok(t) => t,
        Err(e) => return give_up(&app, &accel, HotkeyState::Failed, &e),
    };
    let connection = match zbus::Connection::session().await {
        Ok(c) => c,
        Err(e) => return give_up(&app, &accel, HotkeyState::NoPortal, &e.to_string()),
    };
    // A host app names itself first, on this connection and before any other portal call, or the portal sees no id.
    let data_home = std::env::var_os("XDG_DATA_HOME")
        .map(std::path::PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|h| std::path::PathBuf::from(h).join(".local/share")));
    let data_dirs = std::env::var("XDG_DATA_DIRS").ok();
    if let Some(id) = host_desktop_id(data_home.as_deref(), data_dirs.as_deref(), |p| p.exists()) {
        if let Ok(app_id) = ashpd::AppID::try_from(id) {
            // Older portals have no registry; the scope-derived id may still serve, so this is only worth a line.
            if let Err(e) = ashpd::register_host_app_with_connection(connection.clone(), app_id).await {
                crate::logging::info("hotkey", format!("the portal registry refused {id}: {e}"));
            }
        }
    }
    let portal = match GlobalShortcuts::with_connection(connection).await {
        Ok(p) => p,
        Err(e) => return give_up(&app, &accel, HotkeyState::NoPortal, &e.to_string()),
    };
    // Reading the version cannot tell a missing portal service apart, so the first real call does that below.
    let configurable = portal.version() >= 2;
    let session = match portal.create_session(Default::default()).await {
        Ok(s) => s,
        Err(e) => {
            let why = e.to_string();
            let state = if super::means_no_portal(&why) {
                HotkeyState::NoPortal
            } else if why.contains("app id") {
                HotkeyState::NoAppId
            } else {
                HotkeyState::Failed
            };
            return give_up(&app, &accel, state, &why);
        }
    };
    let description = {
        let db = app.state::<crate::db::Db>();
        crate::i18n::text(crate::i18n::lang(&db), crate::i18n::Msg::HotkeyDescription)
    };
    let shortcut = NewShortcut::new(SUMMON, description).preferred_trigger(trigger.as_str());
    let bound = match portal.bind_shortcuts(&session, &[shortcut], None, Default::default()).await {
        Ok(request) => request.response(),
        Err(e) => Err(e),
    };
    let bound = match bound {
        Ok(b) => b,
        // GNOME answers a cancel as its "other" response, so any answer short of success is the user's no.
        Err(ashpd::Error::Response(_)) => {
            return give_up(&app, &accel, HotkeyState::Denied, "the user declined the shortcut")
        }
        Err(e) => return give_up(&app, &accel, HotkeyState::Failed, &e.to_string()),
    };
    if !bound.shortcuts().iter().any(|s| s.id() == SUMMON) {
        return give_up(&app, &accel, HotkeyState::Denied, "the desktop left the shortcut unbound");
    }
    let _ = app.state::<crate::db::Db>().kv_remove(super::DECLINED_KEY);
    publish(
        &app,
        HotkeyStatus { backend: HotkeyBackend::Portal, state: HotkeyState::Bound, trigger: trigger_of(bound.shortcuts()), configurable },
    );
    let (mut activated, mut changed) = match (portal.receive_activated().await, portal.receive_shortcuts_changed().await) {
        (Ok(a), Ok(c)) => (a, c),
        (Err(e), _) | (_, Err(e)) => return give_up(&app, &accel, HotkeyState::Failed, &e.to_string()),
    };
    *LIVE.lock().await = Some((portal, session));
    loop {
        tokio::select! {
            Some(event) = activated.next() => {
                if event.shortcut_id() != SUMMON {
                    continue;
                }
                // The desktop's activation token lets the window take focus, which a Wayland compositor otherwise refuses.
                let token = event
                    .options()
                    .get("activation_token")
                    .and_then(|v| String::try_from(v.clone()).ok());
                let handle = app.clone();
                let _ = app.run_on_main_thread(move || raise(&handle, token));
            }
            Some(event) = changed.next() => {
                publish(
                    &app,
                    HotkeyStatus { backend: HotkeyBackend::Portal, state: HotkeyState::Bound, trigger: trigger_of(event.shortcuts()), configurable },
                );
            }
            else => break,
        }
    }
}

/// Hands the window the desktop's activation token, then toggles it the way the grab does.
fn raise(app: &AppHandle, token: Option<String>) {
    use gtk::prelude::GtkWindowExt;
    if let (Some(token), Some(window)) = (token, app.get_webview_window("main")) {
        if let Ok(gtk_window) = window.gtk_window() {
            gtk_window.set_startup_id(&token);
        }
    }
    crate::toggle_main_window(app);
}
