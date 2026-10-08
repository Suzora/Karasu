import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { userListQuery, type UserProfile } from "@/api/social";
import { fetchMediaList, isTauri } from "@/api/anilist";
import { displayTitle, type MediaListStatus, type MediaType } from "@/api/types";
import { asScoreFormat, formatScore, fromRaw, scoreScale, toRaw, unroundedScore } from "@/lib/scoreFormat";
import { affinityGap, affinityPct } from "@/lib/affinity";
import { compareLists, type CompareEntry } from "@/lib/listCompare";
import { isBlocked, shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Shimmer } from "@/components/Skeleton";
import { EmptyState, ErrorState, PerchRule } from "@/components/EmptyState";
import { TileGrid } from "@/components/stats/panels";
import { fmt } from "@/components/stats/RankedList";
import { SectionHeader } from "@/components/ui/section-header";
import { DotPlot } from "@/components/stats/DotPlot";
import { CoverCell } from "@/components/media/CoverCell";
import { TitleLockup } from "@/components/media/TitleLockup";
import { formatSigned } from "@/lib/format";

interface Known {
  mediaId: number;
  title: Parameters<typeof displayTitle>[0];
  cover: string | null;
  media: Parameters<typeof shouldBlur>[0];
  adult: boolean;
}

/** Both lists for one comparison: theirs under the Lists tab's key, so the tab and this share one request. */
function useComparison(user: UserProfile, type: MediaType) {
  const viewer = useAuth((s) => s.viewer);
  const viewerFormat = useScoreFormat();
  const level = useContentFilter((s) => s.level);
  const comparing = viewer != null && viewer.id !== user.id;

  const theirs = useQuery({ ...userListQuery(user.id, type), enabled: isTauri && comparing });
  const mine = useQuery({
    queryKey: ["mediaList", type, viewer?.id],
    queryFn: () => fetchMediaList(viewer!.id, type),
    enabled: isTauri && comparing,
    staleTime: Infinity,
  });

  const result = useMemo(() => {
    if (!theirs.data || !mine.data) return null;
    const known = new Map<number, Known>();
    const theirFormat = asScoreFormat(user.mediaListOptions?.scoreFormat);
    const remember = (
      mediaId: number,
      media: Known["media"] & { title: Known["title"]; coverImage: { large: string | null }; isAdult?: boolean | null },
    ) => {
      if (known.has(mediaId)) return;
      known.set(mediaId, {
        mediaId,
        title: media.title,
        cover: media.coverImage.large,
        media,
        adult: media.isAdult === true,
      });
    };
    // Custom groups too, once per title: an entry hidden from the status lists sits only in those.
    const theirEntries: CompareEntry[] = [];
    const theirSeen = new Set<number>();
    for (const e of theirs.data.flatMap((g) => g.entries)) {
      if (theirSeen.has(e.mediaId) || isBlocked(e.media, level)) continue;
      theirSeen.add(e.mediaId);
      remember(e.mediaId, e.media);
      theirEntries.push({ mediaId: e.mediaId, raw: toRaw(theirFormat, e.score), status: e.status as MediaListStatus });
    }
    const myEntries: CompareEntry[] = [];
    const mySeen = new Set<number>();
    for (const e of mine.data.lists.flatMap((g) => g.entries)) {
      if (mySeen.has(e.mediaId) || isBlocked(e.media, level)) continue;
      mySeen.add(e.mediaId);
      remember(e.mediaId, e.media);
      myEntries.push({ mediaId: e.mediaId, raw: toRaw(viewerFormat, e.score), status: e.status });
    }
    return { comparison: compareLists(myEntries, theirEntries), known };
  }, [theirs.data, mine.data, level, user.mediaListOptions?.scoreFormat, viewerFormat]);

  return {
    result,
    // Pending, not loading: a fetch paused offline is pending without fetching, and would otherwise draw nothing.
    loading: theirs.isPending || mine.isPending,
    error: theirs.error ?? mine.error,
    retry: () => Promise.all([theirs.error ? theirs.refetch() : null, mine.error ? mine.refetch() : null]),
    viewerFormat,
  };
}

/** The viewer's list against this user's: how much they agree, where they part, and what is worth a look. */
export function UserCompare({ user }: { user: UserProfile }) {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<MediaType>("ANIME");
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const { result, loading, error, retry, viewerFormat } = useComparison(user, type);
  const scale = scoreScale(viewerFormat);

  const toggle = (
    <div className="flex flex-wrap items-center gap-1.5">
      {(["ANIME", "MANGA"] as const).map((tp) => (
        <Pill key={tp} active={type === tp} onClick={() => setType(tp)}>
          {tp === "ANIME" ? t("common.anime") : t("common.manga")}
        </Pill>
      ))}
    </div>
  );

  // A failed refetch keeps the lists it had, so an error replaces the comparison only when there is none to show.
  if (!result) {
    return (
      <div className="space-y-4">
        {toggle}
        {error != null ? (
          <ErrorState error={error} visual={<PerchRule />} onRetry={retry} />
        ) : (
          loading && <Shimmer className="h-40 w-full rounded-panel" />
        )}
      </div>
    );
  }
  const errorLine = error != null && <ErrorState error={error} inline onRetry={retry} />;
  const c = result.comparison;
  const label = (id: number) => {
    const k = result.known.get(id);
    return k ? displayTitle(k.title) : String(id);
  };

  const picks = c.theyRatedUnseen.length > 0 && (
    <section className="space-y-3">
      <SectionHeader
        icon={Sparkles}
        title={t("social.compareTheyRated", { name: user.name })}
        meta={fmt(c.theyRatedUnseen.length, i18n.language)}
      />
      <div className="media-grid gap-x-4 gap-y-6">
        {c.theyRatedUnseen.map((p) => {
          const k = result.known.get(p.mediaId);
          if (!k) return null;
          return (
            <CoverCell
              key={p.mediaId}
              to={`/media/${p.mediaId}`}
              cover={k.cover}
              adult={k.adult}
              blurred={shouldBlur(k.media, level, blurAdult)}
              revealLabel={displayTitle(k.title)}
              score={formatScore(viewerFormat, fromRaw(viewerFormat, p.theirsRaw), i18n.language)}
            >
              <Link to={`/media/${p.mediaId}`}>
                <TitleLockup title={k.title} clamp={2} tone="muted" className="mt-2" />
              </Link>
            </CoverCell>
          );
        })}
      </div>
    </section>
  );

  if (c.shared === 0) {
    return (
      <div className="space-y-5">
        {toggle}
        {errorLine}
        <EmptyState visual={<PerchRule />} title={t("social.compareNoneShared")} />
        {picks}
      </div>
    );
  }

  // Unrounded on the viewer's scale: rounding each mean to a whole step first would show a gap it threw away.
  const diff =
    c.meanMine !== null && c.meanTheirs !== null
      ? unroundedScore(viewerFormat, c.meanTheirs) - unroundedScore(viewerFormat, c.meanMine)
      : null;
  const gap = affinityGap(c);
  const tiles = [
    { label: t("social.compareAffinity"), value: c.pearson !== null ? t("social.comparePct", { pct: affinityPct(c.pearson) }) : "–" },
    { label: t("social.compareShared"), value: fmt(c.shared, i18n.language) },
    { label: t("social.compareScored"), value: fmt(c.scoredShared, i18n.language) },
    { label: t("social.compareBothCompleted"), value: fmt(c.bothCompleted, i18n.language) },
    ...(diff !== null
      ? [
          {
            label: t("social.compareMeanDiff", { name: user.name }),
            value: formatSigned(diff, i18n.language, 1),
          },
        ]
      : []),
  ];
  const rows = c.disagreements.map((d) => ({
    id: d.mediaId,
    label: label(d.mediaId),
    mine: unroundedScore(viewerFormat, d.mineRaw),
    other: unroundedScore(viewerFormat, d.theirsRaw),
  }));

  return (
    <div className="space-y-5">
      {toggle}
      {errorLine}
      <Card>
        <CardTitle>{t("social.compareTitle", { name: user.name })}</CardTitle>
        <div className="mt-4">
          <TileGrid tiles={tiles} />
        </div>
        {gap && (
          <p className="mt-3 text-xs text-ink-500">
            {gap === "spread" ? t("social.compareNoSpread") : t("social.affinityNone")}
          </p>
        )}
      </Card>
      {rows.length > 0 && (
        <DotPlot
          locale={i18n.language}
          title={t("social.compareDisagree")}
          hint={t("social.compareDisagreeHint", { name: user.name })}
          rows={rows}
          legendMine={t("social.compareYou")}
          legendOther={user.name}
          max={scale.max}
        />
      )}
      {picks}
    </div>
  );
}
