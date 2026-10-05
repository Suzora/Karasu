//! The site-notification summary toast, never a bell row; its kv vocabulary is shared with background.rs's Android job.

use crate::anilist::client::{AniList, ApiError, RATE_LIMITED};
use crate::db::Db;
use crate::i18n::{ActivityEvent, CaptionVerb, Lang, MediaEvent, Msg, SubmissionKind, ThreadEvent};
use crate::titles::TitleLanguage;
use serde_json::{json, Value};
use std::time::Duration;
use tauri::{AppHandle, Manager};

const TICK: Duration = Duration::from_secs(60);
const STARTUP_DELAY: Duration = Duration::from_secs(45);

pub const INTERVAL_KEY: &str = "notif_bg_interval_min";
/// The cursor per account; `switch_identity` clears it, since `kv_advance_max` only ever moves it forward.
pub(crate) const SEEN_KEY: &str = "site_notif_seen_id";
pub(crate) const LAST_CHECK_KEY: &str = "site_notif_last_check_ms";

/// Android's JobScheduler floor, one vocabulary on both platforms so the desktop cannot promise a faster cadence.
pub const INTERVAL_MIN: i64 = 15;
pub const INTERVAL_MAX: i64 = 720;

/// `0` = off (the default); anything else clamped to the shared bounds.
pub fn interval_min(db: &Db) -> i64 {
    let raw = db
        .kv_get(INTERVAL_KEY)
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(0);
    if raw <= 0 {
        0
    } else {
        raw.clamp(INTERVAL_MIN, INTERVAL_MAX)
    }
}

/// The one request, with what the newest row needs to be named; never any text a person wrote, and no reset.
pub(crate) const SITE_QUERY: &str = "
query {
  Viewer { unreadNotificationCount }
  Page(page: 1, perPage: 1) {
    notifications(type_in: [
      AIRING, FOLLOWING, ACTIVITY_MENTION, ACTIVITY_REPLY, ACTIVITY_REPLY_SUBSCRIBED,
      ACTIVITY_LIKE, ACTIVITY_REPLY_LIKE, THREAD_COMMENT_MENTION, THREAD_COMMENT_REPLY,
      THREAD_SUBSCRIBED, THREAD_COMMENT_LIKE, THREAD_LIKE, RELATED_MEDIA_ADDITION,
      MEDIA_DATA_CHANGE, MEDIA_MERGE, MEDIA_DELETION, MEDIA_SUBMISSION_UPDATE,
      STAFF_SUBMISSION_UPDATE, CHARACTER_SUBMISSION_UPDATE
    ]) {
      __typename
      ... on AiringNotification { id episode media { id title { romaji english native } isAdult genres } }
      ... on FollowingNotification { id user { name } }
      ... on ActivityMentionNotification { id user { name } }
      ... on ActivityReplyNotification { id user { name } activity { __typename ... on ListActivity { status progress media { title { romaji english native } isAdult genres } } } }
      ... on ActivityReplySubscribedNotification { id user { name } }
      ... on ActivityLikeNotification { id user { name } activity { __typename ... on ListActivity { status progress media { title { romaji english native } isAdult genres } } } }
      ... on ActivityReplyLikeNotification { id user { name } }
      ... on ThreadCommentMentionNotification { id user { name } thread { title } }
      ... on ThreadCommentReplyNotification { id user { name } thread { title } }
      ... on ThreadCommentSubscribedNotification { id user { name } thread { title } }
      ... on ThreadCommentLikeNotification { id user { name } thread { title } }
      ... on ThreadLikeNotification { id user { name } thread { title } }
      ... on RelatedMediaAdditionNotification { id media { title { romaji english native } isAdult genres } }
      ... on MediaDataChangeNotification { id media { title { romaji english native } isAdult genres } }
      ... on MediaMergeNotification { id media { title { romaji english native } isAdult genres } }
      ... on MediaDeletionNotification { id deletedMediaTitle }
      ... on MediaSubmissionUpdateNotification { id submittedTitle media { title { romaji english native } isAdult genres } }
      ... on StaffSubmissionUpdateNotification { id staff { name { full } } }
      ... on CharacterSubmissionUpdateNotification { id character { name { full } } }
    }
  }
}";

/// The same request with ids alone, for when AniList refuses the detailed one; the toast then counts instead of naming.
pub(crate) const SITE_QUERY_PLAIN: &str = "
query {
  Viewer { unreadNotificationCount }
  Page(page: 1, perPage: 1) {
    notifications(type_in: [
      AIRING, FOLLOWING, ACTIVITY_MENTION, ACTIVITY_REPLY, ACTIVITY_REPLY_SUBSCRIBED,
      ACTIVITY_LIKE, ACTIVITY_REPLY_LIKE, THREAD_COMMENT_MENTION, THREAD_COMMENT_REPLY,
      THREAD_SUBSCRIBED, THREAD_COMMENT_LIKE, THREAD_LIKE, RELATED_MEDIA_ADDITION,
      MEDIA_DATA_CHANGE, MEDIA_MERGE, MEDIA_DELETION, MEDIA_SUBMISSION_UPDATE,
      STAFF_SUBMISSION_UPDATE, CHARACTER_SUBMISSION_UPDATE
    ]) {
      __typename
      ... on AiringNotification { id }
      ... on FollowingNotification { id }
      ... on ActivityMentionNotification { id }
      ... on ActivityReplyNotification { id }
      ... on ActivityReplySubscribedNotification { id }
      ... on ActivityLikeNotification { id }
      ... on ActivityReplyLikeNotification { id }
      ... on ThreadCommentMentionNotification { id }
      ... on ThreadCommentReplyNotification { id }
      ... on ThreadCommentSubscribedNotification { id }
      ... on ThreadCommentLikeNotification { id }
      ... on ThreadLikeNotification { id }
      ... on RelatedMediaAdditionNotification { id }
      ... on MediaDataChangeNotification { id }
      ... on MediaMergeNotification { id }
      ... on MediaDeletionNotification { id }
      ... on MediaSubmissionUpdateNotification { id }
      ... on StaffSubmissionUpdateNotification { id }
      ... on CharacterSubmissionUpdateNotification { id }
    }
  }
}";

/// How long a failed check waits: neither the tick rate nor the whole configured interval.
const RETRY_AFTER_FAILURE_MS: i64 = 5 * 60_000;

pub fn spawn(app: AppHandle) {
    crate::logging::supervise("site", move || {
        let app = app.clone();
        async move {
            tokio::time::sleep(STARTUP_DELAY).await;
            loop {
                check(&app).await;
                tokio::time::sleep(TICK).await;
            }
        }
    });
}

async fn check(app: &AppHandle) {
    let db = app.state::<Db>();
    let interval = interval_min(&db);
    if interval == 0 {
        return;
    }
    let last = db
        .kv_get(LAST_CHECK_KEY)
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(0);
    if crate::alerts::notify::now_ms() - last < interval * 60_000 {
        return;
    }
    let Some(token) = crate::anilist::auth::load_token() else {
        return;
    };

    let api = app.state::<AniList>();
    let answer = match api.query_from("site", Some(&token), SITE_QUERY, json!({})).await {
        // Its own source, so "Requests by source" says how often the detailed answer was refused.
        Err(e) if wants_plain(&e) => {
            crate::logging::debug_changed("site", "detail", format!("detailed check refused: {e:?}"));
            api.query_from("sitePlain", Some(&token), SITE_QUERY_PLAIN, json!({})).await
        }
        other => other,
    };
    let data = match answer {
        Ok(d) => d,
        Err(e) => {
            // Once per transition, not per tick — the debug_changed lesson.
            crate::logging::debug_changed("site", "check", format!("check failed: {e:?}"));
            // Not a success stamp, yet not left unstamped: an unreachable server must not be polled at the tick rate.
            let interval_ms = interval * 60_000;
            let retry_in = interval_ms.min(RETRY_AFTER_FAILURE_MS);
            let _ = db.kv_set(
                LAST_CHECK_KEY,
                &(crate::alerts::notify::now_ms() - interval_ms + retry_in).to_string(),
            );
            return;
        }
    };
    // Stamped only on success: a failed fetch must not silence the next interval, nor Android's job.
    let _ = db.kv_set(
        LAST_CHECK_KEY,
        &crate::alerts::notify::now_ms().to_string(),
    );

    if let Some((title, body)) = announcement(&db, &data) {
        crate::alerts::notify::notify_toast_text(app, "site", &title, &body);
    }
}

/// Whether a refused detailed answer earns the plain one: never when the token, the budget or the connection failed.
pub(crate) fn wants_plain(e: &ApiError) -> bool {
    match e {
        ApiError::Network(_) | ApiError::Auth(_) => false,
        ApiError::Retryable(m) => m != RATE_LIMITED,
        ApiError::Api(_) => true,
    }
}

/// News this connection claimed; a zero unread count means it was read in the bell, so the toast stays quiet.
pub(crate) fn should_announce(seen: Option<i64>, newest: i64, unread: i64, advanced: bool) -> bool {
    // A first fetch ever only writes the baseline.
    matches!(seen, Some(s) if newest > s && unread > 0 && advanced)
}

/// Whether the airing watcher already toasted this episode, so the summary counts it rather than naming it twice.
pub(crate) fn airing_toasted(db: &Db, newest: &Value) -> bool {
    if newest.get("__typename").and_then(Value::as_str) != Some("AiringNotification") {
        return false;
    }
    let (Some(media), Some(episode)) = (
        newest.pointer("/media/id").and_then(Value::as_i64),
        newest.get("episode").and_then(Value::as_i64),
    ) else {
        return false;
    };
    db.kv_get(&format!("aired:{media}:{episode}")).is_some()
}

/// Whether the newest row is an episode of a title the user muted, so the summary counts it rather than naming it.
pub(crate) fn airing_muted(db: &Db, newest: &Value) -> bool {
    newest.get("__typename").and_then(Value::as_str) == Some("AiringNotification")
        && newest
            .pointer("/media/id")
            .and_then(Value::as_i64)
            .is_some_and(|id| crate::alerts::airing::is_muted(db, id))
}

/// AniList's status words as a verb, the closed set `lib/activity`'s `VERBS` also maps; anything else names no caption.
fn caption_verb(status: &str) -> Option<CaptionVerb> {
    Some(match status.trim().to_ascii_lowercase().as_str() {
        "watched episode" => CaptionVerb::WatchedEpisode,
        "rewatched episode" => CaptionVerb::RewatchedEpisode,
        "read chapter" => CaptionVerb::ReadChapter,
        "reread chapter" | "re-read chapter" => CaptionVerb::RereadChapter,
        "completed" => CaptionVerb::Completed,
        "plans to watch" => CaptionVerb::PlansToWatch,
        "plans to read" => CaptionVerb::PlansToRead,
        "dropped" => CaptionVerb::Dropped,
        "paused" => CaptionVerb::Paused,
        _ => return None,
    })
}

/// The verbs whose sentence carries a number.
fn counts(verb: CaptionVerb) -> bool {
    matches!(
        verb,
        CaptionVerb::WatchedEpisode
            | CaptionVerb::RewatchedEpisode
            | CaptionVerb::ReadChapter
            | CaptionVerb::RereadChapter
    )
}

/// `"12"` or `"162 - 170"` as `lib/activity`'s `formatProgress` writes it; a reversed or equal range is one number.
fn progress_text(progress: &str) -> Option<String> {
    let mut parts = progress.split('-').map(str::trim);
    let from = parts.next()?.parse::<u32>().ok()?;
    let to = match parts.next() {
        Some(t) => Some(t.parse::<u32>().ok()?),
        None => None,
    };
    if parts.next().is_some() {
        return None;
    }
    Some(match to {
        Some(to) if to > from => format!("{from}\u{2013}{to}"),
        _ => from.to_string(),
    })
}

/// What one notification may name and how; a lock screen cannot blur, so the blur setting hides explicit titles too.
struct Wording<'a> {
    lang: Lang,
    titles: TitleLanguage,
    level: &'a str,
    hide_adult: bool,
}

impl Wording<'_> {
    fn text(&self, msg: Msg<'_>) -> String {
        crate::i18n::text(self.lang, msg)
    }

    /// A title the filter lets through, in the title language, or nothing.
    fn title(&self, media: Option<&Value>) -> Option<String> {
        let media = media.filter(|m| m.is_object())?;
        if crate::commands::media_blocked(media, self.level) {
            return None;
        }
        if self.hide_adult && media.get("isAdult").and_then(Value::as_bool) == Some(true) {
            return None;
        }
        crate::titles::pick_json(self.titles, media.get("title"))
    }

    /// A bare title with nothing to check it against, named only when neither the filter nor the blur is on.
    fn unchecked(&self, title: Option<&str>) -> Option<String> {
        let title = title.map(str::trim).filter(|t| !t.is_empty())?;
        (self.level == "off" && !self.hide_adult).then(|| title.to_string())
    }

    /// The viewer's own list activity as a caption, when AniList sent one Karasu can word and may name.
    fn caption(&self, activity: Option<&Value>) -> Option<String> {
        let activity = activity?;
        if activity.get("__typename").and_then(Value::as_str) != Some("ListActivity") {
            return None;
        }
        let title = self.title(activity.get("media"))?;
        let verb = caption_verb(activity.get("status").and_then(Value::as_str)?)?;
        let progress = activity.get("progress").and_then(Value::as_str).and_then(progress_text);
        if counts(verb) && progress.is_none() {
            return None;
        }
        Some(self.text(Msg::ActivityCaption {
            verb,
            progress: progress.as_deref().unwrap_or(""),
            title: &title,
        }))
    }
}

/// The newest notification as one sentence, or nothing where it would name a hidden title, nobody, or someone's words.
pub(crate) fn describe(
    lang: Lang,
    titles: TitleLanguage,
    level: &str,
    hide_adult: bool,
    newest: &Value,
) -> Option<String> {
    let w = Wording { lang, titles, level, hide_adult };
    let text_at = |path: &str| {
        newest
            .pointer(path)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|s| !s.is_empty())
    };
    let actor = text_at("/user/name");
    let thread = text_at("/thread/title");
    let activity = |event: ActivityEvent| {
        let sentence = w.text(Msg::SiteActivity { event, actor: actor? });
        // Only a like or a reply is about the viewer's own activity, which is what a caption without an owner says.
        let caption = matches!(event, ActivityEvent::Like | ActivityEvent::Reply)
            .then(|| w.caption(newest.get("activity")))
            .flatten();
        Some(match caption {
            Some(subject) => w.text(Msg::SiteNotifSubject { sentence: &sentence, subject: &subject }),
            None => sentence,
        })
    };
    let in_thread = |event: ThreadEvent| Some(w.text(Msg::SiteThread { event, actor: actor?, thread: thread? }));
    let media = |event: MediaEvent| {
        let title = w.title(newest.get("media"))?;
        Some(w.text(Msg::SiteMedia { event, title: &title }))
    };
    let submission = |kind: SubmissionKind, name: Option<String>| {
        Some(w.text(Msg::SiteSubmission { kind, name: &name? }))
    };

    match newest.get("__typename").and_then(Value::as_str)? {
        "AiringNotification" => {
            let episode = newest.get("episode").and_then(Value::as_i64)?;
            let title = w.title(newest.get("media"))?;
            Some(w.text(Msg::SiteAiring { title: &title, episode }))
        }
        "FollowingNotification" => Some(w.text(Msg::SiteFollowing { actor: actor? })),
        "ActivityMentionNotification" => activity(ActivityEvent::Mention),
        "ActivityReplyNotification" => activity(ActivityEvent::Reply),
        "ActivityReplySubscribedNotification" => activity(ActivityEvent::ReplySubscribed),
        "ActivityLikeNotification" => activity(ActivityEvent::Like),
        "ActivityReplyLikeNotification" => activity(ActivityEvent::ReplyLike),
        "ThreadCommentMentionNotification" => in_thread(ThreadEvent::Mention),
        "ThreadCommentReplyNotification" => in_thread(ThreadEvent::Reply),
        "ThreadCommentSubscribedNotification" => in_thread(ThreadEvent::Subscribed),
        "ThreadCommentLikeNotification" => in_thread(ThreadEvent::CommentLike),
        "ThreadLikeNotification" => in_thread(ThreadEvent::ThreadLike),
        "RelatedMediaAdditionNotification" => media(MediaEvent::RelatedAdded),
        "MediaDataChangeNotification" => media(MediaEvent::DataChange),
        "MediaMergeNotification" => media(MediaEvent::Merge),
        // A deleted title has no flags left to check, so it is named only where nothing would be hidden.
        "MediaDeletionNotification" => {
            let title = w.unchecked(text_at("/deletedMediaTitle"))?;
            Some(w.text(Msg::SiteMedia { event: MediaEvent::Deletion, title: &title }))
        }
        "MediaSubmissionUpdateNotification" => {
            let name = match newest.get("media").filter(|m| m.is_object()) {
                Some(m) => w.title(Some(m)),
                None => w.unchecked(text_at("/submittedTitle")),
            };
            submission(SubmissionKind::Media, name)
        }
        "StaffSubmissionUpdateNotification" => {
            submission(SubmissionKind::Staff, text_at("/staff/name/full").map(str::to_string))
        }
        "CharacterSubmissionUpdateNotification" => {
            submission(SubmissionKind::Character, text_at("/character/name/full").map(str::to_string))
        }
        _ => None,
    }
}

/// What a successful check announces, as a rendered title and body, or nothing; the cursor moves either way.
pub(crate) fn announcement(db: &Db, data: &Value) -> Option<(String, String)> {
    let unread = data
        .pointer("/Viewer/unreadNotificationCount")
        .and_then(Value::as_i64)
        .unwrap_or(0);
    let newest = data.pointer("/Page/notifications/0")?;
    let id = newest.get("id").and_then(Value::as_i64)?;
    let seen = db.kv_get(SEEN_KEY).and_then(|s| s.parse::<i64>().ok());
    let advanced = db.kv_advance_max(SEEN_KEY, id);
    if !should_announce(seen, id, unread, advanced) {
        return None;
    }

    let lang = crate::i18n::lang(db);
    let sentence = if airing_toasted(db, newest) || airing_muted(db, newest) {
        None
    } else {
        describe(
            lang,
            crate::titles::title_language(db),
            &crate::commands::read_content_filter(db),
            crate::commands::read_blur_adult(db),
            newest,
        )
    };
    let body = match sentence {
        Some(sentence) if unread > 1 => {
            crate::i18n::text(lang, Msg::SiteNotifNews { sentence: &sentence, more: unread - 1 })
        }
        Some(sentence) => sentence,
        None => crate::i18n::text(lang, Msg::SiteNotifBody { count: unread }),
    };
    Some((crate::i18n::text(lang, Msg::SiteNotifTitle), body))
}

/// What Android's job does with one raw answer, which reaches it without the client's classification.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum JobVerdict {
    Answer,
    /// Ask once more with `SITE_QUERY_PLAIN`.
    Plain,
    /// The token or the budget failed; a second request would fail the same way.
    Stop,
}

/// `JobVerdict` for one status and body, mirroring `wants_plain` for a job that never sees an `ApiError`.
#[cfg_attr(not(target_os = "android"), allow(dead_code))]
pub(crate) fn job_verdict(status: u16, body: &Value) -> JobVerdict {
    if status == 401 || status == 429 {
        return JobVerdict::Stop;
    }
    let messages = body
        .get("errors")
        .and_then(Value::as_array)
        .map(|errors| {
            errors
                .iter()
                .filter_map(|e| e.get("message").and_then(Value::as_str))
                .collect::<Vec<_>>()
                .join("; ")
                .to_ascii_lowercase()
        })
        .unwrap_or_default();
    // The client's own reading of a dead token: "invalid token", or the bare word, which a job cannot probe.
    if messages.contains("invalid token") || messages.trim().trim_end_matches('.') == "unauthorized" {
        return JobVerdict::Stop;
    }
    let answered = (200..300).contains(&status)
        && body.get("errors").is_none()
        && body.get("data").is_some_and(|d| !d.is_null());
    if answered {
        JobVerdict::Answer
    } else {
        JobVerdict::Plain
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A background pass must never mark the user's site feed seen.
    #[test]
    fn the_query_never_resets_the_unread_count() {
        assert!(!SITE_QUERY.contains("resetNotificationCount"));
        assert!(!SITE_QUERY_PLAIN.contains("resetNotificationCount"));
    }

    /// Private mail stays excluded, the same way it is everywhere else.
    #[test]
    fn message_notifications_are_absent_twice_over() {
        for query in [SITE_QUERY, SITE_QUERY_PLAIN] {
            assert!(!query.contains("ACTIVITY_MESSAGE"));
            assert!(!query.contains("ActivityMessageNotification"));
            assert!(!query.contains("MessageActivity"));
        }
    }

    /// A lock screen shows the toast to anyone, so no post, comment or reason is asked for; a thread's title is its name.
    #[test]
    fn neither_query_asks_for_a_post_a_comment_or_anilists_own_sentences() {
        for query in [SITE_QUERY, SITE_QUERY_PLAIN] {
            for field in ["text", "comment", "context", "reason", "TextActivity", "childComments"] {
                let word = query
                    .split(|c: char| !c.is_ascii_alphanumeric() && c != '_')
                    .any(|w| w == field);
                assert!(!word, "{field} in a site query");
            }
        }
    }

    fn mem() -> Db {
        crate::db::tests::mem_db()
    }

    fn en(newest: Value) -> Option<String> {
        describe(Lang::En, TitleLanguage::English, "off", false, &newest)
    }

    fn frieren(adult: bool) -> Value {
        json!({
            "id": 42,
            "title": { "romaji": "Sousou no Frieren", "english": "Frieren", "native": "葬送のフリーレン" },
            "isAdult": adult,
            "genres": ["Adventure"],
        })
    }

    fn liked(status: &str, progress: Option<&str>, media: Value) -> Value {
        json!({
            "__typename": "ActivityLikeNotification",
            "id": 9,
            "user": { "name": "Mikan" },
            "activity": { "__typename": "ListActivity", "status": status, "progress": progress, "media": media },
        })
    }

    #[test]
    fn a_like_on_an_own_list_activity_names_it() {
        assert_eq!(
            en(liked("watched episode", Some("1 - 3"), frieren(false))).as_deref(),
            Some("Mikan liked your activity: Watched episode 1\u{2013}3 of Frieren"),
        );
        let de = describe(Lang::De, TitleLanguage::Native, "off", false, &liked("completed", None, frieren(false))).unwrap();
        // The German wording is pinned by the i18n snapshot; this checks the language and the title language reach it.
        assert!(de.starts_with("Mikan ") && de.ends_with(": 葬送のフリーレン abgeschlossen"), "{de}");
    }

    /// An unknown status, or a counting verb without its number, leaves the sentence without a caption.
    #[test]
    fn a_status_it_cannot_word_drops_only_the_caption() {
        assert_eq!(en(liked("binged", None, frieren(false))).as_deref(), Some("Mikan liked your activity"));
        assert_eq!(en(liked("watched episode", None, frieren(false))).as_deref(), Some("Mikan liked your activity"));
        let text = json!({ "__typename": "ActivityLikeNotification", "id": 9, "user": { "name": "Mikan" }, "activity": { "__typename": "TextActivity" } });
        assert_eq!(en(text).as_deref(), Some("Mikan liked your activity"));
    }

    /// The filter hides a title everywhere, and with the blur on an explicit one too, since a lock screen cannot blur.
    #[test]
    fn a_hidden_or_explicit_title_is_never_named() {
        let like = liked("completed", None, frieren(true));
        assert_eq!(describe(Lang::En, TitleLanguage::English, "moderate", false, &like).as_deref(), Some("Mikan liked your activity"));
        assert_eq!(describe(Lang::En, TitleLanguage::English, "off", true, &like).as_deref(), Some("Mikan liked your activity"));
        assert_eq!(
            describe(Lang::En, TitleLanguage::English, "off", false, &like).as_deref(),
            Some("Mikan liked your activity: Completed Frieren"),
        );
        let airing = json!({ "__typename": "AiringNotification", "id": 1, "episode": 5, "media": frieren(true) });
        assert_eq!(describe(Lang::En, TitleLanguage::English, "off", true, &airing), None);
        assert_eq!(describe(Lang::En, TitleLanguage::English, "strict", false, &airing), None);
        let deleted = json!({ "__typename": "MediaDeletionNotification", "id": 2, "deletedMediaTitle": "Gone" });
        assert_eq!(describe(Lang::En, TitleLanguage::English, "strict", true, &deleted), None);
        assert_eq!(en(deleted).as_deref(), Some("Gone was removed from AniList"));
    }

    /// Only a like or a reply is on the viewer's own activity; elsewhere a caption with nobody in front would mislead.
    #[test]
    fn someone_elses_activity_gets_no_caption() {
        for typename in ["ActivityReplySubscribedNotification", "ActivityReplyLikeNotification", "ActivityMentionNotification"] {
            let mut n = liked("completed", None, frieren(false));
            n["__typename"] = json!(typename);
            assert!(!en(n).unwrap().contains("Frieren"), "{typename}");
        }
    }

    #[test]
    fn rows_without_their_person_or_their_thread_name_nothing() {
        assert_eq!(en(json!({ "__typename": "FollowingNotification", "id": 3, "user": null })), None);
        assert_eq!(en(json!({ "__typename": "ThreadLikeNotification", "id": 4, "user": { "name": "Hoshi" } })), None);
        assert_eq!(en(json!({ "__typename": "SomethingNew", "id": 5 })), None);
        assert_eq!(
            en(json!({ "__typename": "ThreadCommentReplyNotification", "id": 6, "user": { "name": "Hoshi" }, "thread": { "title": "Weekly talk" } })).as_deref(),
            Some("Hoshi replied to your comment in \u{201c}Weekly talk\u{201d}"),
        );
    }

    #[test]
    fn progress_reads_the_way_the_feed_writes_it() {
        assert_eq!(progress_text("12").as_deref(), Some("12"));
        assert_eq!(progress_text(" 162 - 170 ").as_deref(), Some("162\u{2013}170"));
        assert_eq!(progress_text("5 - 5").as_deref(), Some("5"));
        assert_eq!(progress_text("7 - 3").as_deref(), Some("7"));
        assert_eq!(progress_text("soon"), None);
        assert_eq!(progress_text("1 - 2 - 3"), None);
    }

    #[test]
    fn a_first_check_only_writes_the_baseline() {
        assert!(!should_announce(None, 10, 3, true));
        assert!(should_announce(Some(9), 10, 3, true));
        assert!(!should_announce(Some(10), 10, 3, false));
        assert!(!should_announce(Some(9), 10, 0, true));
        assert!(!should_announce(Some(9), 10, 3, false));
    }

    fn answer(newest: Value, unread: i64) -> Value {
        json!({ "Viewer": { "unreadNotificationCount": unread }, "Page": { "notifications": [newest] } })
    }

    #[test]
    fn the_toast_names_the_newest_and_counts_the_rest() {
        let db = mem();
        db.kv_set("content_filter", "off").unwrap();
        db.kv_set("blur_adult", "0").unwrap();
        assert_eq!(announcement(&db, &answer(liked("completed", None, frieren(false)), 3)), None);
        let mut like = liked("completed", None, frieren(false));
        like["id"] = json!(10);
        let (title, body) = announcement(&db, &answer(like, 3)).unwrap();
        assert_eq!(title, "AniList notifications");
        assert_eq!(body, "Mikan liked your activity: Completed Frieren (+2 more)");
        let mut alone = liked("completed", None, frieren(false));
        alone["id"] = json!(11);
        assert_eq!(announcement(&db, &answer(alone, 1)).unwrap().1, "Mikan liked your activity: Completed Frieren");
    }

    /// The airing watcher's own toast already named the episode, and a plain answer has nothing to name it with.
    #[test]
    fn an_episode_already_toasted_or_a_plain_answer_is_counted_instead() {
        let db = mem();
        db.kv_set(SEEN_KEY, "1").unwrap();
        db.kv_set("content_filter", "off").unwrap();
        let airing = json!({ "__typename": "AiringNotification", "id": 20, "episode": 5, "media": frieren(false) });
        db.kv_set("aired:42:5", "1").unwrap();
        assert_eq!(announcement(&db, &answer(airing, 2)).unwrap().1, "2 unread notifications are waiting.");
        let plain = json!({ "__typename": "AiringNotification", "id": 21 });
        assert_eq!(announcement(&db, &answer(plain, 1)).unwrap().1, "1 unread notification is waiting.");
    }

    /// A muted title is never named, not even as the only unread row; the count still says something arrived.
    #[test]
    fn a_muted_episode_is_counted_instead() {
        let db = mem();
        db.kv_set(SEEN_KEY, "1").unwrap();
        db.kv_set("content_filter", "off").unwrap();
        db.kv_set("airing_mute:42", "Frieren").unwrap();
        let airing = json!({ "__typename": "AiringNotification", "id": 30, "episode": 5, "media": frieren(false) });
        assert_eq!(announcement(&db, &answer(airing, 1)).unwrap().1, "1 unread notification is waiting.");
        db.kv_set("airing_notify", "0").unwrap();
        let off = json!({ "__typename": "AiringNotification", "id": 31, "episode": 6, "media": frieren(false) });
        assert!(announcement(&db, &answer(off, 1)).unwrap().1.contains("Frieren"), "inert with the switch off");
        db.kv_delete("airing_notify");
        db.kv_delete("airing_mute:42");
        let next = json!({ "__typename": "AiringNotification", "id": 32, "episode": 7, "media": frieren(false) });
        assert!(announcement(&db, &answer(next, 1)).unwrap().1.contains("Frieren"));
    }

    #[test]
    fn only_a_refusal_that_another_request_could_outlive_earns_the_plain_one() {
        assert!(wants_plain(&ApiError::Api("Not Found.".into())));
        assert!(wants_plain(&ApiError::Retryable("AniList answered 500".into())));
        assert!(!wants_plain(&ApiError::Retryable(RATE_LIMITED.into())));
        assert!(!wants_plain(&ApiError::Auth("Invalid token".into())));
        assert!(!wants_plain(&ApiError::Network("refused".into())));
    }

    #[test]
    fn the_jobs_raw_answers_are_read_the_same_way() {
        let ok = json!({ "data": { "Viewer": {} } });
        assert_eq!(job_verdict(200, &ok), JobVerdict::Answer);
        assert_eq!(job_verdict(401, &Value::Null), JobVerdict::Stop);
        assert_eq!(job_verdict(429, &Value::Null), JobVerdict::Stop);
        assert_eq!(job_verdict(400, &json!({ "errors": [{ "message": "Invalid token" }] })), JobVerdict::Stop);
        assert_eq!(job_verdict(200, &json!({ "errors": [{ "message": "Unauthorized." }], "data": null })), JobVerdict::Stop);
        assert_eq!(job_verdict(404, &json!({ "errors": [{ "message": "Not Found." }], "data": null })), JobVerdict::Plain);
        assert_eq!(job_verdict(500, &Value::Null), JobVerdict::Plain);
        assert_eq!(job_verdict(200, &json!({ "data": null })), JobVerdict::Plain);
    }
}
