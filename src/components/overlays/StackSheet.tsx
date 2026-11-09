import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { displayTitle, maxProgress, type MediaListEntry } from "@/api/types";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { PlusOne } from "@/components/ui/plus-one";
import { canIncrement } from "@/components/list/shared";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { cn } from "@/lib/utils";

/** One stack's members as rows, with their progress, a +1 and the order; a sheet over the list rather than a band in it. */
export default function StackSheet({
  leaving,
  members,
  unit,
  onPlusOne,
  onMove,
  onTake,
  onDissolve,
  onClose,
}: {
  leaving?: boolean;
  members: MediaListEntry[];
  unit: string;
  onPlusOne: (entry: MediaListEntry) => void;
  onMove: (mediaId: number, by: -1 | 1) => void;
  onTake: (mediaId: number) => void;
  onDissolve: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const lead = members[0];
  return (
    <Modal
      leaving={leaving}
      title={t("stack.sheetTitle", { title: lead ? displayTitle(lead.media.title) : "" })}
      description={t("stack.hint")}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onDissolve}>
          {t("stack.dissolve")}
        </Button>
      }
    >
      <ol className="flex flex-col">
        {members.map((entry, i) => {
          const title = displayTitle(entry.media.title);
          const max = maxProgress(entry.media);
          return (
            <li key={entry.mediaId} className="flex items-center gap-3 border-surface-800 py-2.5 not-first:border-t">
              <div className="flex flex-col">
                <IconButton
                  size="xs"
                  disabled={i === 0}
                  onClick={() => onMove(entry.mediaId, -1)}
                  aria-label={t("stack.moveUp", { title })}
                  title={t("stack.moveUp", { title })}
                >
                  <ArrowUp className="size-3.5" />
                </IconButton>
                <IconButton
                  size="xs"
                  disabled={i === members.length - 1}
                  onClick={() => onMove(entry.mediaId, 1)}
                  aria-label={t("stack.moveDown", { title })}
                  title={t("stack.moveDown", { title })}
                >
                  <ArrowDown className="size-3.5" />
                </IconButton>
              </div>
              <Link to={`/media/${entry.media.id}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 rounded-control">
                {entry.media.coverImage.large && (
                  <img
                    src={entry.media.coverImage.large}
                    alt=""
                    className={cn("h-16 w-11 shrink-0 rounded-inner object-cover", shouldBlur(entry.media, level, blurAdult) && "veil")}
                  />
                )}
                <span className="min-w-0">
                  <span className="line-clamp-2 text-ui font-medium text-ink-100">{title}</span>
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
                  onClick={() => onPlusOne(entry)}
                  aria-label={t("common.plusOne")}
                  title={t("common.plusOne")}
                >
                  <PlusOne />
                </IconButton>
              )}
              <IconButton
                size="sm"
                onClick={() => onTake(entry.mediaId)}
                aria-label={t("stack.take", { title })}
                title={t("stack.take", { title })}
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
