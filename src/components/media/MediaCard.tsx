import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Pencil, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { TitleLockup } from "@/components/media/TitleLockup";
import { CoverCell, CoverMeta } from "@/components/media/CoverCell";

import { formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
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
      // Null when the title is not on the list, so an unlisted title has no ring rather than a grey one.
      statusRing={entry ? statusColorVar(entry.status) : null}
      score={media.averageScore != null ? `${media.averageScore}%` : null}
      adult={media.isAdult === true}
      blurred={shouldBlur(media, level, blurAdult)}
      revealLabel={displayTitle(media.title)}
      data-media-id={media.id}
      data-media-type={media.type}
      data-media-title={displayTitle(media.title)}
      // A status point on the art, not a circle beside the pencil: it is no control, and the action corner holds controls.
      overlay={
        entry && (
          <span
            role="img"
            aria-label={t(`status.${media.type}.${entry.status}`)}
            title={t(`status.${media.type}.${entry.status}`)}
            className={cn("absolute top-2 size-2.5 rounded-full ring-2 ring-on-cover", media.isAdult ? "right-12" : "right-2")}
            style={{ background: statusColorVar(entry.status) }}
          />
        )
      }
      actions={
        hasProfile && (
          <>
            {/* Below two circles' width a cover keeps one control: the quick add for a new title, the editor for a listed one. */}
            <IconButton
              variant="onCover"
              size="sm"
              round
              onClick={() => setEditing(true)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
              className={entry ? undefined : "@max-cover-pair:hidden"}
            >
              <Pencil className="size-3.5" />
            </IconButton>
            {/* The neutral circle: adding to Planning is not the same weight as a +1, and the accent is reserved for that. */}
            {!entry && (
              <IconButton
                variant="onCover"
                size="sm"
                round
                onClick={() =>
                  send({
                    mediaId: media.id,
                    status: loadDefaultAddStatus(),
                  })
                }
                disabled={busy}
                aria-label={t("media.addDefault")}
                title={t("media.addDefault")}
              >
                <Plus className="size-4" />
              </IconButton>
            )}
          </>
        )
      }
    >
      <Link to={`/media/${media.id}`}>
        <TitleLockup
          title={media.title}
          clamp={2}
          tone="muted"
          className="mt-2"
        />
      </Link>
      <CoverMeta>
        {[formatLabel(media.format, t), media.seasonYear]
          .filter(Boolean)
          .join(" · ")}
      </CoverMeta>

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
