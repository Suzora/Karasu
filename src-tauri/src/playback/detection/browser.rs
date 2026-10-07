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

/// Words that mark a page about a series rather than a chapter of it, wherever they stand in the tab title.
const OFF_TOPIC_WORDS: &[&str] = &[
    "discussion", "explained", "prediction", "predictions", "recap", "reddit", "review", "reviews", "spoiler",
    "spoilers", "summary", "trailer", "wiki",
    // The German twins, since the chapter word itself is also read in German.
    "diskussion", "erklärt", "erklärung", "erscheinungsdatum", "rezension", "vorhersage", "vorhersagen",
    "zusammenfassung",
];

/// Off-topic words that real series also carry in their names, so they count only where the series does not.
const TITLE_WORDS: &[&str] = &[
    "analyse", "analysis", "breakdown", "countdown", "delay", "delayed", "disc", "leak", "leaked", "leaks", "news",
    "reaction", "reactions", "reaktion", "theories", "theorie", "theorien", "theory",
];

/// Phrases with the same meaning whose words alone are innocent, compared in the matcher's form.
const OFF_TOPIC_PHRASES: &[&str] = &["release date", "release time", "where to read", "what to expect"];

/// The last segment of a search engine's or a video site's tab title: a page that finds a chapter, not one.
const NOT_A_READER: &[&str] = &[
    "Google Search", "Google Suche", "Google-Suche", "Search", "Suchen", "Bing", "DuckDuckGo", "Ecosia",
    "Brave Search", "Startpage", "Kagi Search", "Qwant", "Qwant Search", "Search / X", "Suche / X", "YouTube",
    "TikTok", "Dailymotion", "Vimeo",
];

/// Words that say where in a series a chapter sits, so text made only of them is no series at all.
const POSITION_WORDS: &[&str] = &[
    "band", "bonus", "epilogue", "extra", "omake", "prologue", "side", "special", "story", "tba", "tbd", "vol",
    "volume",
];

/// What a tab title puts between the series, the chapter and the site's own name.
const SEGMENT_SEPARATORS: &[&str] = &[" - ", " – ", " — ", " | ", " · "];

/// The tab title without Edge's count of the window's other tabs, which changes whenever one opens or closes.
fn without_tab_count(title: &str) -> String {
    static RE: OnceLock<Regex> = OnceLock::new();
    // Edge's own wording in the two languages the app ships, read out of its locale files.
    let re = RE.get_or_init(|| {
        Regex::new(r"(?i)\s+(?:and \d+ more pages?|und \d+ weitere Seiten?)(\s+[-–]\s+|$)").unwrap()
    });
    re.replace(title, "$1").into_owned()
}

/// A tab title cut at its separators, empty pieces dropped.
fn segments(title: &str) -> Vec<String> {
    let mut joined = title.to_string();
    for sep in SEGMENT_SEPARATORS {
        joined = joined.replace(sep, "\u{1f}");
    }
    joined.split('\u{1f}').map(str::trim).filter(|s| !s.is_empty()).map(str::to_string).collect()
}

/// Whether a tab is a page about chapters: a search, a video, a forum thread, or an off-topic word or phrase.
fn off_topic(title: &str, parts: &[String]) -> bool {
    // Any segment after the first, since a browser profile's own name can follow the search engine's.
    if parts.iter().skip(1).any(|p| NOT_A_READER.iter().any(|end| p.eq_ignore_ascii_case(end))) {
        return true;
    }
    if title.contains(" at DuckDuckGo") || title.contains(" : r/") {
        return true;
    }
    let padded = format!(" {} ", normalize(title));
    padded.split(' ').any(|w| OFF_TOPIC_WORDS.contains(&w))
        || OFF_TOPIC_PHRASES.iter().any(|p| padded.contains(&format!(" {p} ")))
}

/// Whether a title word that series also use stands outside the series guess, where it marks the page instead.
fn off_topic_beside(title: &str, series: &str) -> bool {
    let own = normalize(series);
    let own: Vec<&str> = own.split(' ').collect();
    normalize(title).split(' ').any(|w| TITLE_WORDS.contains(&w) && !own.contains(&w))
}

/// Whether the guess holds a title word none of the matched entry's titles carry, so it labels the page ("Leaks").
pub(crate) fn label_beyond_entry(series: &str, entry_titles: &[String]) -> bool {
    let titles: Vec<String> = entry_titles.iter().map(|t| normalize(t)).collect();
    normalize(series)
        .split(' ')
        .any(|w| TITLE_WORDS.contains(&w) && !titles.iter().any(|t| t.split(' ').any(|x| x == w)))
}

/// Whether a guess holds nothing but position words and numbers ("Season 2", "Extra", "Vol. TBD").
fn only_position(guess: &str) -> bool {
    normalize(guess).split(' ').filter(|w| !w.is_empty()).all(|w| {
        w.chars().all(char::is_numeric) || MARKER_WORDS.contains(&w) || POSITION_WORDS.contains(&w)
    })
}

/// Whether a guess is a season or part on its own, which AniList may keep as a separate entry.
fn is_entry_marker(guess: &str) -> bool {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)^(?:season|staffel|part)\s*\d{1,2}$").unwrap()).is_match(guess.trim())
}

/// A trailing season or part in the guess, with "Staffel" re-spelt as "Season" and its number for the matcher.
fn with_entry_marker(series: String) -> (String, Option<u32>) {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"(?i)^(.*\S)\s+(season|staffel|part)\s*(\d{1,2})$").unwrap());
    let Some(caps) = re.captures(&series) else {
        return (series, None);
    };
    let Ok(n) = caps[3].parse::<u32>() else {
        return (series, None);
    };
    // The matcher lets a season steer only in the spellings it knows; a part is only ever a name.
    match caps[2].to_lowercase().as_str() {
        "part" => (format!("{} Part {n}", &caps[1]), None),
        _ => (format!("{} Season {n}", &caps[1]), Some(n)),
    }
}

/// The punctuation a site leaves around a series guess.
fn trim_separators(s: &str) -> &str {
    s.trim_matches(|c: char| c.is_whitespace() || matches!(c, '-' | '–' | '—' | ':' | ',' | '|'))
}

/// A series guess without what sites wrap around it: "Read", brackets, a volume, a trailing "Manga" or kin.
fn clean_series(guess: &str, unwrap: bool) -> String {
    static RE: OnceLock<[Regex; 4]> = OnceLock::new();
    let [read, brackets, volume, kind] = RE.get_or_init(|| {
        [
            Regex::new(r"(?i)^\s*read(?:ing)?(?:\s+|$)").unwrap(),
            Regex::new(r"\s*[\[(]([^\])]*)[\])]").unwrap(),
            Regex::new(r"(?i)[\s,:\-–—]*\b(?:vol(?:ume)?|band|bd)\.?\s*(?:\d+(?:\.\d+)?|tb[ad]|\?+)[\s,:\-–—]*$").unwrap(),
            Regex::new(r"(?i)(?:^|\s+)(?:manga|manhwa|manhua|webtoon)\s*$").unwrap(),
        ]
    });
    let tail = |s: &str| {
        let s = volume.replace(s, "").to_string();
        let s = kind.replace(trim_separators(&s), "").to_string();
        trim_separators(&s).split_whitespace().collect::<Vec<_>>().join(" ")
    };
    let out = read.replace(trim_separators(guess), "").to_string();
    let dropped = tail(&brackets.replace_all(&out, ""));
    if !unwrap || dropped.chars().any(char::is_alphabetic) {
        return dropped;
    }
    // A series whose name is itself a bracket ("[Oshi no Ko]") keeps the bracket's words rather than losing them all.
    tail(&brackets.replace_all(&out, |c: &regex::Captures| {
        if c[1].chars().any(char::is_alphabetic) { format!(" {}", &c[1]) } else { String::new() }
    }))
}

/// A chapter open in a tab on any site: one deterministic series guess and the chapter, or None for anything else.
pub(crate) fn chapter_tab(title: &str) -> Option<Parsed> {
    let title = &without_tab_count(title);
    let parts = segments(title);
    if off_topic(title, &parts) {
        return None;
    }
    let (at, (start, chapter)) = parts.iter().enumerate().find_map(|(i, p)| Some((i, parser::spelled_chapter(p)?)))?;
    let names = |s: &str| s.chars().any(char::is_alphabetic) && !only_position(s);
    // The text before the chapter word, else the nearest segment before it that names one, else the one after.
    let own = &parts[at][..start];
    let candidates = std::iter::once((own, false))
        .chain(parts[..at].iter().rev().map(|p| (p.as_str(), true)))
        // A bracket in front of the chapter is a series only when nothing before it names one ("[Oshi no Ko]").
        .chain(std::iter::once((own, true)))
        .chain(parts.get(at + 1).map(|p| (p.as_str(), true)));
    let mut marker: Option<String> = None;
    let mut series: Option<String> = None;
    for (raw, unwrap) in candidates {
        let guess = clean_series(raw, unwrap);
        if names(&guess) {
            series = Some(guess);
            break;
        }
        if marker.is_none() && is_entry_marker(&guess) {
            marker = Some(guess);
        }
    }
    // A season or part beside the series still says which AniList entry this is, so it joins the guess.
    let series = match (series?, marker) {
        (series, Some(marker)) => format!("{series} {marker}"),
        (series, None) => series,
    };
    let (series, season) = with_entry_marker(series);
    if off_topic_beside(title, &series) {
        return None;
    }
    Some(Parsed {
        title: series,
        episode: Some(chapter),
        episode_marked: true,
        season,
        release_group: None,
        episode_title: None,
    })
}

/// A browser window on a chapter at a site with no rule of its own: the title without the browser's name, and its guess.
pub(crate) fn match_chapter_tab(process: &str, title: &str) -> Option<(String, Parsed)> {
    if !profiles::is_browser(process) {
        return None;
    }
    let media = without_tab_count(profiles::strip_browser_suffix(title)?.trim());
    // A known site's rule decides its own tabs, including the ones it turned down.
    if profiles::match_site(&media).is_some() || profiles::names_manga_site(&media) {
        return None;
    }
    let parsed = chapter_tab(&media)?;
    Some((media, parsed))
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
        assert_eq!(series("[DISC] Kusuriya no Hitorigoto - Chapter 45 : r/manga"), None);
        assert_eq!(series("One Piece Kapitel 1100 Diskussion - ExampleForum"), None);
        assert_eq!(series("One Piece Chapter 1100 Release Date and Time | ExampleNews"), None);
        assert_eq!(series("Jujutsu Kaisen Chapter 261 LEAKS - ExampleVideos"), None);
        assert_eq!(series("Chainsaw Man Chapter 181 Full Breakdown & Theories - ExampleVideos"), None);
    }

    /// The query a reader types to find the next chapter is exactly the one the progress gate lets through.
    #[test]
    fn a_search_or_a_video_about_a_chapter_is_not_reading_it() {
        assert_eq!(series("one piece chapter 1100 - Google Search"), None);
        assert_eq!(series("jujutsu kaisen kapitel 261 - Google Suche"), None);
        assert_eq!(series("kagurabachi chapter 51 at DuckDuckGo"), None);
        assert_eq!(series("kagurabachi chapter 51 - Search"), None);
        assert_eq!(series("one piece kapitel 1100 - Suchen"), None);
        assert_eq!(series("one piece kapitel 1100 – Qwant"), None);
        assert_eq!(series("one piece kapitel 1100 – Qwant Search"), None);
        assert_eq!(series("kagurabachi chapter 51 - YouTube"), None);
        assert_eq!(series("Jujutsu Kaisen chapter 262 is peak #jjk | TikTok"), None);
        assert_eq!(series("one piece chapter 1101 - Search / X"), None);
        assert_eq!(series("one piece kapitel 1101 - Suche / X"), None);
        assert_eq!(series("Jujutsu Kaisen Chapter 261 Leaked - ExampleVideos"), None);
        assert_eq!(series("One Piece Chapter 1101 Delayed - ExampleNews"), None);
        assert_eq!(series("Jujutsu Kaisen Chapter 261: Release Time, Where To Read & What To Expect - ExampleNews"), None);
    }

    /// Edge adds the window's tab count and the profile after the tab title, and a private window names itself.
    #[test]
    fn a_browser_window_s_own_additions_are_no_part_of_the_tab() {
        assert_eq!(series("one piece chapter 1101 - Search and 3 more pages - Personal"), None);
        assert_eq!(series("One Piece Chapter 1101 - YouTube and 2 more pages - Personal"), None);
        assert_eq!(series("one piece chapter 1101 - Search - Profile 1"), None);
        let private = "one piece chapter 1101 - Google Search — Mozilla Firefox Private Browsing";
        assert_eq!(match_chapter_tab("firefox.exe", private), None);
        let edge = "Chapter 46 | Kusuriya no Hitorigoto and 4 more pages - Personal - Microsoft\u{200b} Edge";
        let (media, parsed) = match_chapter_tab("msedge.exe", edge).unwrap();
        assert_eq!((media.as_str(), parsed.title.as_str()), ("Chapter 46 | Kusuriya no Hitorigoto - Personal", "Kusuriya no Hitorigoto"));
        assert_eq!(series("one piece kapitel 1101 - Suchen und 3 weitere Seiten - Persönlich"), None);
        assert_eq!(series("kagurabachi chapter 51 - YouTube und 1 weitere Seite - Persönlich"), None);
        let german = "Chapter 46 | Kusuriya no Hitorigoto und 4 weitere Seiten - Persönlich – Microsoft\u{200b} Edge";
        let (media, parsed) = match_chapter_tab("msedge.exe", german).unwrap();
        assert_eq!((media.as_str(), parsed.title.as_str()), ("Chapter 46 | Kusuriya no Hitorigoto - Persönlich", "Kusuriya no Hitorigoto"));
    }

    /// Words a page about chapters uses are also in real series names, where they must not refuse the series.
    #[test]
    fn a_title_word_refuses_only_outside_the_series() {
        let theory = series("Dysfunctional Family Theory - Ch. 30 - ExampleReader");
        assert_eq!(theory, Some(("Dysfunctional Family Theory".into(), Some(30))));
        let news = series("Wolf & Parchment: New Theory Spice & Wolf - Ch. 45 - ExampleReader");
        assert_eq!(news, Some(("Wolf & Parchment: New Theory Spice & Wolf".into(), Some(45))));
        assert_eq!(series("Countdown to Love Chapter 12 - ExampleReader"), Some(("Countdown to Love".into(), Some(12))));
        let analysis = "An Isekai Adventure Tale of a Former Structural Analysis Researcher - Ch. 20 - ExampleReader";
        assert!(series(analysis).is_some());
        assert_eq!(series("Jujutsu Kaisen Chapter 261 Theories - ExampleVideos"), None);
        assert_eq!(series("One Piece Chapter 1100 Reaction - ExampleBlog"), None);
        assert_eq!(series("Jujutsu Kaisen Kapitel 261 Analyse - ExampleBlog"), None);
    }

    /// "Read" alone before the chapter word is the site's verb, not a series.
    #[test]
    fn a_reading_verb_alone_is_no_series() {
        let expected = Some(("Kusuriya no Hitorigoto".into(), Some(45)));
        assert_eq!(series("Kusuriya no Hitorigoto - Read Chapter 45 Online - ExampleReader"), expected);
        assert_eq!(series("Read Ch. 45 - Kusuriya no Hitorigoto - ExampleReader"), expected);
    }

    /// A position word before the chapter is no series, so the guess comes from beside it and holds across chapters.
    #[test]
    fn an_extra_or_volume_marker_is_not_the_series() {
        let expected = Some(("Kusuriya no Hitorigoto".into(), Some(45)));
        assert_eq!(series("Kusuriya no Hitorigoto - Extra Chapter 45 - ExampleReader"), expected);
        assert_eq!(series("Kusuriya no Hitorigoto - Extra - Chapter 45 - ExampleReader"), expected);
        assert_eq!(series("Vol. TBD Ch. 45 - Kusuriya no Hitorigoto - ExampleReader"), expected);
        assert_eq!(series("Vol. 3 - Ch. 45 - Kusuriya no Hitorigoto - ExampleReader"), expected);
        assert_eq!(series("Kusuriya no Hitorigoto Vol. 3, Ch. 45 - ExampleReader"), expected);
        assert_eq!(series("Kusuriya no Hitorigoto Band 3 Kapitel 45 - ExampleReader"), expected);
        assert_eq!(series("Berserk - Vol. 41, Ch. 364 - ExampleReader"), Some(("Berserk".into(), Some(364))));
        assert_eq!(series("Berserk - Vol. 41 - Ch. 364 - ExampleReader"), Some(("Berserk".into(), Some(364))));
        assert_eq!(series("One Piece Bd. 105 Kapitel 1060"), Some(("One Piece".into(), Some(1060))));
    }

    /// AniList keeps some seasons and parts as entries of their own, so the marker stays in the guess.
    #[test]
    fn a_season_or_part_stays_with_the_series() {
        let season = |t: &str| chapter_tab(t).map(|p| (p.title, p.season));
        let two = Some(("Kusuriya no Hitorigoto Season 2".to_string(), Some(2)));
        assert_eq!(season("Kusuriya no Hitorigoto Season 2 Chapter 45 - ExampleReader"), two);
        assert_eq!(season("Kusuriya no Hitorigoto - Season 2 Chapter 45 - ExampleReader"), two);
        assert_eq!(season("Kusuriya no Hitorigoto - Season 2 - Ch. 45 - ExampleReader"), two);
        assert_eq!(season("Kusuriya no Hitorigoto Staffel 2 Kapitel 45 - ExampleReader"), two);
        let part = season("Ascendance of a Bookworm Part 3 - Ch. 45 - ExampleReader");
        assert_eq!(part, Some(("Ascendance of a Bookworm Part 3".to_string(), None)));
    }

    #[test]
    fn every_bracket_leaves_the_guess_unless_it_is_the_series() {
        let expected = Some(("Kusuriya no Hitorigoto".into(), Some(45)));
        assert_eq!(series("(3) [Official] Kusuriya no Hitorigoto - Ch. 45 - ExampleReader"), expected);
        let oshi = Some(("Oshi no Ko".into(), Some(120)));
        assert_eq!(series("[Oshi no Ko] Chapter 120 - ExampleReader"), oshi);
        assert_eq!(series("[Oshi no Ko] - Chapter 120 - ExampleReader"), oshi);
        assert_eq!(series("Ch. 120 - [Oshi no Ko] - ExampleReader"), oshi);
        assert_eq!(series("[Oshi no Ko] Vol. 16 Chapter 120 - ExampleReader"), oshi);
        assert_eq!(series("[Oshi no Ko] Manga Chapter 120 - ExampleReader"), oshi);
        // A scan group's tag beside the volume is no series while the segment before names one.
        let tagged = series("Kusuriya no Hitorigoto - [ExampleScans] Vol. 9 Ch. 45 - ExampleReader");
        assert_eq!(tagged, Some(("Kusuriya no Hitorigoto".into(), Some(45))));
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
