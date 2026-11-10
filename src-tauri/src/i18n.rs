//! The strings Rust composes, in the language the frontend mirrors into kv, read from the catalogs in `src/i18n/native`.

use crate::db::Db;

/// The kv key the frontend mirrors its language into.
pub const LANGUAGE_KEY: &str = "ui_language";

/// A language Karasu composes in: the code of one of the catalogs under `src/i18n/native/`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Lang(&'static str);

/// Each catalog by code; English is complete and is what every missing message falls back to.
const CATALOGS: &[(&str, &str)] = &[
    ("en", include_str!("../../src/i18n/native/en.json")),
    ("de", include_str!("../../src/i18n/native/de.json")),
    ("bg", include_str!("../../src/i18n/native/bg.json")),
    ("cs", include_str!("../../src/i18n/native/cs.json")),
    ("da", include_str!("../../src/i18n/native/da.json")),
    ("el", include_str!("../../src/i18n/native/el.json")),
    ("es", include_str!("../../src/i18n/native/es.json")),
    ("es-419", include_str!("../../src/i18n/native/es-419.json")),
    ("et", include_str!("../../src/i18n/native/et.json")),
    ("fi", include_str!("../../src/i18n/native/fi.json")),
    ("fil", include_str!("../../src/i18n/native/fil.json")),
    ("fr", include_str!("../../src/i18n/native/fr.json")),
    ("fr-CA", include_str!("../../src/i18n/native/fr-CA.json")),
    ("hi", include_str!("../../src/i18n/native/hi.json")),
    ("hr", include_str!("../../src/i18n/native/hr.json")),
    ("hu", include_str!("../../src/i18n/native/hu.json")),
    ("id", include_str!("../../src/i18n/native/id.json")),
    ("it", include_str!("../../src/i18n/native/it.json")),
    ("ja", include_str!("../../src/i18n/native/ja.json")),
    ("ko", include_str!("../../src/i18n/native/ko.json")),
    ("lt", include_str!("../../src/i18n/native/lt.json")),
    ("lv", include_str!("../../src/i18n/native/lv.json")),
    ("ms", include_str!("../../src/i18n/native/ms.json")),
    ("nb", include_str!("../../src/i18n/native/nb.json")),
    ("nl", include_str!("../../src/i18n/native/nl.json")),
    ("pl", include_str!("../../src/i18n/native/pl.json")),
    ("pt", include_str!("../../src/i18n/native/pt.json")),
    ("pt-BR", include_str!("../../src/i18n/native/pt-BR.json")),
    ("ro", include_str!("../../src/i18n/native/ro.json")),
    ("ru", include_str!("../../src/i18n/native/ru.json")),
    ("sk", include_str!("../../src/i18n/native/sk.json")),
    ("sl", include_str!("../../src/i18n/native/sl.json")),
    ("sr", include_str!("../../src/i18n/native/sr.json")),
    ("sv", include_str!("../../src/i18n/native/sv.json")),
    ("th", include_str!("../../src/i18n/native/th.json")),
    ("tr", include_str!("../../src/i18n/native/tr.json")),
    ("uk", include_str!("../../src/i18n/native/uk.json")),
    ("vi", include_str!("../../src/i18n/native/vi.json")),
    ("zh-Hans", include_str!("../../src/i18n/native/zh-Hans.json")),
    ("zh-Hant", include_str!("../../src/i18n/native/zh-Hant.json")),
];

#[allow(non_upper_case_globals)]
impl Lang {
    pub const En: Lang = Lang("en");
    /// Named for the tests; the app reaches German through `parse`, like every other language.
    #[cfg(test)]
    pub const De: Lang = Lang("de");

    /// The mirror's code exactly, else its language alone (`de-AT` reads German); anything unknown is English.
    pub fn parse(code: Option<&str>) -> Self {
        let code = code.unwrap_or("");
        let base = code.split('-').next().unwrap_or("");
        let find = |want: &str| CATALOGS.iter().find(|(c, _)| c.eq_ignore_ascii_case(want)).map(|(c, _)| Lang(c));
        find(code).or_else(|| find(base)).unwrap_or(Lang::En)
    }
}

type Catalog = std::collections::HashMap<String, String>;

/// The catalogs parsed once; a malformed one is a build mistake that the catalog test catches before it ships.
fn catalogs() -> &'static std::collections::HashMap<&'static str, Catalog> {
    static PARSED: std::sync::OnceLock<std::collections::HashMap<&'static str, Catalog>> = std::sync::OnceLock::new();
    PARSED.get_or_init(|| {
        CATALOGS
            .iter()
            .map(|(code, raw)| (*code, serde_json::from_str::<Catalog>(raw).unwrap_or_default()))
            .collect()
    })
}

/// The languages a message is looked up in: the language, its parent for a regional variant, then English.
fn chain(lang: Lang) -> Vec<&'static str> {
    let parent = lang.0.split_once('-').map(|(p, _)| p).filter(|p| catalogs().contains_key(p));
    [Some(lang.0), parent, Some("en")].into_iter().flatten().collect()
}

/// A message's template in `lang` or the first language it falls back to, else the key so a gap shows.
pub fn template(lang: Lang, key: &str) -> String {
    let all = catalogs();
    chain(lang)
        .iter()
        .find_map(|code| all.get(code).and_then(|c| c.get(key)))
        .cloned()
        .unwrap_or_else(|| key.to_string())
}

/// CLDR's cardinal category for `n` in `code`, as i18next spells it in a key's suffix.
fn plural(code: &str, n: i64) -> &'static str {
    use intl_pluralrules::{PluralCategory, PluralRuleType, PluralRules};
    let category = code
        .parse::<unic_langid::LanguageIdentifier>()
        .ok()
        .and_then(|id| PluralRules::create(id, PluralRuleType::CARDINAL).ok())
        .and_then(|rules| rules.select(n).ok());
    match category {
        Some(PluralCategory::ZERO) => "zero",
        Some(PluralCategory::ONE) => "one",
        Some(PluralCategory::TWO) => "two",
        Some(PluralCategory::FEW) => "few",
        Some(PluralCategory::MANY) => "many",
        Some(PluralCategory::OTHER) => "other",
        None if n == 1 => "one",
        None => "other",
    }
}

/// A counted message: each language's own form for `n`, else its `_other`, before falling back to the next language.
fn counted(lang: Lang, key: &str, n: i64) -> String {
    let all = catalogs();
    chain(lang)
        .iter()
        .find_map(|code| {
            let catalog = all.get(code)?;
            catalog.get(&format!("{key}_{}", plural(code, n))).or_else(|| catalog.get(&format!("{key}_other")))
        })
        .cloned()
        .unwrap_or_else(|| key.to_string())
}

/// Fills `{{name}}` placeholders, the i18next spelling, so a translator writes the same syntax in both catalogs.
fn fill(template: String, args: &[(&str, String)]) -> String {
    args.iter().fold(template, |out, (name, value)| out.replace(&format!("{{{{{name}}}}}"), value))
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

/// Every string Rust composes for a user to read; an enum so each one is named exactly once.
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
    /// Queued edits left unsent because AniList holds a newer change to the same entry.
    QueueOvertaken { count: usize },
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
    use Msg::*;
    let s = |v: &str| v.to_string();
    let (key, count, args): (&str, Option<i64>, Vec<(&str, String)>) = match msg {
        AiringTitle => ("airingTitle", None, vec![]),
        AiringBody { title, episode } => ("airingBody", None, vec![("title", s(title)), ("episode", episode.to_string())]),
        StaleTitle => ("staleTitle", None, vec![]),
        StaleBody { title, months } => ("staleBody", Some(months), vec![("title", s(title))]),
        SequelTitle { side_story } => (if side_story { "sideStoryTitle" } else { "sequelTitle" }, None, vec![]),
        SequelBody { title } => ("sequelBody", None, vec![("title", s(title))]),
        UpdateTitle => ("updateTitle", None, vec![]),
        UpdateBody { version } => ("updateBody", None, vec![("version", s(version))]),
        UpdateBodyAndroid { version } => ("updateBodyAndroid", None, vec![("version", s(version))]),
        SiteNotifTitle => ("siteNotifTitle", None, vec![]),
        SiteNotifBody { count } => ("siteNotifBody", Some(count), vec![]),
        SiteNotifNews { sentence, more } => ("siteNotifNews", None, vec![("sentence", s(sentence)), ("more", more.to_string())]),
        SiteNotifSubject { sentence, subject } => ("siteNotifSubject", None, vec![("sentence", s(sentence)), ("subject", s(subject))]),
        SiteAiring { title, episode } => ("siteAiring", None, vec![("title", s(title)), ("episode", episode.to_string())]),
        SiteFollowing { actor } => ("siteFollowing", None, vec![("actor", s(actor))]),
        SiteActivity { event, actor } => {
            let key = match event {
                ActivityEvent::Mention => "siteActivityMention",
                ActivityEvent::Reply => "siteActivityReply",
                ActivityEvent::ReplySubscribed => "siteActivityReplySubscribed",
                ActivityEvent::Like => "siteActivityLike",
                ActivityEvent::ReplyLike => "siteActivityReplyLike",
            };
            (key, None, vec![("actor", s(actor))])
        }
        SiteThread { event, actor, thread } => {
            let key = match event {
                ThreadEvent::Mention => "siteThreadMention",
                ThreadEvent::Reply => "siteThreadReply",
                ThreadEvent::Subscribed => "siteThreadSubscribed",
                ThreadEvent::CommentLike => "siteThreadCommentLike",
                ThreadEvent::ThreadLike => "siteThreadThreadLike",
            };
            (key, None, vec![("actor", s(actor)), ("thread", s(thread))])
        }
        SiteMedia { event, title } => {
            let key = match event {
                MediaEvent::RelatedAdded => "siteMediaRelatedAdded",
                MediaEvent::DataChange => "siteMediaDataChange",
                MediaEvent::Merge => "siteMediaMerge",
                MediaEvent::Deletion => "siteMediaDeletion",
            };
            (key, None, vec![("title", s(title))])
        }
        SiteSubmission { kind, name } => {
            let key = match kind {
                SubmissionKind::Media => "siteSubmissionMedia",
                SubmissionKind::Staff => "siteSubmissionStaff",
                SubmissionKind::Character => "siteSubmissionCharacter",
            };
            (key, None, vec![("name", s(name))])
        }
        ActivityCaption { verb, progress, title } => {
            let key = match verb {
                CaptionVerb::WatchedEpisode => "captionWatchedEpisode",
                CaptionVerb::RewatchedEpisode => "captionRewatchedEpisode",
                CaptionVerb::ReadChapter => "captionReadChapter",
                CaptionVerb::RereadChapter => "captionRereadChapter",
                CaptionVerb::Completed => "captionCompleted",
                CaptionVerb::PlansToWatch => "captionPlansToWatch",
                CaptionVerb::PlansToRead => "captionPlansToRead",
                CaptionVerb::Dropped => "captionDropped",
                CaptionVerb::Paused => "captionPaused",
            };
            (key, None, vec![("progress", s(progress)), ("title", s(title))])
        }
        QueueTitle => ("queueTitle", None, vec![]),
        QueueBodyOne { reason } => ("queueBody", Some(1), vec![("reason", s(reason))]),
        QueueBodyMany { count, reason } => ("queueBody", Some(count as i64), vec![("reason", s(reason))]),
        QueueOvertaken { count } => ("queueOvertaken", Some(count as i64), vec![]),
        ConfirmAction => ("confirmAction", None, vec![]),
        ConfirmEpisode { episode } => ("confirmEpisode", None, vec![("episode", episode.to_string())]),
        ConfirmChapter { chapter } => ("confirmChapter", None, vec![("chapter", chapter.to_string())]),
        TrayNothingPlaying => ("trayNothingPlaying", None, vec![]),
        TrayScrobbleNow => ("trayScrobbleNow", None, vec![]),
        TraySyncNow => ("traySyncNow", None, vec![]),
        TrayDetection => ("trayDetection", None, vec![]),
        TrayOpen => ("trayOpen", None, vec![]),
        TrayQuit => ("trayQuit", None, vec![]),
        HotkeyDescription => ("hotkeyDescription", None, vec![]),
        TrackingServiceTitle => ("trackingServiceTitle", None, vec![]),
        TrackingServiceBody => ("trackingServiceBody", None, vec![]),
    };
    match count {
        Some(n) => {
            let mut args = args;
            args.push(("count", n.to_string()));
            fill(counted(lang, key, n), &args)
        }
        None => fill(template(lang, key), &args),
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
        assert_eq!(Lang::parse(Some("xx")), Lang::En);
        assert_eq!(Lang::parse(Some("fr")), Lang("fr"));
        assert_eq!(Lang::parse(Some("pt-BR")), Lang("pt-BR"));
        assert_eq!(Lang::parse(Some("zh-Hant")), Lang("zh-Hant"));
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

    /// Every catalog parses, names only English keys and keeps English's placeholders, so a translation cannot break a toast.
    #[test]
    fn every_catalog_matches_english() {
        let all = catalogs();
        let en = &all["en"];
        let holes = |t: &str| {
            let mut v: Vec<String> = t.split("{{").skip(1).filter_map(|p| p.split_once("}}").map(|(n, _)| n.to_string())).collect();
            v.sort();
            v
        };
        for (code, raw) in CATALOGS {
            let catalog: Catalog = serde_json::from_str(raw).unwrap_or_else(|e| panic!("{code}: {e}"));
            for (key, value) in &catalog {
                let base = ["_one", "_two", "_few", "_many", "_zero", "_other"].iter().find_map(|s| key.strip_suffix(s)).unwrap_or(key);
                let english = en.get(key).or_else(|| en.get(&format!("{base}_other")));
                let english = english.unwrap_or_else(|| panic!("{code}: {key} is not an English key"));
                assert!(!value.trim().is_empty(), "{code}: {key} is empty");
                if !key.starts_with("android.") {
                    let mut want = holes(english);
                    want.retain(|h| h != "count");
                    let mut got = holes(value);
                    got.retain(|h| h != "count");
                    assert_eq!(got, want, "{code}: {key} has other placeholders than English");
                }
            }
        }
    }

    /// Polish has a third form for two to four, Japanese has one form for everything, and a gap falls back to `_other`.
    #[test]
    fn the_plural_category_follows_each_language() {
        assert_eq!((plural("en", 1), plural("en", 3)), ("one", "other"));
        assert_eq!((plural("pl", 1), plural("pl", 3), plural("pl", 5)), ("one", "few", "many"));
        assert_eq!(plural("ja", 1), "other");
        assert_eq!(plural("not a tag", 1), "one");
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
