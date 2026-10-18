import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { userListQuery, type ForeignListEntry, type UserProfile } from "@/api/social";
import { fetchMediaList, isTauri } from "@/api/anilist";
import {
  STATUS_ORDER,
  displayTitle,
  type MediaListStatus,
  type MediaType,
} from "@/api/types";
import { asScoreFormat, formatScore, toRaw } from "@/lib/scoreFormat";
import { affinity, affinityGap, affinityPct } from "@/lib/affinity";
import { isBlocked, shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { CoverCell } from "@/components/media/CoverCell";
import { ProgressMarks } from "@/components/media/ProgressMarks";
import { TitleLockup } from "@/components/media/TitleLockup";
import { Segmented } from "@/components/ui/segmented";
import { StatusPicker } from "@/components/list/StatusNav";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { Shimmer } from "@/components/Skeleton";
import { EmptyState, ErrorState, PerchRule } from "@/components/EmptyState";

/** Another user's list, read-only through `CoverCell` rather than `GridCard`, with scores in the owner's format. */
export function UserLists({ user }: { user: UserProfile }) {
  const { t, i18n } = useTranslation();
  const viewer = useAuth((s) => s.viewer);
  const viewerFormat = useScoreFormat();
  const level = useContentFilter((s) => s.level);
  // Someone else's list still renders under *this* user's filter, so the veil applies as it does to their own grid.
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const [type, setType] = useState<MediaType>("ANIME");
  const [status, setStatus] = useState<MediaListStatus>("CURRENT");

  const q = useQuery({ ...userListQuery(user.id, type), enabled: isTauri });

  const theirFormat = asScoreFormat(user.mediaListOptions?.scoreFormat);

  // Subscribed rather than read once: the phone mounts no other observer, so a one-off read outlived the cache entry.
  const comparing = viewer != null && viewer.id !== user.id;
  const { data: mineData } = useQuery({
    queryKey: ["mediaList", type, viewer?.id],
    queryFn: () => fetchMediaList(viewer!.id, type),
    enabled: isTauri && comparing,
    staleTime: Infinity,
  });

  // De-duped by media id: a custom list echoes entries the status lists already carry.
  const entries = useMemo(() => {
    const seen = new Set<number>();
    const out: ForeignListEntry[] = [];
    for (const group of q.data ?? []) {
      if (group.isCustomList) continue;
      for (const e of group.entries) {
        if (seen.has(e.mediaId) || isBlocked(e.media, level)) continue;
        seen.add(e.mediaId);
        out.push(e);
      }
    }
    return out;
  }, [q.data, level]);

  const byStatus = useMemo(() => {
    const map = new Map<MediaListStatus, ForeignListEntry[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const e of entries) map.get(e.status as MediaListStatus)?.push(e);
    return map;
  }, [entries]);
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, byStatus.get(s)?.length ?? 0])) as Record<MediaListStatus, number>;
  const phone = usePhoneShell();

  const match = useMemo(() => {
    if (!comparing || !mineData) return null;
    // Custom groups too: an entry hidden from the status lists sits only there, and `affinity` keeps one per title.
    const mine = mineData.lists
      .flatMap((g) => g.entries)
      .map((e) => ({ mediaId: e.mediaId, raw: toRaw(viewerFormat, e.score) }));
    const theirs = entries.map((e) => ({
      mediaId: e.mediaId,
      raw: toRaw(theirFormat, e.score),
    }));
    return affinity(mine, theirs);
  }, [comparing, mineData, entries, viewerFormat, theirFormat]);

  const titleOf = useMemo(
    () => new Map(entries.map((e) => [e.mediaId, displayTitle(e.media.title)])),
    [entries],
  );

  const shown = byStatus.get(status) ?? [];

  return (
    <div className="space-y-4">
      {/* The six statuses fold into the lists' own picker, which carries their counts. */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          aria-label={t("stats.mediaTypeLabel")}
          value={type}
          onChange={setType}
          segments={[
            { value: "ANIME", label: t("common.anime") },
            { value: "MANGA", label: t("common.manga") },
          ]}
        />
        <div className="min-w-56 flex-1 sm:max-w-80">
          <StatusPicker
            variant={phone ? "sheet" : "dropdown"}
            type={type}
            value={status}
            counts={counts}
            onChange={setStatus}
            lists={[]}
            list=""
            onList={() => {}}
          />
        </div>
      </div>

      {match && match.shared > 0 && (
        <div className="rounded-control border border-hair bg-surface-900 px-3 py-2 text-xs text-ink-300">
          <span className="font-medium text-ink-100">
            {match.pearson !== null
              ? t("social.affinity", { pct: affinityPct(match.pearson) })
              : affinityGap(match) === "spread"
                ? t("social.compareNoSpread")
                : t("social.affinityNone")}
          </span>
          {" · "}
          {t("social.affinityShared", { n: match.shared })}
          {match.disagreements.length > 0 && (
            <span className="mt-1 block text-xs text-ink-600">
              {t("social.affinityDisagree")}{" "}
              {match.disagreements
                .map((d) => titleOf.get(d.mediaId))
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
      )}

      {q.isLoading && <Shimmer className="h-40 w-full rounded-panel" />}
      {q.error != null && (
        <ErrorState
          error={q.error}
          visual={<PerchRule />}
          inline={q.data != null}
          onRetry={() => q.refetch()}
        />
      )}
      {q.data && shown.length === 0 && (
        <EmptyState visual={<PerchRule />} title={t("social.listsEmpty")} />
      )}
      {shown.length > 0 && (
        <div className="media-grid gap-x-4 gap-y-6">
          {shown.map((e) => {
            const total = type === "ANIME" ? e.media.episodes : e.media.chapters;
            return (
              <CoverCell
                key={e.mediaId}
                to={`/media/${e.mediaId}`}
                cover={e.media.coverImage.large}
                adult={e.media.isAdult === true}
                blurred={shouldBlur(e.media, level, blurAdult)}
                revealLabel={displayTitle(e.media.title)}
                score={e.score > 0 ? formatScore(theirFormat, e.score, i18n.language) : undefined}
                caption={
                  <>
                    <Link to={`/media/${e.mediaId}`}>
                      <TitleLockup title={e.media.title} clamp={2} tone="muted" />
                    </Link>
                    <p className="mb-1.5 mt-0.5 text-xs tabular-nums text-ink-500">
                      {e.progress}
                      {total ? ` / ${total}` : ""}
                    </p>
                    <ProgressMarks progress={e.progress} total={total ?? null} />
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
