import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useNavigationType } from "react-router";
import { useColumnCount } from "@/hooks/useColumnCount";
import { useGridRoving } from "@/hooks/useGridRoving";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useUrlState } from "@/hooks/useUrlState";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  browseMedia,
  genreTagCollections,
  MEDIA_SOURCES,
  type BrowseFilters,
  type MediaWithListStatus,
  type Season,
} from "@/api/queries";
import { EMPTY, encode, isEmpty, toQueryArgs } from "@/lib/multiFilter";
import {
  SCOPES,
  SEASONS,
  SORTS,
  STATUSES,
  isMediaScope,
  parseSearchView,
  writeSearchView,
  type SearchView,
} from "@/lib/searchView";
import { MultiFilterSelect } from "@/components/ui/multi-filter-select";
import type { MediaType } from "@/api/types";
import {
  searchCharacters,
  searchStaff,
  searchStudios,
  searchUsers,
  USER_SEARCH_MIN,
  type PersonHit,
  type StudioHit,
} from "@/api/social";
import {
  formatLabel,
  MEDIA_FORMATS,
  mediaStatusLabel,
  ORIGINS,
  originLabel,
  sourceLabel,
} from "@/lib/format";
import { SearchField } from "@/components/ui/search-field";
import { UserLockup } from "@/components/ui/user-lockup";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import MediaCard from "@/components/media/MediaCard";
import { isTauri } from "@/api/anilist";
import { adultQueryArg, blockReason } from "@/lib/contentFilter";
import { FilteredNotice } from "@/components/FilteredNotice";
import { useContentFilter } from "@/stores/contentFilter";
import { useAuth } from "@/stores/auth";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { usePresence } from "@/hooks/usePresence";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, PerchRule, StruckQuery } from "@/components/EmptyState";
import { Pill } from "@/components/ui/pill";
import { UserList } from "@/components/social/UserList";
import { cardClass } from "@/components/ui/card";

/** Literal switch, so `i18nKeys.test.ts` sees every key. */
function sortLabel(sort: string, t: (k: string) => string): string {
  switch (sort) {
    case "SEARCH_MATCH":
      return t("search.sortRelevance");
    case "TRENDING_DESC":
      return t("search.sortTrending");
    case "POPULARITY_DESC":
      return t("search.sortPopularity");
    case "SCORE_DESC":
      return t("search.sortScore");
    case "START_DATE_DESC":
      return t("search.sortNewest");
    default:
      return sort;
  }
}

/** The ready-made lenses — a browse page's worth of charts as one click. */
const BROWSE_CHIPS = [
  { key: "chipTrending", sort: "TRENDING_DESC", thisSeason: false },
  { key: "chipSeason", sort: "POPULARITY_DESC", thisSeason: true },
  { key: "chipPopular", sort: "POPULARITY_DESC", thisSeason: false },
  { key: "chipTop", sort: "SCORE_DESC", thisSeason: false },
] as const;

function currentSeasonOf(now = new Date()): { season: Season; year: number } {
  const month = now.getMonth() + 1;
  const season: Season =
    month <= 3 ? "WINTER" : month <= 6 ? "SPRING" : month <= 9 ? "SUMMER" : "FALL";
  return { season, year: now.getFullYear() };
}

export default function Search() {
  const { t } = useTranslation();
  // In the URL, so Back from a result brings the query, the scope and every filter back.
  const [view, setView, visit] = useUrlState(parseSearchView, writeSearchView);
  const { scope, term, genre, tag, year, season, format, status, source, country, sort } = view;
  const set = useCallback(
    (patch: Partial<SearchView>) =>
      setView((v) =>
        (Object.keys(patch) as (keyof SearchView)[]).every((k) => v[k] === patch[k]) ? v : { ...v, ...patch },
      ),
    [setView],
  );
  // The typed text runs ahead of the debounced term; a new visit to the page starts it from that visit's URL.
  const [input, setInput] = useState(term);
  const [inputVisit, setInputVisit] = useState(visit);
  if (inputVisit !== visit) {
    setInputVisit(visit);
    setInput(term);
  }
  // Arriving by Back restores a search, and a field that took the focus would open the phone's keyboard over it.
  const restored = useNavigationType() === "POP";
  const resultsRef = useRef<HTMLDivElement>(null);
  useScrollMemory(resultsRef, "search");
  const phone = usePhoneShell();
  // Phone only: the filter chips collapse behind this; desktop has the room and keeps its inline row.
  const [filtersOpen, setFiltersOpen] = useState(false);
  // The phone fold must pop out as well as in; a bare conditional cuts it away mid-frame on collapse.
  const filterPanel = usePresence(filtersOpen);
  const type: MediaType = isMediaScope(scope) ? scope : "ANIME";

  // Debounce: search only after 500 ms of typing pause (spare the rate limit)
  useEffect(() => {
    const timer = setTimeout(() => set({ term: input.trim() }), 500);
    return () => clearTimeout(timer);
  }, [input, set]);

  // In the setter, not an effect on the scope, which would also run on arrival and drop a restored format.
  const changeScope = (next: SearchView["scope"]) => {
    // A format from the other medium is meaningless after a flip, and a season would keep filtering manga invisibly.
    if (next !== scope) set({ scope: next, format: "", season: "" });
  };

  const level = useContentFilter((s) => s.level);
  const filterReady = useContentFilter((s) => s.ready);

  // The vocabularies AniList defines. One request, effectively permanent.
  const collections = useQuery({
    queryKey: ["genreTags"],
    queryFn: genreTagCollections,
    enabled: isTauri,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const genres = collections.data?.genres ?? [];
  const tags = useMemo(
    () =>
      (collections.data?.tags ?? [])
        .filter((x) => level === "off" || x.isAdult !== true)
        .map((x) => x.name)
        .sort(),
    [collections.data, level],
  );

  const hasFilters =
    !isEmpty(genre) ||
    !isEmpty(tag) ||
    !!(year || season || format || status || source || country);

  // The toggle's badge: `hasFilters` summed, so sort is deliberately not counted either.
  const activeFilterCount =
    Number(!isEmpty(genre)) +
    Number(!isEmpty(tag)) +
    [year, season, format, status, source, country].filter(Boolean).length;

  const clearFilters = () =>
    set({ genre: EMPTY, tag: EMPTY, year: "", season: "", format: "", status: "", source: "", country: "" });
  // Relevance without a query is meaningless; popularity is the browse default.
  const effectiveSort = term || sort !== "SEARCH_MATCH" ? sort : "POPULARITY_DESC";
  const active = term.length >= 2 || hasFilters;

  const genreArgs = toQueryArgs(genre);
  const tagArgs = toQueryArgs(tag);
  const filters: BrowseFilters = {
    search: term.length >= 2 ? term : undefined,
    genreIn: genreArgs.in,
    genreNotIn: genreArgs.notIn,
    tagIn: tagArgs.in,
    tagNotIn: tagArgs.notIn,
    seasonYear: year ? Number(year) : undefined,
    season: (season || undefined) as Season | undefined,
    format: format || undefined,
    status: status || undefined,
    source: source || undefined,
    countryOfOrigin: country || undefined,
    sort: term.length >= 2 ? sort : effectiveSort,
  };

  // Level is keyed since filtering is server-side; genre and tag are encoded so pick order is one entry.
  const mediaKey = [
    "search",
    type,
    term,
    encode(genre),
    encode(tag),
    year,
    season,
    format,
    status,
    source,
    country,
    filters.sort,
    level,
  ];
  const queryClient = useQueryClient();
  const media = useInfiniteQuery({
    queryKey: mediaKey,
    queryFn: ({ pageParam }) => browseMedia(type, filters, pageParam, adultQueryArg(level)),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.pageInfo.hasNextPage ? all.length + 1 : undefined),
    enabled: isTauri && filterReady && active && isMediaScope(scope),
    // Never stale by age, only by invalidation (a sync, a new score format): a stale refetch re-asks every loaded page.
    staleTime: Infinity,
  });

  // Adult stays server-side (`adultQueryArg`): filtering it here is the sparse-page bug; the split keeps the notice honest.
  const fetched = (media.data?.pages ?? []).flatMap((p) => p.media);
  let hiddenAdult = 0;
  let hiddenSuggestive = 0;
  const results = fetched.filter((m) => {
    const reason = blockReason(m, level);
    if (reason === "adult") hiddenAdult++;
    else if (reason === "suggestive") hiddenSuggestive++;
    return reason === null;
  });

  const applyChip = (chip: (typeof BROWSE_CHIPS)[number]) => {
    const now = currentSeasonOf();
    setInput("");
    set({
      term: "",
      genre: EMPTY,
      tag: EMPTY,
      status: "",
      format: "",
      source: "",
      country: "",
      sort: chip.sort,
      year: chip.thisSeason ? String(now.year) : "",
      // Manga has no seasons, and the URL keeps a season for anime alone.
      season: chip.thisSeason && scope === "ANIME" ? now.season : "",
    });
  };

  const yearOptions = useMemo(() => {
    const max = new Date().getFullYear() + 1;
    return Array.from({ length: max - 1939 }, (_, i) => String(max - i));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="px-8 pt-6">
        <h1 className="text-title">{t("search.title")}</h1>
        <div className="mt-4 max-w-176">
          <SearchField
            size="lg"
            autoFocus={!restored}
            // What "/" and the Search action focus when the page is already open, so they refine rather than reset.
            data-page-search=""
            value={input}
            onChange={setInput}
            label={t("search.placeholder")}
            clearLabel={t("common.clear")}
            placeholder={t("search.placeholder")}
            className="max-w-136"
          />
          {/* Chips scroll in one row on a phone, behind a divider; a desktop gives the browse chips a row of their own. */}
          <div
            // Only the x axis scrolls and draws no bar: a pill's touch hit area overflows the row vertically.
            className={cn(
              "mt-2.5 flex items-center gap-1.5",
              phone
                ? "flex-nowrap overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                : "flex-wrap",
            )}
          >
            {SCOPES.map((sc) => (
              <Pill
                key={sc}
                active={scope === sc}
                onClick={() => changeScope(sc)}
                className="shrink-0 whitespace-nowrap"
              >
                {sc === "ANIME"
                  ? t("search.anime")
                  : sc === "MANGA"
                    ? t("search.manga")
                    : sc === "USERS"
                      ? t("search.users")
                      : sc === "CHARACTERS"
                        ? t("search.characters")
                        : sc === "STAFF"
                          ? t("search.staffScope")
                          : t("search.studios")}
              </Pill>
            ))}
            {isMediaScope(scope) && (
              <span className={cn("flex shrink-0 items-center gap-1.5", !phone && "basis-full")}>
                {phone && <span className="mx-1 h-4 w-px bg-surface-700" />}
                {BROWSE_CHIPS.map((chip) => (
                  <Pill
                    key={chip.key}
                    onClick={() => applyChip(chip)}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {t(`search.${chip.key}`)}
                  </Pill>
                ))}
              </span>
            )}
          </div>
          {isMediaScope(scope) && phone && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <Pill
                active={filtersOpen}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                {t("search.filters")}
                {activeFilterCount > 0 && (
                  <span className="tabular-nums">({activeFilterCount})</span>
                )}
              </Pill>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-2xs font-medium text-accent-400 hover:underline"
                >
                  {t("list.clearFilter")}
                </button>
              )}
            </div>
          )}
          {isMediaScope(scope) && (!phone || filterPanel.mounted) && (
            <div
              className={cn(
                "mt-2.5 flex flex-wrap gap-2",
                phone && (filterPanel.leaving ? "animate-pop-out" : "animate-pop-in"),
              )}
            >
              <MultiFilterSelect
                label={t("search.genreLabel")}
                value={genre}
                onChange={(v) => set({ genre: v })}
                placeholder={t("search.any")}
                options={genres}
              />
              {/* Searchable: the tag vocabulary is a scroll rather than a list. */}
              <MultiFilterSelect
                label={t("search.tagLabel")}
                value={tag}
                onChange={(v) => set({ tag: v })}
                placeholder={t("search.any")}
                options={tags}
                searchable
              />
              <FilterSelect
                label={t("search.yearLabel")}
                value={year}
                onChange={(v) => set({ year: v })}
                placeholder={t("search.any")}
                options={yearOptions.map((y) => ({ value: y, label: y }))}
              />
              {scope === "ANIME" && (
                <FilterSelect
                  label={t("search.seasonLabel")}
                  value={season}
                  onChange={(v) => set({ season: v })}
                  placeholder={t("search.any")}
                  options={SEASONS.map((s) => ({
                    value: s,
                    label: t(`season.${s}`, { defaultValue: s }),
                  }))}
                />
              )}
              <FilterSelect
                label={t("list.formatLabel")}
                value={format}
                onChange={(v) => set({ format: v })}
                placeholder={t("search.any")}
                options={MEDIA_FORMATS[type].map((f) => ({
                  value: f,
                  label: formatLabel(f, t),
                }))}
              />
              <FilterSelect
                label={t("search.statusLabel")}
                value={status}
                onChange={(v) => set({ status: v })}
                placeholder={t("search.any")}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: mediaStatusLabel(s, t),
                }))}
              />
              {/* `sourceLabel` and `originLabel` stay `lib/format`'s; a second copy is how a label gets spelled two ways. */}
              <FilterSelect
                label={t("search.sourceLabel")}
                value={source}
                onChange={(v) => set({ source: v })}
                placeholder={t("search.any")}
                options={MEDIA_SOURCES.map((s) => ({
                  value: s,
                  label: sourceLabel(s, t),
                }))}
              />
              <FilterSelect
                label={t("list.originLabel")}
                value={country}
                onChange={(v) => set({ country: v })}
                placeholder={t("search.any")}
                options={ORIGINS.map((c) => ({
                  value: c,
                  label: originLabel(c, t),
                }))}
              />
              <FilterSelect
                label={t("list.sortLabel")}
                value={filters.sort}
                onChange={(v) => set({ sort: v })}
                options={SORTS.map((s) => ({ value: s, label: sortLabel(s, t) }))}
              />
            </div>
          )}
        </div>
      </div>

      <div ref={resultsRef} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {scope === "USERS" && <UserSearchResults term={term} />}
        {(scope === "CHARACTERS" || scope === "STAFF") && (
          <PersonSearchResults kind={scope === "CHARACTERS" ? "character" : "staff"} term={term} />
        )}
        {scope === "STUDIOS" && <StudioSearchResults term={term} />}
        {isMediaScope(scope) && (
          <MediaResults
            error={media.error}
            onRetry={() => queryClient.resetQueries({ queryKey: mediaKey, exact: true })}
            nextPageFailed={media.isFetchNextPageError}
            isFetching={media.isFetching && !media.isFetchingNextPage}
            active={active}
            term={term}
            results={results}
            hiddenAdult={hiddenAdult}
            hiddenSuggestive={hiddenSuggestive}
            hasNextPage={media.hasNextPage === true}
            fetchingMore={media.isFetchingNextPage}
            onMore={() => media.fetchNextPage()}
          />
        )}
      </div>
    </div>
  );
}

/** Users need a longer query than media; a shorter one makes AniList pad the exact match with unrelated accounts. */
function UserSearchResults({ term }: { term: string }) {
  const { t } = useTranslation();
  const mode = useAuth((s) => s.mode);

  if (mode !== "anilist") {
    return (
      <EmptyState
        visual={<PerchRule />}
        title={t("social.needsAccount")}
        hint={t("social.needsAccountHint")}
      />
    );
  }

  if (term.length < USER_SEARCH_MIN) {
    return (
      <EmptyState
        title={t("search.userPrompt")}
        hint={t("search.userPromptHint", { n: USER_SEARCH_MIN })}
      />
    );
  }

  return (
    <UserList
      queryKey={["social", "userSearch", term]}
      fetchPage={(page) => searchUsers(term, page)}
      emptyTitle={t("search.noUsers")}
      emptyHint={t("search.noUsersHint")}
      // AniList's `total` is a capped 5000 here, so a count would be invented.
      countRemaining={false}
      staleTime={Infinity}
    />
  );
}

/** Characters and staff share one list, with no account gate because these are public reads. */
function PersonSearchResults({
  kind,
  term,
}: {
  kind: "character" | "staff";
  term: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["search", kind, term],
    queryFn: ({ pageParam }) =>
      kind === "character"
        ? searchCharacters(term, pageParam)
        : searchStaff(term, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.pageInfo.hasNextPage ? all.length + 1 : undefined,
    enabled: isTauri && term.length >= USER_SEARCH_MIN,
    staleTime: Infinity,
  });

  if (term.length < USER_SEARCH_MIN) {
    return (
      <EmptyState
        title={t("search.entityPrompt")}
        hint={t("search.userPromptHint", { n: USER_SEARCH_MIN })}
      />
    );
  }
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
  return (
    <EntityResultList
      loading={query.isLoading}
      error={query.error}
      onRetry={() => queryClient.resetQueries({ queryKey: ["search", kind, term], exact: true })}
      nextPageFailed={query.isFetchNextPageError}
      empty={rows.length === 0}
      term={term}
      hasNextPage={query.hasNextPage === true}
      fetchingMore={query.isFetchingNextPage}
      onMore={() => query.fetchNextPage()}
    >
      {rows.map((hit: PersonHit) => (
        <EntityRow
          key={hit.id}
          to={`/${kind}/${hit.id}`}
          name={hit.name?.full ?? "—"}
          src={hit.image?.medium ?? undefined}
        />
      ))}
    </EntityResultList>
  );
}

function StudioSearchResults({ term }: { term: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: ["search", "studio", term],
    queryFn: ({ pageParam }) => searchStudios(term, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.pageInfo.hasNextPage ? all.length + 1 : undefined,
    enabled: isTauri && term.length >= USER_SEARCH_MIN,
    staleTime: Infinity,
  });

  if (term.length < USER_SEARCH_MIN) {
    return (
      <EmptyState
        title={t("search.entityPrompt")}
        hint={t("search.userPromptHint", { n: USER_SEARCH_MIN })}
      />
    );
  }
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
  return (
    <EntityResultList
      loading={query.isLoading}
      error={query.error}
      onRetry={() => queryClient.resetQueries({ queryKey: ["search", "studio", term], exact: true })}
      nextPageFailed={query.isFetchNextPageError}
      empty={rows.length === 0}
      term={term}
      hasNextPage={query.hasNextPage === true}
      fetchingMore={query.isFetchingNextPage}
      onMore={() => query.fetchNextPage()}
    >
      {rows.map((hit: StudioHit) => (
        <EntityRow key={hit.id} to={`/studio/${hit.id}`} name={hit.name} />
      ))}
    </EntityResultList>
  );
}

/** The states around any entity result list, shared so they cannot drift. */
function EntityResultList({
  loading,
  error,
  onRetry,
  nextPageFailed,
  empty,
  term,
  hasNextPage,
  fetchingMore,
  onMore,
  children,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => unknown;
  /** The failure was a later page's, so the loaded rows stay and Load more is what asks again. */
  nextPageFailed: boolean;
  empty: boolean;
  term: string;
  hasNextPage: boolean;
  fetchingMore: boolean;
  onMore: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  if (error != null && empty) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  if (loading) {
    return <Loader size="sm" label={t("search.searching")} />;
  }
  if (empty) {
    return (
      <EmptyState
        visual={<StruckQuery query={term} />}
        title={t("search.noMatches")}
      />
    );
  }
  return (
    <>
      {error != null && !nextPageFailed && <ErrorState error={error} onRetry={onRetry} inline className="mb-3" />}
      <div className="space-y-2">{children}</div>
      {hasNextPage && (
        <div className="mt-3">
          {nextPageFailed && <ErrorState error={error} inline className="mb-2" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMore}
            disabled={fetchingMore}
            className="w-full"
          >
            {t("social.loadMorePlain")}
          </Button>
        </div>
      )}
    </>
  );
}

/** `UserRow`'s frame without the follow button — the whole row is the link. */
function EntityRow({ to, name, src }: { to: string; name: string; src?: string }) {
  return (
    <div className={cn(cardClass("flat", { interactive: true }), "flex items-center gap-3 p-3")}>
      <Link to={to} className="min-w-0 flex-1">
        <UserLockup name={name} src={src} size="md" titleAttr nameClassName="text-sm" />
      </Link>
    </div>
  );
}

function MediaResults({
  error,
  onRetry,
  nextPageFailed,
  isFetching,
  active,
  term,
  results,
  hiddenAdult,
  hiddenSuggestive,
  hasNextPage,
  fetchingMore,
  onMore,
}: {
  error: unknown;
  onRetry: () => unknown;
  /** The failure was a later page's, so the loaded covers stay and Load more is what asks again. */
  nextPageFailed: boolean;
  isFetching: boolean;
  /** Whether anything — a query or a filter — is asking for results. */
  active: boolean;
  term: string;
  results: MediaWithListStatus[];
  /** Results that arrived and were dropped by the content filter, by why. */
  hiddenAdult: number;
  hiddenSuggestive: number;
  hasNextPage: boolean;
  fetchingMore: boolean;
  onMore: () => void;
}) {
  const { t } = useTranslation();

  // Arrow keys as in the list view; `useColumnCount` reads the resolved grid instead of recomputing CSS.
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(gridRef, results.length);
  const navigate = useNavigate();
  const { focus } = useGridRoving({
    count: results.length,
    columns,
    onOpen: (i) => {
      const m = results[i];
      if (m) navigate(`/media/${m.id}`);
    },
  });
  return (
    <>
      {error != null && !(nextPageFailed && results.length > 0) && (
        <ErrorState
          error={error}
          onRetry={onRetry}
          inline={results.length > 0}
          className={results.length > 0 ? "mb-3" : undefined}
        />
      )}
      {isFetching && <Loader size="sm" label={t("search.searching")} />}
      {!isFetching && !active && (
        // No mark here, deliberately: on this empty screen the field above is the subject, not a visual.
        <EmptyState title={t("search.prompt")} hint={t("search.promptHint")} />
      )}
      {!isFetching && active && (
        <FilteredNotice adult={hiddenAdult} suggestive={hiddenSuggestive} className="mb-3" />
      )}
      {!isFetching && active && error == null && results.length === 0 && (
        <EmptyState
          visual={<StruckQuery query={term || t("search.filtered")} />}
          // The query is already on screen in the visual, so the sentence underneath does not repeat it.
          title={t("search.noResults")}
          hint={t("search.noResultsHint")}
        />
      )}
      {results.length > 0 && (
        <>
          <div ref={gridRef} className="media-grid gap-x-4 gap-y-6">
            {results.map((m, i) => (
              <MediaCard key={m.id} media={m} focused={i === focus} />
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-6 flex flex-col items-center gap-3">
              {nextPageFailed && <ErrorState error={error} inline />}
              {/* Countless: `pageInfo.total` is a capped sentinel on search, so a number would be invented. */}
              <Button variant="outline" size="control" onClick={onMore} disabled={fetchingMore}>
                {t("social.loadMorePlain")}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
