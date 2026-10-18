import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { CoverCell } from "@/components/media/CoverCell";

import { formatLabel } from "@/lib/format";
import { displayTitle } from "@/api/types";
import { useDiscoveryEntry } from "@/hooks/useDiscoveryEntry";
import { statusColorVar } from "@/lib/statusColors";
import { loadDefaultAddStatus } from "@/lib/defaultAddStatus";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import type { MediaWithListStatus } from "@/api/queries";
import EntryDialog from "@/components/media/LazyEntryDialog";
import { PresenceIf } from "@/components/ui/presence";

/** Card for discovery grids (search, season): quick add and full editing straight from the results. */
export default function MediaCard({
  media,
  focused = false,
}: {
  media: MediaWithListStatus;
  /** The roving keyboard cursor is on this card — see `useGridRoving`. */
  focused?: boolean;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const { entry, send, busy, hasProfile } = useDiscoveryEntry(media);
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);

  return (
    <CoverCell
      to={`/media/${media.id}`}
      // The roving cursor is not real DOM focus, so the ring is drawn rather than inherited from `:focus-visible`.
      className={focused ? "rounded-cover ring-2 ring-accent-500" : undefined}
      cover={media.coverImage.large}
      score={media.averageScore != null ? `${media.averageScore}%` : null}
      communityScore={t("media.communityAverage")}
      adult={media.isAdult === true}
      blurred={shouldBlur(media, level, blurAdult)}
      revealLabel={displayTitle(media.title)}
      data-media-id={media.id}
      data-media-type={media.type}
      data-media-title={displayTitle(media.title)}
      caption={
        <>
          <p className="line-clamp-2 text-ui font-medium leading-snug text-ink-100">{displayTitle(media.title)}</p>
          {/* The status point leads the meta line: it is no control, and the corner above holds controls only. */}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-ink-500">
            {entry && (
              <span
                role="img"
                aria-label={t(`status.${media.type}.${entry.status}`)}
                title={t(`status.${media.type}.${entry.status}`)}
                className="size-2 shrink-0 rounded-full"
                style={{ background: statusColorVar(entry.status) }}
              />
            )}
            <span className="truncate">{[formatLabel(media.format, t), media.seasonYear].filter(Boolean).join(" · ")}</span>
          </p>
        </>
      }
      actions={
        hasProfile && (
          // One circle, so the score beside it stays readable: the editor for a listed title, the quick add for a new one.
          entry ? (
            <IconButton variant="onCover" size="sm" round onClick={() => setEditing(true)} aria-label={t("common.edit")} title={t("common.edit")}>
              <Pencil className="size-3.5" />
            </IconButton>
          ) : (
            <IconButton
              variant="onCover"
              size="sm"
              round
              onClick={() => send({ mediaId: media.id, status: loadDefaultAddStatus() })}
              disabled={busy}
              aria-label={t("media.addDefault")}
              title={t("media.addDefault")}
            >
              <Plus className="size-4" />
            </IconButton>
          )
        )
      }
    >
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
    </CoverCell>
  );
}
