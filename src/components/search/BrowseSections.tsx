import { useMemo, useRef } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Cake,
  CalendarClock,
  CalendarDays,
  Flame,
  GalleryVerticalEnd,
  Heart,
  LayoutGrid,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { isTauri, TTL } from "@/api/anilist";
import { browseSections, type BrowseMedia } from "@/api/queries";
import { browsePeople, type BrowsePerson } from "@/api/social";
import { displayTitle, type MediaType } from "@/api/types";
import MediaCard from "@/components/media/MediaCard";
import { TitleLockup } from "@/components/media/TitleLockup";
import { FilteredNotice } from "@/components/FilteredNotice";
import { ErrorState } from "@/components/EmptyState";
import { Busy, CoverGridSkeleton, HeaderSkeleton, Shimmer } from "@/components/Skeleton";
import { Chip } from "@/components/ui/chip";
import { cardClass } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/user-lockup";
import { useColumnCount } from "@/hooks/useColumnCount";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import {
  MEDIA_SECTIONS,
  TOP_ROWS,
  birthdayDay,
  cutSection,
  rowRequestSize,
  sectionPeriod,
  showAllView,
  type MediaSectionKey,
} from "@/lib/browseSections";
import { adultQueryArg, shouldBlur, type BlockReason } from "@/lib/contentFilter";
import { compactCount, formatLabel } from "@/lib/format";
import { SEARCH_DEFAULTS, writeSearchView, type SearchView } from "@/lib/searchView";
import type { Period } from "@/lib/seasonView";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";
import { useTheme } from "@/stores/theme";

const ICONS: Record<MediaSectionKey, LucideIcon> = {
  trending: TrendingUp,
  season: CalendarDays,
  nextSeason: CalendarClock,
  popular: Flame,
  manhwa: GalleryVerticalEnd,
  top: Trophy,
};

/** Literal switch, so `i18nKeys.test.ts` sees every key. */
export function sectionTitle(key: MediaSectionKey, t: (k: string) => string): string {
  switch (key) {
    case "trending":
      return t("search.browseTrending");
    case "season":
      return t("search.browseSeason");
    case "nextSeason":
      return t("search.browseNextSeason");
    case "popular":
      return t("search.browsePopular");
    case "manhwa":
      return t("search.browseManhwa");
    case "top":
      return t("search.browseTop");
  }
}

export const sectionIcon = (key: MediaSectionKey): LucideIcon => ICONS[key];

/** A search view as the link that opens it, so "Show all" and the way back are history entries Back can return through. */
export const searchHref = (view: SearchView): string => {
  const query = writeSearchView(new URLSearchParams(), view).toString();
  return query ? `/search?${query}` : "/search";
};

/** The section header's link, named for its section, since every section carries the same link text. */
function ShowAll({ to, title }: { to: string; title: string }) {
  const { t } = useTranslation();
  return (
    <Link to={to} className="relative coarse:hit-area text-xs text-accent-400 hover:underline">
      {t("dashboard.showAll")}
      <span className="sr-only"> ({title})</span>
    </Link>
  );
}

/** The heading over a section's "Show all", with the way back to every section. */
export function ShowAllHeading({ icon, title, back }: { icon: LucideIcon; title: string; back: string }) {
  const { t } = useTranslation();
  return (
    <SectionHeader
      icon={icon}
      title={title}
      className="mb-4"
      action={
        <Link to={back} className="relative coarse:hit-area flex items-center gap-1.5 text-xs text-accent-400 hover:underline">
          <LayoutGrid className="size-3.5" />
          {t("search.browseBack")}
        </Link>
      }
    />
  );
}

function Loading({ rows }: { rows: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }, (_, i) => (
        <section key={i} className="space-y-4">
          <HeaderSkeleton index={i} />
          <CoverGridSkeleton count={rows} />
        </section>
      ))}
    </div>
  );
}

/** The people sections while they load, as the portrait cards they become, so nothing jumps when they arrive. */
function PeopleLoading() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }, (_, i) => (
        <section key={i} className="space-y-4">
          <HeaderSkeleton index={i} />
          <PortraitsSkeleton index={i} />
        </section>
      ))}
    </div>
  );
}

/** One row of portrait-card shapes, as many as the row draws. */
function PortraitsSkeleton({ index }: { index: number }) {
  const grid = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(grid);
  return (
    <Busy>
      <div ref={grid} className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className={cn(cardClass("flat"), "flex flex-col items-center gap-2 px-2 py-3")}>
            <Shimmer index={index + i} className="size-20 rounded-full" />
            <Shimmer index={index + i} className="my-0.5 h-3 w-3/4" />
            <Shimmer index={index + i} className="h-3.5 w-10" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Anime or manga with nothing typed: AniList's own browse sections, one cached request for the whole page. */
export function MediaSections({ type, now }: { type: MediaType; now: Period }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const level = useContentFilter((s) => s.level);
  const filterReady = useContentFilter((s) => s.ready);
  const coverCols = useTheme((s) => s.coverCols);
  const perPage = rowRequestSize(coverCols);
  const queryKey = ["browse", type, now.season, now.year, perPage, level];
  const q = useQuery({
    queryKey,
    queryFn: () => browseSections(type, now, perPage, adultQueryArg(level)),
    enabled: isTauri && filterReady,
    staleTime: TTL.hour * 1000,
  });

  // A title in two sections is one hidden title, so the notice counts ids rather than rows.
  const { sections, hiddenAdult, hiddenSuggestive } = useMemo(() => {
    const hidden = new Map<number, BlockReason>();
    const sections = MEDIA_SECTIONS[type].map((key) => {
      const cut = cutSection(q.data?.[key]?.media ?? [], key === "top" ? TOP_ROWS : coverCols, level);
      for (const [id, reason] of cut.hidden) hidden.set(id, reason);
      return { key, media: cut.shown };
    });
    const reasons = [...hidden.values()];
    return {
      sections,
      hiddenAdult: reasons.filter((r) => r === "adult").length,
      hiddenSuggestive: reasons.filter((r) => r === "suggestive").length,
    };
  }, [q.data, type, level, coverCols]);

  if (q.error != null && !q.data) {
    return <ErrorState error={q.error} onRetry={() => qc.resetQueries({ queryKey, exact: true })} />;
  }
  if (!q.data) return <Loading rows={coverCols} />;

  return (
    <div className="space-y-8">
      <FilteredNotice adult={hiddenAdult} suggestive={hiddenSuggestive} />
      {sections.map(({ key, media }) => {
        if (media.length === 0) return null;
        const title = sectionTitle(key, t);
        const period = sectionPeriod(key, now);
        return (
          <section key={key}>
            <SectionHeader
              icon={ICONS[key]}
              title={title}
              meta={period ? `${t(`season.${period.season}`)} ${period.year}` : undefined}
              action={<ShowAll to={searchHref(showAllView(type, key, now))} title={title} />}
            />
            {key === "top" ? (
              <ol className="mt-4 space-y-1.5">
                {media.map(({ media: m, rank }) => (
                  <li key={m.id}>
                    <RankedRow media={m} rank={rank} />
                  </li>
                ))}
              </ol>
            ) : (
              <CoverRow media={media.map((x) => x.media)} />
            )}
          </section>
        );
      })}
    </div>
  );
}

/** One row of the shared cover grid, cut to the columns it draws, as the Overview's strips are. */
function CoverRow({ media }: { media: BrowseMedia[] }) {
  const grid = useRef<HTMLDivElement>(null);
  const coverCols = useTheme((s) => s.coverCols);
  const measured = useColumnCount(grid, coverCols);
  const perRow = measured > 1 ? measured : coverCols;
  return (
    <div ref={grid} className="media-grid mt-4 gap-x-4 gap-y-5">
      {media.slice(0, perRow).map((m) => (
        <MediaCard key={m.id} media={m} />
      ))}
    </div>
  );
}

/** A ranked title: its place, its cover, its genres, AniList's score with how many list it, and what it is. */
function RankedRow({ media: m, rank }: { media: BrowseMedia; rank: number }) {
  const { t, i18n } = useTranslation();
  const phone = usePhoneShell();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const title = displayTitle(m.title);
  const count =
    m.type === "MANGA"
      ? m.chapters
        ? t(m.chapters === 1 ? "search.rankChaptersOne" : "search.rankChapters", { count: m.chapters })
        : null
      : m.episodes
        ? t(m.episodes === 1 ? "search.rankEpisodesOne" : "search.rankEpisodes", { count: m.episodes })
        : null;
  // A manga has no season, so its line falls back to the year it started.
  const year = m.seasonYear ?? m.startDate?.year ?? null;
  const when = m.season && m.seasonYear ? `${t(`season.${m.season}`)} ${m.seasonYear}` : year ? String(year) : null;
  return (
    <Link
      to={`/media/${m.id}`}
      data-media-id={m.id}
      data-media-type={m.type}
      data-media-title={title}
      className={cn(cardClass("flat", { interactive: true }), "flex items-center gap-3 px-3 py-2")}
    >
      <span className="w-8 shrink-0 text-right text-base font-semibold tabular-nums text-ink-500">#{rank}</span>
      <span className="h-14 w-10 shrink-0 overflow-hidden rounded-cover bg-surface-800">
        {m.coverImage.large && (
          <img
            src={m.coverImage.large}
            alt=""
            loading="lazy"
            className={cn("size-full object-cover", shouldBlur(m, level, blurAdult) && "veil-thumb")}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <TitleLockup title={m.title} />
        {m.genres && m.genres.length > 0 && (
          // One line that wraps out of sight, so a narrow row drops whole genres rather than cutting one in half.
          <div className="mt-1 flex h-4.5 flex-wrap gap-1 overflow-hidden">
            {m.genres.slice(0, 4).map((g) => (
              <Chip key={g} size="xs" tone="muted">
                {g}
              </Chip>
            ))}
          </div>
        )}
      </div>
      {/* Keep `min-w-0`, not `shrink-0`: a long German count must not hand the page a sideways scroll. */}
      <div className="min-w-0 text-right">
        {m.averageScore != null && (
          <p title={t("media.communityAverage")} className="text-sm font-semibold tabular-nums text-ink-100">
            <span className="sr-only">{t("media.communityAverage")} </span>
            {m.averageScore}%
          </p>
        )}
        {m.popularity != null && (
          <p className="whitespace-nowrap text-2xs tabular-nums text-ink-600">
            {t("search.rankUsers", { n: m.popularity.toLocaleString(i18n.language) })}
          </p>
        )}
      </div>
      {!phone && (
        <div className="w-32 min-w-0 text-right">
          <p className="truncate text-xs text-ink-300">{[m.format ? formatLabel(m.format, t) : null, count].filter(Boolean).join(" · ")}</p>
          {when && <p className="truncate text-2xs text-ink-600">{when}</p>}
        </div>
      )}
    </Link>
  );
}

/** Characters or staff with nothing typed: today's birthdays and the most favourited, one cached request for both scopes. */
export function PeopleSections({ kind }: { kind: "character" | "staff" }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const day = birthdayDay(new Date());
  const queryKey = ["browsePeople", day];
  const q = useQuery({
    queryKey,
    queryFn: () => browsePeople(day),
    enabled: isTauri,
    staleTime: TTL.hour * 1000,
  });
  if (q.error != null && !q.data) {
    return <ErrorState error={q.error} onRetry={() => qc.resetQueries({ queryKey, exact: true })} />;
  }
  if (!q.data) return <PeopleLoading />;

  const scope = kind === "character" ? "CHARACTERS" : "STAFF";
  const pick = (page: { characters?: BrowsePerson[] | null; staff?: BrowsePerson[] | null } | null) =>
    (kind === "character" ? page?.characters : page?.staff) ?? [];
  const birthdays = pick(kind === "character" ? q.data.characterBirthdays : q.data.staffBirthdays);
  const favourites = pick(kind === "character" ? q.data.characterFavourites : q.data.staffFavourites);
  const favouritesTitle = kind === "character" ? t("search.browseFavouriteCharacters") : t("search.browseFavouriteStaff");

  return (
    <div className="space-y-8">
      {birthdays.length > 0 && (
        <PeopleRow
          icon={Cake}
          title={t("search.browseBirthdays")}
          href={searchHref({ ...SEARCH_DEFAULTS, scope, browse: "birthdays" })}
          people={birthdays}
          kind={kind}
          birthdays
        />
      )}
      <PeopleRow
        icon={Heart}
        title={favouritesTitle}
        href={searchHref({ ...SEARCH_DEFAULTS, scope, browse: "favourites" })}
        people={favourites}
        kind={kind}
      />
    </div>
  );
}

/** A heart and a favourites count, compact past ten thousand. */
export function Favourites({ count }: { count: number | null }) {
  const { t, i18n } = useTranslation();
  if (count == null) return null;
  return (
    <>
      <Heart className="size-3.5" fill="currentColor" />
      {compactCount(count, i18n.language)}
      <span className="sr-only"> {t("detail.favorites")}</span>
    </>
  );
}

function PeopleRow({
  icon,
  title,
  href,
  people,
  kind,
  birthdays = false,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  people: BrowsePerson[];
  kind: "character" | "staff";
  /** Each card says "today" rather than its favourites count. */
  birthdays?: boolean;
}) {
  const { t } = useTranslation();
  const grid = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(grid, people.length);
  return (
    <section>
      <SectionHeader icon={icon} title={title} action={<ShowAll to={href} title={title} />} />
      <div ref={grid} className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
        {people.slice(0, columns).map((p) => (
          <Link
            key={p.id}
            to={`/${kind}/${p.id}`}
            className={cn(cardClass("flat", { interactive: true }), "flex flex-col items-center gap-2 px-2 py-3 text-center")}
          >
            <Avatar src={p.image?.medium} name={p.name?.full ?? "?"} size="2xl" />
            <span className="line-clamp-2 w-full text-xs font-medium text-ink-100">{p.name?.full ?? "—"}</span>
            <span className="flex items-center gap-1 text-2xs tabular-nums text-ink-500">
              {birthdays ? (
                <>
                  <Cake className="size-3.5 text-accent-400" />
                  {t("search.browseToday")}
                </>
              ) : (
                <Favourites count={p.favourites} />
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
