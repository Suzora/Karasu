//! Site-neutral rules for browser tabs: which tab a playing session belongs to, and a chapter open anywhere; pure.

use super::media_session::MediaSession;
use super::{profiles, WindowInfo};
use crate::playback::recognition::matcher::normalize;
use crate::playback::recognition::parser::{self, Parsed};
use regex::Regex;
use std::sync::OnceLock;

/// Words that say where in a series something is rather than what it is, so they never make a title distinctive.
const MARKER_WORDS: &[&str] = &["episode", "ep", "e", "folge", "chapter", "ch", "part", "season", "staffel", "s"];

/// Two words and six letters left once numbers and episode words are gone, so "Episode 1" never links a tab.
pub(crate) fn distinctive(title: &str) -> bool {
    let norm = normalize(title);
    let words: Vec<&str> = norm
        .split(' ')
        .filter(|w| !w.is_empty() && !w.chars().all(|c| c.is_numeric()) && !MARKER_WORDS.contains(w))
        .collect();
    words.len() >= 2 && words.iter().map(|w| w.chars().count()).sum::<usize>() >= 6
}

/// The positive evidence a tab title can give that it is the session's tab; anything weaker is no evidence at all.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Relation {
    Equal,
    /// The tab title holds the whole session title, word for word, and that title is `distinctive`.
    Contains,
}

/// How a tab title relates to a session title, compared in the matcher's form and only on whole words.
pub(crate) fn relation(tab_title: &str, session_title: &str) -> Option<Relation> {
    let tab = normalize(tab_title);
    let session = normalize(session_title);
    if session.is_empty() {
        return None;
    }
    if tab == session {
        return Some(Relation::Equal);
    }
    (distinctive(session_title) && format!(" {tab} ").contains(&format!(" {session} "))).then_some(Relation::Contains)
}

/// Says, for each playing session nothing recognised, how many browser windows there are and which hold its title.
pub(crate) fn unlinked_line(sessions: &[MediaSession], windows: &[WindowInfo]) -> Option<String> {
    let browsers: Vec<&WindowInfo> = windows.iter().filter(|w| super::profiles::is_browser(&w.process)).collect();
    let parts: Vec<String> = sessions
        .iter()
        .filter(|s| s.is_playing() && !s.is_music_player())
        .map(|s| {
            // Only windows that hold the session's own title are named; the rest of what is open stays a count.
            let held: Vec<String> = browsers
                .iter()
                .filter_map(|w| relation(&w.title, &s.title).map(|r| format!("{r:?} {} {:?}", w.process, w.title)))
                .collect();
            let url = if s.url.is_empty() { "no url" } else { "a url" };
            let named = if held.is_empty() { String::new() } else { format!(": {}", held.join(", ")) };
            format!("{}: {:?} with {url}, held by {} of {} browser window(s){named}", s.app_id, s.title, held.len(), browsers.len())
        })
        .collect();
    (!parts.is_empty()).then(|| format!("unrecognised: {}", parts.join("; ")))
}

/// Words that mark a page about a series rather than a chapter of it, so a tab holding one is never reading.
const OFF_TOPIC_WORDS: &[&str] = &[
    "analysis", "discussion", "explained", "prediction", "predictions", "reaction", "recap", "review", "reviews",
    "spoiler", "spoilers", "summary", "trailer", "wiki",
];

/// What a tab title puts between the series, the chapter and the site's own name.
const SEGMENT_SEPARATORS: &[&str] = &[" - ", " – ", " — ", " | ", " · "];

/// A tab title cut at its separators, empty pieces dropped.
fn segments(title: &str) -> Vec<String> {
    let mut joined = title.to_string();
    for sep in SEGMENT_SEPARATORS {
        joined = joined.replace(sep, "\u{1f}");
    }
    joined.split('\u{1f}').map(str::trim).filter(|s| !s.is_empty()).map(str::to_string).collect()
}

/// A series guess without what sites wrap around it: a leading "Read", brackets, a volume, a trailing "Manga" or kin.
fn clean_series(guess: &str) -> String {
    static RE: OnceLock<[Regex; 4]> = OnceLock::new();
    let res = RE.get_or_init(|| {
        [
            Regex::new(r"(?i)^\s*read(?:ing)?\s+").unwrap(),
            Regex::new(r"\s*[\[(][^\])]*[\])]").unwrap(),
            Regex::new(r"(?i)[\s,:\-–—]*\bvol(?:ume)?\.?\s*\d+(?:\.\d+)?\s*$").unwrap(),
            Regex::new(r"(?i)\s+(?:manga|manhwa|manhua|webtoon)\s*$").unwrap(),
        ]
    });
    let mut out = guess.to_string();
    for re in res {
        out = re.replace(&out, "").to_string();
    }
    out.trim_matches(|c: char| c.is_whitespace() || matches!(c, '-' | '–' | '—' | ':' | ',' | '|')).to_string()
}

/// A chapter open in a tab on any site: one deterministic series guess and the chapter, or None for anything else.
pub(crate) fn chapter_tab(title: &str) -> Option<Parsed> {
    if normalize(title).split(' ').any(|w| OFF_TOPIC_WORDS.contains(&w)) {
        return None;
    }
    let parts = segments(title);
    let at = parts.iter().position(|p| parser::spells_chapter(p))?;
    let parsed = parser::parse_manga(&parts[at]);
    let chapter = parsed.episode?;
    // The text before the chapter word, else the segment before it, else the one after; never a chapter's own name.
    let own = clean_series(&parsed.title);
    let series = if own.chars().any(char::is_alphabetic) {
        own
    } else {
        let beside = if at > 0 { parts.get(at - 1) } else { parts.get(at + 1) };
        clean_series(beside?)
    };
    if !series.chars().any(char::is_alphabetic) {
        return None;
    }
    Some(Parsed {
        title: series,
        episode: Some(chapter),
        episode_marked: true,
        season: None,
        release_group: None,
        episode_title: None,
    })
}

/// A browser window on a chapter at a site with no rule of its own: the title without the browser's name, and its guess.
pub(crate) fn match_chapter_tab(process: &str, title: &str) -> Option<(String, Parsed)> {
    if !profiles::is_browser(process) {
        return None;
    }
    let media = profiles::strip_browser_suffix(title)?;
    // A known site's rule decides its own tabs, including the ones it turned down.
    if profiles::match_site(&media).is_some() || profiles::names_manga_site(&media) {
        return None;
    }
    let parsed = chapter_tab(&media)?;
    Some((media.trim().to_string(), parsed))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn window(process: &str, title: &str) -> WindowInfo {
        WindowInfo { process: process.into(), title: title.into() }
    }

    fn browser_session(title: &str, status: &str) -> MediaSession {
        MediaSession {
            app_id: "308046B0AF4A39CB".into(),
            title: title.into(),
            artist: String::new(),
            album: String::new(),
            playback_type: "music".into(),
            status: status.into(),
            url: String::new(),
        }
    }

    #[test]
    fn a_title_that_is_only_an_episode_number_is_not_distinctive() {
        assert!(!distinctive("Episode 1"));
        assert!(!distinctive("Folge 12 - Part 2"));
        assert!(!distinctive("Departures"));
        assert!(distinctive("The Hero's Party"));
    }

    #[test]
    fn a_tab_holding_the_session_title_word_for_word_is_related() {
        let tab = "Frieren: Beyond Journey’s End Episode 5 - The Hero’s Party - ExampleStream — Zen Browser";
        assert_eq!(relation(tab, "The Hero's Party"), Some(Relation::Contains));
        assert_eq!(relation("The Hero’s Party", "the hero's party"), Some(Relation::Equal));
    }

    #[test]
    fn a_short_or_partial_title_is_no_evidence() {
        assert_eq!(relation("Frieren Episode 1 - ExampleStream", "Episode 1"), None);
        assert_eq!(relation("Show - The Ending Theme - ExampleStream", "The End Of It"), None);
        assert_eq!(relation("Anything", ""), None);
    }

    #[test]
    fn the_unrecognised_line_names_only_the_windows_holding_the_title() {
        let sessions = [browser_session("The Hero’s Party", "playing")];
        let windows = [
            window("zen.exe", "Frieren Episode 5 - The Hero’s Party - ExampleStream — Zen Browser"),
            window("zen.exe", "Private mail — Zen Browser"),
            window("explorer.exe", "The Hero’s Party notes"),
        ];
        let line = unlinked_line(&sessions, &windows).unwrap();
        assert!(line.contains("held by 1 of 2 browser window(s)"), "{line}");
        assert!(line.contains("ExampleStream"), "{line}");
        assert!(!line.contains("Private mail"), "{line}");
        assert!(!line.contains("notes"), "{line}");
    }

    fn series(title: &str) -> Option<(String, Option<u32>)> {
        chapter_tab(title).map(|p| (p.title, p.episode))
    }

    #[test]
    fn the_series_is_the_text_before_the_spelled_out_chapter() {
        assert_eq!(
            series("Kusuriya no Hitorigoto Chapter 45 - ExampleReader"),
            Some(("Kusuriya no Hitorigoto".into(), Some(45)))
        );
    }

    #[test]
    fn a_chapter_alone_takes_the_series_from_beside_it() {
        let before = series("Kusuriya no Hitorigoto - Ch. 45 - ExampleReader");
        assert_eq!(before, Some(("Kusuriya no Hitorigoto".into(), Some(45))));
        let after = series("Chapter 45 | Kusuriya no Hitorigoto | ExampleReader");
        assert_eq!(after, Some(("Kusuriya no Hitorigoto".into(), Some(45))));
    }

    #[test]
    fn the_chapter_name_never_enters_the_series_guess() {
        let named = "Kusuriya no Hitorigoto Ch. 45: The Festival - ExampleReader";
        assert_eq!(series(named), Some(("Kusuriya no Hitorigoto".into(), Some(45))));
        let segment = "Kusuriya no Hitorigoto - Ch. 45 - The Festival - ExampleReader";
        assert_eq!(series(segment), Some(("Kusuriya no Hitorigoto".into(), Some(45))));
    }

    /// The guess is the correction key, so a picked series has to hold for the next chapter's tab.
    #[test]
    fn the_series_guess_is_the_same_for_every_chapter() {
        let a = chapter_tab("Kusuriya no Hitorigoto - Ch. 45 - A Festival - ExampleReader").unwrap();
        let b = chapter_tab("Kusuriya no Hitorigoto - Ch. 46 - The Return - ExampleReader").unwrap();
        assert_eq!(a.title, b.title);
        assert_eq!((a.episode, b.episode), (Some(45), Some(46)));
    }

    #[test]
    fn reading_words_brackets_and_volumes_stay_out_of_the_guess() {
        assert_eq!(
            series("Read Solo Leveling Manhwa (Official) Vol. 3 Chapter 45 - ExampleReader"),
            Some(("Solo Leveling".into(), Some(45)))
        );
        assert_eq!(
            series("Kusuriya no Hitorigoto - Vol. 3 Ch. 45 - ExampleReader"),
            Some(("Kusuriya no Hitorigoto".into(), Some(45)))
        );
    }

    #[test]
    fn a_page_about_a_chapter_is_not_reading_it() {
        assert_eq!(series("Kusuriya no Hitorigoto Chapter 45 Discussion - ExampleForum"), None);
        assert_eq!(series("Chapter 45 | Kusuriya no Hitorigoto Wiki | ExampleWiki"), None);
        assert_eq!(series("Kusuriya no Hitorigoto Chapter 45 Spoilers - ExampleForum"), None);
    }

    #[test]
    fn only_a_spelled_out_chapter_counts() {
        assert_eq!(series("Kusuriya no Hitorigoto - 45 - ExampleReader"), None);
        assert_eq!(series("Fix the crash · Issue #45 · example/repo"), None);
        assert_eq!(series("Chapter 5 - 2024"), None, "no series anywhere beside it");
    }

    #[test]
    fn a_known_site_never_takes_the_generic_path() {
        let official = "One Piece - Chapter 1100 - MANGA Plus by SHUEISHA — Mozilla Firefox";
        assert_eq!(match_chapter_tab("firefox.exe", official), None);
        let streaming = "Kusuriya no Hitorigoto Chapter 3 - Watch on Crunchyroll — Mozilla Firefox";
        assert_eq!(match_chapter_tab("firefox.exe", streaming), None);
    }

    #[test]
    fn a_chapter_tab_is_read_from_a_browser_window_only() {
        let title = "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Zen Browser";
        let (media, parsed) = match_chapter_tab("zen.exe", title).unwrap();
        assert_eq!(media, "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader");
        assert_eq!((parsed.title.as_str(), parsed.episode), ("Kusuriya no Hitorigoto", Some(45)));
        assert_eq!(match_chapter_tab("notepad.exe", title), None);
    }

    #[test]
    fn nothing_playing_or_only_music_players_says_nothing() {
        let mut spotify = browser_session("Some Song Title Here", "playing");
        spotify.app_id = "SpotifyAB.SpotifyMusic_zpdnekdrzrea0".into();
        assert_eq!(unlinked_line(&[browser_session("The Hero’s Party", "paused")], &[]), None);
        assert_eq!(unlinked_line(&[spotify], &[]), None);
    }
}
