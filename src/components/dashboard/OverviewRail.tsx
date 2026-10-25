import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isTauri } from "@/api/anilist";
import { favouriteBirthdays, OWN_ACTIVITY } from "@/api/social";
import type { MediaListEntry } from "@/api/types";
import DetectionSurface from "@/components/media/DetectionSurface";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/user-lockup";
import { Shimmer } from "@/components/Skeleton";
import { useDetectionMedia } from "@/hooks/useDetectionMedia";
import { birthdaysOn } from "@/lib/birthdays";
import { formatDecimal } from "@/lib/format";
import { overviewFigures } from "@/lib/overview";
import { formatMeanScore } from "@/lib/scoreFormat";
import { cn } from "@/lib/utils";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { useNowPlaying } from "@/stores/nowPlaying";
import { useOverviewRail } from "@/stores/overviewRail";

const panel = "rounded-panel bg-surface-900 surface-outline";
/** One's own activity shows this many, and as many more per press, so it never needs a scroller of its own. */
const ACTIVITY_STEP = 5;

/** The Overview's right column: the detected title, the figures, one's own AniList activity a few at a time, birthdays. */
export function OverviewRail({
  userId,
  anime,
  manga,
  settled,
  beside,
  ready,
}: {
  userId: number;
  anime: MediaListEntry[];
  manga: MediaListEntry[];
  /** Both lists have answered; the activity and the birthdays wait for it, so the mount burst stays small. */
  settled: boolean;
  /** Beside the page rather than below it; only then does it take the detected title from the floating window. */
  beside: boolean;
  /** The anime list has answered without an error; until then the figures would state zeros as fact. */
  ready: boolean;
}) {
  const { t } = useTranslation();
  const mode = useAuth((s) => s.mode);
  const current = useNowPlaying((s) => s.current);
  const setShows = useOverviewRail((s) => s.set);
  const shows = beside && current !== null;
  useEffect(() => {
    setShows(shows);
    return () => setShows(false);
  }, [shows, setShows]);
  const anilist = mode === "anilist" && userId > 0;

  return (
    <aside className={cn("flex min-w-0 flex-col gap-4", beside && "sticky top-0 max-h-[calc(100dvh-2.25rem)] overflow-y-auto overflow-x-hidden py-6")}>
      {shows && <RailDetection />}
      {ready ? <RailStats anime={anime} manga={manga} /> : <Shimmer className="h-72 w-full rounded-panel" />}
      <section className={cn(panel, "flex min-h-40 flex-col p-4", beside && "flex-1")}>
        <div className="mb-2 flex items-center">
          <h2 className="text-base text-ink-100">{t("dashboard.ownActivity")}</h2>
        </div>
        {anilist ? (
          <ActivityFeed
            queryKey={["social", "activities", userId]}
            source={{ userId }}
            requestSource={OWN_ACTIVITY.source}
            enabled={settled}
            variant="row"
            step={ACTIVITY_STEP}
            emptyTitle={t("social.noActivitySelf")}
          />
        ) : (
          <p className="text-sm text-ink-500">{t("dashboard.ownActivityNeedsAccount")}</p>
        )}
      </section>
      {anilist && <RailBirthdays userId={userId} settled={settled} />}
    </aside>
  );
}

/** The figures the old tiles and statistics card showed, with the share of what is running as a ring. */
function RailStats({ anime, manga }: { anime: MediaListEntry[]; manga: MediaListEntry[] }) {
  const { t, i18n } = useTranslation();
  const scoreFormat = useScoreFormat();
  const f = useMemo(() => overviewFigures(anime, manga), [anime, manga]);
  const runAll = f.running.anime.all + f.running.manga.all;
  const runDone = f.running.anime.done + f.running.manga.done;
  const share = runAll ? runDone / runAll : 0;
  const n = (v: number) => v.toLocaleString(i18n.language);
  const cell = (label: string, value: string) => (
    <div className="rounded-inner bg-surface-850 px-3 py-2.5">
      <p className="label-text text-ink-500">{label}</p>
      <p className="mt-0.5 font-brand text-xl text-ink-100">{value}</p>
    </div>
  );
  const bar = (label: string, done: number, all: number) => all > 0 && (
    <div>
      <div className="mb-1 flex label-text"><span className="text-ink-300">{label}</span><span className="ml-auto tabular-nums text-ink-500">{done} / {all}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-800"><div className="h-full rounded-full bg-accent-400" style={{ width: `${all ? (done / all) * 100 : 0}%` }} /></div>
    </div>
  );
  return (
    <section className={cn(panel, "p-4")}>
      <div className="mb-3 flex items-center">
        <h2 className="text-base text-ink-100">{t("dashboard.stats")}</h2>
        <span className="flex-1" />
        <Link to="/stats" className={buttonClass("text", "text")}>{t("dashboard.statsMore")}</Link>
      </div>
      <div className="mb-3 flex items-center gap-4 rounded-inner bg-surface-850 p-3">
        <div className="relative grid size-16 shrink-0 place-items-center" title={t("dashboard.runningShare")}>
          <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6" className="stroke-surface-800" />
            <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-accent-400" strokeDasharray={`${175.9 * share} 175.9`} />
          </svg>
          <span className="font-brand text-base text-ink-100">{Math.round(share * 100)} %</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          {bar(t("dashboard.runningAnime"), f.running.anime.done, f.running.anime.all)}
          {bar(t("dashboard.runningManga"), f.running.manga.done, f.running.manga.all)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cell(t("dashboard.statAnime"), n(f.anime))}
        {cell(t("dashboard.statManga"), n(f.manga))}
        {cell(t("dashboard.statEpisodes"), n(f.episodes))}
        {cell(t("dashboard.statChapters"), n(f.chapters))}
        {cell(t("dashboard.statDays"), formatDecimal(f.days, i18n.language, 1))}
        {cell(t("dashboard.statMeanScore"), f.meanScore == null ? "–" : formatMeanScore(scoreFormat, f.meanScore, i18n.language))}
      </div>
    </section>
  );
}

/** The detection surface the floating window draws, here in the rail; there is still one detection. */
function RailDetection() {
  const { t } = useTranslation();
  const current = useNowPlaying((s) => s.current);
  const media = useDetectionMedia(current?.mediaId ?? null);
  if (!current) return null;
  return (
    <section aria-label={t("dashboard.nowPlaying")} className={cn(panel, "overflow-hidden")}>
      <p className="px-4 pt-3 label-text text-accent-400">{t("dashboard.nowPlaying")}</p>
      <DetectionSurface playing={current} variant="expanded" media={media} />
    </section>
  );
}

/** Today's birthdays among the favourites, small; one request a day, held until the lists have answered. */
function RailBirthdays({ userId, settled }: { userId: number; settled: boolean }) {
  const { t } = useTranslation();
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const q = useQuery({
    queryKey: ["social", "birthdays", userId, `${month}-${day}`],
    queryFn: () => favouriteBirthdays(userId),
    enabled: isTauri && settled,
    staleTime: Infinity,
  });
  const today = useMemo(() => (q.data ? birthdaysOn(q.data, month, day) : []), [q.data, month, day]);
  if (today.length === 0) return null;
  return (
    <section className={cn(panel, "p-3")}>
      <h2 className="mb-1.5 px-1 label-text text-ink-500">{t("dashboard.birthdays")}</h2>
      <ul className="space-y-0.5">
        {today.map((p) => (
          <li key={`${p.kind}-${p.id}`}>
            <Link to={`/${p.kind}/${p.id}`} className="flex items-center gap-2.5 rounded-control px-1 py-1 transition-surface hover:bg-surface-850">
              <Avatar src={p.image?.medium} name={p.name.full ?? "?"} size="sm" />
              <span className="min-w-0 flex-1 truncate text-xs text-ink-100">{p.name.full}</span>
              <span className="shrink-0 text-2xs text-ink-500">{t(p.kind === "character" ? "dashboard.birthdayCharacter" : "dashboard.birthdayStaff")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
