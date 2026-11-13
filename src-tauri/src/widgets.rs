//! The Android home-screen widgets' projection file; Rust owns the format so a `MIGRATION_V*` cannot break a widget.

use serde_json::{json, Value};

use crate::i18n::Lang;
use crate::titles::TitleLanguage;

/// Rows per list — a widget shows a handful, and the file stays small.
const MAX_ROWS: usize = 8;
/// The airing window, and the calendar's whole span.
const WEEK_MS: i64 = 7 * 24 * 60 * 60 * 1000;

/// The widget captions, read from the same catalogs as `Msg` but kept apart from it, because no toast ever renders them.
fn labels(lang: Lang) -> Value {
    let t = |key| crate::i18n::template(lang, key);
    json!({
        "airingToday": t("widgetAiringToday"),
        "continueWatching": t("widgetContinueWatching"),
        "continueReading": t("widgetContinueReading"),
        "week": t("widgetWeek"),
        "episode": t("widgetEpisode"),
        "empty": t("widgetEmpty"),
        "stale": t("widgetStale"),
        "upNext": t("widgetUpNext"),
        "latest": t("widgetLatest"),
        "chapter": t("widgetChapter"),
        "aired": t("widgetAired"),
        "stats": t("widgetStats"),
        "statsAnime": t("widgetStatsAnime"),
        "statsManga": t("widgetStatsManga"),
        "days": t("widgetStatDays"),
        "episodes": t("widgetStatEpisodes"),
        "chapters": t("widgetStatChapters"),
        "meanScore": t("widgetStatMeanScore"),
        "titles": t("widgetStatTitles"),
        "current": t("widgetStatCurrent"),
        "completed": t("widgetStatCompleted"),
        "planning": t("widgetStatPlanning"),
        "paused": t("widgetStatPaused"),
        "dropped": t("widgetStatDropped"),
        "completedInYear": t("widgetStatCompletedInYear"),
    })
}

/// Monday-first short day names, indexable by Kotlin from the epoch ms; one space-separated line in the catalog.
fn day_names(lang: Lang) -> Value {
    json!(crate::i18n::template(lang, "widgetDays").split_whitespace().collect::<Vec<_>>())
}

/// The entry's title in the user's title language, as every other composed text spells it.
fn title_of(media: &Value, titles: TitleLanguage) -> String {
    crate::titles::pick_json(titles, media.get("title")).unwrap_or_else(|| "—".to_string())
}

/// Every visible CURRENT/REPEATING entry, content-filtered, with custom lists skipped as duplicates.
fn watching_rows<'a>(payload: &'a Value, level: &str, hide_adult: bool) -> Vec<&'a Value> {
    visible_rows(payload, level, hide_adult, &["CURRENT", "REPEATING"])
}

/// Every visible entry in one of `statuses`, content-filtered, with custom lists skipped as duplicates.
fn visible_rows<'a>(
    payload: &'a Value,
    level: &str,
    hide_adult: bool,
    statuses: &[&str],
) -> Vec<&'a Value> {
    let mut out = Vec::new();
    let Some(lists) = payload.as_array() else {
        return out;
    };
    for group in lists {
        if group["isCustomList"].as_bool() == Some(true) {
            continue;
        }
        let Some(entries) = group["entries"].as_array() else {
            continue;
        };
        for e in entries {
            let status = e["status"].as_str().unwrap_or("");
            if !statuses.contains(&status) {
                continue;
            }
            let media = &e["media"];
            if crate::commands::media_blocked(media, level) {
                continue;
            }
            if hide_adult && media["isAdult"].as_bool() == Some(true) {
                continue;
            }
            out.push(e);
        }
    }
    out
}

/// The continue-list projection: newest activity first.
fn continue_rows(entries: &[&Value], total_key: &str, titles: TitleLanguage) -> Value {
    let mut rows: Vec<&&Value> = entries.iter().collect();
    rows.sort_by_key(|e| -(e["updatedAt"].as_i64().unwrap_or(0)));
    Value::Array(
        rows.iter()
            .take(MAX_ROWS)
            .map(|e| {
                json!({
                    "id": e["media"]["id"].as_i64().unwrap_or(0),
                    "title": title_of(&e["media"], titles),
                    "progress": e["progress"].as_i64().unwrap_or(0),
                    "total": e["media"][total_key].as_i64(),
                })
            })
            .collect(),
    )
}

/// Next episodes inside the coming week, soonest first.
fn airing_rows(entries: &[&Value], now_ms: i64, titles: TitleLanguage) -> Value {
    let mut rows: Vec<(i64, i64, String, i64)> = entries
        .iter()
        .filter_map(|e| {
            let next = &e["media"]["nextAiringEpisode"];
            let at_ms = next["airingAt"].as_i64()? * 1000;
            if at_ms < now_ms - 60 * 60 * 1000 || at_ms > now_ms + WEEK_MS {
                return None;
            }
            Some((
                at_ms,
                next["episode"].as_i64().unwrap_or(0),
                title_of(&e["media"], titles),
                e["media"]["id"].as_i64().unwrap_or(0),
            ))
        })
        .collect();
    rows.sort();
    Value::Array(
        rows.into_iter()
            .take(MAX_ROWS * 2)
            .map(|(at_ms, episode, title, id)| {
                json!({ "id": id, "title": title, "episode": episode, "airingAtMs": at_ms })
            })
            .collect(),
    )
}

/// The civil year of an epoch in UTC, by the days-to-civil arithmetic, so the projection needs no date crate.
fn year_of(ms: i64) -> i64 {
    let z = ms.div_euclid(86_400_000) + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let month = (5 * doy + 2) / 153;
    yoe + era * 400 + i64::from(month >= 10)
}

/// One list's figures for the statistics widgets, from the cached list alone; hidden titles count, since none is named.
fn stats(payload: &Value, total_key: &str, now_ms: i64) -> Value {
    let year = year_of(now_ms);
    let mut counts = [0i64; 5];
    let (mut units, mut minutes, mut score_sum, mut scored, mut last_year) = (0i64, 0i64, 0f64, 0i64, 0i64);
    let mut months = [0i64; 12];
    let groups = payload.as_array().map(Vec::as_slice).unwrap_or(&[]);
    for group in groups.iter().filter(|g| g["isCustomList"].as_bool() != Some(true)) {
        for e in group["entries"].as_array().map(Vec::as_slice).unwrap_or(&[]) {
            let slot = match e["status"].as_str().unwrap_or("") {
                "CURRENT" | "REPEATING" => 0,
                "COMPLETED" => 1,
                "PLANNING" => 2,
                "PAUSED" => 3,
                "DROPPED" => 4,
                _ => continue,
            };
            counts[slot] += 1;
            let media = &e["media"];
            let seen = e["progress"].as_i64().unwrap_or(0)
                + e["repeat"].as_i64().unwrap_or(0) * media[total_key].as_i64().unwrap_or(0);
            units += seen;
            minutes += seen * media["duration"].as_i64().unwrap_or(0);
            let score = e["score"].as_f64().unwrap_or(0.0);
            if score > 0.0 {
                score_sum += score;
                scored += 1;
            }
            let done = &e["completedAt"];
            match (done["year"].as_i64(), done["month"].as_i64()) {
                (Some(y), Some(m)) if y == year && (1..=12).contains(&m) => months[(m - 1) as usize] += 1,
                (Some(y), _) if y == year - 1 => last_year += 1,
                _ => {}
            }
        }
    }
    json!({
        "total": counts.iter().sum::<i64>(),
        "current": counts[0],
        "completed": counts[1],
        "planning": counts[2],
        "paused": counts[3],
        "dropped": counts[4],
        "units": units,
        "minutes": minutes,
        "meanScore": if scored > 0 { Some(score_sum / scored as f64) } else { None },
        "year": year,
        "months": months,
        "lastYear": last_year,
    })
}

/// What the projection carries beside the lists: each placed widget's settings and the app's accent.
#[derive(Default)]
pub struct Extras {
    pub config: Value,
    pub accent: Option<String>,
}

/// The cover every row may draw, as `(media id, url)`, deduplicated; adult and filtered titles never reach a row.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
fn cover_targets(lists: &[&[&Value]], now_ms: i64) -> Vec<(i64, String)> {
    let mut out: Vec<(i64, String)> = Vec::new();
    for (i, entries) in lists.iter().enumerate() {
        let mut rows: Vec<&&Value> = entries.iter().collect();
        rows.sort_by_key(|e| -(e["updatedAt"].as_i64().unwrap_or(0)));
        // The first list is the anime one, whose airing rows are chosen by time, not by activity.
        let airing = (i == 0).then(|| {
            entries.iter().filter(|e| {
                let at = e["media"]["nextAiringEpisode"]["airingAt"].as_i64().unwrap_or(0) * 1000;
                at >= now_ms - 60 * 60 * 1000 && at <= now_ms + WEEK_MS
            })
        });
        for e in rows.into_iter().take(MAX_ROWS).chain(airing.into_iter().flatten().take(MAX_ROWS * 2)) {
            let media = &e["media"];
            let (Some(id), Some(url)) = (media["id"].as_i64(), media["coverImage"]["large"].as_str()) else {
                continue;
            };
            if !out.iter().any(|(have, _)| *have == id) {
                out.push((id, url.to_string()));
            }
        }
    }
    out
}

/// The whole projection, pure and tested; the allow keeps the chain live on desktop, where only tests call it.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
#[allow(clippy::too_many_arguments)]
pub fn project(
    anime_payload: Option<&Value>,
    manga_payload: Option<&Value>,
    level: &str,
    hide_adult: bool,
    lang: Lang,
    titles: TitleLanguage,
    now_ms: i64,
    extras: &Extras,
) -> Value {
    let empty = Value::Array(Vec::new());
    let anime_payload = anime_payload.unwrap_or(&empty);
    let manga_payload = manga_payload.unwrap_or(&empty);
    let anime = watching_rows(anime_payload, level, hide_adult);
    let manga = watching_rows(manga_payload, level, hide_adult);
    let plan_anime = visible_rows(anime_payload, level, hide_adult, &["PLANNING"]);
    let plan_manga = visible_rows(manga_payload, level, hide_adult, &["PLANNING"]);

    json!({
        "generatedAtMs": now_ms,
        "labels": labels(lang),
        "days": day_names(lang),
        "airing": airing_rows(&anime, now_ms, titles),
        "continueWatching": continue_rows(&anime, "episodes", titles),
        "continueReading": continue_rows(&manga, "chapters", titles),
        "planWatching": continue_rows(&plan_anime, "episodes", titles),
        "planReading": continue_rows(&plan_manga, "chapters", titles),
        "stats": {
            "anime": stats(anime_payload, "episodes", now_ms),
            "manga": stats(manga_payload, "chapters", now_ms),
        },
        "config": if extras.config.is_object() { extras.config.clone() } else { json!({}) },
        "accent": extras.accent,
    })
}

/// Re-projects and rewrites the file from the database; cheap enough for every hook, and a no-op off Android.
pub fn refresh(app: &tauri::AppHandle) {
    write_projection(app);
}

#[cfg(not(target_os = "android"))]
fn write_projection(_app: &tauri::AppHandle) {}

#[cfg(target_os = "android")]
fn write_projection(app: &tauri::AppHandle) {
    use tauri::Manager;
    let db = app.state::<crate::db::Db>();
    let Some(user_id) = db
        .kv_get("anilist_viewer")
        .and_then(|s| serde_json::from_str::<Value>(&s).ok())
        .and_then(|v| v["id"].as_i64())
    else {
        return;
    };
    let parse = |t: &str| {
        db.cached_list(user_id, t)
            .and_then(|p| serde_json::from_str::<Value>(&p).ok())
    };
    let anime = parse("ANIME");
    let manga = parse("MANGA");
    let level = crate::commands::read_content_filter(&db);
    let hide_adult = crate::commands::read_blur_adult(&db);
    let lang = crate::i18n::lang(&db);
    let now = crate::alerts::notify::now_ms();
    let doc = project(
        anime.as_ref(),
        manga.as_ref(),
        &level,
        hide_adult,
        lang,
        crate::titles::title_language(&db),
        now,
        &Extras { config: stored_configs(&db), accent: db.kv_get(ACCENT_KEY) },
    );

    let Some(path) = crate::portable::mobile_secret_file("widgets.json") else {
        return;
    };
    if let Err(e) = std::fs::write(&path, doc.to_string()) {
        crate::logging::warn("widgets", format!("cannot write the projection: {e}"));
        return;
    }
    poke_refresher();

    let empty = Value::Array(Vec::new());
    let rows = |payload: &Option<Value>, statuses: &[&str]| -> Vec<Value> {
        visible_rows(payload.as_ref().unwrap_or(&empty), &level, hide_adult, statuses)
            .into_iter()
            .cloned()
            .collect()
    };
    let lists = [
        rows(&anime, &["CURRENT", "REPEATING"]),
        rows(&manga, &["CURRENT", "REPEATING"]),
        rows(&anime, &["PLANNING"]),
        rows(&manga, &["PLANNING"]),
    ];
    let borrowed: Vec<Vec<&Value>> = lists.iter().map(|l| l.iter().collect()).collect();
    let slices: Vec<&[&Value]> = borrowed.iter().map(Vec::as_slice).collect();
    covers::sync(cover_targets(&slices, now));
}

/// The kv prefix of one placed widget's settings, keyed by Android's widget id.
pub const CONFIG_PREFIX: &str = "widget_config:";
/// The app's accent as the theme store last mirrored it, for a widget set to follow the app.
pub const ACCENT_KEY: &str = "widget_accent";

/// Every stored widget setting as one object keyed by widget id; a row that does not parse is left out.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
fn stored_configs(db: &crate::db::Db) -> Value {
    let mut out = serde_json::Map::new();
    for (key, value) in db.kv_prefixed(CONFIG_PREFIX) {
        if let Ok(parsed) = serde_json::from_str::<Value>(&value) {
            out.insert(key[CONFIG_PREFIX.len()..].to_string(), parsed);
        }
    }
    Value::Object(out)
}

/// The cover files the widgets draw from, fetched from AniList's image host so the widget itself never needs a network.
#[cfg(target_os = "android")]
mod covers {
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};

    static RUNNING: AtomicBool = AtomicBool::new(false);
    static FAILED_AT_MS: AtomicI64 = AtomicI64::new(0);
    /// After a failed fetch nothing is tried again for this long, so an offline phone does not retry on every save.
    const BACKOFF_MS: i64 = 10 * 60 * 1000;
    /// No cover comes near this; a larger answer is not one.
    const MAX_BYTES: usize = 1024 * 1024;

    /// Android's cache directory, which no backup carries and the system may empty.
    pub fn dir() -> Option<PathBuf> {
        Some(crate::portable::mobile_secret_file("cache")?.join("widget-covers"))
    }

    /// Fetches the wanted covers that are missing, drops the files nothing wants, and redraws when one arrived.
    pub fn sync(wanted: Vec<(i64, String)>) {
        let Some(dir) = dir() else { return };
        if std::fs::create_dir_all(&dir).is_err() {
            return;
        }
        if let Ok(files) = std::fs::read_dir(&dir) {
            for file in files.flatten() {
                let name = file.file_name().to_string_lossy().to_string();
                if !wanted.iter().any(|(id, _)| name == id.to_string()) {
                    let _ = std::fs::remove_file(file.path());
                }
            }
        }
        let missing: Vec<(i64, String)> =
            wanted.into_iter().filter(|(id, _)| !dir.join(id.to_string()).exists()).collect();
        let now = crate::alerts::notify::now_ms();
        if missing.is_empty() || now - FAILED_AT_MS.load(Ordering::Relaxed) < BACKOFF_MS {
            return;
        }
        if RUNNING.swap(true, Ordering::SeqCst) {
            return;
        }
        tauri::async_runtime::spawn(async move {
            let fetched = fetch_all(&dir, missing).await;
            RUNNING.store(false, Ordering::SeqCst);
            if fetched > 0 {
                super::poke_refresher();
            }
        });
    }

    async fn fetch_all(dir: &std::path::Path, missing: Vec<(i64, String)>) -> usize {
        let Ok(client) = crate::net::client_builder().timeout(std::time::Duration::from_secs(15)).build() else {
            return 0;
        };
        let mut fetched = 0;
        for (id, url) in missing {
            match fetch_one(&client, &url).await {
                Some(bytes) => {
                    let part = dir.join(format!("{id}.part"));
                    if std::fs::write(&part, &bytes).is_ok() && std::fs::rename(&part, dir.join(id.to_string())).is_ok() {
                        fetched += 1;
                    }
                }
                None => {
                    FAILED_AT_MS.store(crate::alerts::notify::now_ms(), Ordering::Relaxed);
                    break;
                }
            }
        }
        fetched
    }

    /// One cover's bytes, only over https from an anilist.co host and only when they start like a JPEG, PNG or WebP.
    async fn fetch_one(client: &reqwest::Client, url: &str) -> Option<Vec<u8>> {
        let parsed = reqwest::Url::parse(url).ok()?;
        let host = parsed.host_str()?;
        if parsed.scheme() != "https" || !(host == "anilist.co" || host.ends_with(".anilist.co")) {
            return None;
        }
        let response = client.get(parsed).send().await.ok()?.error_for_status().ok()?;
        let bytes = response.bytes().await.ok()?;
        let image = bytes.starts_with(&[0xff, 0xd8]) || bytes.starts_with(b"\x89PNG") || bytes.starts_with(b"RIFF");
        (image && bytes.len() <= MAX_BYTES).then(|| bytes.to_vec())
    }

    pub fn clear() {
        if let Some(dir) = dir() {
            let _ = std::fs::remove_dir_all(dir);
        }
    }
}

/// Broadcasts the widget update through Kotlin's `WidgetRefresher` so placed widgets re-render the fresh file.
#[cfg(target_os = "android")]
fn poke_refresher() {
    let go = || -> Result<(), String> {
        let ctx = tao::platform::android::prelude::main_android_context()
            .ok_or("widgets: the android context is not ready yet")?;
        let vm = unsafe { jni::JavaVM::from_raw(ctx.java_vm.cast()) }
            .map_err(|e| format!("widgets vm: {e}"))?;
        let mut env = vm
            .attach_current_thread()
            .map_err(|e| format!("widgets attach: {e}"))?;
        let activity =
            unsafe { jni::objects::JObject::from_raw(ctx.context_jobject.cast()) };
        let result = (|| -> jni::errors::Result<()> {
            let loader = env
                .call_method(&activity, "getClassLoader", "()Ljava/lang/ClassLoader;", &[])?
                .l()?;
            let name = env.new_string("dev.kyu.karasu.WidgetRefresher")?;
            let class = env
                .call_method(
                    &loader,
                    "loadClass",
                    "(Ljava/lang/String;)Ljava/lang/Class;",
                    &[jni::objects::JValue::Object(&name)],
                )?
                .l()?;
            env.call_static_method(
                &jni::objects::JClass::from(class),
                "refresh",
                "(Landroid/content/Context;)V",
                &[jni::objects::JValue::Object(&activity)],
            )?;
            Ok(())
        })();
        result.map_err(|e| {
            if env.exception_check().unwrap_or(false) {
                let _ = env.exception_clear();
            }
            format!("widgets refresh: {e}")
        })
    };
    if let Err(e) = go() {
        crate::logging::debug_changed("widgets", "poke", e);
    }
}

/// Sign-out: the projection holds list titles, so the file must not outlive the account it describes.
pub fn clear() {
    remove_projection();
}

#[cfg(target_os = "android")]
fn remove_projection() {
    if let Some(path) = crate::portable::mobile_secret_file("widgets.json") {
        let _ = std::fs::remove_file(path);
    }
    covers::clear();
}

#[cfg(not(target_os = "android"))]
fn remove_projection() {}

#[cfg(test)]
mod tests {
    use super::*;

    fn payload(entries: Value) -> Value {
        json!([{ "isCustomList": false, "entries": entries }])
    }

    fn entry(status: &str, progress: i64, updated: i64, title: &str) -> Value {
        json!({
            "status": status,
            "progress": progress,
            "updatedAt": updated,
            "media": {
                "title": { "romaji": title, "english": null, "native": null },
                "episodes": 12,
                "chapters": null,
                "isAdult": false,
                "genres": [],
                "nextAiringEpisode": null,
            },
        })
    }

    #[test]
    fn only_current_and_repeating_rows_survive_sorted_by_activity() {
        let p = payload(json!([
            entry("CURRENT", 3, 100, "Old"),
            entry("COMPLETED", 12, 500, "Done"),
            entry("REPEATING", 5, 300, "Again"),
        ]));
        let doc = project(Some(&p), None, "off", false, Lang::En, TitleLanguage::English, 0, &Extras::default());
        let rows = doc["continueWatching"].as_array().unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0]["title"], "Again");
        assert_eq!(rows[1]["title"], "Old");
    }

    #[test]
    fn the_filter_and_the_blur_both_hide_on_the_home_screen() {
        let mut adult = entry("CURRENT", 1, 100, "Hidden");
        adult["media"]["isAdult"] = json!(true);
        let p = payload(json!([adult, entry("CURRENT", 1, 50, "Shown")]));

        // Filter level catches it…
        let doc = project(Some(&p), None, "moderate", false, Lang::En, TitleLanguage::English, 0, &Extras::default());
        let rows = doc["continueWatching"].as_array().unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0]["title"], "Shown");

        // …and with the filter off, blur-adult still hides rather than blurs.
        let doc = project(Some(&p), None, "off", true, Lang::En, TitleLanguage::English, 0, &Extras::default());
        assert_eq!(doc["continueWatching"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn airing_rows_keep_only_the_coming_week_soonest_first() {
        let now = 1_000_000_000_000i64;
        let with_airing = |title: &str, at_s: i64| {
            let mut e = entry("CURRENT", 1, 0, title);
            e["media"]["nextAiringEpisode"] = json!({ "episode": 2, "airingAt": at_s });
            e
        };
        let p = payload(json!([
            with_airing("Later", now / 1000 + 3600 * 30),
            with_airing("Soon", now / 1000 + 3600),
            with_airing("NextMonth", now / 1000 + 3600 * 24 * 20),
            entry("CURRENT", 1, 0, "NoSchedule"),
        ]));
        let doc = project(Some(&p), None, "off", false, Lang::En, TitleLanguage::English, now, &Extras::default());
        let rows = doc["airing"].as_array().unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0]["title"], "Soon");
        assert_eq!(rows[1]["title"], "Later");
        // Raw ms, for Kotlin to bucket at render time.
        assert!(rows[0]["airingAtMs"].as_i64().unwrap() > now);
    }

    #[test]
    fn custom_lists_do_not_duplicate_rows() {
        let doc = project(
            Some(&json!([
                { "isCustomList": true, "entries": [entry("CURRENT", 1, 0, "Dup")] },
                { "isCustomList": false, "entries": [entry("CURRENT", 1, 0, "Dup")] },
            ])),
            None,
            "off",
            false,
            Lang::En,
            TitleLanguage::English,
            0,
            &Extras::default(),
        );
        assert_eq!(doc["continueWatching"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn rows_follow_the_title_language() {
        let mut e = entry("CURRENT", 1, 0, "Sousou no Frieren");
        e["media"]["title"]["english"] = json!("Frieren: Beyond Journey's End");
        e["media"]["title"]["native"] = json!("葬送のフリーレン");
        let p = payload(json!([e]));
        let title = |titles| project(Some(&p), None, "off", false, Lang::En, titles, 0, &Extras::default())["continueWatching"][0]["title"].clone();
        assert_eq!(title(TitleLanguage::English), "Frieren: Beyond Journey's End");
        assert_eq!(title(TitleLanguage::Romaji), "Sousou no Frieren");
        assert_eq!(title(TitleLanguage::Native), "葬送のフリーレン");
    }

    /// Widgets.kt reads this file with no schema of its own, so the shape is pinned here as a snapshot, both locales.
    #[test]
    fn the_projection_keeps_its_shape() {
        let now = 1_000_000_000_000i64;
        let mut airing = entry("CURRENT", 4, 200, "Soon");
        airing["media"]["nextAiringEpisode"] = json!({ "episode": 5, "airingAt": now / 1000 + 3600 });
        let anime = payload(json!([airing, entry("REPEATING", 9, 100, "Again")]));
        let manga = payload(json!([entry("CURRENT", 31, 150, "Pages")]));
        insta::assert_json_snapshot!("projection_en", project(Some(&anime), Some(&manga), "off", false, Lang::En, TitleLanguage::English, now, &Extras::default()));
        insta::assert_json_snapshot!("projection_de", project(Some(&anime), Some(&manga), "off", false, Lang::De, TitleLanguage::English, now, &Extras::default()));
    }

    #[test]
    fn the_year_is_the_civil_one() {
        assert_eq!(year_of(0), 1970);
        assert_eq!(year_of(1_000_000_000_000), 2001);
        assert_eq!(year_of(1_798_761_599_000), 2026);
        assert_eq!(year_of(1_798_761_600_000), 2027);
    }

    #[test]
    fn stats_count_every_status_and_a_rewatch_as_a_whole_run() {
        let now = 1_794_000_000_000i64;
        let mut done = entry("COMPLETED", 12, 1, "Done");
        done["score"] = json!(8.0);
        done["repeat"] = json!(1);
        done["media"]["duration"] = json!(24);
        done["completedAt"] = json!({ "year": 2026, "month": 3, "day": 1 });
        let mut older = entry("COMPLETED", 12, 1, "Older");
        older["score"] = json!(6.0);
        older["completedAt"] = json!({ "year": 2025, "month": 12, "day": 31 });
        let p = payload(json!([done, older, entry("CURRENT", 3, 1, "Now"), entry("PLANNING", 0, 1, "Later")]));
        let s = stats(&p, "episodes", now);
        assert_eq!(s["total"], 4);
        assert_eq!(s["completed"], 2);
        assert_eq!(s["current"], 1);
        assert_eq!(s["planning"], 1);
        assert_eq!(s["units"], 12 + 12 + 12 + 3);
        assert_eq!(s["minutes"], 24 * 24);
        assert_eq!(s["meanScore"], 7.0);
        assert_eq!(s["year"], 2026);
        assert_eq!(s["months"][2], 1);
        assert_eq!(s["lastYear"], 1);
    }

    #[test]
    fn an_unscored_list_has_no_mean() {
        let p = payload(json!([entry("CURRENT", 3, 1, "Now")]));
        assert!(stats(&p, "episodes", 0)["meanScore"].is_null());
    }

    #[test]
    fn a_cover_is_wanted_once_per_title_and_only_with_an_address() {
        let mut a = entry("CURRENT", 1, 2, "A");
        a["media"]["id"] = json!(1);
        a["media"]["coverImage"] = json!({ "large": "https://s4.anilist.co/a.jpg" });
        a["media"]["nextAiringEpisode"] = json!({ "episode": 2, "airingAt": 10 });
        let mut b = entry("CURRENT", 1, 1, "B");
        b["media"]["id"] = json!(2);
        let rows = [&a, &b];
        let targets = cover_targets(&[&rows], 0);
        assert_eq!(targets, vec![(1, "https://s4.anilist.co/a.jpg".to_string())]);
    }

    #[test]
    fn the_projection_carries_each_widgets_settings_and_the_accent() {
        let extras = Extras { config: json!({ "7": { "opacity": 80 } }), accent: Some("#8b9dff".into()) };
        let doc = project(None, None, "off", false, Lang::En, TitleLanguage::English, 0, &extras);
        assert_eq!(doc["config"]["7"]["opacity"], 80);
        assert_eq!(doc["accent"], "#8b9dff");
        assert_eq!(project(None, None, "off", false, Lang::En, TitleLanguage::English, 0, &Extras::default())["config"], json!({}));
    }
}
