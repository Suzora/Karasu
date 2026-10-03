/**
 * Every screenshot the site uses: which capture it comes from, what it shows,
 * and the sentence a screen reader gets. `process-screenshots.mjs` reads this,
 * writes the derivatives and generates `src/content/screenshots.ts`. Order
 * here is the gallery's order.
 *
 * Alt text: one present-tense sentence naming the screen and what is on it,
 * never "screenshot of". Captions are the gallery's labels.
 */
export const DESKTOP = [
  { id: "overview", file: "overview.png", alt: "The Overview shows this season's most popular title in a banner, four statistics tiles, the titles to continue watching and the ones airing soon.", caption: "Overview — the season, your numbers, what to watch next" },
  { id: "now-playing", file: "now-playing.png", alt: "The Now Playing window floating over the Overview: the cover of Katanagatari, episode 3 playing in mpv, the progress update counting down, and the update, skip and fix-match buttons in its header.", caption: "Now Playing — the floating window, an episode detected in mpv" },
  { id: "anime-grid", file: "anime-grid.png", alt: "The anime list as a cover grid, with status tabs, a search field, sort, filters and presets above it.", caption: "Anime list, grid view" },
  { id: "anime-rows", file: "anime-rows.png", alt: "The anime list as rows: cover, title, status, score and episode count editable in place, rewatches and dates beside them.", caption: "Anime list, rows — status, score and progress edited in place" },
  { id: "manga-grid", file: "manga-grid.png", alt: "The manga list as a cover grid.", caption: "Manga list, grid view" },
  { id: "library", file: "library.png", alt: "The local library lists three matched titles with their next unwatched file, the match confidence and a Play button each.", caption: "Local library — files matched to your list, next episode first" },
  { id: "stats-overview", file: "stats-overview.png", alt: "The Statistics page's overview tab: the list's totals, then its statuses, formats and episode lengths as bars and a ring.", caption: "Statistics — overview" },
  { id: "stats-genres", file: "stats-genres.png", alt: "The Statistics page's genres and tags tab: a radar of the six biggest genres, each genre's mean score against the overall one, and the tags as a treemap.", caption: "Statistics — genres and tags" },
  { id: "wrapped", file: "wrapped.png", alt: "The year-in-review page: the shape, format and size choices above the 2026 poster with the year's numbers, top genres and top-rated titles.", caption: "Year in review" },
  { id: "seasonal", file: "seasonal.png", alt: "The Seasonal page shows one season's titles in a grid, with the season switcher above it.", caption: "Seasonal" },
  { id: "calendar", file: "calendar.png", alt: "The Calendar page shows the week's airing episodes on a Monday-first grid.", caption: "Calendar" },
  { id: "franchise", file: "franchise.png", alt: "The franchise graph of the Monogatari series, its related titles in columns connected by lines, with Bakemonogatari's card open at the side.", caption: "Franchise graph" },
  { id: "bell", file: "bell.png", alt: "The notification bell open over the Overview, listing recent notifications.", caption: "The bell — Karasu's and AniList's notifications in one stream" },
  { id: "palette", file: "palette.png", alt: "The command palette open over the Overview, listing the titles on the list that match “mono”.", caption: "Command palette (Ctrl+K)" },
  { id: "settings-detection", file: "settings-detection.png", alt: "The Detection settings pane: automatic tracking, the confirmation toggle, the threshold, media sessions and mpv.", caption: "Settings — detection" },
  { id: "light-anime-grid", file: "light-anime-grid.png", alt: "The anime list in the light theme.", caption: "Light theme" },
  { id: "about", file: "about.png", alt: "The About page with the mark, the update check and the diagnostics report.", caption: "About" },
];

export const PHONE = [
  { id: "phone-overview", file: "overview.png", alt: "The phone's Overview: this season's most popular title, four statistics tiles and the titles to continue watching, above the bottom bar.", crop: { top: 107 }, caption: "Android — overview" },
  { id: "phone-list", file: "list.png", alt: "The anime list on the phone as a four-column cover grid with the status tabs above.", crop: { top: 107 }, caption: "Android — anime list" },
  { id: "phone-detail", file: "detail.png", alt: "Katanagatari's detail page on the phone with the status sheet open: the status, the progress and the score over the community's own spread of scores.", crop: { top: 107 }, caption: "Android — a title, with its entry open" },
  { id: "phone-search", file: "search.png", alt: "The search page on the phone with the results for “haikyu” as a cover grid.", crop: { top: 107 }, caption: "Android — search" },
  { id: "phone-more", file: "more.png", alt: "The More sheet on the phone listing the remaining screens.", crop: { top: 107 }, caption: "Android — the More sheet" },
];
