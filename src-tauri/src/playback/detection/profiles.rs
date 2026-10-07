//! Player and streaming profiles: which processes are interesting and how the media title comes out of the window title.

use crate::playback::recognition::parser::{self, Parsed};
use regex::Regex;
use std::sync::OnceLock;

/// Known video players: process names and the suffixes stripped from a window title that looks like a video file.
const PLAYERS: &[(&[&str], &[&str])] = &[
    (&["mpv.exe", "mpvnet.exe"], &[" - mpv", " - mpv.net"]),
    (&["vlc.exe"], &[" - VLC media player", " - VLC Media Player"]),
    (
        &["mpc-hc.exe", "mpc-hc64.exe", "mpc-hc64_nvo.exe", "mpc-be.exe", "mpc-be64.exe"],
        &[" - MPC-HC", " - MPC-BE"],
    ),
    (
        &["potplayermini64.exe", "potplayermini.exe", "potplayer64.exe", "potplayer.exe"],
        &[" - PotPlayer"],
    ),
    (&["smplayer.exe"], &[" - SMPlayer"]),
];

/// Shared with `media_session` to tell a video URL from an audio one, so the two cannot disagree about what a video is.
pub(crate) const VIDEO_EXTENSIONS: &[&str] = &[
    ".mkv", ".mp4", ".avi", ".m4v", ".webm", ".ts", ".m2ts", ".ogm", ".wmv", ".flv",
];

const BROWSERS: &[&str] = &[
    "chrome.exe",
    "firefox.exe",
    "msedge.exe",
    "brave.exe",
    "opera.exe",
    "opera_gx.exe",
    "vivaldi.exe",
    "zen.exe",
    "librewolf.exe",
    "waterfox.exe",
    "helium.exe",
];

/// Whether a window's process is one of the browsers whose tabs Karasu reads.
pub(crate) fn is_browser(process: &str) -> bool {
    BROWSERS.contains(&process)
}

/// Browser window titles end with the browser name — strip it.
const BROWSER_SUFFIXES: &[&str] = &[
    " - Google Chrome",
    " — Mozilla Firefox Private Browsing",
    " — Mozilla Firefox Privater Modus",
    " — Mozilla Firefox",
    " - Mozilla Firefox",
    " - Microsoft\u{200b} Edge",
    // German and French Edge join the browser's name with an en dash.
    " – Microsoft\u{200b} Edge",
    " - Microsoft Edge",
    " - Brave",
    " - Opera",
    " - Vivaldi",
    " — Zen Browser",
    " - LibreWolf",
    // Firefox forks keep Firefox's em-dash, the hyphen twin covers older builds, and Helium is Chromium-family.
    " — Waterfox",
    " - Waterfox",
    " - Helium",
];

/// What a site's title can tell: the series and an episode, or the series alone.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Carries {
    Episode,
    /// The tab shows the same title on the detail page as during playback, so only a playing media session may use it.
    SeriesOnly,
}

/// A streaming site, recognised by an affix that actually strips off its tab title rather than by a word inside it.
struct Site {
    /// Stripped once the site is named; a prefix names it only when it is also in `names_alone`.
    prefixes: &'static [&'static str],
    /// The prefixes specific enough to name the site without a suffix.
    names_alone: &'static [&'static str],
    suffixes: &'static [&'static str],
    /// Everything from the first of these on is the site's own text, cut after the suffix.
    cut_from: &'static [&'static str],
    /// A title holding one of these is a page that is never playback.
    reject: &'static [&'static str],
    carries: Carries,
}

/// The sites whose tab titles name a series; the measured titles behind each entry are in CLAUDE.md.
const SITES: &[Site] = &[
    Site {
        prefixes: &["Watching "],
        names_alone: &[],
        suffixes: &[" - Watch on Crunchyroll", " Watch on Crunchyroll", " - Schau auf Crunchyroll", " - Crunchyroll"],
        cut_from: &[],
        reject: &[],
        carries: Carries::Episode,
    },
    Site {
        prefixes: &[],
        names_alone: &[],
        suffixes: &[" en streaming - ADN", " - ADN"],
        cut_from: &[" - streaming - "],
        reject: &[],
        carries: Carries::Episode,
    },
    Site {
        prefixes: &[],
        names_alone: &[],
        suffixes: &[" - BiliBili", " - Bstation"],
        cut_from: &[],
        reject: &[],
        carries: Carries::Episode,
    },
    Site {
        prefixes: &["Watch "],
        names_alone: &[],
        suffixes: &[" | Disney+"],
        cut_from: &[],
        reject: &[" | Full episodes"],
        carries: Carries::SeriesOnly,
    },
    Site {
        prefixes: &["Prime Video: ", "Amazon.de: ", "Amazon.com: ", "Amazon.co.uk: ", "Watch "],
        // An Amazon prefix alone is any store page; only the suffix or Prime's own prefix means a video.
        names_alone: &["Prime Video: "],
        suffixes: &[" ansehen | Prime Video", " | Prime Video"],
        cut_from: &[],
        reject: &[],
        carries: Carries::SeriesOnly,
    },
];

/// A tab title a site profile recognised: what it carries and the title with the site's own text removed.
#[derive(Debug, Clone, PartialEq)]
pub struct SiteTitle {
    pub carries: Carries,
    pub media: String,
    /// Filled for a series-only site, so the parser's bare-number rule never reads "Mob Psycho 100" as episode 100.
    pub parsed: Option<Parsed>,
}

/// Every prefix of the list that leads the title, stripped in turn; true when any did.
fn strip_prefixes(media: &mut String, prefixes: &[&str]) -> bool {
    let mut any = false;
    for p in prefixes {
        if let Some(rest) = media.strip_prefix(p) {
            *media = rest.to_string();
            any = true;
        }
    }
    any
}

/// The first suffix of the list that ends the title, stripped; true when one did.
fn strip_suffix_of(media: &mut String, suffixes: &[&str]) -> bool {
    for s in suffixes {
        if let Some(rest) = media.strip_suffix(s) {
            *media = rest.to_string();
            return true;
        }
    }
    false
}

/// A series-only title as the matcher wants it: brackets gone, a later season re-spelt as "Season N" so it can steer.
fn series_only(media: &str) -> Parsed {
    static RE: OnceLock<[Regex; 3]> = OnceLock::new();
    let [brackets, named, short] = RE.get_or_init(|| {
        [
            Regex::new(r"\s*[\[(][^\])]*[\])]").unwrap(),
            Regex::new(r"(?i)(?:\s*[,\-–:]\s*|\s+)(?:season|staffel)\s*(\d{1,2})\b").unwrap(),
            Regex::new(r"(?i)\s+s(\d{1,2})\s*$").unwrap(),
        ]
    });
    let mut title = brackets.replace_all(media, "").to_string();
    let mut season: Option<u32> = None;
    for re in [named, short] {
        if let Some(c) = re.captures(&title) {
            season = c.get(1).and_then(|m| m.as_str().parse().ok());
            title = re.replace(&title, "").to_string();
            break;
        }
    }
    let mut title = title.trim().trim_end_matches([',', '-', '–', ':']).trim().to_string();
    // The matcher only lets a season steer when the title carries it, and only in the spellings it knows.
    if let Some(n) = season.filter(|n| *n > 1) {
        title = format!("{title} Season {n}");
    }
    Parsed {
        title,
        episode: None,
        episode_marked: false,
        season,
        release_group: None,
        episode_title: None,
    }
}

/// Recognises a streaming site's tab title, with the browser's own name already stripped; None for any other title.
pub fn match_site(title: &str) -> Option<SiteTitle> {
    for site in SITES {
        if site.reject.iter().any(|r| title.contains(r)) {
            continue;
        }
        let mut media = title.trim().to_string();
        let suffixed = strip_suffix_of(&mut media, site.suffixes);
        strip_prefixes(&mut media, site.prefixes);
        let named = suffixed || site.names_alone.iter().any(|p| title.trim_start().starts_with(p));
        if !named {
            continue;
        }
        for cut in site.cut_from {
            if let Some(i) = media.find(cut) {
                media.truncate(i);
            }
        }
        let media = media.trim().to_string();
        if media.is_empty() {
            return None;
        }
        let parsed = (site.carries == Carries::SeriesOnly).then(|| series_only(&media));
        if parsed.as_ref().is_some_and(|p| p.title.is_empty()) {
            return None;
        }
        return Some(SiteTitle { carries: site.carries, media, parsed });
    }
    None
}

/// Official manga readers: same mechanics as streaming, but the title carries a chapter number.
const MANGA_MARKERS: &[(&str, &[&str])] = &[
    ("MANGA Plus", &[" - MANGA Plus by SHUEISHA", " | MANGA Plus", " - MANGA Plus"]),
];

/// The tab title without an official reader's suffix, or None unless it ends in one; a post naming the reader is no tab.
fn strip_manga_site(title: &str) -> Option<String> {
    let title = super::browser::without_tab_count(title.trim_end());
    MANGA_MARKERS
        .iter()
        .flat_map(|(_, suffixes)| suffixes.iter())
        .find_map(|s| title.strip_suffix(s))
        .map(|rest| rest.trim().to_string())
}

/// Whether a tab title ends in one of the readers above, whose own rule decides it.
pub(crate) fn names_manga_site(title: &str) -> bool {
    strip_manga_site(title).is_some()
}

/// Extracts the file name from a known player's window when the title looks like a video file.
pub fn match_player(process: &str, title: &str) -> Option<String> {
    let (_, suffixes) = PLAYERS
        .iter()
        .find(|(procs, _)| procs.contains(&process))?;

    let mut media = title.to_string();
    for suffix in *suffixes {
        if let Some(stripped) = media.strip_suffix(suffix) {
            media = stripped.to_string();
            break;
        }
    }
    let media = media.trim();
    if media.is_empty() {
        return None;
    }

    // Players often show menu or idle titles, so only what looks like a video file is accepted.
    let lower = media.to_lowercase();
    if VIDEO_EXTENSIONS.iter().any(|ext| lower.ends_with(ext)) {
        return Some(media.to_string());
    }
    // MPC and mpv may hide the file extension: accepted when an episode number is recognizable.
    if crate::playback::recognition::parser::parse(media).episode.is_some() {
        return Some(media.to_string());
    }
    None
}

pub(crate) fn strip_browser_suffix(title: &str) -> Option<String> {
    let mut media = title.to_string();
    for suffix in BROWSER_SUFFIXES {
        if let Some(stripped) = media.strip_suffix(suffix) {
            media = stripped.to_string();
            break;
        }
    }
    Some(media)
}

/// Detects streaming playback in browser tabs from the window title; only a site that names the episode counts here.
pub fn match_streaming(process: &str, title: &str) -> Option<String> {
    if !BROWSERS.contains(&process) {
        return None;
    }
    let site = match_site(&strip_browser_suffix(title)?)?;
    // A window cannot tell a detail page from playback, so a series-only site waits for its media session.
    if site.carries != Carries::Episode {
        return None;
    }
    // Only a spelled-out episode: a series page's own number ("Mob Psycho 100") is not one.
    parser::parse(&site.media).episode_marked.then_some(site.media)
}

/// Detects manga reading on an official reader's tab; a chapter anywhere else is `browser::chapter_tab`'s.
pub fn match_manga(process: &str, title: &str) -> Option<String> {
    if !BROWSERS.contains(&process) {
        return None;
    }
    let media = strip_manga_site(&strip_browser_suffix(title)?)?;
    // Only accept when a chapter number is recognizable
    crate::playback::recognition::parser::parse_manga(&media).episode.is_some().then_some(media)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn player_mpv_with_suffix() {
        assert_eq!(
            match_player("mpv.exe", "[SubsPlease] Sousou no Frieren - 28 (1080p).mkv - mpv"),
            Some("[SubsPlease] Sousou no Frieren - 28 (1080p).mkv".to_string())
        );
    }

    #[test]
    fn player_vlc_idle_ignored() {
        assert_eq!(match_player("vlc.exe", "VLC media player"), None);
    }

    #[test]
    fn player_unknown_process_ignored() {
        assert_eq!(match_player("notepad.exe", "file.mkv"), None);
    }

    #[test]
    fn streaming_crunchyroll_watch_page() {
        assert_eq!(
            match_streaming(
                "chrome.exe",
                "Watching Sousou no Frieren Episode 28 - Crunchyroll - Google Chrome"
            ),
            Some("Sousou no Frieren Episode 28".to_string())
        );
    }

    #[test]
    fn streaming_crunchyroll_ep_format() {
        assert_eq!(
            match_streaming(
                "firefox.exe",
                "Frieren: Beyond Journey's End Season 1 Ep 28 Watch on Crunchyroll — Mozilla Firefox"
            ),
            Some("Frieren: Beyond Journey's End Season 1 Ep 28".to_string())
        );
    }

    #[test]
    fn streaming_overview_page_ignored() {
        assert_eq!(
            match_streaming("chrome.exe", "Crunchyroll - Watch Anime - Google Chrome"),
            None
        );
    }

    /// Crunchyroll's German watch page names the series and the episode's name but no number, so it is not playback.
    #[test]
    fn crunchyroll_without_a_number_is_not_playback() {
        let title = "Sousou no Frieren Tabi no Owari - Schau auf Crunchyroll - Google Chrome";
        assert_eq!(match_streaming("chrome.exe", title), None);
    }

    #[test]
    fn bilibili_names_series_and_episode() {
        assert_eq!(
            match_streaming("chrome.exe", "Face on Lie E2 - ILLUSION - BiliBili - Google Chrome"),
            Some("Face on Lie E2 - ILLUSION".to_string())
        );
        let season = match_streaming("firefox.exe", "Rakshasa Street S4 E1 - BiliBili — Mozilla Firefox").unwrap();
        assert_eq!(season, "Rakshasa Street S4 E1");
        let parsed = parser::parse(&season);
        assert_eq!((parsed.season, parsed.episode), (Some(4), Some(1)));
        assert_eq!(
            match_streaming("chrome.exe", "Rakshasa Street S4 E1 - Tiada Jalan Kembali - Bstation - Google Chrome"),
            Some("Rakshasa Street S4 E1 - Tiada Jalan Kembali".to_string())
        );
        assert_eq!(match_streaming("chrome.exe", "Anime - BiliBili - Google Chrome"), None);
    }

    /// ADN's German titles carry the dub list after the episode, which is the site's text and not the episode's name.
    #[test]
    fn adn_cuts_its_dub_list() {
        let title = "TOUGEN ANKI - 1 Folge 1 : Teufelsblut - streaming - DF, OmdU, vde, vostde und vostpl - ADN - Google Chrome";
        assert_eq!(match_streaming("chrome.exe", title), Some("TOUGEN ANKI - 1 Folge 1 : Teufelsblut".to_string()));
    }

    /// A word inside a title names no site: "MADNESS" is not ADN, and a lone "Watch " is not Disney+.
    #[test]
    fn a_site_is_named_by_an_affix_not_a_word() {
        assert_eq!(match_site("MADNESS Episode 3"), None);
        assert_eq!(match_site("Watching paint dry Episode 3"), None);
        assert_eq!(match_site("Watch Frieren Episode 3"), None);
    }

    /// HIDIVE's tab names only the episode and Netflix's only itself, so neither can ever be recognised.
    #[test]
    fn hidive_and_netflix_tabs_are_not_recognised() {
        assert_eq!(match_streaming("chrome.exe", "E3 - Fencer Ordinaire - Google Chrome"), None);
        assert_eq!(match_streaming("chrome.exe", "Netflix - Google Chrome"), None);
        assert_eq!(match_site("Netflix"), None);
    }

    /// Disney+ and Prime Video name the series alone, read without the parser, and never pass the window pass.
    #[test]
    fn disney_and_prime_name_the_series_alone() {
        let mob = match_site("Mob Psycho 100 | Disney+").unwrap();
        assert_eq!(mob.carries, Carries::SeriesOnly);
        let parsed = mob.parsed.unwrap();
        assert_eq!((parsed.title.as_str(), parsed.episode, parsed.season), ("Mob Psycho 100", None, None));
        assert_eq!(match_streaming("chrome.exe", "Mob Psycho 100 | Disney+ - Google Chrome"), None);

        for title in [
            "Prime Video: The Vampire Diaries - Staffel 1 [OV]",
            "Amazon.de: The Vampire Diaries - Staffel 1 [OV] ansehen | Prime Video",
        ] {
            let parsed = match_site(title).unwrap().parsed.unwrap();
            assert_eq!((parsed.title.as_str(), parsed.season), ("The Vampire Diaries", Some(1)), "{title}");
        }
        let kill = match_site("Prime Video: KILL JACKIE, Season 1").unwrap().parsed.unwrap();
        assert_eq!((kill.title.as_str(), kill.season), ("KILL JACKIE", Some(1)));
        let marshals = match_site("Prime Video: Marshals S2").unwrap().parsed.unwrap();
        assert_eq!((marshals.title.as_str(), marshals.season), ("Marshals Season 2", Some(2)));
        let vinland = match_site("Prime Video: Vinland Saga - Staffel 2 [OmU]").unwrap().parsed.unwrap();
        assert_eq!((vinland.title.as_str(), vinland.season), ("Vinland Saga Season 2", Some(2)));
    }

    /// A later season keeps a marker the matcher reads, so it lands on that season's entry and not the first.
    #[test]
    fn a_later_season_on_prime_steers_the_match() {
        use crate::playback::recognition::matcher::{best_match, Candidate};
        let entry = |media_id: i64, title: &str| Candidate {
            media_id,
            titles: vec![title.to_string()],
            episodes: Some(24),
            duration_min: Some(24),
            cover_url: None,
            progress: 0,
            status: "CURRENT".into(),
            display: None,
        };
        let candidates = [entry(1, "Vinland Saga"), entry(2, "Vinland Saga Season 2")];
        let parsed = match_site("Prime Video: Vinland Saga - Staffel 2").unwrap().parsed.unwrap();
        assert_eq!(best_match(&parsed, &candidates).map(|m| m.media_id), Some(2));
    }

    /// A number inside a series page's title is not an episode, on any site that can name one.
    #[test]
    fn a_numbered_series_page_is_not_an_episode() {
        assert_eq!(match_streaming("chrome.exe", "Mob Psycho 100 - Watch on Crunchyroll - Google Chrome"), None);
        assert_eq!(match_streaming("chrome.exe", "Mob Psycho 100 - Schau auf Crunchyroll - Google Chrome"), None);
        assert_eq!(match_streaming("chrome.exe", "Kaiju No. 8 - BiliBili - Google Chrome"), None);
    }

    #[test]
    fn store_pages_are_not_series() {
        assert_eq!(match_site("Prime Video | Watch movies, TV shows, Live TV, and sports"), None);
        assert_eq!(match_site("Watch The Walking Dead | Full episodes | Disney+"), None);
        assert_eq!(match_site("Amazon.com: Echo Dot (5th Gen, 2022 release) : Amazon Devices & Accessories"), None);
        assert_eq!(match_site("Amazon.de: Bücher"), None);
    }

    #[test]
    fn manga_plus_chapter() {
        assert_eq!(
            match_manga(
                "firefox.exe",
                "One Piece - Chapter 1100 - MANGA Plus by SHUEISHA — Mozilla Firefox"
            ),
            Some("One Piece - Chapter 1100".to_string())
        );
    }

    #[test]
    fn manga_overview_page_ignored() {
        assert_eq!(
            match_manga("chrome.exe", "MANGA Plus by SHUEISHA - Google Chrome"),
            None
        );
    }

    #[test]
    fn manga_non_browser_ignored() {
        assert_eq!(match_manga("mpv.exe", "Something Ch. 4 - MANGA Plus"), None);
    }

    /// A post, a thread or an article that mentions the reader is not its tab, and never takes its no-questions path.
    #[test]
    fn a_page_that_only_mentions_the_reader_is_not_its_tab() {
        for title in [
            "Jujutsu Kaisen on X: \"Chapter 261 is out now on MANGA Plus\" / X — Mozilla Firefox",
            "Kagurabachi Chapter 51 is out on MANGA Plus : r/Kagurabachi — Mozilla Firefox",
            "One Piece Chapter 1101: Release Date, Where to Read on MANGA Plus - ExampleNews — Mozilla Firefox",
        ] {
            assert_eq!(match_manga("firefox.exe", title), None, "{title}");
            assert!(!names_manga_site(&strip_browser_suffix(title).unwrap()), "{title}");
        }
        let edge = "One Piece - Chapter 1100 - MANGA Plus by SHUEISHA and 2 more pages - Microsoft\u{200b} Edge";
        assert_eq!(match_manga("msedge.exe", edge), Some("One Piece - Chapter 1100".to_string()));
    }

    /// Only an official reader is a known site; a chapter elsewhere goes through the generic rule or nowhere.
    #[test]
    fn a_reader_karasu_does_not_name_is_not_a_known_site() {
        let title = "Kusuriya no Hitorigoto - Ch. 45 - ExampleReader — Mozilla Firefox";
        assert_eq!(match_manga("firefox.exe", title), None);
        assert!(!names_manga_site(title));
    }
}
