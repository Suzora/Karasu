import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useNavigationType } from "react-router";
import { useColumnCount } from "@/hooks/useColumnCount";
import { useGridRoving } from "@/hooks/useGridRoving";
import { PageTitle, PickerField, columnRow } from "@/components/shell/PageColumn";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useUrlState } from "@/hooks/useUrlState";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  browseMedia,
  currentSeason,
  genreTagCollections,
  MEDIA_SOURCES,
  type BrowseFilters,
  type MediaWithListStatus,
  type Season,
} from "@/api/queries";
import { EMPTY, encode, isEmpty, toQueryArgs } from "@/lib/multiFilter";
import {
  SCOPES,
  SEARCH_DEFAULTS,
  SEASONS,
  SORTS,
  STATUSES,
  isMediaScope,
  isPeopleScope,
  parseSearchView,
  writeSearchView,
  type SearchView,
} from "@/lib/searchView";
import { MultiFilterSelect } from "@/components/ui/multi-filter-select";
import type { MediaType } from "@/api/types";
import {
  browsePeoplePage,
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
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, PerchRule, StruckQuery } from "@/components/EmptyState";
import { UserList } from "@/components/social/UserList";
import { cardClass } from "@/components/ui/card";
import {
  Favourites,
  MediaSections,
  PeopleSections,
  ShowAllHeading,
  searchHref,
  sectionIcon,
  sectionTitle,
} from "@/components/search/BrowseSections";
import { birthdayDay, sectionOfView } from "@/lib/browseSections";
import { BookOpen, Building2, Cake, Clapperboard, Heart, SlidersHorizontal, User, UserRound, Users } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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

/** One glyph per scope, so the column is scannable without reading. */
const SCOPE_ICON: Record<SearchView["scope"], typeof Clapperboard> = {
  ANIME: Clapperboard,
  MANGA: BookOpen,
  USERS: Users,
  CHARACTERS: UserRound,
  STAFF: User,
  STUDIOS: Building2,
};

export default function Search() {
  const { t } = useTranslation();
  // In the URL, so Back from a result brings the query, the scope and every filter back.
  const [view, setView, visit] = useUrlState(parseSearchView, writeSearchView);
  const { scope, term, genre, tag, year, season, format, status, source, country, sort, browse } = view;
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
  const type: MediaType = isMediaScope(scope) ? scope : "ANIME";

  // Debounce: search only after 500 ms of typing pause (spare the rate limit)
  useEffect(() => {
    const timer = setTimeout(() => set({ term: input.trim() }), 500);
    return () => clearTimeout(timer);
  }, [input, set]);

  // In the setter, not an effect on the scope, which would also run on arrival and drop a restored format.
  const changeScope = (next: SearchView["scope"]) => {
    // A format is one medium's, manga have no season to filter on, and a people list has no media; a year means both.
    if (next !== scope)
      set({
        scope: next,
        format: "",
        season: "",
        ...(isPeopleScope(next) ? {} : { browse: "" }),
      });
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
  // A term under two characters searches nothing, so it neither keys a request nor unnames a section's grid.
  const searched = term.length >= 2 ? term : "";
  // Relevance without a query is meaningless; popularity is the browse default.
  const effectiveSort = searched || sort !== "SEARCH_MATCH" ? sort : "POPULARITY_DESC";
  // A chosen sort browses too: it is what a section's "Show all" opens, while an untouched page shows the sections.
  const active = searched !== "" || hasFilters || sort !== SEARCH_DEFAULTS.sort;
  // Read once per mount, so a season that turns while the page is open cannot name one grid after another's section.
  const [now] = useState(currentSeason);
  const section = sectionOfView({ ...view, term: searched }, now);

  const genreArgs = toQueryArgs(genre);
  const tagArgs = toQueryArgs(tag);
  const filters: BrowseFilters = {
    search: searched || undefined,
    genreIn: genreArgs.in,
    genreNotIn: genreArgs.notIn,
    tagIn: tagArgs.in,
    tagNotIn: tagArgs.notIn,
    year: year ? Number(year) : undefined,
    season: (season || undefined) as Season | undefined,
    format: format || undefined,
    status: status || undefined,
    source: source || undefined,
    countryOfOrigin: country || undefined,
    sort: effectiveSort,
  };

  // Level is keyed since filtering is server-side; genre and tag are encoded so pick order is one entry.
  const mediaKey = [
    "search",
    type,
    searched,
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

  const yearOptions = useMemo(() => {
    const max = new Date().getFullYear() + 1;
    return Array.from({ length: max - 1939 }, (_, i) => String(max - i));
  }, []);

  const scopeName = (sc: SearchView["scope"]) =>
    sc === "ANIME"
      ? t("search.anime")
      : sc === "MANGA"
        ? t("search.manga")
        : sc === "USERS"
          ? t("search.users")
          : sc === "CHARACTERS"
            ? t("search.characters")
            : sc === "STAFF"
              ? t("search.staffScope")
              : t("search.studios");
  const scopeRow = (sc: SearchView["scope"], after?: () => void) => {
    const Icon = SCOPE_ICON[sc];
    return (
      <button
        key={sc}
        type="button"
        aria-pressed={scope === sc}
        onClick={() => {
          changeScope(sc);
          after?.();
        }}
        className={columnRow(scope === sc)}
      >
        <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 truncate">{scopeName(sc)}</span>
      </button>
    );
  };
  const filterControls = (row: boolean) => (
    <>
              <MultiFilterSelect
                row={row}
                label={t("search.genreLabel")}
                value={genre}
                onChange={(v) => set({ genre: v })}
                placeholder={t("search.any")}
                options={genres}
              />
              {/* Searchable: the tag vocabulary is a scroll rather than a list. */}
              <MultiFilterSelect
                row={row}
                label={t("search.tagLabel")}
                value={tag}
                onChange={(v) => set({ tag: v })}
                placeholder={t("search.any")}
                options={tags}
                searchable
              />
              <FilterSelect
                row={row}
                label={t("search.yearLabel")}
                value={year}
                onChange={(v) => set({ year: v })}
                placeholder={t("search.any")}
                options={yearOptions.map((y) => ({ value: y, label: y }))}
              />
              {scope === "ANIME" && (
                <FilterSelect
                row={row}
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
                row={row}
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
                row={row}
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
                row={row}
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
                row={row}
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
                row={row}
                label={row ? t("search.sortRow") : t("list.sortLabel")}
                neutral="SEARCH_MATCH"
                // The sections have no sort of their own, so an untouched page shows the URL's and every pick browses.
                value={active ? filters.sort : sort}
                onChange={(v) => set({ sort: v })}
                options={SORTS.map((s) => ({ value: s, label: sortLabel(s, t) }))}
              />
    </>
  );
  const filterHeading = (
    <div className="flex items-center gap-2 px-4 pb-1">
      <p className="label-text text-ink-500">
        {t("search.filters")}
        {activeFilterCount > 0 && <span className="tabular-nums"> ({activeFilterCount})</span>}
      </p>
      <span className="flex-1" />
      {activeFilterCount > 0 && (
        <button type="button" onClick={clearFilters} className="text-xs font-medium text-accent-400 hover:underline">
          {t("list.clearFilter")}
        </button>
      )}
    </div>
  );
  const field = (
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
      className="rounded-full px-5"
    />
  );
  const resultsView = (
    <>
        {scope === "USERS" && <UserSearchResults term={term} />}
        {isPeopleScope(scope) && (
          <PersonSearchResults kind={scope === "CHARACTERS" ? "character" : "staff"} term={term} browse={browse} />
        )}
        {scope === "STUDIOS" && <StudioSearchResults term={term} />}
        {/* A term too short to search says so, or the sections would read as its answer. */}
        {isMediaScope(scope) && !active && term && <EmptyState title={t("search.prompt")} hint={t("search.promptHint")} />}
        {isMediaScope(scope) && !active && !term && <MediaSections type={type} now={now} />}
        {isMediaScope(scope) && active && section && (
          <ShowAllHeading
            icon={sectionIcon(section)}
            title={sectionTitle(section, t)}
            back={searchHref({ ...SEARCH_DEFAULTS, scope })}
          />
        )}
        {isMediaScope(scope) && active && (
          <MediaResults
            error={media.error}
            onRetry={() => queryClient.resetQueries({ queryKey: mediaKey, exact: true })}
            nextPageFailed={media.isFetchNextPageError}
            isFetching={media.isFetching && !media.isFetchingNextPage}
            term={searched}
            results={results}
            hiddenAdult={hiddenAdult}
            hiddenSuggestive={hiddenSuggestive}
            hasNextPage={media.hasNextPage === true}
            fetchingMore={media.isFetchingNextPage}
            onMore={() => media.fetchNextPage()}
          />
        )}
    </>
  );

  if (phone) {
    const CurrentIcon = SCOPE_ICON[scope];
    return (
      <div ref={resultsRef} className="h-full space-y-4 overflow-y-auto px-8 pb-12 pt-4 float-clear">
        <PageTitle title={t("search.title")} jp="検索" />
        {field}
        <div className="flex gap-2">
          <Popover
            label={t("search.scopes")}
            variant="sheet"
            className="min-w-0 flex-1"
            renderTrigger={(p) => (
              <PickerField trigger={p} label={t("search.scopePick", { scope: scopeName(scope) })} icon={CurrentIcon} value={scopeName(scope)} />
            )}
          >
            {(api) => <div className="space-y-0.5">{SCOPES.map((sc) => scopeRow(sc, api.close))}</div>}
          </Popover>
          {isMediaScope(scope) && (
            <Popover
              label={t("search.filters")}
              variant="sheet"
              renderTrigger={(p) => (
                <button
                  type="button"
                  {...p}
                  aria-label={t("search.filters")}
                  className="relative grid w-12 place-items-center rounded-panel bg-surface-900 surface-outline transition-surface hover:bg-surface-850"
                >
                  <SlidersHorizontal aria-hidden className="size-4 text-ink-300" />
                  {activeFilterCount > 0 && <Badge aria-hidden count={activeFilterCount} floating className="-right-1.5 -top-1.5" />}
                </button>
              )}
            >
              {() => (
                <div className="space-y-0.5">
                  {filterHeading}
                  {filterControls(true)}
                </div>
              )}
            </Popover>
          )}
        </div>
        {resultsView}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 space-y-1 overflow-y-auto pb-8 pl-5 pr-3 pt-6">
        <PageTitle title={t("search.title")} jp="検索" className="mb-3" />
        {SCOPES.map((sc) => scopeRow(sc))}
        {isMediaScope(scope) && (
          <>
            <div className="pt-5">{filterHeading}</div>
            <div className="space-y-0.5">{filterControls(true)}</div>
          </>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="pb-3 pl-2 pr-8 pt-6">{field}</div>
        <div ref={resultsRef} className="min-h-0 flex-1 overflow-y-auto pb-12 pl-2 pr-8 pt-2 float-clear">
          {resultsView}
        </div>
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
  browse,
}: {
  kind: "character" | "staff";
  term: string;
  /** The people list a section's "Show all" opened, or "" for the sections. */
  browse: string;
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
    // A name too short to search says so, or the sections would read as its answer.
    if (term) return <EmptyState title={t("search.entityPrompt")} hint={t("search.userPromptHint", { n: USER_SEARCH_MIN })} />;
    if (browse === "birthdays" || browse === "favourites") return <PeopleList kind={kind} list={browse} />;
    return <PeopleSections kind={kind} />;
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

/** A people section's "Show all": the whole list a page at a time, the most favourited first. */
function PeopleList({ kind, list }: { kind: "character" | "staff"; list: "birthdays" | "favourites" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Today's birthdays are another list tomorrow, so the day keys them as it keys the cached sections.
  const queryKey = ["search", kind, "browse", list, list === "birthdays" ? birthdayDay(new Date()) : ""];
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => browsePeoplePage(kind, list, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.pageInfo.hasNextPage ? all.length + 1 : undefined),
    enabled: isTauri,
    staleTime: Infinity,
  });
  const title =
    list === "birthdays"
      ? t("search.browseBirthdays")
      : kind === "character"
        ? t("search.browseFavouriteCharacters")
        : t("search.browseFavouriteStaff");
  const rows = query.data?.pages.flatMap((p) => p.rows) ?? [];
  return (
    <>
      <ShowAllHeading
        icon={list === "birthdays" ? Cake : Heart}
        title={title}
        back={searchHref({ ...SEARCH_DEFAULTS, scope: kind === "character" ? "CHARACTERS" : "STAFF" })}
      />
      <EntityResultList
        loading={query.isLoading}
        error={query.error}
        onRetry={() => queryClient.resetQueries({ queryKey, exact: true })}
        nextPageFailed={query.isFetchNextPageError}
        empty={rows.length === 0}
        term={title}
        hasNextPage={query.hasNextPage === true}
        fetchingMore={query.isFetchingNextPage}
        onMore={() => query.fetchNextPage()}
      >
        {rows.map((p) => (
          <EntityRow
            key={p.id}
            to={`/${kind}/${p.id}`}
            name={p.name?.full ?? "—"}
            src={p.image?.medium ?? undefined}
            meta={<Favourites count={p.favourites} />}
          />
        ))}
      </EntityResultList>
    </>
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
function EntityRow({ to, name, src, meta }: { to: string; name: string; src?: string; meta?: React.ReactNode }) {
  return (
    <div className={cn(cardClass("flat", { interactive: true }), "flex items-center gap-3 p-3")}>
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-3">
        <UserLockup name={name} src={src} size="md" titleAttr nameClassName="text-sm" className="min-w-0 flex-1" />
        {meta && <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-ink-500">{meta}</span>}
      </Link>
    </div>
  );
}

function MediaResults({
  error,
  onRetry,
  nextPageFailed,
  isFetching,
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
      {!isFetching && (
        <FilteredNotice adult={hiddenAdult} suggestive={hiddenSuggestive} className="mb-3" />
      )}
      {!isFetching && error == null && results.length === 0 && (
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
