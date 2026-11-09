import { memo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCheck, Pencil } from "lucide-react";
import { displayTitle, maxProgress, type MediaListEntry } from "@/api/types";
import { formatScore } from "@/lib/scoreFormat";
import { useScoreFormat } from "@/stores/auth";
import { IconButton } from "@/components/ui/icon-button";
import { CoverCell } from "@/components/media/CoverCell";
import { ProgressMarks } from "@/components/media/ProgressMarks";
import { cn } from "@/lib/utils";
import { PlusOne } from "@/components/ui/plus-one";
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
  stack,
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
  /** Drawn as a stack: the members in the stack's order, this entry first among them, and how to open them. */
  stack?: { members: MediaListEntry[]; onOpen: (mediaId: number) => void };
}) {
  const { t, i18n } = useTranslation();
  const scoreFormat = useScoreFormat();
  const { media } = entry;
  const max = maxProgress(media);
  const plusOne = canIncrement(entry);
  const completable = entry.status !== "COMPLETED";
  const cell = (
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
        selectMode ? () => onToggleSelect(entry.mediaId) : stack ? () => stack.onOpen(entry.mediaId) : undefined
      }
      score={
        !selectMode && entry.score > 0
          ? formatScore(scoreFormat, entry.score, i18n.language)
          : undefined
      }
      caption={stack ? <StackCaption lead={entry} members={stack.members} /> : <CardCaption entry={entry} max={max} unit={unit} />}
      overlay={
        selectMode ? (
          <SelectBox
            checked={selected}
            onToggle={() => onToggleSelect(entry.mediaId)}
            label={t("bulk.selectTitle", { title: displayTitle(media.title) })}
            className="absolute left-2 top-2 z-20"
          />
        ) : stack ? (
          <button
            type="button"
            onClick={() => stack.onOpen(entry.mediaId)}
            aria-label={t("stack.open", { title: displayTitle(media.title) })}
            className="absolute bottom-2 left-2 rounded-full bg-on-cover/93 px-2 py-0.5 text-2xs font-semibold text-on-cover-edge focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            {t("stack.count", { count: stack.members.length })}
          </button>
        ) : (
          // A wash under the top corner while the actions show; touch has no hover, so it stays there.
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-on-cover/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100" />
        )
      }
      actions={
        // Suppressed in select mode; keep `group-focus-within`, or Tab lands on fully transparent buttons.
        !selectMode && !stack && (
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
                <PlusOne />
              </IconButton>
            )}
          </div>
        )
      }
    >
      <TagChips notes={entry.notes} />
    </CoverCell>
  );
  if (!stack) return cell;
  // The next two members lie behind the cover, offset up and right, so the stack reads as one before it is opened.
  const behind = stack.members.filter((m) => m.mediaId !== entry.mediaId).slice(0, 2);
  return (
    <div className="relative">
      {behind
        .map((m, i) => (
          <div
            key={m.mediaId}
            aria-hidden
            className={cn(
              "absolute inset-x-0 top-0 aspect-[2/3] overflow-hidden rounded-cover border border-surface-700",
              // Each layer further back is darker and fainter, so the stack recedes into the page.
              i === 0 ? "translate-x-2 -translate-y-2 opacity-70 brightness-60" : "translate-x-3.5 -translate-y-3.5 opacity-40 brightness-40",
            )}
          >
            {m.media.coverImage.large && !blurred && (
              <img src={m.media.coverImage.large} alt="" loading="lazy" className="h-full w-full object-cover" />
            )}
          </div>
        ))
        .reverse()}
      {cell}
    </div>
  );
});

/** A stack's caption: the cover's title, then how many of its members are finished. */
function StackCaption({ lead, members }: { lead: MediaListEntry; members: MediaListEntry[] }) {
  const { t } = useTranslation();
  const done = members.filter((m) => {
    const max = maxProgress(m.media);
    return m.status === "COMPLETED" || (max !== null && m.progress >= max);
  }).length;
  return (
    <>
      <p className="line-clamp-2 text-ui font-medium leading-snug text-ink-100">{displayTitle(lead.media.title)}</p>
      <p className="mb-1.5 mt-0.5 text-xs tabular-nums text-ink-500">{t("stack.summary", { done, count: members.length })}</p>
    </>
  );
}

/** The title, the count and a tick per episode, laid on the cover's foot the way the Overview's cards carry them. */
function CardCaption({ entry, max, unit }: { entry: MediaListEntry; max: number | null; unit: string }) {
  const { t } = useTranslation();
  const { media } = entry;
  return (
    <>
      <p className="line-clamp-2 text-ui font-medium leading-snug text-ink-100">{displayTitle(media.title)}</p>
      <p className="@container mb-1.5 mt-0.5 text-xs tabular-nums text-ink-500">
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
      <ProgressMarks progress={entry.progress} total={max} />
    </>
  );
}
