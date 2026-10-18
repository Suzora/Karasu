import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CalendarClock, Plus } from "lucide-react";
import type { MediaWithListStatus } from "@/api/queries";
import { displayTitle } from "@/api/types";
import { useDiscoveryEntry } from "@/hooks/useDiscoveryEntry";
import { countdown, formatLabel, mediaStatusLabel } from "@/lib/format";
import { loadDefaultAddStatus } from "@/lib/defaultAddStatus";
import { shouldBlur } from "@/lib/contentFilter";
import { statusColorVar } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";
import EntryDialog from "@/components/media/LazyEntryDialog";
import { PresenceIf } from "@/components/ui/presence";

/** The season page's broadcast card: cover, what the title is, when its next episode airs, and the list state or a plan. */
export default function SeasonCard({ media, focused = false }: { media: MediaWithListStatus; focused?: boolean }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const { entry, send, busy, hasProfile } = useDiscoveryEntry(media);
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const title = displayTitle(media.title);
  const next = media.nextAiringEpisode;
  const left = next ? next.airingAt - Math.floor(Date.now() / 1000) : 0;
  const addStatus = loadDefaultAddStatus();

  return (
    <div
      data-media-id={media.id}
      data-media-type={media.type}
      data-media-title={title}
      // The roving cursor is not real DOM focus, so the ring is drawn rather than inherited from `:focus-visible`.
      className={cn("flex gap-3 rounded-panel bg-surface-900 surface-outline p-2.5 transition-surface hover:bg-surface-850", focused && "ring-2 ring-accent-500")}
    >
      <Link to={`/media/${media.id}`} tabIndex={-1} aria-hidden className="w-20 shrink-0 overflow-hidden rounded-inner bg-surface-850">
        {media.coverImage.large && (
          <img
            src={media.coverImage.large}
            alt=""
            loading="lazy"
            className={cn("aspect-[3/4] size-full object-cover", shouldBlur(media, level, blurAdult) && "blur-[6px]")}
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <Link to={`/media/${media.id}`} className="line-clamp-2 text-sm font-medium text-ink-100 hover:underline">
          {title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-500">
          {media.isAdult && <span className="rounded-control bg-danger/15 px-1.5 text-2xs font-semibold text-danger">18+</span>}
          <span>{formatLabel(media.format, t)}</span>
          <span aria-hidden>·</span>
          <span>{t("seasonal.episodes", { n: media.episodes ?? "?" })}</span>
          {media.averageScore != null && (
            // AniList's average, so without the star that marks the user's own score everywhere else.
            <span title={t("media.communityAverage")} className="tabular-nums text-ink-300">
              <span className="sr-only">{t("media.communityAverage")} </span>
              {`${media.averageScore}%`}
            </span>
          )}
        </p>
        {media.genres.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {media.genres.slice(0, 3).map((g) => (
              <span key={g} className="rounded-full bg-surface-850 px-2 py-0.5 text-2xs text-ink-300 surface-outline">
                {g}
              </span>
            ))}
          </div>
        )}
        <span className="flex-1" />
        <div className="mt-2 flex items-center gap-2">
          {next && left > 0 ? (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-accent-400">
              <CalendarClock aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{t("seasonal.nextEpisode", { n: next.episode, when: countdown(left, t) })}</span>
            </span>
          ) : (
            <span className="truncate text-xs text-ink-500">{mediaStatusLabel(media.status, t)}</span>
          )}
          <span className="flex-1" />
          {hasProfile &&
            (entry ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={`${t("common.edit")}: ${t(`status.${media.type}.${entry.status}`)}`}
                className="press flex shrink-0 items-center gap-1.5 rounded-full bg-surface-850 px-2.5 py-1 text-2xs text-ink-300 surface-outline transition-surface hover:text-ink-100 coarse:hit-area"
              >
                <span aria-hidden className="size-2 rounded-full" style={{ background: statusColorVar(entry.status) }} />
                {t(`status.${media.type}.${entry.status}`)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => send({ mediaId: media.id, status: addStatus })}
                disabled={busy}
                aria-label={t("media.addDefault")}
                title={t("media.addDefault")}
                className="press nav-pill flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-2xs transition-surface disabled:opacity-60 coarse:hit-area"
              >
                <Plus aria-hidden className="size-3.5" />
                {t(`status.${media.type}.${addStatus}`)}
              </button>
            ))}
        </div>
      </div>

      <PresenceIf when={editing}>
        {(leaving) => (
          <EntryDialog
            leaving={leaving}
            media={media}
            entry={entry}
            onClose={() => setEditing(false)}
            onAdd={(status) => send({ mediaId: media.id, status })}
            onWrite={(patch) => send({ mediaId: media.id, ...patch })}
          />
        )}
      </PresenceIf>
    </div>
  );
}
