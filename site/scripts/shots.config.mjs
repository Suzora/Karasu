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
  { id: "overview", file: "overview.png", alt: "The Overview: a greeting with search and the next 48 hours over a season's banner, the lists as shelves, the airing titles to catch up on, and a column with the statistics and your own activity.", caption: "Overview — your lists, the week, what to catch up on" },
  { id: "now-playing", file: "now-playing.png", alt: "The Now Playing window floating over the anime list: Mushoku Tensei's third season detected in mpv, season 3 episode 9, with the progress it will write.", caption: "Now Playing — an episode detected in mpv" },
  { id: "anime-grid", file: "anime-grid.png", alt: "The anime list as a cover grid, with the statuses and custom lists in a column beside it and search, sort, filters and presets above it.", caption: "Anime list, grid view" },
  { id: "anime-rows", file: "anime-rows.png", alt: "The anime list as rows: title, format, season and airing state, with score, episode count and the +1 button editable in place.", caption: "Anime list, rows — score and progress edited in place" },
  { id: "manga-grid", file: "manga-grid.png", alt: "The manga list as a cover grid, with chapter and volume progress under each cover.", caption: "Manga list, grid view" },
  { id: "library", file: "library.png", alt: "The local library lists the matched titles with their next unwatched file, the match confidence and a Play button each.", caption: "Local library — files matched to your list, next episode first" },
  { id: "stats-overview", file: "stats-overview.png", alt: "The Statistics page's overview: the list's totals, a ring of statuses and formats, the countries of origin, where the watch time went and the series lengths.", caption: "Statistics — overview" },
  { id: "stats-genres", file: "stats-genres.png", alt: "The Statistics page's genres and tags: where you score harsher or kinder than the community per genre, what you finish per genre, and the genres ranked.", caption: "Statistics — genres and tags" },
  { id: "wrapped", file: "wrapped.png", alt: "The year-in-review page: the period, template, format and size choices beside the 2026 poster with the year's numbers, top genres and top-rated titles.", caption: "Year in review" },
  { id: "seasonal", file: "seasonal.png", alt: "The Seasonal page: Fall 2026's titles as cards with their genres and a countdown, the year, season and formats in a column beside them.", caption: "Seasonal" },
  { id: "calendar", file: "calendar.png", alt: "The Calendar's agenda: the week's airing episodes from today, each on a card with its cover, time and episode number.", caption: "Calendar" },
  { id: "franchise", file: "franchise.png", alt: "The franchise graph of Mushoku Tensei: the third season linked to its earlier seasons, the light novel and a spin-off manga, with the selected title's card at the side.", caption: "Franchise graph" },
  { id: "bell", file: "bell.png", alt: "The notification bell open over the Overview: likes grouped by person, a reply on a followed activity and a new episode.", caption: "The bell — Karasu's and AniList's notifications in one stream" },
  { id: "palette", file: "palette.png", alt: "The command palette open over the Overview, listing the titles on the list that match “frieren”.", caption: "Command palette (Ctrl+K)" },
  { id: "settings-detection", file: "settings-detection.png", alt: "The Detection settings pane: automatic tracking, the confirmation toggle, the episode gap, media sessions, the threshold and new-episode notifications.", caption: "Settings — detection" },
  { id: "light-anime-grid", file: "light-anime-grid.png", alt: "The anime list in the light theme.", caption: "Light theme" },
  { id: "about", file: "about.png", alt: "The About page with the mark, the update check, the changelog and the diagnostics report.", caption: "About" },
];

export const PHONE = [
  { id: "phone-overview", file: "overview.png", alt: "The phone's Overview: a greeting with search over a season's banner and the lists as shelves, above the bottom bar.", caption: "Android — overview" },
  { id: "phone-list", file: "list.png", alt: "The anime list on the phone as a three-column cover grid, with the status picker and the list's search above it.", caption: "Android — anime list" },
  { id: "phone-detail", file: "detail.png", alt: "Mushoku Tensei's detail page on the phone with the status sheet open: the status, the progress and the score over the community's own spread of scores.", caption: "Android — a title, with its entry open" },
  { id: "phone-search", file: "search.png", alt: "The search page on the phone with the results for “season 2” as a cover grid.", caption: "Android — search" },
  { id: "phone-more", file: "more.png", alt: "The More sheet on the phone: your profile, the command palette and the remaining screens.", caption: "Android — the More sheet" },
];
