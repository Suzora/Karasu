---
paths:
  - "src-tauri/src/playback/**"
  - "scripts/browser-measure.mjs"
  - "scripts/browser-measure-core.mjs"
---

# Detection: what browsers and streaming sites publish

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## Notes that have cost real time

- **A streaming site is only as good as its tab title, and four were measured
  on 2026-10-05** from server-rendered HTML and the player bundles. Bilibili.tv
  names series and episode (`Face on Lie E2 - ILLUSION - BiliBili`, `Rakshasa
  Street S4 E1 - BiliBili`, ` - Bstation` in the Indonesian locale) and sets no
  media-session metadata. Disney+ (`<Series> | Disney+`) and Prime Video
  (`Prime Video: <Series> - Staffel 1 [OV]`, `Amazon.de: … ansehen | Prime
  Video`) name the series alone and keep the detail page's title during
  playback, so they are `SeriesOnly` in `profiles.rs`: read without the parser
  (whose bare-number rule makes "Mob Psycho 100" episode 100) and accepted only
  from a playing media session, never from a window title, and only from a
  session with no artist or album of its own (a YouTube trailer titled
  "… | Disney+" names its channel). A later season is re-spelt "<Series>
  Season N" because the matcher lets a season steer only when the title
  carries it in a spelling it knows, and only "Prime Video: " names that
  site without its suffix, since "Amazon.de: " leads every store page. HIDIVE's tab is
  `E3 - <episode name>`, no series and no site, and Netflix's is `Netflix`
  during playback; neither can be detected, and the Netflix profile went.
  Crunchyroll's German watch page for Frieren's first episode read the series,
  then the episode's name, then "- Schau auf Crunchyroll", with no number,
  so its tab alone cannot scrobble; whether its player publishes media-session
  metadata needs a subscriber's capture through the Settings diagnostic. The
  maintainer took Crunchyroll off the README and the site on 2026-10-06, as
  Netflix before it; its profile stays, since a title that spells its number
  still matches. ADN
  appends its dub list (`… : Teufelsblut - streaming - DF, OmdU, … - ADN`),
  which the profile cuts. A site is named by an affix that strips, never by a
  word inside the title — "ADN" sits inside "MADNESS".
- **Firefox and its forks tell the desktop less than the tab shows, and the
  verbose log says what was dropped.** Read from Mozilla's source on
  2026-10-07: the browser publishes one media session, for the tab that last
  started playing; on Windows its SMTC entry is always typed *Music*, carries
  only title and artist and an install-hash app id; on Linux its MPRIS entry
  carries `xesam:url`, the playing tab's page URL (Firefox 132 on, absent in
  private windows). A site that sets its own metadata often names only the
  episode there, while its tab names the series. So with verbose logging on
  the `verdict` line names every playing session that is not a known music
  player — rejected ones included, which is what detection saw — and the
  `browser_tabs` line, written when nothing was recognised, counts the
  browser windows and names only those whose title holds the session's own,
  compared word for word in the matcher's form (`browser::relation`), never
  the rest of what is open. `scripts/browser-measure.mjs` takes the same
  measurement from outside the app, session files included. On KDE the
  playing tab can also reach MPRIS through Plasma's browser integration,
  which puts the page's origin in `xesam:album` when the site names no
  album (seen with Zen on 2026-10-31); `named_artist` drops an address there
  or in the artist, or it led the composed title. A reverse-DNS bus name
  (`io.github.x.app`) is shortened to its last part by `short_app_name`.
- **A chapter on a site Karasu does not name is taken only for a manga being
  read, and always asks.** Since 2026-10-07, when the unofficial readers
  left, MANGA Plus is the one reader named, and only by the suffix its tab
  ends in (`strip_manga_site`): a post or a thread that merely mentions it
  would otherwise take the official path, which never asks. Any other tab
  goes to `browser::chapter_tab`, which reads the tab each browser window
  shows when its title spells a chapter with its word (`parser::spelled_chapter`: "Ch.
  45", "Chapter", "Kapitel" — never a bare or `#` number) and is not a page
  about chapters (`off_topic`): no off-topic word in English or German
  (discussion, wiki, review, spoilers, Diskussion …), no phrase like
  "release date" or "where to read", no search engine or video site as a
  segment after the first (a browser profile's name can follow it), no
  forum thread and no post on X. Words that real series also carry (theory, news, leaks,
  analysis, reaction, `[DISC]` …) refuse a tab outside the series guess
  (`off_topic_beside`), and inside it unless a title of the matched entry
  carries them too (`label_beyond_entry`, checked in `chapter_tab_refusal`),
  because "Dysfunctional Family Theory" is a series while "Chapter 261
  Theories" is a video and "One Piece Leaks - Chapter 1101" a leak page.
  Five review rounds that day measured why each rule exists: the query a
  reader types to find the next chapter is exactly progress + 1. Edge's
  "and N more pages" (German "und N weitere Seiten", read out of Edge's
  locale files, whose German title also ends in an en dash) is cut before
  anything is read (`without_tab_count`), and a Firefox private window's
  suffix, English or German (read from Mozilla's `browser.ftl`), is a
  browser suffix like the rest.
  The series is one deterministic guess,
  because it is the correction key: the raw text before the chapter word
  unless it holds only position words or the verb ("Extra", "Vol. TBD",
  "Band 3", "Read"), else
  the nearest segment before it that names a series, else the one after,
  cut at ` - `, ` | ` and their dashes, without a leading "Read", any
  bracket, a volume or a trailing "Manga"/"Manhwa"; a bracket stands for
  the series ("[Oshi no Ko]") only once nothing before the chapter word
  names one without brackets, and then a segment that is only a bracket
  comes before a tag in the chapter's own segment, or a scan group's tag
  would win. A season or a part stays in the
  guess, "Staffel" re-spelt "Season" and the number set as `season`,
  because AniList keeps some as entries of their own (Ascendance of a
  Bookworm's parts): cutting it matched Part 3 against Part 4, while kept,
  a separate entry matches exactly and a single entry, for a season,
  through the matcher's season-stripped variant (a part has none, so a
  short name with "Part 2" can miss a single entry). The chapter tabs are the sweep's last
  rung (`chapter_tabs`, every browser window front first), after the media
  sessions and a paused mpv, and the loop counts them as nothing while an
  episode's session is still alive (`holds_chapter_tabs`: anime, not yet
  written, queued or cancelled, and not blocked in a way nothing may
  override), so reading in another window never ends a paused episode's
  session; the hold ends with that session's pause grace.
  `now_from` keeps the first tab `build_now_playing` accepts: it matches
  Reading and Rereading entries only (`match_pool`) and drops a tab, card
  and all, unless one matched and the chapter is at most two past its
  progress and inside its known length (`generic_refusal`). A user's
  correction is their word and skips those gates; clearing it applies them
  again (`requeue_match`), and a drop there makes the next tick judge every
  chapter tab afresh (`REJUDGE`). The session is `generic`, so `cautious`
  makes it ask whatever the settings say and never lets its gap block lift
  by itself; the scrobble event's `asks` (the confirm setting as `cautious`
  leaves it, re-read every tick) makes the card count down to asking, here
  and for any session with "Ask before updating" on. A drop is logged once per change of the tab titles, never per
  tick, and nothing is re-judged until a title changes, so a manga marked
  Reading while its tab is open is picked up at the next chapter.
