import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { GripVertical, X } from "lucide-react";
import { displayTitle, maxProgress, type MediaListEntry } from "@/api/types";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { PlusOne } from "@/components/ui/plus-one";
import { canIncrement } from "@/components/list/shared";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { cn } from "@/lib/utils";

/** The drag in flight: which member, where the pointer started in its current slot, and how far it has gone. */
interface Drag {
  mediaId: number;
  originY: number;
  dy: number;
}

/** One stack's members as rows, with their progress and a +1; dragged or Alt+arrowed into order, arrowed through. */
export default function StackSheet({
  leaving,
  name,
  members,
  unit,
  onPlusOne,
  onMove,
  onTake,
  onRename,
  onDissolve,
  onClose,
}: {
  leaving?: boolean;
  /** The user's name for the stack, or null to read as its front title. */
  name?: string | null;
  members: MediaListEntry[];
  unit: string;
  onPlusOne: (entry: MediaListEntry) => void;
  onMove: (mediaId: number, by: -1 | 1) => void;
  onTake: (mediaId: number) => void;
  onRename?: () => void;
  onDissolve: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const listRef = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  // After a keyboard move the row re-renders in its new slot, and the caret has to follow it there.
  const [refocus, setRefocus] = useState<{ mediaId: number; role: string } | null>(null);
  const lead = members[0];
  const title = name || (lead ? displayTitle(lead.media.title) : "");

  useEffect(() => {
    if (!refocus) return;
    listRef.current
      ?.querySelector<HTMLElement>(`li[data-member="${refocus.mediaId}"] [data-row-focus="${refocus.role}"]`)
      ?.focus();
    setRefocus(null);
  }, [refocus, members]);

  const rowHeight = (mediaId: number) =>
    listRef.current?.querySelector<HTMLElement>(`li[data-member="${mediaId}"]`)?.offsetHeight ?? 64;

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, mediaId: number) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ mediaId, originY: e.clientY, dy: 0 });
  };

  // Past half a row the member trades places with its neighbour, and the origin moves with it so the row stays put.
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const dy = e.clientY - drag.originY;
    const at = members.findIndex((m) => m.mediaId === drag.mediaId);
    const h = rowHeight(drag.mediaId);
    if (dy > h / 2 && at < members.length - 1) {
      onMove(drag.mediaId, 1);
      setDrag({ ...drag, originY: drag.originY + h, dy: dy - h });
    } else if (dy < -h / 2 && at > 0) {
      onMove(drag.mediaId, -1);
      setDrag({ ...drag, originY: drag.originY - h, dy: dy + h });
    } else {
      setDrag({ ...drag, dy });
    }
  };

  const endDrag = () => setDrag(null);

  // Up and down walk the rows on the same control; with Alt they carry the row along, as a list's keys do.
  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const el = e.target as HTMLElement;
    const role = el.dataset.rowFocus;
    const row = el.closest<HTMLElement>("li[data-member]");
    if (!role || !row) return;
    e.preventDefault();
    const mediaId = Number(row.dataset.member);
    const at = members.findIndex((m) => m.mediaId === mediaId);
    const by = e.key === "ArrowUp" ? -1 : 1;
    if (e.altKey) {
      if (at + by < 0 || at + by >= members.length) return;
      onMove(mediaId, by);
      setRefocus({ mediaId, role });
      return;
    }
    const next = members[at + by];
    if (next) setRefocus({ mediaId: next.mediaId, role });
  };

  return (
    <Modal
      leaving={leaving}
      title={t("stack.sheetTitle", { title })}
      description={t("stack.hint")}
      onClose={onClose}
      footer={
        <>
          {onRename && (
            <Button variant="ghost" onClick={onRename}>
              {t("stack.rename")}
            </Button>
          )}
          <Button variant="secondary" onClick={onDissolve}>
            {t("stack.dissolve")}
          </Button>
        </>
      }
    >
      <ol ref={listRef} className="flex flex-col" onKeyDown={onKeyDown}>
        {members.map((entry) => {
          const entryTitle = displayTitle(entry.media.title);
          const max = maxProgress(entry.media);
          const dragging = drag?.mediaId === entry.mediaId;
          return (
            <li
              key={entry.mediaId}
              data-member={entry.mediaId}
              className={cn(
                "relative flex items-center gap-3 rounded-control border-surface-800 py-2.5 not-first:border-t",
                dragging && "z-10 bg-surface-850 shadow-float",
              )}
              style={dragging ? { transform: `translateY(${drag.dy}px)` } : undefined}
            >
              <button
                type="button"
                data-row-focus="handle"
                aria-label={t("stack.handle", { title: entryTitle })}
                aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                onPointerDown={(e) => onPointerDown(e, entry.mediaId)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                  "grid h-10 w-6 shrink-0 touch-none place-items-center rounded-inner text-ink-500 transition-surface hover:text-ink-100",
                  "focus-visible:outline-2 focus-visible:outline-accent-500",
                  dragging ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                <GripVertical aria-hidden className="size-4" />
              </button>
              <Link
                to={`/media/${entry.media.id}`}
                data-row-focus="link"
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-control focus-visible:outline-2 focus-visible:outline-accent-500"
              >
                {entry.media.coverImage.large && (
                  <img
                    src={entry.media.coverImage.large}
                    alt=""
                    draggable={false}
                    className={cn("h-16 w-11 shrink-0 rounded-inner object-cover", shouldBlur(entry.media, level, blurAdult) && "veil")}
                  />
                )}
                <span className="min-w-0">
                  <span className="line-clamp-2 text-ui font-medium text-ink-100">{entryTitle}</span>
                  <span className="text-xs tabular-nums text-ink-500">
                    {entry.progress}
                    {max ? ` / ${max}` : ""} {unit}
                  </span>
                </span>
              </Link>
              {canIncrement(entry) && (
                <IconButton
                  variant="accent"
                  size="sm"
                  round
                  data-row-focus="plus"
                  onClick={() => onPlusOne(entry)}
                  aria-label={t("common.plusOne")}
                  title={t("common.plusOne")}
                >
                  <PlusOne />
                </IconButton>
              )}
              <IconButton
                size="sm"
                data-row-focus="take"
                onClick={() => onTake(entry.mediaId)}
                aria-label={t("stack.take", { title: entryTitle })}
                title={t("stack.take", { title: entryTitle })}
              >
                <X className="size-3.5" />
              </IconButton>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
}
