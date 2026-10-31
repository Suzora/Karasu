import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import changelog from "virtual:changelog";

// The real App, shell included, over a mocked backend; `scripts/screens.mjs` drives it and names the parameters.
mockWindows("main");

const params = new URLSearchParams(location.search);
const theme = params.get("theme") ?? "dark";
const contrast = params.get("contrast") === "more";
const android = params.get("android") === "1";
// Signed out, so the overview shows the first-run screen instead of the lists.
const signedOut = params.get("out") === "1";
// A player running the first real title, so the detection window has something to show.
const playing = params.get("playing") === "1";
/** A named alternative state for one mocked command, such as `jellyfin-out` for a server not yet signed in to. */
const mock = params.get("mock") ?? "";
const route = params.get("route") ?? "/";
const style = params.get("style") ?? "";
/** The build the shell and About name: "screens" for the boards, the real version where the website shows it. */
const version = params.get("version") || "screens";
const now = Math.floor(Date.now() / 1000);

/** Real banners and covers when `screens.mjs` has cached them, else generated gradients of the same shape. */
const cached = (await fetch("/scripts/screens/.cache/assets.json")
  .then((r) => (r.ok ? r.json() : {}))
  .catch(() => ({}))) as Record<string, { banner?: string; cover?: string }>;
const asset = (id: number, kind: "banner" | "cover") => {
  const file = cached[id]?.[kind];
  return file ? `/scripts/screens/.cache/${file}` : null;
};

type Person = { id: number; name: { full: string; native?: string | null }; file?: string | null };
type CastEdge = { role: string; node: Person; voiceActors: Person[] };
type CatalogMedia = {
  id: number;
  type: "ANIME" | "MANGA";
  format: string;
  status: string;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  countryOfOrigin: string;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { color: string | null };
  genres: string[];
  averageScore: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  nextAiringEpisode: { episode: number } | null;
  studios: { nodes: { id: number; name: string }[] };
  characters?: { edges: CastEdge[] };
  cover: string | null;
  banner: string | null;
};
/** The real titles and people `screens.mjs` cached, in list order; without them every title is a generated gradient. */
const catalog = (await fetch("/scripts/screens/.cache/catalog.json")
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null)) as null | {
  media: Record<string, CatalogMedia>;
  order: Record<"anime" | "manga" | "franchise", number[]>;
  cast: { characters: { edges: CastEdge[] }; staff: { edges: { role: string; node: Person }[] } };
};
const local = (file?: string | null) => (file ? `/scripts/screens/.cache/${file}` : null);
const catalogAt = (manga: boolean, i: number) => {
  const id = catalog?.order[manga ? "manga" : "anime"][i];
  return id ? (catalog?.media[id] ?? null) : null;
};
const castOf = (ids: number[]) => ids.flatMap((id) => catalog?.media[id]?.characters?.edges ?? []);
const unique = (people: Person[]) => people.filter((p, i) => p.file && people.findIndex((o) => o.id === p.id) === i);
/** Every cached character and Japanese voice, for avatars, portrait rows and the person pages. */
const CHARACTERS = unique(castOf(catalog?.order.anime ?? []).map((e) => e.node));
const VOICES = unique(castOf(catalog?.order.anime ?? []).flatMap((e) => e.voiceActors.slice(0, 1)));
const face = (people: Person[], i: number) => (people.length ? local(people[i % people.length].file) : null) ?? cover(i);
const nameOf = (people: Person[], i: number, fallback: string) => (people.length ? people[i % people.length].name.full : fallback);
/** German by default; the English text where a screen is shot for the website, which speaks English. */
const en = params.get("lang") === "en";
const L = (de: string, english: string) => (en ? english : de);

const svg = (w: number, h: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;
const PAIRS = [
  ["#ff7a59", "#7b2ff7"],
  ["#1fb5a8", "#0b3d5c"],
  ["#f6c85f", "#d1495b"],
  ["#5b8def", "#1b2a49"],
  ["#c86dd7", "#3023ae"],
  ["#59c173", "#1a4d2e"],
  ["#ff4e8a", "#4a0e4e"],
  ["#fbab7e", "#f7ce68"],
  ["#43cea2", "#185a9d"],
  ["#ee9ca7", "#5f2c82"],
];
const cover = (i: number) => {
  const [a, b] = PAIRS[i % PAIRS.length];
  return svg(
    460,
    650,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="460" height="650" fill="url(#g)"/><circle cx="${120 + ((i * 53) % 220)}" cy="${180 + ((i * 37) % 240)}" r="${90 + (i % 3) * 30}" fill="#fff" fill-opacity=".14"/>`,
  );
};
const banner = (i: number) => {
  const [a, b] = PAIRS[i % PAIRS.length];
  return svg(1900, 400, `<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1900" height="400" fill="url(#g)"/>`);
};

const TITLES = ["Frieren: Beyond Journey's End", "The Apothecary Diaries", "Dungeon Meshi", "Oshi no Ko", "Kaiju No. 8", "Bocchi the Rock!", "Mob Psycho 100 III", "Vinland Saga Season 2", "Spy x Family", "Blue Lock", "Chainsaw Man", "Jujutsu Kaisen"];
/** The three titles `screens.mjs` fetches art for, first in every list so the grid opens on real covers. */
const REAL = [
  { id: 178789, title: "Mushoku Tensei: Jobless Reincarnation Season 3", romaji: "Mushoku Tensei III: Isekai Ittara Honki Dasu", native: "無職転生Ⅲ ～異世界行ったら本気だす～", episodes: 14, next: 9, score: 85, studio: "Studio Bind", genres: ["Adventure", "Drama", "Fantasy"], color: "#28bbe4" },
  { id: 135865, title: "Saga of Tanya the Evil Season 2", romaji: "Youjo Senki II", native: "幼女戦記Ⅱ", episodes: 12, next: 4, score: 80, studio: "NUT", genres: ["Action", "Fantasy"], color: "#e46b28" },
  { id: 103303, title: "Sparks of Tomorrow", romaji: "Nijuu Seiki Denki Mokuroku", native: "二十世紀電氣目録", episodes: 13, next: 6, score: 76, studio: "Kyoto Animation", genres: ["Adventure", "Comedy", "Romance"], color: "#fec950" },
];
const STATUSES = ["CURRENT", "REPEATING", "COMPLETED", "PAUSED", "DROPPED", "PLANNING"] as const;

/** A cached title as the list and every query carry it, with the next episode a few hours to a week away. */
function fromCatalog(c: CatalogMedia, i: number) {
  const art = local(c.cover) ?? cover(i);
  const wait = 3600 * (9 + ((i * 31) % 150));
  return {
    id: c.id,
    idMal: null,
    type: c.type,
    title: c.title,
    coverImage: { large: art, extraLarge: art, color: c.coverImage?.color ?? null },
    bannerImage: local(c.banner),
    episodes: c.episodes,
    chapters: c.chapters,
    volumes: c.volumes,
    duration: c.duration ?? 24,
    format: c.format,
    countryOfOrigin: c.countryOfOrigin,
    status: c.status,
    season: c.season,
    seasonYear: c.seasonYear,
    startDate: c.startDate,
    nextAiringEpisode: c.nextAiringEpisode ? { episode: c.nextAiringEpisode.episode, airingAt: now + wait, timeUntilAiring: wait } : null,
    averageScore: c.averageScore ?? 70,
    genres: c.genres,
    isAdult: false,
    synonyms: [],
  };
}

function media(i: number, manga: boolean) {
  const real = !manga && i < REAL.length ? REAL[i] : null;
  const known = real ? null : catalogAt(manga, i);
  if (known) return fromCatalog(known, i);
  const art = real ? asset(real.id, "cover") : null;
  return {
    id: real?.id ?? (manga ? 2000 : 1000) + i,
    idMal: null,
    type: manga ? "MANGA" : "ANIME",
    title: real ? { romaji: real.romaji, english: real.title, native: real.native } : { romaji: TITLES[i % TITLES.length], english: null, native: null },
    coverImage: { large: art ?? cover(i), extraLarge: art ?? cover(i), color: real?.color ?? null },
    bannerImage: real ? (asset(real.id, "banner") ?? banner(i)) : null,
    episodes: manga ? null : (real?.episodes ?? [12, 24, 13, 11, 25, 12][i % 6]),
    chapters: manga ? [120, 57, 300, 98][i % 4] : null,
    volumes: manga ? [12, 6, 30, 10][i % 4] : null,
    duration: 24,
    format: manga ? "MANGA" : ["TV", "TV", "MOVIE", "TV", "ONA"][i % 5],
    countryOfOrigin: "JP",
    status: real ? "RELEASING" : i % 5 === 0 ? "RELEASING" : "FINISHED",
    season: "SUMMER",
    seasonYear: 2026,
    nextAiringEpisode: real ? { episode: real.next, airingAt: now + 3600 * (5 + i * 20), timeUntilAiring: 3600 * (5 + i * 20) } : null,
    averageScore: real?.score ?? 68 + ((i * 7) % 25),
    genres: real?.genres ?? ["Action", "Drama"],
    isAdult: false,
    synonyms: [],
  };
}

/** A list spread over years, genres, lengths and rewatches, so the statistics drafts have something to count. */
const RICH_GENRES = [["Action", "Fantasy"], ["Drama", "Romance"], ["Comedy", "Slice of Life"], ["Sci-Fi", "Mystery"], ["Adventure", "Fantasy"], ["Action", "Drama"], ["Romance", "Comedy"], ["Horror", "Mystery"], ["Sports"], ["Fantasy", "Adventure", "Drama"]];
function richen(i: number, m: ReturnType<typeof media>, status: string) {
  const year = 2019 + ((i * 5) % 8);
  const startMonth = 1 + ((i * 7) % 12);
  const spanDays = [3, 9, 20, 45, 120, 400, 14, 60][i % 8];
  const start = new Date(Date.UTC(year, startMonth - 1, 1 + (i % 26)));
  const end = new Date(start.getTime() + spanDays * 86_400_000);
  const real = i < REAL.length || catalogAt(m.type === "MANGA", i) !== null;
  const genres = real ? m.genres : RICH_GENRES[i % RICH_GENRES.length];
  const format = m.type === "MANGA" || real ? m.format : i % 9 === 4 ? "MOVIE" : i % 11 === 6 ? "ONA" : i % 13 === 8 ? "OVA" : "TV";
  const episodes = m.type === "MANGA" ? null : real ? m.episodes : format === "MOVIE" ? 1 : [12, 24, 13, 25, 12, 52, 11, 37][i % 8];
  const done = status === "COMPLETED" || status === "REPEATING";
  return {
    media: { ...m, title: real ? m.title : { ...m.title, romaji: `${TITLES[i % TITLES.length]}${i >= TITLES.length ? ` ${Math.floor(i / TITLES.length) + 1}` : ""}` }, genres, format, episodes, ...(real ? {} : { duration: format === "MOVIE" ? 105 : format === "ONA" ? 8 : 24, season: ["WINTER", "SPRING", "SUMMER", "FALL"][i % 4], seasonYear: year, averageScore: 52 + ((i * 17) % 43) }) },
    score: i % 4 === 0 ? 0 : 4 + ((i * 3) % 7),
    repeat: i % 7 === 0 ? 1 + (i % 3) : 0,
    progress: done ? (episodes ?? m.chapters ?? 12) : 1 + (i % 9),
    startedAt: { year: start.getUTCFullYear(), month: start.getUTCMonth() + 1, day: start.getUTCDate() },
    completedAt: done ? { year: end.getUTCFullYear(), month: end.getUTCMonth() + 1, day: end.getUTCDate() } : null,
  };
}

function baseEntry(i: number, m: ReturnType<typeof media>, status: (typeof STATUSES)[number], manga: boolean) {
  return {
    id: (manga ? 9000 : 5000) + i,
    mediaId: m.id,
    status,
    score: i % 3 === 0 ? 0 : 5 + (i % 5),
    // Never past what has aired or what the title has, so a catch-up count or a movie's progress reads true.
    progress: status === "COMPLETED" ? (m.episodes ?? 12) : Math.min(i % 9, m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : Infinity, m.episodes ?? Infinity),
    progressVolumes: manga ? i % 4 : 0,
    repeat: 0,
    notes: null,
    updatedAt: now - i * 3600,
    private: false,
    hiddenFromStatusLists: !manga && i === 8,
    customLists: manga
      ? { Oneshots: i % 6 === 0, [L("Lieblinge", "Favourites")]: i % 4 === 1 }
      : { Rewatch: i % 5 === 0, Ghibli: i % 7 === 1, "Seasonals — Airing": i < 4 },
    advancedScores: {},
    startedAt: { year: 2026, month: 3, day: 1 },
    // Finished titles carry a date this year, so the year in review has something to count.
    completedAt: status === "COMPLETED" ? { year: 2026, month: 1 + (i % 9), day: 1 + (i % 27) } : null,
    media: m,
  };
}

function list(manga: boolean) {
  const rich = mock === "stats-rich";
  const entries = Array.from({ length: rich ? 72 : 36 }, (_, i) => {
    const m = media(i, manga);
    // The rich list finishes more than it starts, since most of the drafts count completed titles.
    const status = i < 12 ? "CURRENT" : rich && i % 5 !== 1 && i % 5 !== 3 ? "COMPLETED" : STATUSES[i % STATUSES.length];
    const entry = baseEntry(i, m, status, manga);
    return rich ? { ...entry, ...richen(i, m, status) } : entry;
  });
  // The first real title leaves the list, so its detail page offers the add flow.
  const listed = mock === "off-list" ? entries.filter((e) => e.mediaId !== REAL[0].id) : entries;
  return {
    fromCache: false,
    pending: 0,
    fetchedAt: now,
    lists: STATUSES.map((status) => ({ name: status, status, isCustomList: false, entries: listed.filter((e) => e.status === status) })),
  };
}

const LISTS = { ANIME: list(false), MANGA: list(true) };

/** Another user's list: most of the viewer's titles, scored near the viewer's with a few wide gaps, plus four of its own. */
function foreignList(manga: boolean) {
  const nudge = [1, -2, 0, 2, -1, 3, -4, 0, 1, -1];
  const shared = LISTS[manga ? "MANGA" : "ANIME"].lists
    .flatMap((g) => g.entries)
    .filter((_, i) => i % 7 !== 3)
    .map((e, i) => {
      const finishedHere = e.status === "PLANNING" && i % 2 === 0;
      const score = e.score > 0 ? Math.max(1, Math.min(10, e.score + nudge[i % nudge.length])) : i % 4 === 0 ? 8 : 0;
      return { id: 70000 + i, mediaId: e.mediaId, status: finishedHere ? "COMPLETED" : e.status, score, progress: e.progress, progressVolumes: null, media: e.media };
    });
  const own = Array.from({ length: 4 }, (_, k) => {
    const m = media(36 + k, manga);
    return { id: 71000 + k, mediaId: m.id, status: "COMPLETED", score: 9 - k, progress: m.episodes ?? 12, progressVolumes: null, media: m };
  });
  const entries = [...shared, ...own];
  return STATUSES.map((status) => ({ name: status, status, isCustomList: false, entries: entries.filter((e) => e.status === status) }));
}
const viewer = {
  id: 1,
  name: "Kyusetzu",
  siteUrl: "https://anilist.co/user/Kyusetzu",
  avatar: { large: face(CHARACTERS, 6) },
  donatorTier: 0,
  mediaListOptions: { scoreFormat: "POINT_10" },
  options: { airingNotifications: true, notificationOptions: [] },
};

// The social surface: three people the viewer follows, a feed of both activity kinds, a thread with nested replies.
const person = (id: number, name: string, i: number) => ({ id, name, avatar: { medium: face(CHARACTERS, i * 7) }, isFollowing: id !== 1, isFollower: id === 11 });
const PEOPLE = [person(11, "Mikan", 5), person(12, "Hoshi", 6), person(13, "TsubameNoYume", 7), { ...person(1, "Kyusetzu", 4), isFollowing: false }];
const socialMedia = (i: number) => {
  const m = media(i, false);
  return { id: m.id, type: "ANIME", title: m.title, coverImage: { large: m.coverImage.large }, format: "TV", isAdult: false, genres: [] };
};
const activity = (id: number, user: number, ago: number, likes: number, replies: number, rest: Record<string, unknown>) => ({
  id,
  createdAt: now - ago,
  likeCount: likes,
  isLiked: likes % 2 === 1,
  isPinned: false,
  replyCount: replies,
  siteUrl: `https://anilist.co/activity/${id}`,
  user: PEOPLE[user],
  ...rest,
});
const ACTIVITIES = [
  activity(5001, 0, 600, 4, 2, { __typename: "ListActivity", status: "watched episode", progress: "7", media: socialMedia(0) }),
  activity(5002, 1, 1_500, 9, 3, { __typename: "TextActivity", text: L("Folge 7 war __unfassbar__ schön, und wer schaut diese Saison mit? ~!Das Ende!~ hat mich erwischt.", "Episode 7 was __unbelievably__ beautiful, who else is watching this season? ~!The ending!~ got me.") }),
  activity(5003, 2, 7_200, 12, 0, { __typename: "ListActivity", status: "completed", progress: null, media: socialMedia(1) }),
  activity(5004, 3, 20_000, 1, 0, { __typename: "ListActivity", status: "plans to watch", progress: null, media: socialMedia(2) }),
  activity(5005, 0, 90_000, 3, 1, { __typename: "ListActivity", status: "watched episode", progress: "1 - 3", media: socialMedia(3) }),
  activity(5006, 3, 170_000, 6, 4, { __typename: "TextActivity", text: L("Neue Saison, neue Liste. Was sind eure Geheimtipps?", "New season, new list. What are your hidden gems?") }),
  activity(5007, 3, 2_400, 2, 0, { __typename: "ListActivity", status: "watched episode", progress: "2", media: socialMedia(2) }),
  activity(5008, 3, 9_000, 1, 0, { __typename: "ListActivity", status: "watched episode", progress: "1", media: socialMedia(1) }),
  activity(5009, 3, 30_000, 0, 0, { __typename: "ListActivity", status: "completed", progress: null, media: socialMedia(4) }),
  activity(5010, 3, 60_000, 3, 1, { __typename: "ListActivity", status: "watched episode", progress: "5 - 6", media: socialMedia(5) }),
  activity(5011, 3, 120_000, 0, 0, { __typename: "ListActivity", status: "plans to watch", progress: null, media: socialMedia(6) }),
  activity(5012, 3, 200_000, 4, 0, { __typename: "ListActivity", status: "watched episode", progress: "12", media: socialMedia(7) }),
];
const REPLIES = [
  { id: 7001, text: L("Ich! Die Musik und die Szene am Fluss …", "Me! The music and the scene by the river …"), createdAt: now - 500, likeCount: 2, isLiked: false, user: PEOPLE[1] },
  { id: 7002, text: L("Hab es gestern nachgeholt, @Mikan hatte recht.", "Caught up yesterday, @Mikan was right."), createdAt: now - 300, likeCount: 0, isLiked: false, user: PEOPLE[3] },
];
const thread = (id: number, title: string, user: number, replies: number, ago: number, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  replyCount: replies,
  viewCount: replies * 37,
  likeCount: Math.round(replies / 3),
  isLiked: false,
  isSticky: false,
  isLocked: false,
  repliedAt: now - ago,
  createdAt: now - ago * 20,
  siteUrl: `https://anilist.co/forum/thread/${id}`,
  user: PEOPLE[user],
  replyUser: { id: PEOPLE[(user + 1) % 3].id, name: PEOPLE[(user + 1) % 3].name },
  categories: [{ id: 1, name: "Anime" }],
  ...extra,
});
const THREADS = [
  thread(40, L("Forenregeln und Hinweise", "Forum rules and notes"), 2, 3, 900_000, { isSticky: true, isLocked: true, categories: [{ id: 5, name: "Site Feedback" }] }),
  thread(44, L("Frühjahr 2026: eure Favoriten", "Spring 2026: your favourites"), 0, 128, 900),
  thread(45, L("Frieren Staffel 2 — Folge 7 Diskussion", "Frieren Season 2 — Episode 7 Discussion"), 1, 342, 4_000, { categories: [{ id: 16, name: "Episode Discussion" }] }),
  thread(46, L("Welche Manga sind gut für den Einstieg?", "Which manga are good to start with?"), 2, 57, 26_000, { categories: [{ id: 2, name: "Manga" }] }),
  thread(47, L("Kalender-Apps und Tracker — was nutzt ihr?", "Calendar apps and trackers — what do you use?"), 1, 19, 80_000, { categories: [{ id: 7, name: "Apps" }] }),
];
const comment = (id: number, user: number, ago: number, text: string, children: unknown[] = []) => ({
  id,
  comment: text,
  likeCount: id % 5,
  isLiked: false,
  createdAt: now - ago,
  siteUrl: `https://anilist.co/forum/thread/44/comment/${id}`,
  user: PEOPLE[user],
  thread: { id: 44, title: THREADS[1].title },
  childComments: children,
});
const COMMENTS = [
  comment(801, 1, 80_000, L("Für mich klar **Frieren**. Die Ruhe zwischen den Kämpfen trägt die ganze Staffel.", "**Frieren** for me. The calm between the fights carries the whole season."), [
    comment(811, 0, 70_000, L("Stimmt, und der Soundtrack hilft enorm.", "True, and the soundtrack helps a lot."), [comment(821, 3, 60_000, L("Den höre ich seit Wochen beim Arbeiten.", "I have been listening to it at work for weeks."))]),
    comment(812, 2, 50_000, L("Die Kämpfe waren diesmal sogar besser und klarer als in Staffel 1.", "The fights were even better and clearer than in season 1.")),
  ]),
  comment(802, 2, 40_000, L("Dungeon Meshi hat mich überrascht — Kochen ist dort Worldbuilding.", "Dungeon Meshi surprised me — the cooking is the worldbuilding.")),
  comment(803, 3, 9_000, L("Noch nicht angefangen, aber eure Liste ist jetzt meine Liste. ~!Hoffentlich kein Cliffhanger!~", "Not started yet, but your list is my list now. ~!Hopefully no cliffhanger!~")),
];

// The statistics screen's one request: a plausible spread of genres, tags, people, formats, years and activity.
function userStats() {
  const row = (count: number, i: number) => ({ count, meanScore: 84 - i * 2, minutesWatched: count * 290, chaptersRead: count * 38 });
  const names = (list: string[], at: (name: string, i: number) => Record<string, unknown>) =>
    list.map((name, i) => ({ ...at(name, i), ...row(Math.max(1, 14 - i * 2), i) }));
  const person = (name: string, i: number) => ({ id: 500 + i, name: { full: name }, image: { medium: cover(i) } });
  const real = (p: Person) => ({ id: p.id, name: { full: p.name.full }, image: { medium: local(p.file) } });
  const crew = (catalog?.cast.staff.edges ?? []).map((e) => e.node).filter((p) => p.file);
  const studios = [...new Set(Object.values(catalog?.media ?? {}).flatMap((m) => m.studios?.nodes.map((n) => n.name) ?? []))];
  const block = (manga: boolean) => ({
    count: 36,
    meanScore: manga ? 80 : 78,
    standardDeviation: 11.4,
    minutesWatched: 42_000,
    episodesWatched: 1_700,
    chaptersRead: 3_100,
    volumesRead: 210,
    genres: names(["Action", "Fantasy", "Adventure", "Drama", "Comedy", "Romance", "Sci-Fi", "Slice of Life"], (genre) => ({ genre })),
    tags: names(["Magic", "Male Protagonist", "Isekai", "Ensemble Cast", "Found Family", "Travel"], (name, i) => ({ tag: { id: 90 + i, name } })),
    voiceActors: VOICES.length
      ? names(VOICES.slice(0, 4).map((p) => p.name.full), (_, i) => ({ voiceActor: real(VOICES[i]) }))
      : names(["Kana Hanazawa", "Yuuki Kaji", "Saori Hayami", "Takahiro Sakurai"], (name, i) => ({ voiceActor: person(name, i) })),
    studios: names(studios.length >= 5 ? studios.slice(0, 5) : ["MADHOUSE", "Studio Bind", "Trigger", "WIT STUDIO", "CloverWorks"], (name, i) => ({ studio: { id: 30 + i, name } })),
    staff: crew.length >= 3
      ? names(crew.slice(0, 3).map((p) => p.name.full), (_, i) => ({ staff: real(crew[i]) }))
      : names(["Keiichirou Saitou", "Evan Call", "Yoshinobu Yamakawa"], (name, i) => ({ staff: person(name, i + 4) })),
    formats: [["TV", 24], ["MOVIE", 4], ["OVA", 3], ["ONA", 3], ["SPECIAL", 2]].map(([format, count], i) => ({ format, count, meanScore: 80 - i })),
    statuses: [["CURRENT", 6], ["COMPLETED", 20], ["PLANNING", 5], ["PAUSED", 2], ["DROPPED", 1], ["REPEATING", 2]].map(([status, count], i) => ({ status, count, meanScore: 78 - i })),
    scores: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((score, i) => ({ score, count: [0, 0, 1, 1, 2, 4, 8, 11, 6, 3][i] })),
    releaseYears: Array.from({ length: 12 }, (_, i) => ({ releaseYear: 2026 - i, count: [6, 7, 5, 4, 3, 3, 2, 2, 1, 1, 1, 1][i] })),
    startYears: Array.from({ length: 6 }, (_, i) => ({ startYear: 2021 + i, count: [3, 5, 6, 7, 8, 7][i], meanScore: 74 + i })),
    lengths: [["1", 4], ["2-6", 3], ["7-16", 14], ["17-28", 11], ["29-55", 3], ["56-100", 1]].map(([length, count], i) => ({ length, count, meanScore: 76 + i })),
    countries: [["JP", 31], ["CN", 3], ["KR", 2]].map(([country, count]) => ({ country, count })),
  });
  const day = 86_400;
  const today = Math.floor(now / day) * day;
  // The rich list leans on the weekend, so a weekday chart has a shape to show.
  const weekend = (t: number) => mock === "stats-rich" && [0, 6].includes(new Date(t * 1000).getUTCDay()) ? 4 : 0;
  const activityHistory = Array.from({ length: 180 }, (_, i) => ({ date: today - i * day, amount: (i * 7) % 5 === 0 ? 0 : ((i * 13) % 9) + 1 + weekend(today - i * day) }));
  return { User: { id: viewer.id, name: viewer.name, stats: { activityHistory }, statistics: { anime: block(false), manga: block(true) } } };
}

/** Kusuriya 3 as AniList has it in its first weeks: no banner of its own, a prequel with one to lend. */
const UNBANNERED = {
  id: 195516,
  title: "The Apothecary Diaries Season 3",
  native: "薬屋のひとりごと 第3期",
  color: "#e4a128",
  prequel: { id: 176301, title: "The Apothecary Diaries Season 2", native: "薬屋のひとりごと 第2期" },
};

/** The new season as a list or hero title, with the relation a borrowed banner comes from. */
function unbanneredMedia() {
  const u = UNBANNERED;
  const art = asset(u.id, "cover") ?? cover(9);
  const prequel = {
    id: u.prequel.id,
    type: "ANIME",
    title: { romaji: u.prequel.title, english: u.prequel.title, native: u.prequel.native },
    coverImage: { large: asset(u.prequel.id, "cover") ?? cover(10) },
    bannerImage: asset(u.prequel.id, "banner") ?? banner(10),
    format: "TV",
    isAdult: false,
    genres: ["Drama", "Mystery"],
  };
  return {
    ...media(0, false),
    id: u.id,
    title: { romaji: u.title, english: u.title, native: u.native },
    coverImage: { large: art, extraLarge: art, color: u.color },
    bannerImage: null,
    episodes: 12,
    format: "TV",
    status: "RELEASING",
    season: "FALL",
    averageScore: 85,
    genres: ["Drama", "Mystery"],
    nextAiringEpisode: { episode: 2, airingAt: now + 3600 * 30, timeUntilAiring: 3600 * 30 },
    relations: { edges: [{ relationType: "PREQUEL", node: prequel }] },
  };
}

/** A very popular title's real score counts, so the community chart is shot at its widest. */
const COMMUNITY_SCORES = [3180, 995, 2174, 3769, 9666, 17994, 57157, 131420, 196515, 187770];
/** The same title's real status counts, so the status card stands beside the chart as it does in the app. */
const COMMUNITY_STATUSES = { CURRENT: 66178, PLANNING: 72593, COMPLETED: 889497, DROPPED: 16690, PAUSED: 16565 };

function detail(id: number) {
  if (id === UNBANNERED.id) {
    const base = detail(REAL[0].id);
    const own = unbanneredMedia();
    return {
      ...base,
      ...own,
      description: "Maomao returns to the inner palace for another season of poisons, rumours and quiet deductions.",
      studios: { edges: [{ isMain: true, node: { id: 2, name: "OLM" } }] },
      mediaListEntry: null,
    };
  }
  const index = Math.max(0, REAL.findIndex((r) => r.id === id));
  const r = REAL[index];
  return {
    ...media(index, false),
    // A title AniList has no banner for yet, as most of a new season is in its first weeks.
    ...(mock === "no-banner" ? { bannerImage: null } : {}),
    description: "Rudeus and his companions set out once more; a new chapter in a long journey, and a family scattered across a continent.",
    meanScore: r.score,
    popularity: 120000,
    favourites: 4000,
    isFavourite: false,
    isFavouriteBlocked: false,
    hashtag: null,
    source: "LIGHT_NOVEL",
    startDate: { year: 2026, month: 7, day: 5 },
    endDate: null,
    trailer: null,
    rankings: [],
    stats: {
      scoreDistribution: COMMUNITY_SCORES.map((amount, k) => ({ score: (k + 1) * 10, amount })),
      statusDistribution: Object.entries(COMMUNITY_STATUSES).map(([status, amount]) => ({ status, amount })),
    },
    studios: { edges: [{ isMain: true, node: { id: 1, name: r.studio } }] },
    tags: [],
    externalLinks: [
      { id: 1, site: "Crunchyroll", url: "https://www.crunchyroll.com", type: "STREAMING", color: "#F88A36" },
      { id: 2, site: "Official Site", url: "https://example.org", type: "INFO", color: null },
      { id: 3, site: "Twitter", url: "https://x.com", type: "SOCIAL", color: "#1D9BF0" },
    ],
    mediaListEntry: mock === "off-list" && index === 0 ? null : { id: 5000 + index, status: "CURRENT", progress: 8, score: 8, repeat: 0, notes: null },
    relations: { edges: [] },
    characters: { edges: [] },
    staff: { edges: [] },
    recommendations: { nodes: [] },
  };
}

/** The cast fold's first page, with names long enough that a narrow row has to truncate them rather than widen the page. */
function cast() {
  if (catalog?.cast) {
    const real = (p: Person) => ({ id: p.id, name: { full: p.name.full }, image: { medium: local(p.file) } });
    const characters = catalog.cast.characters.edges.map((e) => ({ role: e.role, node: real(e.node), voiceActors: e.voiceActors.slice(0, 1).map(real) }));
    const staff = catalog.cast.staff.edges.map((e) => ({ role: e.role, node: real(e.node) }));
    return { characters: { pageInfo: { hasNextPage: false }, edges: characters }, staff: { pageInfo: { hasNextPage: false }, edges: staff } };
  }
  const person = (id: number, full: string, i: number) => ({ id, name: { full }, image: { medium: cover(i) } });
  const characters = [
    ["Rudeus Greyrat", "Tomokazu Sugita"],
    ["Eris Boreas Greyrat", "Ai Kakuma"],
    ["Roxy Migurdia", "Konomi Kohara"],
    ["Sylphiette", "Kana Yūki"],
  ].map(([name, voice], i) => ({ role: i < 3 ? "MAIN" : "SUPPORTING", node: person(600 + i, name, i), voiceActors: [person(700 + i, voice, i + 4)] }));
  const staff = [
    ["Rifujin na Magonote", "Original Creator"],
    ["Hiroki Hirano", "Director"],
    ["Toshifumi Akai", "Character Design, Chief Animation Director"],
  ].map(([name, role], i) => ({ role, node: person(800 + i, name, i + 2) }));
  return { characters: { pageInfo: { hasNextPage: false }, edges: characters }, staff: { pageInfo: { hasNextPage: false }, edges: staff } };
}

/** The search page's browse sections: twelve titles a row, and a top list carrying how many users list each. */
function browseSections(manga: boolean) {
  // Ids past the list fixture's but one, so most cards are off the list; manga carry no season, as AniList's do.
  const pick = (k: number) => {
    // Anime past the list's own titles are real and off the list already; the rest borrow a list title's art.
    const spare = k !== 4 && !manga && catalogAt(false, 40 + k) !== null;
    const m = spare ? media(40 + k, false) : media(k, manga);
    const off = k === 4 || spare ? {} : { id: (manga ? 2000 : 1000) + 100 + k };
    const live = manga ? { season: null, seasonYear: null, ...(k % 5 === 0 ? { chapters: null, volumes: null } : {}) } : {};
    return { ...m, ...off, ...live, mediaListEntry: null };
  };
  const row = (offset: number) => ({ media: Array.from({ length: 12 }, (_, i) => pick((i + offset) % 15)) });
  const top = { media: Array.from({ length: 10 }, (_, i) => ({ ...pick(i), popularity: 490_000 - i * 37_000, startDate: (pick(i) as { startDate?: unknown }).startDate ?? { year: (manga ? 1989 : 2009) + i } })) };
  return manga ? { trending: row(0), popular: row(3), manhwa: row(6), top } : { trending: row(0), season: row(2), nextSeason: row(5), popular: row(7), top };
}

/** Characters and staff for the browse sections and their "Show all", with names long enough to wrap a portrait card. */
function browsePeople() {
  const names = ["Kenma Kozume", "Eijirou Kirishima", "Yuuichirou Hyakuya", "Robert E. O. Speedwagon", "Shiho Izumi", "Tetsutetsu Tetsutetsu", "Rito Yuuki", "Satoru Gojou", "Levi", "Monkey D. Luffy", "Killua Zoldyck", "Eren Yeager"];
  if (CHARACTERS.length >= 12) return CHARACTERS.slice(0, 12).map((p, i) => ({ id: p.id, name: { full: p.name.full }, image: { medium: local(p.file) }, favourites: 39_511 - i * 2_900 }));
  return names.map((full, i) => ({ id: 900 + i, name: { full }, image: { medium: cover(i) }, favourites: 39_511 - i * 2_900 }));
}

/** A small franchise around the first title: two earlier seasons, a side story and the source, some on the list. */
function franchise() {
  const node = (id: number, i: number, title: string, format: string, status: string | null, progress = 0) => ({
    id,
    type: (catalog?.media[id]?.type ?? (format === "NOVEL" ? "MANGA" : "ANIME")) as string,
    title: catalog?.media[id]?.title ?? { romaji: title, english: title, native: null },
    coverImage: { large: id === REAL[0].id ? media(0, false).coverImage.large : (local(catalog?.media[id]?.cover) ?? cover(i)) },
    format: catalog?.media[id]?.format ?? format,
    episodes: catalog?.media[id]?.episodes ?? (format === "NOVEL" ? null : 12),
    chapters: null,
    isAdult: false,
    genres: [],
    mediaListEntry: status ? { status, progress } : null,
  });
  const root = node(REAL[0].id, 0, REAL[0].title, "TV", "CURRENT", 8);
  const [s2Id, s1Id, novelId, ovaId] = catalog?.order.franchise ?? [1101, 1102, 1104, 1103];
  const s2 = node(s2Id, 5, "Mushoku Tensei: Jobless Reincarnation Season 2", "TV", "COMPLETED", 12);
  const s1 = node(s1Id, 6, "Mushoku Tensei: Jobless Reincarnation", "TV", "COMPLETED", 12);
  const ova = node(ovaId, 7, "Mushoku Tensei: Eris the Goblin Slayer", "OVA", "PLANNING");
  const novel = node(novelId, 8, "Mushoku Tensei (Light Novel)", "NOVEL", null);
  const edge = (relationType: string, n: ReturnType<typeof node>) => ({ relationType, node: n });
  const withRelations = (n: ReturnType<typeof node>, edges: ReturnType<typeof edge>[]) => ({ ...n, relations: { edges } });
  return [
    withRelations(root, [edge("PREQUEL", s2), edge("SOURCE", novel)]),
    withRelations(s2, [edge("PREQUEL", s1), edge("SEQUEL", root), edge("SIDE_STORY", ova)]),
    withRelations(s1, [edge("SEQUEL", s2)]),
    withRelations(ova, [edge("PARENT", s2)]),
    withRelations(novel, [edge("ADAPTATION", root)]),
  ];
}

/** Under `detail-pending` the detail answer waits for `window.__release()`, so the skeleton can be shot and then swapped. */
let release = () => {};
const held = new Promise<void>((resolve) => (release = resolve));
(window as unknown as { __release: () => void }).__release = () => release();

/** The bell's subjects as the request by id answers them; the notifications carry only their ids, as AniList's do. */
function bellActivities() {
  const me = { id: 1, name: "Kyusetzu" };
  const mikan = { id: 11, name: "Mikan" };
  const about = (i: number) => {
    const m = media(i, false);
    return { id: m.id, title: m.title, isAdult: false, genres: m.genres, coverImage: { medium: m.coverImage.large } };
  };
  const listed = (id: number, owner: typeof me, status: string, progress: string | null, m: ReturnType<typeof about>) =>
    ({ __typename: "ListActivity", id, status, progress, user: owner, media: m });
  const posted = (id: number, owner: typeof me, text: string) => ({ __typename: "TextActivity", id, text, user: owner });
  return [
    listed(5101, me, "watched episode", "1 - 3", about(1)),
    posted(5102, me, L("Endlich Zeit für **Sparks of Tomorrow** gefunden. Kyoto Animation in Bestform!", "Finally found time for **Sparks of Tomorrow**. Kyoto Animation at its best!")),
    listed(5001, mikan, "watched episode", "7", about(0)),
    posted(5103, me, L("Finale gesehen, und ~!der Schluss!~ kam völlig unerwartet.", "Watched the finale, and ~!the ending!~ came completely out of nowhere.")),
    posted(5002, mikan, L("Folge 7 war __unfassbar__ schön, und wer schaut diese Saison mit? ~!Das Ende!~ hat mich erwischt.", "Episode 7 was __unbelievably__ beautiful, who else is watching this season? ~!The ending!~ got me.")),
    // An explicit title, whose line the content filter hides while the row stays.
    listed(5104, me, "completed", null, { id: 3001, title: { romaji: "Tsukiyo no Kagerou", english: null, native: "月夜の陽炎" }, isAdult: true, genres: ["Drama"], coverImage: { medium: cover(9) } }),
  ];
}

/** Answers a passthrough query by the root field it asks for; anything else gets an empty but well-formed page. */
function answerQuery(query: string, variables: Record<string, unknown> | null) {
  const q = query.replace(/\s+/g, " ");
  if (/characters\s*\(\s*page/.test(q)) return { Media: cast() };
  // The search filters' vocabulary, so an opened Genre or Tag field has rows to show.
  if (/GenreCollection/.test(q)) {
    const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports"];
    const tags = ["Isekai", "Time Skip", "Female Protagonist", "Military", "Music", "Iyashikei"].map((name) => ({ name, isAdult: false }));
    return { GenreCollection: genres, MediaTagCollection: tags };
  }
  if (/\bMedia\s*\(\s*id/.test(q)) {
    const answer = { Media: detail(Number(variables?.id ?? REAL[0].id)) };
    return mock === "detail-pending" ? held.then(() => answer) : answer;
  }
  if (/airingSchedules/.test(q)) {
    // Every airing title on the list, at the time its card counts down to.
    const airing = Array.from({ length: 12 }, (_, i) => media(i, false))
      .filter((m) => m.nextAiringEpisode)
      .map((m, i) => ({ id: 70 + i, episode: m.nextAiringEpisode!.episode, airingAt: m.nextAiringEpisode!.airingAt, timeUntilAiring: m.nextAiringEpisode!.timeUntilAiring, mediaId: m.id, media: m }));
    return { Page: { pageInfo: { hasNextPage: false, total: airing.length }, airingSchedules: airing } };
  }
  // The bell's AniList half: grouped likes, replies, a follow, an episode and a thread reply; subjects come by id.
  if (/resetNotificationCount/.test(q)) {
    const user = (id: number, name: string) => ({ id, name });
    const notifications = [
      // Two likes from one person, on an own list entry and an own post, which group under one row.
      { __typename: "ActivityLikeNotification", id: 901, createdAt: now - 600, activityId: 5101, user: user(11, "Mikan") },
      { __typename: "ActivityLikeNotification", id: 902, createdAt: now - 1500, activityId: 5102, user: user(11, "Mikan") },
      // A lone activity row on someone else's activity, whose actor's name is a link beside the row's own press.
      { __typename: "ActivityReplySubscribedNotification", id: 906, createdAt: now - 3000, activityId: 5001, user: user(12, "Hoshi") },
      // A reply on an own post, whose spoiler the bell must name and never show.
      { __typename: "ActivityReplyNotification", id: 907, createdAt: now - 4200, activityId: 5103, user: user(13, "TsubameNoYume") },
      // A like on a reply, whose subject is the activity the reply was on.
      { __typename: "ActivityReplyLikeNotification", id: 909, createdAt: now - 5400, activityId: 5002, user: user(12, "Hoshi") },
      { __typename: "FollowingNotification", id: 903, createdAt: now - 7200, user: user(12, "Hoshi") },
      // A like on an explicit title, whose line the content filter hides while the row stays.
      { __typename: "ActivityLikeNotification", id: 908, createdAt: now - 9000, activityId: 5104, user: user(13, "TsubameNoYume") },
      { __typename: "AiringNotification", id: 904, createdAt: now - 100_000, episode: REAL[1].next - 1, media: { id: REAL[1].id, title: { romaji: REAL[1].title, english: REAL[1].title, native: null }, isAdult: false, genres: [] } },
      { __typename: "ThreadCommentReplyNotification", id: 905, createdAt: now - 260_000, commentId: 1, user: user(13, "Tsubame"), thread: { id: 44, title: L("Frühjahr 2026: eure Favoriten", "Spring 2026: your favourites") }, comment: { id: 1, comment: L("Frieren, ganz klar. ~!Folge 28!~ hat mich fertiggemacht, und die Musik erst.", "Frieren, easily. ~!Episode 28!~ wrecked me, and the music too.") } },
    ];
    return { Page: { pageInfo: { hasNextPage: true, total: 5, currentPage: 1, lastPage: 2 }, notifications } };
  }
  if (/MediaListCollection\s*\(/.test(q)) return { MediaListCollection: { lists: foreignList(variables?.type === "MANGA") } };
  if (/relations \{ edges \{ relationType node/.test(q) && /id_in/.test(q)) {
    const ids = new Set((variables?.ids as number[]) ?? []);
    return { Page: { media: franchise().filter((m) => ids.has(m.id)) } };
  }
  if (/followers:\s*Page/.test(q))
    return { followers: { pageInfo: { total: 12 }, followers: [] }, following: { pageInfo: { total: 30 }, following: [] }, mutual: { pageInfo: { total: 5 }, mutualFollowers: [] } };
  const pageOf = (rows: Record<string, unknown>) => ({ Page: { pageInfo: { hasNextPage: true, total: 5000, currentPage: 1, lastPage: 200 }, ...rows } });
  if (/activityReplies\s*\(/.test(q)) return pageOf({ activityReplies: REPLIES });
  if (/\bActivity\s*\(\s*id/.test(q)) return { Activity: ACTIVITIES.find((a) => a.id === Number(variables?.id)) ?? ACTIVITIES[1] };
  if (/activities\s*\(\s*id_in/.test(q)) {
    const ids = new Set((variables?.ids as number[]) ?? []);
    return { Page: { activities: bellActivities().filter((a) => ids.has(a.id)) } };
  }
  if (/activities\s*\(/.test(q)) {
    const own = variables?.userId != null ? ACTIVITIES.filter((a) => a.user.id === Number(variables.userId)) : ACTIVITIES;
    return pageOf({ activities: own });
  }
  if (/\bThreadComment\s*\(\s*id/.test(q)) return { ThreadComment: [COMMENTS[0]] };
  if (/threadComments\s*\(/.test(q)) return pageOf({ threadComments: COMMENTS });
  if (/\bThread\s*\(\s*id/.test(q)) {
    const summary = THREADS.find((t) => t.id === Number(variables?.id)) ?? THREADS[1];
    const body = L("Welche Serien haben euch diese Saison am meisten gepackt?\n\nIch fange an: **Frieren** und *Dungeon Meshi*. Spoiler bitte mit ~!so!~ markieren.", "Which shows grabbed you most this season?\n\nI will start: **Frieren** and *Dungeon Meshi*. Please mark spoilers ~!like this!~.");
    return { Thread: { ...summary, body, isSubscribed: true, replyCommentId: 821, replyUser: PEOPLE[3], mediaCategories: [socialMedia(0), socialMedia(1)] } };
  }
  if (/threads\s*\(/.test(q)) return pageOf({ threads: THREADS });
  if (/trending:\s*Page/.test(q)) return browseSections(/type: MANGA/.test(q));
  if (/characterBirthdays:\s*Page/.test(q)) {
    const all = browsePeople();
    return { characterBirthdays: { characters: all.slice(0, 7) }, characterFavourites: { characters: all.slice(7) }, staffBirthdays: { staff: all.slice(2, 9) }, staffFavourites: { staff: all } };
  }
  if (/(characters|staff)\(isBirthday: \$isBirthday/.test(q)) {
    const rows = browsePeople();
    return pageOf(/characters\(/.test(q) ? { characters: rows } : { staff: rows });
  }
  if (/\bPage\b/.test(q)) {
    const manga = variables?.type === "MANGA";
    const order = catalog?.order[manga ? "manga" : "anime"] ?? [];
    const term = String(variables?.search ?? "").toLowerCase();
    // A search answers the cached titles that carry the term; a season, the cached titles of that season.
    const found = term
      ? order.flatMap((id, i) => (Object.values(catalog?.media[id]?.title ?? {}).some((t) => t?.toLowerCase().includes(term)) ? [media(i, manga)] : []))
      : variables?.season
        ? order.flatMap((id, i) => (catalog?.media[id]?.season === variables.season && catalog?.media[id]?.seasonYear === Number(variables.year ?? variables.seasonYear) ? [media(i, manga)] : []))
        : [];
    if (found.length >= (term ? 1 : 4) && mock !== "no-banner")
      return { Page: { pageInfo: { hasNextPage: false, total: found.length, currentPage: 1, lastPage: 1 }, media: found, recommendations: [], users: PEOPLE, followers: PEOPLE, following: PEOPLE, mutualFollowers: PEOPLE.slice(0, 5), activities: [], threads: [], notifications: [], airingSchedules: [], characters: [], staff: [] } };
    const page = { media: mock === "no-banner" ? [unbanneredMedia(), { ...media(0, false), bannerImage: null }, ...Array.from({ length: 6 }, (_, i) => media(i + 1, false))] : Array.from({ length: 8 }, (_, i) => media(i, false)), recommendations: [], users: PEOPLE, followers: PEOPLE, following: PEOPLE, mutualFollowers: PEOPLE.slice(0, 5), activities: [], threads: [], notifications: [], airingSchedules: [], characters: [], staff: [] };
    return { Page: { pageInfo: { hasNextPage: false, total: 8, currentPage: 1, lastPage: 1 }, ...page } };
  }
  if (/\bViewer\b/.test(q)) return { Viewer: { ...viewer, unreadNotificationCount: 3 } };
  // The signed-in account's own profile, so the AniList cards in Settings draw their fields rather than a skeleton.
  if (/activityHistory/.test(q)) return userStats();
  // A character and a voice actor with their shows, so the person pages draw full rather than not-found.
  const fav = { favourites: 12_480, isFavourite: false, isFavouriteBlocked: false };
  // The person pages draw Roxy and her voice when the cast is cached, with their real portraits.
  const roxy = catalog?.cast.characters.edges.find((e) => e.node.name.full.startsWith("Roxy")) ?? catalog?.cast.characters.edges[0];
  const roxyVoice = roxy?.voiceActors[0];
  if (/\bCharacter\s*\(\s*id/.test(q) && !/\$page: Int!/.test(q))
    return {
      Character: {
        id: Number(variables?.id ?? 41),
        name: { full: "Roxy Migurdia", native: "ロキシー・ミグルディア", alternative: ["Roxy"] },
        image: { large: local(roxy?.node.file) ?? cover(3) },
        description: L("Eine Magierin der Migurd und __Rudeus' erste Lehrerin__. ~!Später Professorin in Ranoa.!~", "A Migurd mage and __Rudeus' first teacher__. ~!Later a professor in Ranoa.!~"),
        gender: "Female",
        age: "44",
        bloodType: null,
        dateOfBirth: { year: null, month: 5, day: 10 },
        siteUrl: "https://anilist.co/character/41",
        ...fav,
        media: { edges: [0, 1, 2, 3].map((i) => ({ characterRole: i === 0 ? "MAIN" : "SUPPORTING", voiceActors: [{ id: 500, name: { full: "Konomi Kohara" }, image: { medium: local(roxyVoice?.file) ?? cover(5) } }], node: socialMedia(i) })) },
      },
    };
  // The person pages' year lists, a page at a time: the first full and a second behind it, so the button draws.
  const yearPage = (make: (i: number) => Record<string, unknown>) => {
    const page = Number(variables?.page ?? 1);
    const years = [null, 2026, 2026, 2026, 2026, 2025, 2025, 2025, 2025, 2025, 2025, 2024, 2024, 2024, 2024, 2023, 2023, 2023, 2022, 2022, 2021, 2021, 2020, 2019, 2018];
    const formats = ["TV", "TV", "MOVIE", "OVA", "TV", "ONA", "TV_SHORT", "SPECIAL"];
    const edges = page === 1 ? years.map((year, i) => ({ id: 7000 + i, node: { ...socialMedia(i), format: formats[i % formats.length], startDate: { year } }, ...make(i) })) : [];
    return { pageInfo: { currentPage: page, hasNextPage: page === 1 }, edges };
  };
  const weight = (i: number) => (i % 3 === 0 ? "MAIN" : i % 7 === 6 ? "BACKGROUND" : "SUPPORTING");
  if (/characterMedia/.test(q)) {
    const names = ["Roxy Migurdia", "Kobeni Higashiyama", "Aiko Tanabe", "Mei Hoshino", "Yuna Sakuraba", "Yui Katsura", "Hana Mori", "Nao Kisaragi", "Chiyo Umino", "Sora Amane"];
    return { Staff: { characterMedia: yearPage((i) => ({ characterRole: weight(i), characterName: null, characters: [{ id: 9000 + i, name: { full: nameOf(CHARACTERS, i + 3, names[i % names.length]) }, image: { medium: face(CHARACTERS, i + 3) } }] })) } };
  }
  if (/\$page: Int!/.test(q) && /\bCharacter\(/.test(q)) {
    const voices = ["Konomi Kohara", "Yuka Hoshizora", "Ren Takagi"];
    return { Character: { media: yearPage((i) => ({ characterRole: weight(i), voiceActors: [{ id: 500 + (i % 3), name: { full: i % 3 === 0 ? "Konomi Kohara" : nameOf(VOICES, i, voices[i % 3]) }, image: { medium: i % 3 === 0 ? (local(roxyVoice?.file) ?? cover(5)) : face(VOICES, i) } }] })) } };
  }
  if (/\$page: Int!/.test(q) && /\bStudio\(/.test(q)) return { Studio: { media: yearPage((i) => ({ isMainStudio: i % 4 !== 3 })) } };
  if (/\bStudio\s*\(\s*id/.test(q))
    return { Studio: { id: Number(variables?.id ?? 31), name: "Studio Bind", isAnimationStudio: true, siteUrl: "https://anilist.co/studio/31", favourites: 9_120, isFavourite: false } };
  if (/\bStaff\s*\(\s*id/.test(q))
    return {
      Staff: {
        id: Number(variables?.id ?? 500),
        name: { full: "Konomi Kohara", native: "小原好美" },
        image: { large: local(roxyVoice?.file) ?? cover(5) },
        description: L("Sprecherin aus Kanagawa, bekannt für __ruhige, trockene__ Rollen.", "A voice actress from Kanagawa, known for __calm, dry__ roles."),
        primaryOccupations: ["Voice Actor"],
        gender: "Female",
        age: 30,
        homeTown: "Kanagawa, Japan",
        yearsActive: [2014],
        languageV2: "Japanese",
        dateOfBirth: { year: 1995, month: 7, day: 23 },
        dateOfDeath: null,
        siteUrl: "https://anilist.co/staff/500",
        ...fav,
        staffMedia: { edges: [0, 1, 2, 3, 4, 5].map((i) => ({ staffRole: ["Theme Song Performance (OP)", "Director", "Original Creator", "Script (ep 3)", "Character Design", "Music"][i], node: socialMedia(i) })) },
        characters: { nodes: [{ id: 41, name: { full: "Roxy Migurdia" }, image: { medium: local(roxy?.node.file) ?? cover(3) } }, { id: 42, name: { full: nameOf(CHARACTERS, 9, "Kobeni Higashiyama") }, image: { medium: face(CHARACTERS, 9) } }] },
      },
    };
  if (/\bUser\s*\(/.test(q)) {
    const sections = (manga: boolean) =>
      manga
        ? ["Reading", "Rereading", "Completed", "Paused", "Dropped", "Planning"]
        : ["Watching", "Rewatching", "Completed", "Paused", "Dropped", "Planning"];
    const options = (manga: boolean) => ({
      customLists: manga ? ["Oneshots", L("Lieblinge", "Favourites")] : ["Rewatch", "Ghibli", "Seasonals — Airing"],
      sectionOrder: sections(manga),
      splitCompletedSectionByFormat: false,
      advancedScoring: [],
      advancedScoringEnabled: false,
    });
    // Someone else's profile by name draws the full header: banner, bio, favourites and a follow button.
    const other = PEOPLE.find((u) => u.id !== 1 && u.name === variables?.name);
    const favourites = { nodes: other ? [0, 1, 2, 3].map(socialMedia) : [] };
    return {
      User: {
        ...viewer,
        ...(other ? { ...other, siteUrl: `https://anilist.co/user/${other.name}`, avatar: { large: other.avatar.medium } } : {}),
        about: other ? L("Schaut zu viel und liest zu wenig. **Frieren** ist Pflicht, ~!das Finale!~ auch.", "Watches too much and reads too little. **Frieren** is a must, ~!the finale!~ too.") : "",
        bannerImage: other ? asset(REAL[0].id, "banner") ?? banner(0) : null,
        donatorBadge: "",
        moderatorRoles: null,
        createdAt: now - 3 * 365 * 86_400,
        updatedAt: now - 86_400,
        isFollowing: false,
        isFollower: false,
        isBlocked: false,
        previousNames: [],
        options: { titleLanguage: "ROMAJI", displayAdultContent: false, airingNotifications: true, profileColor: "purple", timezone: "+02:00", activityMergeTime: 30, staffNameLanguage: "ROMAJI_WESTERN", restrictMessagesToFollowing: false, disabledListActivity: [] },
        mediaListOptions: { scoreFormat: "POINT_10", rowOrder: "score", animeList: options(false), mangaList: options(true) },
        statistics: { anime: { count: 36, meanScore: 78, minutesWatched: 42_000, episodesWatched: 1_700 }, manga: { count: 36, meanScore: 80, chaptersRead: 3_100, volumesRead: 210 } },
        favourites: { anime: favourites, manga: { nodes: [] }, characters: { nodes: [] }, staff: { nodes: [] }, studios: { nodes: [] } },
      },
    };
  }
  return {};
}

const unknown = new Set<string>();
mockIPC((cmd, args) => {
  const a = (args ?? {}) as Record<string, unknown>;
  const type = (a.mediaType as "ANIME" | "MANGA") ?? "ANIME";
  switch (cmd) {
    case "plugin:event|listen":
      return 1;
    case "anilist_session":
      return signedOut ? null : viewer;
    case "get_profile_mode":
      return signedOut ? "none" : "anilist";
    case "platform_info":
      return { os: android ? "android" : "windows", appImage: false, flatpak: false, storeUpdates: false, viewTransitions: true };
    case "fetch_media_list":
    case "local_fetch_list":
    case "cached_media_list":
      return LISTS[type];
    case "anilist_query":
      // Rejects as the client does when AniList cannot be reached or throttles, so the screens show their failure state.
      if (mock === "offline") return Promise.reject("Network error: error sending request for url (https://graphql.anilist.co/)");
      if (mock === "throttled") return Promise.reject("anilist.rateLimited");
      return answerQuery(String(a.query ?? ""), (a.variables as Record<string, unknown>) ?? null);
    case "get_notifications":
      return [
        { id: 1, kind: "airing", title: REAL[0].title, body: L("Folge 9 ist erschienen", "Episode 9 is out"), createdMs: Date.now() - 3_600_000, mediaId: REAL[0].id, read: false },
        { id: 2, kind: "sequel", title: REAL[2].title, body: L("Eine Fortsetzung ist angekündigt", "A sequel has been announced"), createdMs: Date.now() - 86_400_000, mediaId: REAL[2].id, read: true },
      ];
    case "anilist_auth_info":
      return { hasBuiltinClientId: true, customClientId: null, callbackUrl: "http://127.0.0.1:53682/callback" };
    case "app_version":
      return version;
    // Up to date unless a `neu-` mock names a build that just updated, so no other screen opens on the changelog.
    case "get_whats_new": {
      // Versions read off the bundled releases, so the two mocks keep their meaning after every Stable.
      const lines = changelog.unreleased.groups.flatMap((g) => g.lines.map((l) => l.id));
      const [newest, before] = changelog.releases.map((r) => r.version ?? "0.0.0");
      const nightlyAfter = (v: string, commit: number) => v.replace(/\.(\d+)$/, (_, p) => `.${Number(p) + 1}.${commit}`);
      if (mock === "neu-stable") return { current: `${newest}.900`, version: `${before}.800`, lines, channel: "stable" };
      // A Nightly user from after the older release, now past the newer one: two lines seen, the newer release crossed.
      if (mock === "neu-nightly") return { current: nightlyAfter(newest, 990), version: nightlyAfter(before, 850), lines: lines.slice(0, 2), channel: "prerelease" };
      return { current: "screens", version: "screens", lines: [], channel: "stable" };
    }
    case "get_library_episodes":
      return {};
    case "get_text_scale":
      return 1;
    case "get_ui_zoom":
      return 100;
    case "get_now_playing":
      return playing
        ? { process: "mpv.exe", streaming: false, mediaType: "ANIME", rawTitle: `[Grp] ${REAL[0].title} - 0${REAL[0].next}.mkv`, parsedTitle: REAL[0].title, season: 3, episode: REAL[0].next, sourceEpisode: REAL[0].next, mediaId: REAL[0].id, matchedTitle: REAL[0].title, overridden: false, progress: REAL[0].next - 1, totalEpisodes: REAL[0].episodes, episodeTitle: null }
        : null;
    // A busy default (two edits, a request in flight, a full plan), plus a 429 and a quiet idle state the boards compare.
    case "sync_status": {
      // The page-level throttle and offline mocks report it here too, so the sidebar and the error page agree with them.
      const limited = mock === "sync-limited" || mock === "throttled";
      const lost = mock === "offline";
      const idle = mock === "sync-idle";
      const row = (seq: number, source: string, operation: string, agoS: number, ms: number, left: number, outcome = "ok", pacedMs = 0) => ({
        seq, source, operation, startedAgoMs: agoS * 1000, durationMs: ms, pacedMs, status: outcome === "throttled" ? 429 : 200, remainingAfter: left, outcome,
      });
      return {
        connected: true,
        draining: false,
        queued: idle ? [] : [
          { id: 1, kind: "save", subject: REAL[0].id, fields: ["progress"], queuedAt: now - 120 },
          { id: 2, kind: "delete", subject: 5001, fields: [], queuedAt: now - 3600 },
        ],
        rate: limited
          ? { remaining: 0, limit: 30, observedAgoMs: 4000, throttledForMs: 38_000, throttleKind: "retryAfter" }
          : { remaining: idle ? 29 : 21, limit: 30, observedAgoMs: idle ? 95_000 : 2000, throttledForMs: null, throttleKind: null },
        inFlight: idle ? [] : limited
          ? [{ source: "mediaDetail", startedAgoMs: 9000, waiting: true }]
          : [{ source: "mediaDetail", startedAgoMs: 400, waiting: false }],
        recent: lost
          ? [{ ...row(9, "mediaDetail", "Media", 3, 0, 0, "error"), status: null, remainingAfter: null }]
          : idle
          ? [row(4, "airing", "Page", 840, 290, 29), row(3, "list", "MediaListCollection", 1500, 610, 28)]
          : [
              ...(limited ? [row(9, "seasonal", "Page", 4, 120, 0, "throttled")] : []),
              row(8, "seasonHero", "Page", 12, 340, 21),
              row(7, "notifCount", "Viewer", 13, 180, 22),
              row(6, "save", "SaveMediaListEntry", 50, 420, 23, "ok", 1200),
              row(5, "siteNotifs", "Page", 95, 260, 24),
              row(4, "airing", "Page", 840, 290, 25, "error"),
              row(3, "list", "MediaListCollection", 1500, 610, 26),
            ],
        traffic: {
          sources: [{ source: "list", total: 2 }, { source: "airing", total: 3 }, { source: "seasonHero", total: 1 }, { source: "siteNotifs", total: 2 }, { source: "save", total: 1 }, { source: "notifCount", total: 4 }],
          throttled: limited ? 1 : 0,
          remaining: null,
          limit: null,
        },
        upcoming: [
          { pass: "site", dueInMs: idle ? 540_000 : null, running: !idle, off: false },
          { pass: "airing", dueInMs: 42 * 60_000, running: false, off: false },
          { pass: "sequel", dueInMs: 5 * 3_600_000, running: false, off: false },
          { pass: "stale", dueInMs: null, running: false, off: true },
        ],
        lists: [{ mediaType: "ANIME", freshForMs: idle ? 0 : 11 * 60_000 }, { mediaType: "MANGA", freshForMs: 4 * 60_000 }],
      };
    }
    case "get_update_check_auto":
      return false;
    // Explicit art arrives blurred only where a screen asks, so the other shots keep the covers they always had.
    case "get_blur_adult":
      return mock === "blur-adult";
    case "local_all_entries":
      return [];
    // The rest of Settings, filled in so each pane draws its populated state rather than its empty one.
    case "get_scrobble_settings":
      return { enabled: true, confirm: true, delayMin: 0, gapAuto: false };
    case "get_airing_notify":
    case "get_sequel_notify":
    case "get_media_detection":
      return true;
    case "get_close_to_tray":
      return { enabled: true, tray: true };
    case "get_stale_settings":
      return { enabled: true, months: 3 };
    case "get_jellyfin_settings":
      return {
        url: mock === "jellyfin-out" ? "" : "http://192.168.1.20:8096",
        connected: mock !== "jellyfin-out",
        userName: "kyu",
        serverName: L("Wohnzimmer", "Living room"),
        device: mock === "jellyfin-out" ? "" : "KYU-PC",
        localDevice: "KYU-PC",
        externalUrl: "",
        externalVerified: null,
        externalPlainHttp: false,
      };
    case "get_jellyfin_background":
      return { enabled: android, supported: android, batteryExempt: android ? false : null };
    case "global_hotkey_status":
      return mock === "hotkey-portal"
        ? { backend: "portal", state: "bound", trigger: "Ctrl+Shift+K", configurable: true }
        : { backend: "grab", state: "bound", trigger: "Ctrl+Shift+K", configurable: false };
    case "list_airing_mutes":
      return [
        { mediaId: REAL[1].id, title: REAL[1].title },
        { mediaId: REAL[2].id, title: REAL[2].title },
        { mediaId: 4242, title: "Kimi ni Todoke: From Me to You Season 3" },
      ];
    case "list_detection_overrides":
      return [{ title: "Sousou no Frieren", season: 2, mediaType: "ANIME", mediaId: REAL[0].id, displayTitle: REAL[0].title, episodeOffset: 0 }];
    case "get_mpv_ipc":
      return { enabled: false, path: "\\\\.\\pipe\\mpvsocket", defaultPath: "\\\\.\\pipe\\mpvsocket", launchPath: "" };
    case "get_autostart":
    case "get_apk_download_metered":
    case "get_log_debug":
      return false;
    case "get_notif_schedule":
      return 30;
    case "get_global_hotkey":
      return "Ctrl+Shift+K";
    case "get_update_channel":
      return "stable";
    case "get_discord_settings":
      return { enabled: true, appId: "", hasBuiltinAppId: true };
    case "get_backup_settings":
      return { enabled: true, keep: 7, dir: android ? "/data/user/0/dev.kyu.karasu/backups" : "C:\\Users\\kyu\\AppData\\Roaming\\dev.kyu.karasu\\backups" };
    // A scanned folder: a dozen matched titles, one close match, one manual, one with a next season inside, two unplaced.
    case "get_library_index":
      return LISTS.ANIME.lists.flatMap((l) => l.entries).slice(0, 12).map((e, i) => {
        const count = Math.min(e.media.episodes ?? 12, 4 + (i % 8));
        const files = Array.from({ length: count }, (_, n) => ({ episode: n + 1, path: `D:\\Anime\\${e.media.title.romaji}\\${String(n + 1).padStart(2, "0")}.mkv` }));
        return {
          mediaId: e.mediaId,
          episodes: files.map((f) => f.episode),
          files,
          score: i === 3 ? 0.82 : 1,
          sources: [{ title: e.media.title.romaji, season: -1 }],
          manual: i === 5,
          overflow: i === 7 ? { knownEpisodes: count - 2, extraFiles: 2, firstExtra: count - 1, hint: null } : null,
        };
      });
    case "get_library_status":
      return { path: "D:\\Anime", filesSeen: 131, matched: 12 };
    case "get_library_unmatched":
      return [
        { title: "Kowloon Generic Romance", season: -1, files: [{ episode: 1, path: "D:\\Anime\\Kowloon\\01.mkv" }], suggestion: null },
        { title: "Dan Da Dan", season: 2, files: [{ episode: 3, path: "D:\\Anime\\DDD S2\\03.mkv" }], suggestion: null },
      ];
    case "pending_update":
      return null;
    case "diagnostics_report":
      return `Karasu ${version}\nOS: Windows 11`;
    case "apk_update_state":
      return { available: false, status: "none", version: null, reason: null, needsInstallPermission: false, received: 0, total: 0 };
    case "get_library_path":
      return "D:\\Anime";
    case "list_library_redirects":
      return [{ title: "Sousou no Frieren", season: -1, epFrom: 29, epTo: 38, mediaId: REAL[0].id, dstStart: 1 }];
    case "get_portable_status":
      return { portable: false, dir: "C:\\Users\\kyu\\AppData\\Roaming\\dev.kyu.karasu", other: null };
    case "get_content_filter":
      return mock === "filter-moderate" ? "moderate" : "off";
    case "save_list_entry":
    case "local_save_entry":
      return { queued: false, entry: null };
    default:
      // Unanswered commands are listed for `screens.mjs`, which reports them beside page errors.
      if (!cmd.startsWith("plugin:") && !cmd.startsWith("set_")) unknown.add(cmd);
      (window as unknown as { __unknown: string[] }).__unknown = [...unknown];
      return null;
  }
});

const html = document.documentElement;
html.setAttribute("data-theme", theme);
if (style) html.setAttribute("data-dir", style);
localStorage.setItem("karasu-theme", theme);
localStorage.setItem("karasu-contrast", contrast ? "high" : "standard");
localStorage.setItem("karasu-reduce-motion", params.get("still") === "1" ? "true" : "false");
localStorage.setItem("karasu-cover-cols", android ? "4" : "8");
// A status colour picked too dark to tell from the panel, for the settings' contrast warning.
if (mock === "status-low") localStorage.setItem("karasu-status-colors", JSON.stringify({ PAUSED: "#3b3f4a" }));
// A title language other than the default English, for the screens that show how titles are spelt.
if (mock === "titles-romaji" || mock === "titles-native") localStorage.setItem("karasu-title-language", mock.slice(7));
location.hash = route;

await import("@/app/index.css");
if (style) await import(/* @vite-ignore */ `/scripts/screens/.out/styles/${style}.css`);
await import("./app-main");
