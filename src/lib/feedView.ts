/** Which feed the activity page reads and which kinds of activity it shows, kept in the URL. */
export const feeds = ["following", "everyone", "mine"] as const;
export const feedKinds = ["all", "text", "anime", "manga"] as const;
export type Feed = (typeof feeds)[number];
export type FeedKind = (typeof feedKinds)[number];
export interface FeedView {
  feed: Feed;
  kind: FeedKind;
}

/** The kinds AniList is asked for; `MESSAGE` is private mail and is in none of them. */
const TYPES: Record<FeedKind, ("TEXT" | "ANIME_LIST" | "MANGA_LIST")[]> = {
  all: ["ANIME_LIST", "MANGA_LIST", "TEXT"],
  text: ["TEXT"],
  anime: ["ANIME_LIST"],
  manga: ["MANGA_LIST"],
};

export type FeedVariables = ({ isFollowing: true } | { userId: number } | Record<never, never>) & { types: string[] };

/** The activity query's variables for a view; everyone's feed names no user and asks nothing of following. */
export function feedVariables(view: FeedView, viewerId: number): FeedVariables {
  const types = TYPES[view.kind];
  if (view.feed === "mine") return { userId: viewerId, types };
  if (view.feed === "everyone") return { types };
  return { isFollowing: true, types };
}

/** The kinds a feed can show; everyone's has no status-updates-only view, since AniList answers that one empty. */
export function kindsFor(feed: Feed): FeedKind[] {
  return feed === "everyone" ? feedKinds.filter((k) => k !== "text") : [...feedKinds];
}

export function parseFeedView(params: URLSearchParams): FeedView {
  const raw = params.get("feed");
  const feed: Feed = (feeds as readonly string[]).includes(raw ?? "") ? (raw as Feed) : "following";
  const kind = params.get("kind");
  return { feed, kind: (kindsFor(feed) as string[]).includes(kind ?? "") ? (kind as FeedKind) : "all" };
}

/** Names only what differs from following and everything, so the plain feed keeps a bare URL. */
export function writeFeedView(prev: URLSearchParams, view: FeedView): URLSearchParams {
  const p = new URLSearchParams(prev);
  if (view.feed === "following") p.delete("feed");
  else p.set("feed", view.feed);
  if (view.kind === "all") p.delete("kind");
  else p.set("kind", view.kind);
  return p;
}
