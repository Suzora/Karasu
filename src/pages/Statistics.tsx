import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BarChart3, CalendarRange, ExternalLink, Sparkles, Star, Tags, Users } from "lucide-react";
import { SectionNav, SectionPicker, type SectionItem } from "@/components/stats/SectionNav";
import {
  userStatistics,
  type ActivityHistoryDay,
  type AnimeStats,
  type Distribution,
  type MangaStats,
  type StatEntry,
} from "@/api/queries";
import { fetchMediaList, isTauri } from "@/api/anilist";
import type { MediaType } from "@/api/types";
import { formatMinutes, remainingMinutes } from "@/lib/estimate";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { scoreScale } from "@/lib/scoreFormat";
import { useContentFilter } from "@/stores/contentFilter";
import {
  isBlocked,
  isBlockedGenre,
  type ContentFilterLevel,
} from "@/lib/contentFilter";
import { buttonClass } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/Skeleton";
import { Card, CardTitle } from "@/components/ui/card";
import { Segmented, type Segment } from "@/components/ui/segmented";
import { ColumnPage, ColumnPageSkeleton, PageTitle, columnRow } from "@/components/shell/PageColumn";
import { Sunburst, ToneLegend, type Slice } from "@/components/stats/Charts";
import { STATUS_ORDER, type MediaListStatus } from "@/api/types";
import { SectionHeader } from "@/components/ui/section-header";
import { Empty, type Category, type RankedCategory } from "@/components/stats/shared";
import { ScoreColumns, StatusBar } from "@/components/stats/panels";
import { GradientBars } from "@/components/stats/GradientBars";
import { AreaChart } from "@/components/stats/AreaChart";
import {
  CardPack,
  CompletionPace,
  FigureTiles,
  GenreDeltas,
  GenreDrift,
  GenreOutcomes,
  LengthCard,
  Rhythm,
  ScoreScatter,
  TimeShare,
} from "@/components/stats/insights";
import { Heatmap } from "@/components/stats/Heatmap";
import { ExternalAnchor } from "@/components/RichText";
import { ErrorState } from "@/components/EmptyState";
import { DayHeatmap } from "@/components/stats/DayHeatmap";
import {
  activityHeatmap,
  completionMonths,
  completionPace,
  dayHeatmapFromHistory,
  genreDeltas,
  genreDrift,
  genreOutcomes,
  rewatchTotals,
  scoreDelta,
  scorePairs,
  seasonalHistory,
  timeShare,
  weekdayTotals,
  type ActivityHeatmap,
  type DayHeatmap as DayHeatmapData,
  type ScoreDeltaSummary,
  type SeasonCount,
} from "@/lib/localStats";
import type { MediaListEntry } from "@/api/types";
import { RankedList, fmt, scoreText } from "@/components/stats/RankedList";
import LocalStatistics from "@/components/stats/LocalStatistics";
import { formatDecimal, formatLabel, formatSigned } from "@/lib/format";
import { isListStatus, statusColorVar } from "@/lib/statusColors";
import { inkOn } from "@/components/stats/tones";
import { useTheme } from "@/stores/theme";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { cn } from "@/lib/utils";
/** Five themed tabs shared by both media types; the ranked lists live inside two of them, not one each. */
const CATEGORIES: Category[] = ["overview", "ratings", "years", "genresTags", "people"];
const SECTION_ICON: Record<Category, typeof BarChart3> = { overview: BarChart3, ratings: Star, years: CalendarRange, genresTags: Tags, people: Users };

export default function Statistics() {
  const { t } = useTranslation();
  const viewer = useAuth((s) => s.viewer);
  const loading = useAuth((s) => s.loading);
  const mode = useAuth((s) => s.mode);
  const [params, setParams] = useSearchParams();

  if (loading) return <ColumnPageSkeleton />;

  // The account-free profile gets every panel counted from the list rather than a sign-in wall.
  if (!viewer && mode === "local") {
    const type: MediaType = params.get("type") === "MANGA" ? "MANGA" : "ANIME";
    return (
      <LocalStatistics
        type={type}
        onType={(v) =>
          setParams(
            (prev) => {
              const p = new URLSearchParams(prev);
              if (v === "ANIME") p.delete("type");
              else p.set("type", v);
              return p;
            },
            { replace: true },
          )
        }
      />
    );
  }

  if (!viewer) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-title">{t("stats.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            {t("stats.signInText")}
          </p>
          <Link to="/settings?pane=account" className={cn(buttonClass(), "mt-5")}>
            {t("dashboard.connect")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StatisticsContent
      userId={viewer.id}
      siteUrl={viewer.siteUrl}
    />
  );
}

function StatisticsContent({
  userId,
  siteUrl,
}: {
  userId: number;
  siteUrl: string;
}) {
  const { t } = useTranslation();
  // Type and tab live in the URL rather than state, so Back from anywhere keeps the selection.
  const [params, setParams] = useSearchParams();
  const type: MediaType = params.get("type") === "MANGA" ? "MANGA" : "ANIME";
  const rawTab = params.get("tab");
  const category: Category = CATEGORIES.includes(rawTab as Category)
    ? (rawTab as Category)
    : "overview";
  const setView = (patch: { type?: MediaType; category?: Category }) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (patch.type !== undefined) {
          if (patch.type === "ANIME") p.delete("type");
          else p.set("type", patch.type);
        }
        if (patch.category !== undefined) {
          if (patch.category === "overview") p.delete("tab");
          else p.set("tab", patch.category);
        }
        return p;
      },
      { replace: true },
    );

  const scoreFormat = useScoreFormat();
  const { data, isLoading, error, refetch } = useQuery({
    // The format is part of the key, because a format change rescales every number the normalizer produced.
    queryKey: ["userStats", userId, scoreFormat],
    queryFn: () => userStatistics(userId, scoreFormat),
    enabled: isTauri,
    // AniList only recomputes these when list entries change, and Karasu is what changes them.
    staleTime: 30 * 60 * 1000,
  });

  // Asked here rather than in the overview, so the list request runs beside the stats query instead of after it.
  const level = useContentFilter((s) => s.level);
  // Read `isError` beside `data`, or a failed list renders every derived panel's empty answer as settled fact.
  const { data: animeList, isError: animeListFailed } = useQuery({
    queryKey: ["mediaList", "ANIME", userId],
    queryFn: () => fetchMediaList(userId, "ANIME"),
    enabled: isTauri,
  });
  const remainingTotal = useMemo<number | null>(() => {
    // No list, no answer: zero is a claim a failed fetch cannot make.
    if (animeListFailed) return null;
    let sum = 0;
    for (const group of animeList?.lists ?? []) {
      if (group.isCustomList) continue;
      for (const e of group.entries) {
        if (e.status !== "CURRENT" && e.status !== "REPEATING") continue;
        if (isBlocked(e.media, level)) continue;
        const rem = remainingMinutes(e.media, e.progress);
        if (rem) sum += rem;
      }
    }
    return sum;
  }, [animeList, animeListFailed, level]);

  // Formats per status are counted from the list, keyed like the list screens so anime adds no request.
  const { data: typeList, isError: typeListFailed } = useQuery({
    queryKey: ["mediaList", type, userId],
    queryFn: () => fetchMediaList(userId, type),
    enabled: isTauri,
  });
  /** Whether anything drawn from the list itself can be trusted right now. */
  const listFailed = typeListFailed || (type === "ANIME" && animeListFailed);
  // The cached list, filtered once here so no local panel below can forget the content check.
  const localEntries = useMemo(
    () =>
      (typeList?.lists ?? [])
        .filter((g) => !g.isCustomList)
        .flatMap((g) => g.entries)
        .filter((e) => !isBlocked(e.media, level)),
    [typeList, level],
  );
  // My score against the crowd's, the one figure AniList's statistics cannot answer.
  const delta = useMemo(
    () => scoreDelta(localEntries, 5, scoreScale(scoreFormat).max),
    [localEntries, scoreFormat],
  );
  /** AniList's own per-day history, null when the account has none; the month grid below is the fallback. */
  const dayHeatmap = useMemo(
    () => dayHeatmapFromHistory(data?.stats?.activityHistory),
    [data],
  );
  // The month grid from the list's dates, only when the day grid is empty, so the two never draw at once.
  const heatmap = useMemo(
    () => (dayHeatmap ? null : activityHeatmap(localEntries)),
    [dayHeatmap, localEntries],
  );
  const seasons = useMemo(() => seasonalHistory(localEntries), [localEntries]);
  const statusColors = useTheme((s) => s.statusColors);

  // Counted by the raw format, labelled in the reader's language only once the counts are settled.
  const breakdown = useMemo<Slice[]>(() => {
    const byStatus = new Map<MediaListStatus, Map<string, number>>();
    for (const group of typeList?.lists ?? []) {
      if (group.isCustomList) continue;
      for (const e of group.entries) {
        if (isBlocked(e.media, level)) continue;
        const formats = byStatus.get(e.status) ?? new Map<string, number>();
        const key = e.media.format ?? "";
        formats.set(key, (formats.get(key) ?? 0) + 1);
        byStatus.set(e.status, formats);
      }
    }
    return STATUS_ORDER.filter((st) => byStatus.has(st)).map((st) => {
      const formats = [...byStatus.get(st)!].sort((a, b) => b[1] - a[1]);
      return {
        label: t(`status.${type}.${st}`),
        value: formats.reduce((sum, [, n]) => sum + n, 0),
        color: statusColorVar(st),
        ink: inkOn(statusColors[st]),
        children: formats.map(([key, value]) => ({ key, label: formatLabel(key, t) || "?", value })),
      };
    });
  }, [typeList, level, t, type, statusColors]);

  // One tab bar for both media types now, so switching type keeps the tab.
  const activeCategory = category;

  const typeOptions: Segment<MediaType>[] = [
    { value: "ANIME", label: t("nav.list") },
    { value: "MANGA", label: t("nav.manga") },
  ];

  const stats = data?.statistics;
  const phone = usePhoneShell();

  const sectionItems: SectionItem<Category>[] = CATEGORIES.map((c) => ({ value: c, label: t(`stats.${c}`), icon: SECTION_ICON[c] }));
  const typeSwitch = (
    <Segmented
      className="w-full [&>button]:flex-1"
      aria-label={t("stats.mediaTypeLabel")}
      segments={typeOptions}
      value={type}
      onChange={(v) => setView({ type: v })}
    />
  );
  const content = (
    <>
      {isLoading && (
        <div className="space-y-6">
          <CardGridSkeleton className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6" cardClassName="h-20" />
          <CardGridSkeleton count={4} className="grid gap-4 lg:grid-cols-2" cardClassName="h-56" />
        </div>
      )}
      {/* The stats can land while the list fails, and a list-counted panel left empty reads as an answer. */}
      {!isLoading && listFailed && (
        <p className="text-sm text-gold">{t("stats.listUnavailable")}</p>
      )}
      {error && <ErrorState error={error} onRetry={() => refetch()} inline={!!stats} />}
      {stats &&
        (type === "ANIME" ? (
          <AnimeView
            stats={stats.anime}
            category={activeCategory}
            breakdown={breakdown}
            delta={delta}
            heatmap={heatmap}
            dayHeatmap={dayHeatmap}
            seasons={seasons}
            entries={localEntries}
            history={data?.stats?.activityHistory}
            remainingTotal={remainingTotal}
          />
        ) : (
          <MangaView
            stats={stats.manga}
            category={activeCategory}
            breakdown={breakdown}
            delta={delta}
            heatmap={heatmap}
            dayHeatmap={dayHeatmap}
            seasons={seasons}
            entries={localEntries}
            history={data?.stats?.activityHistory}
          />
        ))}
    </>
  );

  const linkRow = cn(columnRow(), "hover:no-underline");
  const phoneActions = (
    <>
      <ExternalAnchor href={siteUrl} aria-label={t("ctx.openAniList")} title={t("ctx.openAniList")} className={cn(buttonClass("ghost", "iconControl"), "hover:no-underline")}>
        <ExternalLink className="size-4" aria-hidden="true" />
      </ExternalAnchor>
      <Link to="/wrapped" aria-label={t("wrapped.title")} title={t("wrapped.title")} className={buttonClass("ghost", "iconControl")}>
        <Sparkles className="size-4" aria-hidden="true" />
      </Link>
    </>
  );

  if (phone) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-4">
        <PageTitle title={t("stats.title")} jp="統計" action={phoneActions} />
        {typeSwitch}
        <SectionPicker label={t("stats.sectionsLabel")} items={sectionItems} value={activeCategory} onChange={(v) => setView({ category: v })} />
        {content}
      </div>
    );
  }

  return (
    <ColumnPage
      contentClassName="space-y-6"
      column={
      <>
        <PageTitle title={t("stats.title")} jp="統計" className="mb-3" />
        <div className="mb-3">{typeSwitch}</div>
        <SectionNav label={t("stats.sectionsLabel")} items={sectionItems} value={activeCategory} onChange={(v) => setView({ category: v })} />
        <div className="mx-3 my-3 h-px bg-surface-850" />
        <Link to="/wrapped" className={linkRow}>
          <Sparkles aria-hidden className="size-4 shrink-0 opacity-70" />
          {t("wrapped.title")}
        </Link>
        {/* Keep `ExternalAnchor`; a raw target="_blank" anchor goes nowhere because the WebView has no tabs. */}
        <ExternalAnchor href={siteUrl} className={linkRow}>
          <ExternalLink aria-hidden className="size-4 shrink-0 opacity-70" />
          <span className="min-w-0 flex-1 truncate">{t("ctx.openAniList")}</span>
        </ExternalAnchor>
      </>
      }
    >
      {content}
    </ColumnPage>
  );
}

function AnimeView({
  stats,
  category,
  breakdown,
  delta,
  heatmap,
  dayHeatmap,
  seasons,
  entries,
  history,
  remainingTotal,
}: {
  stats: AnimeStats;
  category: Category;
  breakdown: Slice[];
  delta: ScoreDeltaSummary | null;
  heatmap: ActivityHeatmap | null;
  dayHeatmap: DayHeatmapData | null;
  seasons: SeasonCount[];
  entries: MediaListEntry[];
  history: ActivityHistoryDay[] | null | undefined;
  remainingTotal: number | null;
}) {
  const { t, i18n } = useTranslation();
  if (stats.count === 0) return <Empty />;

  if (category === "ratings") {
    return <RatingsView stats={stats} type="ANIME" delta={delta} entries={entries} />;
  }

  if (category === "years") {
    return (
      <YearsView
        stats={stats}
        heatmap={heatmap}
        dayHeatmap={dayHeatmap}
        seasons={seasons}
        entries={entries}
        history={history}
      />
    );
  }

  if (category === "genresTags") {
    return <GenresTagsView stats={stats} type="ANIME" entries={entries} />;
  }

  if (category === "people") {
    return <PeopleView stats={stats} type="ANIME" />;
  }

  const days = stats.minutesWatched / 60 / 24;
  const rewatch = rewatchTotals(entries);
  return (
    <div className="space-y-4">
      <FigureTiles
        tiles={[
          { label: t("stats.entries"), value: fmt(stats.count, i18n.language) },
          { label: t("stats.episodes"), value: fmt(stats.episodesWatched, i18n.language) },
          { label: t("stats.daysWatched"), value: formatDecimal(days, i18n.language, 1) },
          { label: t("stats.meanScore"), value: scoreText(stats.meanScore, i18n.language) },
          { label: t("stats.spread"), value: `± ${formatDecimal(stats.standardDeviation, i18n.language, 1)}` },
          {
            label: t("stats.perEntryEpisodes"),
            value: formatDecimal(stats.episodesWatched / Math.max(1, stats.count), i18n.language, 1),
          },
          {
            label: t("stats.rewatches"),
            value: fmt(rewatch.repeats, i18n.language),
            note: rewatch.most ? t("stats.rewatchNote", { titles: rewatch.titles, title: rewatch.most.title, times: rewatch.most.times }) : undefined,
          },
          ...(remainingTotal ? [{ label: t("stats.timeToFinish"), value: formatMinutes(remainingTotal, t) }] : []),
        ]}
      />
      <OverviewCharts stats={stats} type="ANIME" breakdown={breakdown} entries={entries} />
    </div>
  );
}

function MangaView({
  stats,
  category,
  breakdown,
  delta,
  heatmap,
  dayHeatmap,
  seasons,
  entries,
  history,
}: {
  stats: MangaStats;
  category: Category;
  breakdown: Slice[];
  delta: ScoreDeltaSummary | null;
  heatmap: ActivityHeatmap | null;
  dayHeatmap: DayHeatmapData | null;
  seasons: SeasonCount[];
  entries: MediaListEntry[];
  history: ActivityHistoryDay[] | null | undefined;
}) {
  const { t, i18n } = useTranslation();
  if (stats.count === 0) return <Empty />;

  if (category === "ratings") {
    return <RatingsView stats={stats} type="MANGA" delta={delta} entries={entries} />;
  }

  if (category === "years") {
    return (
      <YearsView
        stats={stats}
        heatmap={heatmap}
        dayHeatmap={dayHeatmap}
        seasons={seasons}
        entries={entries}
        history={history}
      />
    );
  }

  if (category === "genresTags") {
    return <GenresTagsView stats={stats} type="MANGA" entries={entries} />;
  }

  if (category === "people") {
    return <PeopleView stats={stats} type="MANGA" />;
  }

  const reread = rewatchTotals(entries);
  return (
    <div className="space-y-4">
      <FigureTiles
        tiles={[
          { label: t("stats.entries"), value: fmt(stats.count, i18n.language) },
          { label: t("stats.chapters"), value: fmt(stats.chaptersRead, i18n.language) },
          { label: t("stats.volumes"), value: fmt(stats.volumesRead, i18n.language) },
          { label: t("stats.meanScore"), value: scoreText(stats.meanScore, i18n.language) },
          { label: t("stats.spread"), value: `± ${formatDecimal(stats.standardDeviation, i18n.language, 1)}` },
          {
            label: t("stats.perEntryChapters"),
            value: formatDecimal(stats.chaptersRead / Math.max(1, stats.count), i18n.language, 0),
          },
          {
            label: t("stats.rereads"),
            value: fmt(reread.repeats, i18n.language),
            note: reread.most ? t("stats.rewatchNote", { titles: reread.titles, title: reread.most.title, times: reread.most.times }) : undefined,
          },
        ]}
      />
      <OverviewCharts stats={stats} type="MANGA" breakdown={breakdown} entries={entries} />
    </div>
  );
}

/** Picks the ranked array for a category, minus blocked genre and tag names (the totals are AniList's). */
function rowsFor(
  stats: AnimeStats | MangaStats,
  category: RankedCategory,
  level: ContentFilterLevel,
): StatEntry[] {
  switch (category) {
    case "genres":
      return stats.genres.filter((e) => !isBlockedGenre(e.genre ?? "", level));
    case "tags":
      return stats.tags.filter(
        (e) => !isBlockedGenre(e.tag?.name ?? "", level),
      );
    case "staff":
      return stats.staff;
    case "voiceActors":
      return "voiceActors" in stats ? stats.voiceActors : [];
    case "studios":
      return "studios" in stats ? stats.studios : [];
  }
}

/** The Genres & Tags tab: where the user parts from the crowd, what they finish, and the two ranked lists. */
function GenresTagsView({
  stats,
  type,
  entries,
}: {
  stats: AnimeStats | MangaStats;
  type: MediaType;
  entries: MediaListEntry[];
}) {
  const { t, i18n } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const scoreMax = scoreScale(useScoreFormat()).max;
  const safeGenres = rowsFor(stats, "genres", level);
  const safeTags = rowsFor(stats, "tags", level);
  // The list's own genres pass the same filter as AniList's ranked names, so a blocked genre never gets a row.
  const shown = <T extends { genre: string }>(rows: T[]) => rows.filter((r) => !isBlockedGenre(r.genre, level));
  const deltas = shown(genreDeltas(entries, scoreMax));
  const outcomes = shown(genreOutcomes(entries));

  return (
    <div className="space-y-4">
      <CardPack>
        <GenreDeltas rows={deltas} locale={i18n.language} />
        <GenreOutcomes rows={outcomes} type={type} locale={i18n.language} />
      </CardPack>
      <section className="space-y-3">
        <SectionHeader icon={BarChart3} title={t("stats.genres")} />
        <RankedList entries={safeGenres} category="genres" type={type} />
      </section>
      {safeTags.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={BarChart3} title={t("stats.tags")} />
          <RankedList entries={safeTags} category="tags" type={type} />
        </section>
      )}
    </div>
  );
}

/** The People & Studios tab: three portrait lists on anime, staff alone on manga. */
function PeopleView({
  stats,
  type,
}: {
  stats: AnimeStats | MangaStats;
  type: MediaType;
}) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);

  const sections: { key: RankedCategory; title: string }[] = [
    ...("voiceActors" in stats ? [{ key: "voiceActors" as const, title: t("stats.voiceActors") }] : []),
    { key: "staff", title: t("stats.staff") },
    ...("studios" in stats ? [{ key: "studios" as const, title: t("stats.studios") }] : []),
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ key, title }) => {
        const rows = rowsFor(stats, key, level);
        return rows.length > 0 ? (
          <section key={key} className="space-y-3">
            <SectionHeader icon={BarChart3} title={title} />
            <RankedList entries={rows} category={key} type={type} />
          </section>
        ) : null;
      })}
    </div>
  );
}

/** The Ratings tab: the distribution, every scored title against the community, and the means per format and status. */
function RatingsView({
  stats,
  type,
  delta,
  entries,
}: {
  stats: AnimeStats | MangaStats;
  type: MediaType;
  delta: ScoreDeltaSummary | null;
  entries: MediaListEntry[];
}) {
  const { t, i18n } = useTranslation();
  const scoreMax = scoreScale(useScoreFormat()).max;
  const scores = [...stats.scores].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const meanRows = (list: Distribution[], label: (d: Distribution) => string) =>
    list
      .filter((d) => (d.meanScore ?? 0) > 0)
      .sort((a, b) => (b.meanScore ?? 0) - (a.meanScore ?? 0))
      .map((d) => ({
        label: label(d),
        value: d.meanScore ?? 0,
        text: formatDecimal(d.meanScore ?? 0, i18n.language, 1),
        sub: `${fmt(d.count, i18n.language)}×`,
      }));

  return (
    <div className="space-y-4">
      {delta && (
        <FigureTiles
          tiles={[
            { label: t("stats.yourMean"), value: formatDecimal(delta.meanMine, i18n.language, 2) },
            { label: t("stats.communityMean"), value: formatDecimal(delta.meanCommunity, i18n.language, 2) },
            { label: t("stats.meanDelta"), value: formatSigned(delta.meanDelta, i18n.language, 2) },
            { label: t("stats.scoredTitles"), value: fmt(delta.count, i18n.language) },
          ]}
        />
      )}
      <CardPack>
        <ScoreColumns
          title={t("stats.scoreDist")}
          hint={t("stats.scoreDistHint")}
          data={scores.map((d: Distribution) => ({ score: d.score ?? 0, count: d.count }))}
          max={scoreMax}
          locale={i18n.language}
        />
        <ScoreScatter pairs={scorePairs(entries, scoreMax)} max={scoreMax} locale={i18n.language} />
        {/* Pinned to the full scale, or two close means read as a landslide. */}
        <GradientBars
          title={t("stats.meanByFormat")}
          hint={t("stats.meanByFormatHint")}
          domain={scoreMax}
          rows={meanRows(stats.formats, (d) => formatLabel(d.format, t) || "?")}
        />
        <GradientBars
          title={t("stats.meanByStatus")}
          hint={t("stats.meanByStatusHint")}
          domain={scoreMax}
          rows={meanRows(stats.statuses, (d) => t(`status.${type}.${d.status}`, { defaultValue: d.status ?? "?" }))}
        />
      </CardPack>
    </div>
  );
}

/** The Years tab: taste over time, one of the two activity grids, then the year series, rhythm and pace packed. */
function YearsView({
  stats,
  heatmap,
  dayHeatmap,
  seasons,
  entries,
  history,
}: {
  stats: AnimeStats | MangaStats;
  heatmap: ActivityHeatmap | null;
  dayHeatmap: DayHeatmapData | null;
  seasons: SeasonCount[];
  entries: MediaListEntry[];
  history: ActivityHistoryDay[] | null | undefined;
}) {
  const { t, i18n } = useTranslation();
  const scoreMax = scoreScale(useScoreFormat()).max;

  const released = [...stats.releaseYears]
    .filter((d) => d.releaseYear)
    .sort((a, b) => (a.releaseYear ?? 0) - (b.releaseYear ?? 0))
    .slice(-20);
  const started = [...stats.startYears]
    .filter((d) => d.startYear)
    .sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))
    .slice(-16);
  const startMeans = started
    .filter((d) => (d.meanScore ?? 0) > 0)
    .slice(-12)
    .map((d) => ({
      label: String(d.startYear ?? 0),
      value: d.meanScore ?? 0,
      text: formatDecimal(d.meanScore ?? 0, i18n.language, 1),
      sub: `${fmt(d.count, i18n.language)}×`,
    }));
  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) =>
        new Date(2000, m, 1).toLocaleDateString(i18n.language, { month: "narrow" }),
      ),
    [i18n.language],
  );
  // Monday first, matching `dayHeatmapFromHistory`'s rotation, because the seed date is a Monday.
  const dayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, d) =>
        new Date(Date.UTC(2024, 0, 1 + d)).toLocaleDateString(i18n.language, {
          weekday: "short",
          timeZone: "UTC",
        }),
      ),
    [i18n.language],
  );
  // The cell dates are UTC midnights, so read them back as UTC or the label shifts for anyone off UTC.
  const formatDay = useCallback(
    (daySeconds: number) =>
      new Date(daySeconds * 1000).toLocaleDateString(i18n.language, {
        dateStyle: "medium",
        timeZone: "UTC",
      }),
    [i18n.language],
  );

  const yearCard = (title: string, hint: string, data: { label: string; value: number }[]) =>
    data.length > 1 ? (
      <Card className="flex flex-col">
        <CardTitle>{title}</CardTitle>
        <p className="mt-1 text-xs text-ink-600">{hint}</p>
        <div className="mt-3">
          <AreaChart data={data} height={130} />
        </div>
      </Card>
    ) : null;

  return (
    <div className="space-y-4">
      <GenreDrift data={genreDrift(entries)} />
      {/* Block children, never grid items: a grid track grows to the day grid's full width and scrolls the phone sideways. */}
      {dayHeatmap && (
        <DayHeatmap
          title={t("stats.activityDays")}
          hint={t("stats.activityDaysHint")}
          data={dayHeatmap}
          monthLabels={monthLabels}
          dayLabels={dayLabels}
          formatDay={formatDay}
          rangeLabel={t("stats.activityRange", {
            from: formatDay(dayHeatmap.from),
            to: formatDay(dayHeatmap.to),
            total: dayHeatmap.total,
          })}
          legendLess={t("stats.legendLess")}
          legendMore={t("stats.legendMore")}
        />
      )}
      {heatmap && (
        <Heatmap
          title={t("stats.activityHeatmap")}
          hint={t("stats.activityHeatmapHint")}
          years={heatmap.years}
          max={heatmap.max}
          monthLabels={monthLabels}
        />
      )}
      <CardPack>
        {yearCard(t("stats.releaseYears"), t("stats.releaseYearsHint"), released.map((d) => ({ label: String(d.releaseYear ?? 0), value: d.count })))}
        {yearCard(t("stats.startYears"), t("stats.startYearsHint"), started.map((d) => ({ label: String(d.startYear ?? 0), value: d.count })))}
        <Rhythm weekdays={weekdayTotals(history)} months={completionMonths(entries)} locale={i18n.language} />
        <CompletionPace rows={completionPace(entries)} locale={i18n.language} formatLabel={(f) => formatLabel(f, t) || "?"} />
        {startMeans.length > 1 && (
          <GradientBars
            title={t("stats.meanByStartYear")}
            hint={t("stats.meanByStartYearHint")}
            domain={scoreMax}
            rows={startMeans}
          />
        )}
        {seasons.length > 0 && (
          <GradientBars
            title={t("stats.seasonHabits")}
            hint={t("stats.seasonHabitsHint")}
            rows={seasons.map((s) => ({
              label: t(`season.${s.season}`, { defaultValue: s.season }),
              value: s.count,
              text: fmt(s.count, i18n.language),
              sub: s.meanScore > 0 ? `★ ${formatDecimal(s.meanScore, i18n.language, 1)}` : undefined,
            }))}
          />
        )}
      </CardPack>
    </div>
  );
}

function OverviewCharts({
  stats,
  type,
  breakdown,
  entries,
}: {
  stats: AnimeStats | MangaStats;
  type: MediaType;
  breakdown: Slice[];
  entries: MediaListEntry[];
}) {
  const { t, i18n } = useTranslation();
  const countries = [...stats.countries].filter((d) => d.country);
  // The sunburst's outer ring needs its own key on its own card; summed by raw format, so a label never splits one.
  const formatsInBreakdown = useMemo(() => {
    const totals = new Map<string, { label: string; value: number }>();
    for (const group of breakdown) {
      for (const kid of group.children ?? []) {
        const key = kid.key ?? kid.label;
        totals.set(key, { label: kid.label, value: (totals.get(key)?.value ?? 0) + kid.value });
      }
    }
    return [...totals].sort((a, b) => b[1].value - a[1].value).map(([key, f]) => ({ key, ...f }));
  }, [breakdown]);
  // The ring's outer key is the format count, so there is no separate formats card; the bar stands in without a list.
  return (
    <CardPack>
      {breakdown.length === 0 && (
        <StatusBar
          locale={i18n.language}
          title={t("stats.statuses")}
          data={stats.statuses.map((d) => ({
            label: t(`status.${type}.${d.status}`, { defaultValue: d.status ?? "?" }),
            count: d.count,
            color: isListStatus(d.status) ? statusColorVar(d.status) : undefined,
          }))}
        />
      )}
      {breakdown.length > 0 && (
        <Card className="flex flex-col">
          <CardTitle>{t("stats.breakdown")}</CardTitle>
          <p className="mt-1 text-xs text-ink-600">{t("stats.breakdownHint")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <div className="w-36 shrink-0 sm:w-44">
              <Sunburst data={breakdown} />
            </div>
            <div className="min-w-32 flex-1 space-y-2">
              <ToneLegend locale={i18n.language} items={breakdown.map((b) => ({ label: b.label, value: b.value, color: b.color }))} />
              {formatsInBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="label-text text-ink-500">{t("stats.outerRing")}</span>
                  {formatsInBreakdown.map((f) => (
                    <span key={f.key} className="text-2xs text-ink-500">
                      {f.label}
                      <span className="ml-1 tabular-nums text-ink-300">{f.value.toLocaleString(i18n.language)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      <LengthCard lengths={stats.lengths} type={type} locale={i18n.language} />
      {countries.length > 1 && (
        <StatusBar
          locale={i18n.language}
          title={t("stats.countries")}
          data={countries.map((d) => ({
            label: t(`country.${d.country}`, { defaultValue: d.country ?? "?" }),
            count: d.count,
          }))}
        />
      )}
      {type === "ANIME" && <TimeShare data={timeShare(entries)} locale={i18n.language} />}
    </CardPack>
  );
}

// --- Helpers ---------------------------------------------------------------
