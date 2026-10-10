import { EMPTY, type MultiValue } from "@/lib/multiFilter";
import { MEDIA_FORMATS, ORIGINS } from "@/lib/format";

/** What the search is looking for; the scope pills grew from two mediums to people and entities. */
export type Scope = "ANIME" | "MANGA" | "USERS" | "CHARACTERS" | "STAFF" | "STUDIOS";

export const SCOPES: readonly Scope[] = ["ANIME", "MANGA", "USERS", "CHARACTERS", "STAFF", "STUDIOS"];
export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
export const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"] as const;
/** The sorts worth offering; relevance only means something with a query. */
export const SORTS = ["SEARCH_MATCH", "TRENDING_DESC", "POPULARITY_DESC", "SCORE_DESC", "START_DATE_DESC"] as const;

/** Everything the search page shows that Back should bring back, all of it in the URL. */
export interface SearchView {
  scope: Scope;
  term: string;
  genre: MultiValue;
  tag: MultiValue;
  year: string;
  season: string;
  format: string;
  status: string;
  source: string;
  country: string;
  sort: string;
}

export const SEARCH_DEFAULTS: SearchView = {
  scope: "ANIME",
  term: "",
  genre: EMPTY,
  tag: EMPTY,
  year: "",
  season: "",
  format: "",
  status: "",
  source: "",
  country: "",
  sort: "SEARCH_MATCH",
};

/** The two scopes that browse media — everything the filter toolbar serves. */
export const isMediaScope = (s: Scope): s is "ANIME" | "MANGA" => s === "ANIME" || s === "MANGA";

const oneOf = (value: string | null, allowed: readonly string[]): string => (value && allowed.includes(value) ? value : "");

/** One repeated param per pick, an exclusion led by a minus, so a name holding a comma stays whole. */
function readMulti(params: URLSearchParams, key: string): MultiValue {
  const all = params.getAll(key).filter(Boolean);
  if (all.length === 0) return EMPTY;
  return {
    include: all.filter((v) => !v.startsWith("-")),
    exclude: all.filter((v) => v.startsWith("-")).map((v) => v.slice(1)),
  };
}

/** A hand-edited or stale URL falls back value by value, since an unknown enum would make AniList refuse the query. */
export function parseSearchView(params: URLSearchParams): SearchView {
  const scope = (SCOPES as readonly string[]).includes(params.get("scope") ?? "")
    ? (params.get("scope") as Scope)
    : "ANIME";
  const type = scope === "MANGA" ? "MANGA" : "ANIME";
  const year = params.get("year") ?? "";
  const source = params.get("source") ?? "";
  return {
    scope,
    term: (params.get("q") ?? "").trim(),
    genre: readMulti(params, "genre"),
    tag: readMulti(params, "tag"),
    year: /^\d{4}$/.test(year) ? year : "",
    // Seasons exist for anime alone, as the toolbar offers them.
    season: scope === "ANIME" ? oneOf(params.get("season"), SEASONS) : "",
    format: oneOf(params.get("format"), MEDIA_FORMATS[type]),
    status: oneOf(params.get("status"), STATUSES),
    source: /^[A-Z_]+$/.test(source) ? source : "",
    country: oneOf(params.get("country"), ORIGINS),
    sort: oneOf(params.get("sort"), SORTS) || "SEARCH_MATCH",
  };
}

/** Every key the view owns, in the one order they are written. */
const OWNED_KEYS = ["scope", "q", "genre", "tag", "year", "season", "format", "status", "source", "country", "sort"] as const;

/** Writes only what differs from a fresh search, so an untouched page keeps a bare URL. */
export function writeSearchView(prev: URLSearchParams, view: SearchView): URLSearchParams {
  const p = new URLSearchParams(prev);
  // Dropping every owned key first and appending in one order makes the result a fixpoint: writing it again changes nothing.
  for (const key of OWNED_KEYS) p.delete(key);
  const single = (key: string, value: string, def = "") => {
    if (value !== def) p.append(key, value);
  };
  const multi = (key: string, value: MultiValue) => {
    for (const v of value.include) p.append(key, v);
    for (const v of value.exclude) p.append(key, `-${v}`);
  };
  single("scope", view.scope, "ANIME");
  single("q", view.term.trim());
  multi("genre", view.genre);
  multi("tag", view.tag);
  single("year", view.year);
  single("season", view.season);
  single("format", view.format);
  single("status", view.status);
  single("source", view.source);
  single("country", view.country);
  single("sort", view.sort, "SEARCH_MATCH");
  return p;
}
