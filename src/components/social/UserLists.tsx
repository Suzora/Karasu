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
import { CoverCell, CoverMeta } from "@/components/media/CoverCell";
import { TitleLockup } from "@/components/media/TitleLockup";
import { Pill } from "@/components/ui/pill";
import { Select } from "@/components/ui/select";
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
      {/* One row at any width: the six statuses fold into a select that carries their counts. */}
      <div className="flex items-center gap-1.5">
        {(["ANIME", "MANGA"] as const).map((tp) => (
          <Pill key={tp} active={type === tp} onClick={() => setType(tp)}>
            {tp === "ANIME" ? t("common.anime") : t("common.manga")}
          </Pill>
        ))}
        <Select
          aria-label={t("common.status")}
          value={status}
          onChange={(e) => setStatus(e.target.value as MediaListStatus)}
          className="ml-auto min-w-0"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {`${t(`status.${type}.${s}`)} (${(byStatus.get(s)?.length ?? 0).toLocaleString(i18n.language)})`}
            </option>
          ))}
        </Select>
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
            <span className="mt-1 block text-2xs text-ink-600">
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
                progress={total ? { current: e.progress, total } : null}
              >
                <Link to={`/media/${e.mediaId}`}>
                  <TitleLockup title={e.media.title} clamp={2} tone="muted" className="mt-2" />
                </Link>
                <CoverMeta>
                  {e.progress}
                  {total ? ` / ${total}` : ""}
                </CoverMeta>
              </CoverCell>
            );
          })}
        </div>
      )}
    </div>
  );
}
