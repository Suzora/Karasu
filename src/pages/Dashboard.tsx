import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchMediaList } from "@/api/anilist";
import { useAuth } from "@/stores/auth";
import { useContentFilter } from "@/stores/contentFilter";
import { isBlocked } from "@/lib/contentFilter";
import { ErrorState } from "@/components/EmptyState";
import FirstRun from "@/components/shell/FirstRun";
import { Busy, CoverGridSkeleton, HeaderSkeleton, Shimmer } from "@/components/Skeleton";
import RecommendedSection from "@/components/media/RecommendedSection";
import { OverviewBanner } from "@/components/dashboard/OverviewBanner";
import { ListShelves } from "@/components/dashboard/ListShelves";
import { ContinueRow } from "@/components/dashboard/ContinueRow";
import { WeekPlan } from "@/components/dashboard/WeekPlan";
import { ComingUp } from "@/components/dashboard/ComingUp";
import { OverviewRail } from "@/components/dashboard/OverviewRail";
import { useElementWidth } from "@/hooks/useElementWidth";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { cn } from "@/lib/utils";
import { OverviewPager } from "@/components/dashboard/OverviewPager";

/** The page width from which the rail sits beside the middle: a 44 rem middle, the 20 rem rail and the gaps between. */
const BESIDE_MIN = 1040;
/** What the rail and its gap take from the middle; the measured width already leaves the padding out. */
const RAIL_SPACE = 344;
/** The narrowest a shelf may get before the row holds one fewer. */
const SHELF_MIN = 140;

export default function Dashboard() {
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  const loading = useAuth((s) => s.loading);

  if (loading) return null;

  if (!viewer && mode !== "local") return <FirstRun />;

  return <DashboardContent userId={viewer?.id ?? 0} />;
}

function DashboardContent({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const name = useAuth((s) => s.viewer?.name ?? null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mediaList", "ANIME", userId],
    queryFn: () => fetchMediaList(userId, "ANIME"),
  });
  // The manga shelves, the continue row and the manga recommendations read the manga list; the manga page fills its cache.
  const { data: mangaData, isLoading: mangaLoading, error: mangaError } = useQuery({
    queryKey: ["mediaList", "MANGA", userId],
    queryFn: () => fetchMediaList(userId, "MANGA"),
  });
  const level = useContentFilter((s) => s.level);

  // One content-filtered base for every section below, so a new section cannot skip the check.
  const allAnime = useMemo(
    () => data?.lists.filter((g) => !g.isCustomList).flatMap((g) => g.entries).filter((e) => !isBlocked(e.media, level)) ?? [],
    [data, level],
  );
  const allManga = useMemo(
    () => mangaData?.lists.filter((g) => !g.isCustomList).flatMap((g) => g.entries).filter((e) => !isBlocked(e.media, level)) ?? [],
    [mangaData, level],
  );

  const root = useRef<HTMLDivElement>(null);
  const width = useElementWidth(root);
  const phone = usePhoneShell();
  const beside = !phone && width >= BESIDE_MIN;
  const middle = beside ? width - RAIL_SPACE : width;
  const shelfCols = phone ? 2 : Math.min(6, Math.max(2, Math.floor(middle / SHELF_MIN)));
  const settled = !isLoading && !mangaLoading;

  const middleColumn = (
    <div className={cn("min-w-0 space-y-8", beside && "pb-12 pt-6")}>
      <OverviewBanner name={name} anime={allAnime} strip={!phone} />
      {isLoading ? (
        <OverviewSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} title={(reason) => t("list.loadError", { message: reason })} />
      ) : (
        <>
          <ListShelves anime={allAnime} manga={allManga} cols={shelfCols} />
          <ContinueRow userId={userId} anime={allAnime} manga={allManga} />
          <WeekPlan anime={allAnime} />
          <ComingUp anime={allAnime} />
          <RecommendedSection type="ANIME" entries={allAnime} />
        </>
      )}
      {!mangaLoading && <RecommendedSection type="MANGA" entries={allManga} listUnavailable={!!mangaError} />}
    </div>
  );
  const rail = <OverviewRail userId={userId} anime={allAnime} manga={allManga} settled={settled} beside={beside} ready={!isLoading && !error} />;

  // The phone pages sideways, so the statistics sit one swipe away instead of under every section.
  if (phone) {
    return (
      <div ref={root} className="px-4 pb-24 pt-4">
        <OverviewPager
          pages={[
            { label: t("dashboard.pageOverview"), node: middleColumn },
            { label: t("dashboard.pageMine"), node: rail },
          ]}
        />
      </div>
    );
  }

  return (
    <div ref={root} className={cn(beside ? "grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-6 pl-7 pr-5" : "space-y-8 px-4 pb-10 pt-6 md:px-7")}>
      {middleColumn}
      {rail}
    </div>
  );
}

/** Stand-in for the middle while the list loads, shaped like it so nothing jumps; one status for all of it. */
function OverviewSkeleton() {
  return (
    <Busy className="space-y-8">
      <div className="space-y-3">
        <HeaderSkeleton />
        <CoverGridSkeleton count={6} />
      </div>
      <div className="space-y-3">
        <HeaderSkeleton />
        <Shimmer className="h-60 w-full rounded-panel" />
      </div>
    </Busy>
  );
}
