//! Relates a playing media session to the browser tabs that could be playing it; pure, so its tests run everywhere.

use super::media_session::MediaSession;
use super::WindowInfo;
use crate::playback::recognition::matcher::normalize;

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

    #[test]
    fn nothing_playing_or_only_music_players_says_nothing() {
        let mut spotify = browser_session("Some Song Title Here", "playing");
        spotify.app_id = "SpotifyAB.SpotifyMusic_zpdnekdrzrea0".into();
        assert_eq!(unlinked_line(&[browser_session("The Hero’s Party", "paused")], &[]), None);
        assert_eq!(unlinked_line(&[spotify], &[]), None);
    }
}
