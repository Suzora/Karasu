import { memo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCheck, Pencil, Plus } from "lucide-react";
import { displayTitle, maxProgress, type MediaListEntry } from "@/api/types";
import { formatScore } from "@/lib/scoreFormat";
import { useScoreFormat } from "@/stores/auth";
import { IconButton } from "@/components/ui/icon-button";
import { CoverCell } from "@/components/media/CoverCell";
import { progressMarks } from "@/lib/overview";
import { cn } from "@/lib/utils";
import { SelectBox } from "./SelectBox";
import { TagChips } from "./TagChips";
import { canIncrement } from "./shared";
/** Memoized, since hundreds of cards re-render per keystroke; handlers take the entry so the props stay stable. */

export const GridCard = memo(function GridCard({
  entry,
  unit,
  blurred,
  onPlusOne,
  onComplete,
  onEdit,
  selectMode,
  selected,
  focused,
  onToggleSelect,
}: {
  entry: MediaListEntry;
  unit: string;
  /** Computed by the page, not read from the store here: a store subscription would re-render every memoized card. */
  blurred: boolean;
  onPlusOne: (entry: MediaListEntry) => void;
  onComplete: (entry: MediaListEntry) => void;
  onEdit: (entry: MediaListEntry) => void;
  selectMode: boolean;
  selected: boolean;
  focused: boolean;
  onToggleSelect: (mediaId: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const scoreFormat = useScoreFormat();
  const { media } = entry;
  const max = maxProgress(media);
  const plusOne = canIncrement(entry);
  const completable = entry.status !== "COMPLETED";
  return (
    <CoverCell
      to={`/media/${media.id}`}
      cover={media.coverImage.large}
      // The badge shows through the veil, so a blurred cell reads as hidden rather than as failed artwork.
      adult={media.isAdult === true}
      blurred={blurred}
      revealLabel={displayTitle(media.title)}
      data-media-id={media.id}
      data-media-type={media.type}
      data-media-title={displayTitle(media.title)}
      // The focused cell wears the selection outline: both say "this is the one the next key acts on".
      selected={focused || (selectMode && selected)}
      // In select mode the cover is the checkbox target; navigating away mid-selection is never what the click meant.
      onCoverClick={
        selectMode ? () => onToggleSelect(entry.mediaId) : undefined
      }
      score={
        !selectMode && entry.score > 0
          ? formatScore(scoreFormat, entry.score, i18n.language)
          : undefined
      }
      caption={<CardCaption entry={entry} max={max} unit={unit} />}
      overlay={
        selectMode ? (
          <SelectBox
            checked={selected}
            onToggle={() => onToggleSelect(entry.mediaId)}
            label={t("bulk.selectTitle", { title: displayTitle(media.title) })}
            className="absolute left-2 top-2 z-20"
          />
        ) : (
          // A wash under the top corner while the actions show; touch has no hover, so it stays there.
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-on-cover/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100" />
        )
      }
      actions={
        // Suppressed in select mode; keep `group-focus-within`, or Tab lands on fully transparent buttons.
        !selectMode && (
          <div className="flex gap-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
            {/* Narrow or touched, a cover keeps one circle, the quick write; a long press reaches the editor. */}
            <IconButton
              variant="onCover"
              size="sm"
              round
              onClick={() => onEdit(entry)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
              className={cn(
                plusOne && "@max-cover-pair:hidden pointer-coarse:hidden",
                !plusOne && completable && "not-pointer-coarse:@max-cover-pair:hidden",
              )}
            >
              <Pencil className="size-3.5" />
            </IconButton>
            {completable && (
              // Off on a phone, and wherever it would be the third circle on a cover too narrow for three.
              <IconButton
                variant="onCover"
                size="sm"
                round
                onClick={() => onComplete(entry)}
                aria-label={t("common.complete")}
                title={t("common.complete")}
                className={cn("text-on-cover-success pointer-coarse:hidden", plusOne && "@max-cover-actions:hidden")}
              >
                <CheckCheck className="size-3.5" />
              </IconButton>
            )}
            {plusOne && (
              <IconButton
                variant="accentOnCover"
                size="sm"
                round
                onClick={() => onPlusOne(entry)}
                aria-label={t("common.plusOne")}
                title={t("common.plusOne")}
              >
                <Plus className="size-4" />
              </IconButton>
            )}
          </div>
        )
      }
    >
      <TagChips notes={entry.notes} />
    </CoverCell>
  );
});

/** The title, the count and a tick per episode, laid on the cover's foot the way the Overview's cards carry them. */
function CardCaption({ entry, max, unit }: { entry: MediaListEntry; max: number | null; unit: string }) {
  const { t } = useTranslation();
  const { media } = entry;
  const marks = progressMarks(entry.progress, max);
  return (
    <>
      <p className="line-clamp-2 text-xs font-medium leading-snug text-on-cover-edge">{displayTitle(media.title)}</p>
      <p className="@container mb-1.5 mt-0.5 text-2xs tabular-nums text-on-cover-edge/80">
        {media.type === "MANGA" ? (
          // Chapters lead, volumes trail; `?` rather than a hidden total, since an ongoing series has no end count.
          <>
            {t("common.progressChapters", { n: entry.progress, total: media.chapters ?? "?" })}
            {" · "}
            {t("common.progressVolumes", { n: entry.progressVolumes ?? 0, total: media.volumes ?? "?" })}
          </>
        ) : (
          <>
            {entry.progress}
            {max ? ` / ${max}` : ""}
            {/* On a narrow card the numbers stand alone rather than wrap the word onto a second line. */}
            <span className="@max-cover-meta:hidden"> {unit}</span>
          </>
        )}
      </p>
      {marks.kind === "ticks" ? (
        <div aria-hidden className="flex gap-px">
          {Array.from({ length: marks.total }, (_, i) => (
            <span key={i} data-tick={i < marks.done ? "done" : "left"} className={cn("h-1 flex-1 rounded-mark", i < marks.done ? "bg-accent-400" : "bg-on-cover-edge/20")} />
          ))}
        </div>
      ) : (
        <div aria-hidden className="h-1 overflow-hidden rounded-full bg-on-cover-edge/20">
          <div className="h-full rounded-full bg-accent-400" style={{ width: `${marks.share * 100}%` }} />
        </div>
      )}
    </>
  );
}
