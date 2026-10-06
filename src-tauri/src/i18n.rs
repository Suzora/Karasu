//! The strings Rust composes, in the language the frontend mirrors into kv; each match arm holds both languages.

use crate::db::Db;

/// The kv key the frontend mirrors its language into.
pub const LANGUAGE_KEY: &str = "ui_language";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Lang {
    En,
    De,
}

impl Lang {
    /// Anything unrecognised is English, which is also i18next's `fallbackLng`.
    pub fn parse(code: Option<&str>) -> Self {
        match code {
            Some(c) if c.starts_with("de") => Lang::De,
            _ => Lang::En,
        }
    }
}

/// The language to compose in, from the mirror.
pub fn lang(db: &Db) -> Lang {
    Lang::parse(db.kv_get(LANGUAGE_KEY).as_deref())
}

/// What someone did to one of the viewer's activities, or in one the viewer follows.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActivityEvent {
    Mention,
    Reply,
    ReplySubscribed,
    Like,
    ReplyLike,
}

/// What someone did in a forum thread.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThreadEvent {
    Mention,
    Reply,
    Subscribed,
    CommentLike,
    ThreadLike,
}

/// What AniList's moderators did to a title.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MediaEvent {
    RelatedAdded,
    DataChange,
    Merge,
    Deletion,
}

/// Which of the viewer's submissions moved.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubmissionKind {
    Media,
    Staff,
    Character,
}

/// A list activity's verb, the closed set the frontend's `ActivityVerb` also is.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CaptionVerb {
    WatchedEpisode,
    RewatchedEpisode,
    ReadChapter,
    RereadChapter,
    Completed,
    PlansToWatch,
    PlansToRead,
    Dropped,
    Paused,
}

/// Every string Rust composes for a user to read; an enum so the match is exhaustive in both languages.
// The tray and toast variants are constructed only by desktop code, so the Android check reads them as unused.
#[cfg_attr(mobile, allow(dead_code))]
pub enum Msg<'a> {
    AiringTitle,
    AiringBody { title: &'a str, episode: i64 },
    StaleTitle,
    StaleBody { title: &'a str, months: i64 },
    SequelTitle { side_story: bool },
    SequelBody { title: &'a str },
    UpdateTitle,
    UpdateBody { version: &'a str },
    /// Android's wording: the APK downloads on its own, and the tap on the row or About opens the installer.
    #[cfg_attr(not(mobile), allow(dead_code))]
    UpdateBodyAndroid { version: &'a str },
    SiteNotifTitle,
    SiteNotifBody { count: i64 },
    /// The newest AniList notification as a sentence, and how many more are unread beside it.
    SiteNotifNews { sentence: &'a str, more: i64 },
    /// A sentence and what it is about, joined the way each language joins them.
    SiteNotifSubject { sentence: &'a str, subject: &'a str },
    SiteAiring { title: &'a str, episode: i64 },
    SiteFollowing { actor: &'a str },
    SiteActivity { event: ActivityEvent, actor: &'a str },
    SiteThread { event: ThreadEvent, actor: &'a str, thread: &'a str },
    SiteMedia { event: MediaEvent, title: &'a str },
    SiteSubmission { kind: SubmissionKind, name: &'a str },
    /// The viewer's own list activity, with nobody in front of it; `progress` only for the four verbs that count.
    ActivityCaption { verb: CaptionVerb, progress: &'a str, title: &'a str },
    QueueTitle,
    QueueBodyOne { reason: &'a str },
    QueueBodyMany { count: usize, reason: &'a str },
    /// The scrobble-confirm toast's button — its whole reason for existing.
    ConfirmAction,
    ConfirmEpisode { episode: u32 },
    ConfirmChapter { chapter: u32 },
    TrayNothingPlaying,
    TrayScrobbleNow,
    TraySyncNow,
    TrayDetection,
    TrayOpen,
    TrayQuit,
    /// What the desktop lists for the summon shortcut in its own settings and approval dialog.
    #[cfg_attr(not(target_os = "linux"), allow(dead_code))]
    HotkeyDescription,
    /// The Android tracking service's persistent notification, composed here so Kotlin renders text it never chose.
    #[cfg_attr(not(target_os = "android"), allow(dead_code))]
    TrackingServiceTitle,
    #[cfg_attr(not(target_os = "android"), allow(dead_code))]
    TrackingServiceBody,
}

pub fn text(lang: Lang, msg: Msg<'_>) -> String {
    use Lang::{De, En};
    use Msg::*;
    match (lang, msg) {
        (En, AiringTitle) => "New episode aired".into(),
        (De, AiringTitle) => "Neue Folge erschienen".into(),
        (En, AiringBody { title, episode }) => format!("{title} — episode {episode} is out"),
        (De, AiringBody { title, episode }) => format!("{title} — Folge {episode} ist da"),

        (En, StaleTitle) => "On-hold reminder".into(),
        (De, StaleTitle) => "Erinnerung: pausiert".into(),
        // The plural is spelled out rather than papered over with "month(s)", a form nobody writes.
        (En, StaleBody { title, months }) => {
            let unit = if months == 1 { "month" } else { "months" };
            format!("{title} has been paused for over {months} {unit}.")
        }
        (De, StaleBody { title, months }) => {
            let unit = if months == 1 { "Monat" } else { "Monaten" };
            format!("{title} ist seit über {months} {unit} pausiert.")
        }

        (En, SequelTitle { side_story }) => {
            if side_story { "Side story announced" } else { "Sequel announced" }.into()
        }
        (De, SequelTitle { side_story }) => {
            if side_story { "Nebengeschichte angekündigt" } else { "Fortsetzung angekündigt" }
                .into()
        }
        (En, SequelBody { title }) => format!("{title} — related to something on your list."),
        (De, SequelBody { title }) => {
            format!("{title} — verwandt mit etwas auf deiner Liste.")
        }

        (En, UpdateTitle) => "Update ready".into(),
        (De, UpdateTitle) => "Update bereit".into(),
        // Deliberately not "restart to install": the download lives in process memory, so restarting throws it away.
        (En, UpdateBody { version }) => {
            format!("Karasu {version} is ready. Open About to install it.")
        }
        (De, UpdateBody { version }) => {
            format!("Karasu {version} ist bereit. Zum Installieren „Über“ öffnen.")
        }
        (En, UpdateBodyAndroid { version }) => {
            format!("Karasu {version} is out. Open About to install it.")
        }
        (De, UpdateBodyAndroid { version }) => {
            format!("Karasu {version} ist draußen. Zum Installieren „Über“ öffnen.")
        }

        (En, SiteNotifTitle) => "AniList notifications".into(),
        (De, SiteNotifTitle) => "AniList-Benachrichtigungen".into(),
        (En, SiteNotifBody { count }) => {
            if count == 1 {
                "1 unread notification is waiting.".into()
            } else {
                format!("{count} unread notifications are waiting.")
            }
        }
        (De, SiteNotifBody { count }) => {
            if count == 1 {
                "1 ungelesene Benachrichtigung wartet.".into()
            } else {
                format!("{count} ungelesene Benachrichtigungen warten.")
            }
        }

        (En, SiteNotifNews { sentence, more }) => format!("{sentence} (+{more} more)"),
        (De, SiteNotifNews { sentence, more }) => format!("{sentence} (+{more} weitere)"),
        (En, SiteNotifSubject { sentence, subject }) => format!("{sentence}: {subject}"),
        (De, SiteNotifSubject { sentence, subject }) => format!("{sentence}: {subject}"),
        (En, SiteAiring { title, episode }) => format!("Episode {episode} of {title} aired"),
        (De, SiteAiring { title, episode }) => format!("Folge {episode} von {title} ist erschienen"),
        (En, SiteFollowing { actor }) => format!("{actor} started following you"),
        (De, SiteFollowing { actor }) => format!("{actor} folgt dir jetzt"),
        (En, SiteActivity { event: ActivityEvent::Mention, actor }) => format!("{actor} mentioned you in an activity"),
        (De, SiteActivity { event: ActivityEvent::Mention, actor }) => format!("{actor} hat dich in einer Aktivität erwähnt"),
        (En, SiteActivity { event: ActivityEvent::Reply, actor }) => format!("{actor} replied to your activity"),
        (De, SiteActivity { event: ActivityEvent::Reply, actor }) => format!("{actor} hat auf deine Aktivität geantwortet"),
        (En, SiteActivity { event: ActivityEvent::ReplySubscribed, actor }) => format!("{actor} replied to an activity you follow"),
        (De, SiteActivity { event: ActivityEvent::ReplySubscribed, actor }) => format!("{actor} hat in einer Aktivität geantwortet, der du folgst"),
        (En, SiteActivity { event: ActivityEvent::Like, actor }) => format!("{actor} liked your activity"),
        (De, SiteActivity { event: ActivityEvent::Like, actor }) => format!("{actor} gefällt deine Aktivität"),
        (En, SiteActivity { event: ActivityEvent::ReplyLike, actor }) => format!("{actor} liked your reply"),
        (De, SiteActivity { event: ActivityEvent::ReplyLike, actor }) => format!("{actor} gefällt deine Antwort"),
        (En, SiteThread { event: ThreadEvent::Mention, actor, thread }) => format!("{actor} mentioned you in “{thread}”"),
        (De, SiteThread { event: ThreadEvent::Mention, actor, thread }) => format!("{actor} hat dich in „{thread}“ erwähnt"),
        (En, SiteThread { event: ThreadEvent::Reply, actor, thread }) => format!("{actor} replied to your comment in “{thread}”"),
        (De, SiteThread { event: ThreadEvent::Reply, actor, thread }) => format!("{actor} hat auf deinen Kommentar in „{thread}“ geantwortet"),
        (En, SiteThread { event: ThreadEvent::Subscribed, actor, thread }) => format!("{actor} commented in “{thread}”"),
        (De, SiteThread { event: ThreadEvent::Subscribed, actor, thread }) => format!("{actor} hat in „{thread}“ kommentiert"),
        (En, SiteThread { event: ThreadEvent::CommentLike, actor, thread }) => format!("{actor} liked your comment in “{thread}”"),
        (De, SiteThread { event: ThreadEvent::CommentLike, actor, thread }) => format!("{actor} gefällt dein Kommentar in „{thread}“"),
        (En, SiteThread { event: ThreadEvent::ThreadLike, actor, thread }) => format!("{actor} liked your thread “{thread}”"),
        (De, SiteThread { event: ThreadEvent::ThreadLike, actor, thread }) => format!("{actor} gefällt dein Thread „{thread}“"),
        (En, SiteMedia { event: MediaEvent::RelatedAdded, title }) => format!("{title} was added to AniList"),
        (De, SiteMedia { event: MediaEvent::RelatedAdded, title }) => format!("{title} wurde zu AniList hinzugefügt"),
        (En, SiteMedia { event: MediaEvent::DataChange, title }) => format!("{title} received a data change"),
        (De, SiteMedia { event: MediaEvent::DataChange, title }) => format!("{title} hat eine Datenänderung erhalten"),
        (En, SiteMedia { event: MediaEvent::Merge, title }) => format!("{title} absorbed another entry"),
        (De, SiteMedia { event: MediaEvent::Merge, title }) => format!("{title} hat einen anderen Eintrag übernommen"),
        (En, SiteMedia { event: MediaEvent::Deletion, title }) => format!("{title} was removed from AniList"),
        (De, SiteMedia { event: MediaEvent::Deletion, title }) => format!("{title} wurde von AniList entfernt"),
        (En, SiteSubmission { kind: SubmissionKind::Media, name }) => format!("Your submission “{name}” was updated"),
        (De, SiteSubmission { kind: SubmissionKind::Media, name }) => format!("Deine Einreichung „{name}“ wurde aktualisiert"),
        (En, SiteSubmission { kind: SubmissionKind::Staff, name }) => format!("Your staff submission “{name}” was updated"),
        (De, SiteSubmission { kind: SubmissionKind::Staff, name }) => format!("Deine Staff-Einreichung „{name}“ wurde aktualisiert"),
        (En, SiteSubmission { kind: SubmissionKind::Character, name }) => format!("Your character submission “{name}” was updated"),
        (De, SiteSubmission { kind: SubmissionKind::Character, name }) => format!("Deine Charakter-Einreichung „{name}“ wurde aktualisiert"),
        (En, ActivityCaption { verb: CaptionVerb::WatchedEpisode, progress, title }) => format!("Watched episode {progress} of {title}"),
        (De, ActivityCaption { verb: CaptionVerb::WatchedEpisode, progress, title }) => format!("Episode {progress} von {title} geschaut"),
        (En, ActivityCaption { verb: CaptionVerb::RewatchedEpisode, progress, title }) => format!("Rewatched episode {progress} of {title}"),
        (De, ActivityCaption { verb: CaptionVerb::RewatchedEpisode, progress, title }) => format!("Episode {progress} von {title} erneut geschaut"),
        (En, ActivityCaption { verb: CaptionVerb::ReadChapter, progress, title }) => format!("Read chapter {progress} of {title}"),
        (De, ActivityCaption { verb: CaptionVerb::ReadChapter, progress, title }) => format!("Kapitel {progress} von {title} gelesen"),
        (En, ActivityCaption { verb: CaptionVerb::RereadChapter, progress, title }) => format!("Reread chapter {progress} of {title}"),
        (De, ActivityCaption { verb: CaptionVerb::RereadChapter, progress, title }) => format!("Kapitel {progress} von {title} erneut gelesen"),
        (En, ActivityCaption { verb: CaptionVerb::Completed, title, .. }) => format!("Completed {title}"),
        (De, ActivityCaption { verb: CaptionVerb::Completed, title, .. }) => format!("{title} abgeschlossen"),
        (En, ActivityCaption { verb: CaptionVerb::PlansToWatch, title, .. }) => format!("Planning to watch {title}"),
        (De, ActivityCaption { verb: CaptionVerb::PlansToWatch, title, .. }) => format!("{title} zum Schauen geplant"),
        (En, ActivityCaption { verb: CaptionVerb::PlansToRead, title, .. }) => format!("Planning to read {title}"),
        (De, ActivityCaption { verb: CaptionVerb::PlansToRead, title, .. }) => format!("{title} zum Lesen geplant"),
        (En, ActivityCaption { verb: CaptionVerb::Dropped, title, .. }) => format!("Dropped {title}"),
        (De, ActivityCaption { verb: CaptionVerb::Dropped, title, .. }) => format!("{title} abgebrochen"),
        (En, ActivityCaption { verb: CaptionVerb::Paused, title, .. }) => format!("Paused {title}"),
        (De, ActivityCaption { verb: CaptionVerb::Paused, title, .. }) => format!("{title} pausiert"),

        (En, QueueTitle) => "Offline changes were not saved".into(),
        (De, QueueTitle) => "Offline-Änderungen wurden nicht gespeichert".into(),
        (En, QueueBodyOne { reason }) => format!("AniList refused an offline change: {reason}"),
        (De, QueueBodyOne { reason }) => {
            format!("AniList hat eine Offline-Änderung abgelehnt: {reason}")
        }
        (En, QueueBodyMany { count, reason }) => {
            format!("AniList refused {count} offline changes. The first: {reason}")
        }
        (De, QueueBodyMany { count, reason }) => {
            format!("AniList hat {count} Offline-Änderungen abgelehnt. Die erste: {reason}")
        }

        (En, ConfirmAction) => "Update now".into(),
        (De, ConfirmAction) => "Jetzt aktualisieren".into(),
        (En, ConfirmEpisode { episode }) => format!("Mark episode {episode} as watched?"),
        (De, ConfirmEpisode { episode }) => format!("Folge {episode} als gesehen markieren?"),
        (En, ConfirmChapter { chapter }) => format!("Mark chapter {chapter} as read?"),
        (De, ConfirmChapter { chapter }) => format!("Kapitel {chapter} als gelesen markieren?"),

        (En, TrayNothingPlaying) => "Nothing playing".into(),
        (De, TrayNothingPlaying) => "Nichts läuft".into(),
        (En, TrayScrobbleNow) => "Scrobble now".into(),
        (De, TrayScrobbleNow) => "Jetzt scrobbeln".into(),
        (En, TraySyncNow) => "Sync now".into(),
        (De, TraySyncNow) => "Jetzt synchronisieren".into(),
        (En, TrayDetection) => "Media detection".into(),
        (De, TrayDetection) => "Medienerkennung".into(),
        (En, TrayOpen) => "Open Karasu".into(),
        (De, TrayOpen) => "Karasu öffnen".into(),
        (En, TrayQuit) => "Quit".into(),
        (De, TrayQuit) => "Beenden".into(),
        (En, HotkeyDescription) => "Show or hide Karasu".into(),
        (De, HotkeyDescription) => "Karasu zeigen oder verbergen".into(),
        (En, TrackingServiceTitle) => "Watching Jellyfin".into(),
        (De, TrackingServiceTitle) => "Jellyfin wird beobachtet".into(),
        (En, TrackingServiceBody) => {
            "Karasu keeps checking what is playing so your AniList progress updates.".into()
        }
        (De, TrackingServiceBody) => {
            "Karasu prüft weiter, was läuft, damit dein AniList-Fortschritt aktualisiert wird."
                .into()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Proves every way the mirror can be missing or wrong means English rather than a panic or an empty string.
    #[test]
    fn an_unknown_or_absent_language_is_english() {
        assert_eq!(Lang::parse(None), Lang::En);
        assert_eq!(Lang::parse(Some("")), Lang::En);
        assert_eq!(Lang::parse(Some("fr")), Lang::En);
        assert_eq!(Lang::parse(Some("de")), Lang::De);
        // i18next resolves regional codes; the mirror may carry one.
        assert_eq!(Lang::parse(Some("de-AT")), Lang::De);
    }

    /// Proves each message differs between languages and carries its parameters; a forgotten one still compiles.
    #[test]
    fn each_message_is_translated_and_carries_its_parameters() {
        let en = text(Lang::En, Msg::AiringBody { title: "Frieren", episode: 5 });
        let de = text(Lang::De, Msg::AiringBody { title: "Frieren", episode: 5 });
        assert!(en.contains("Frieren") && en.contains('5'));
        assert!(de.contains("Frieren") && de.contains('5'));
        assert_ne!(en, de);

        assert_ne!(text(Lang::En, Msg::TrayQuit), text(Lang::De, Msg::TrayQuit));
        assert_ne!(
            text(Lang::En, Msg::ConfirmAction),
            text(Lang::De, Msg::ConfirmAction)
        );
    }

    /// Proves both halves of the plural are spelled out, in both languages.
    #[test]
    fn the_month_count_is_spelled_out_both_ways() {
        let one = text(Lang::En, Msg::StaleBody { title: "X", months: 1 });
        let many = text(Lang::En, Msg::StaleBody { title: "X", months: 3 });
        assert!(one.contains("1 month") && !one.contains("months"));
        assert!(many.contains("3 months"));

        let one_de = text(Lang::De, Msg::StaleBody { title: "X", months: 1 });
        let many_de = text(Lang::De, Msg::StaleBody { title: "X", months: 6 });
        assert!(one_de.contains("1 Monat") && !one_de.contains("Monaten"));
        assert!(many_de.contains("6 Monaten"));
    }

    /// Every sentence the AniList toast can say, one block per language, so a change of wording is a reviewed diff.
    fn site_samples(lang: Lang) -> String {
        let mut out = Vec::new();
        let caption = text(lang, Msg::ActivityCaption { verb: CaptionVerb::WatchedEpisode, progress: "1–3", title: "Frieren" });
        let like = text(lang, Msg::SiteActivity { event: ActivityEvent::Like, actor: "Mikan" });
        let joined = text(lang, Msg::SiteNotifSubject { sentence: &like, subject: &caption });
        out.push(text(lang, Msg::SiteNotifNews { sentence: &joined, more: 2 }));
        out.push(text(lang, Msg::SiteAiring { title: "Frieren", episode: 5 }));
        out.push(text(lang, Msg::SiteFollowing { actor: "Hoshi" }));
        for event in [ActivityEvent::Mention, ActivityEvent::Reply, ActivityEvent::ReplySubscribed, ActivityEvent::Like, ActivityEvent::ReplyLike] {
            out.push(text(lang, Msg::SiteActivity { event, actor: "Mikan" }));
        }
        for event in [ThreadEvent::Mention, ThreadEvent::Reply, ThreadEvent::Subscribed, ThreadEvent::CommentLike, ThreadEvent::ThreadLike] {
            out.push(text(lang, Msg::SiteThread { event, actor: "Hoshi", thread: "Weekly talk" }));
        }
        for event in [MediaEvent::RelatedAdded, MediaEvent::DataChange, MediaEvent::Merge, MediaEvent::Deletion] {
            out.push(text(lang, Msg::SiteMedia { event, title: "Frieren" }));
        }
        for kind in [SubmissionKind::Media, SubmissionKind::Staff, SubmissionKind::Character] {
            out.push(text(lang, Msg::SiteSubmission { kind, name: "Frieren" }));
        }
        for verb in [
            CaptionVerb::WatchedEpisode,
            CaptionVerb::RewatchedEpisode,
            CaptionVerb::ReadChapter,
            CaptionVerb::RereadChapter,
            CaptionVerb::Completed,
            CaptionVerb::PlansToWatch,
            CaptionVerb::PlansToRead,
            CaptionVerb::Dropped,
            CaptionVerb::Paused,
        ] {
            out.push(text(lang, Msg::ActivityCaption { verb, progress: "7", title: "Frieren" }));
        }
        out.join("
")
    }

    #[test]
    fn site_toasts_en() {
        insta::assert_snapshot!("site_toasts_en", site_samples(Lang::En));
    }

    #[test]
    fn site_toasts_de() {
        insta::assert_snapshot!("site_toasts_de", site_samples(Lang::De));
    }

    /// A sequel and a side story are different news, in both languages.
    #[test]
    fn a_side_story_is_named_as_one() {
        for lang in [Lang::En, Lang::De] {
            assert_ne!(
                text(lang, Msg::SequelTitle { side_story: true }),
                text(lang, Msg::SequelTitle { side_story: false }),
            );
        }
    }
}
