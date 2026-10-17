import { useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Play, Plus } from "lucide-react";
import { displayTitle, maxProgress, type MediaListEntry, type MediaType } from "@/api/types";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState, PerchRule } from "@/components/EmptyState";
import { canIncrement } from "@/components/list/shared";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useListMutations } from "@/hooks/useListMutations";
import { shouldBlur } from "@/lib/contentFilter";
import { continueRow, progressMarks, progressShare } from "@/lib/overview";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";

/** The narrowest a card may get before the row holds one fewer. */
const CARD_MIN = 150;
const GAP = 12;
/** The ring's radius in its 40-unit box, and so its circumference. */
const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;

/** Continue watching and reading: one row, anime and manga mixed, each card counting its episodes. */
export function ContinueRow({ userId, anime, manga }: { userId: number; anime: MediaListEntry[]; manga: MediaListEntry[] }) {
  const { t } = useTranslation();
  const row = useRef<HTMLDivElement>(null);
  const width = useElementWidth(row);
  const cols = width > 0 ? Math.max(2, Math.floor((width + GAP) / (CARD_MIN + GAP))) : 6;
  const animeSave = useListMutations(userId, "ANIME").save;
  const mangaSave = useListMutations(userId, "MANGA").save;
  const items = continueRow(anime, manga).slice(0, cols);
  return (
    <section>
      <SectionHeader icon={Play} title={t("dashboard.continueBoth")} />
      {items.length === 0 && (
        <EmptyState
          visual={<PerchRule />}
          title={t("dashboard.nothingWatching")}
          hint={<Link to="/seasonal" className="text-accent-400 hover:underline">{t("dashboard.currentSeason")}</Link>}
        />
      )}
      <div ref={row} className={cn("mt-3 grid gap-3", items.length === 0 && "hidden")} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.map(({ entry, type }) => (
          <ContinueCard
            key={`${type}-${entry.id}`}
            entry={entry}
            type={type}
            onPlusOne={() => (type === "ANIME" ? animeSave : mangaSave).mutate({ mediaId: entry.mediaId, progress: entry.progress + 1 })}
          />
        ))}
      </div>
    </section>
  );
}

function ContinueCard({ entry, type, onPlusOne }: { entry: MediaListEntry; type: MediaType; onPlusOne: () => void }) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const total = maxProgress(entry.media);
  const marks = progressMarks(entry.progress, total);
  const share = progressShare(entry.progress, total);
  const title = displayTitle(entry.media.title);
  return (
    <article>
      <div data-cover className="relative aspect-3/4 overflow-hidden rounded-panel bg-surface-900">
        <Link to={`/media/${entry.mediaId}`} aria-label={title} className="absolute inset-0 focus-inset">
          {entry.media.coverImage.large && (
            <img src={entry.media.coverImage.large} alt="" loading="lazy" className={cn("size-full object-cover", shouldBlur(entry.media, level, blurAdult) && "veil")} />
          )}
        </Link>
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-inner bg-on-cover/75 px-2 py-0.5 text-2xs font-medium text-on-cover-edge backdrop-blur">
          {t(type === "ANIME" ? "common.anime" : "common.manga")}
        </span>
        {canIncrement(entry) && (
          <button
            type="button"
            onClick={onPlusOne}
            aria-label={t("common.plusOne")}
            title={t(type === "ANIME" ? "dashboard.markWatched" : "dashboard.markRead", { n: entry.progress + 1 })}
            className="press absolute right-2 top-2 grid size-10 place-items-center"
          >
            <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
              <circle cx="20" cy="20" r={RING_R} fill="none" strokeWidth="3" className="stroke-on-cover-edge/20" />
              <circle cx="20" cy="20" r={RING_R} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-accent-400" strokeDasharray={`${RING_C * share} ${RING_C}`} />
            </svg>
            <span className="grid size-7 place-items-center rounded-full bg-on-cover/75 text-on-cover-edge backdrop-blur">
              <Plus className="size-4" />
            </span>
          </button>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-ui font-medium leading-snug text-ink-100">{title}</p>
        <p className="mb-2 mt-0.5 text-xs text-ink-500">
          {entry.progress} / {total ?? "?"}
          {total ? ` · ${t("dashboard.remaining", { n: Math.max(0, total - entry.progress) })}` : ""}
        </p>
        {marks.kind === "ticks" ? (
          <div className="flex gap-0.5">
            {Array.from({ length: marks.total }, (_, i) => (
              <span
                key={i}
                data-tick={i < marks.done ? "done" : i === marks.done ? "next" : "left"}
                className={cn("h-1.5 flex-1 rounded-mark", i < marks.done ? "bg-accent-400" : i === marks.done ? "bg-ink-500" : "bg-surface-700")}
              />
            ))}
          </div>
        ) : (
          <div data-bar className="h-1.5 overflow-hidden rounded-full bg-surface-700">
            <div className="h-full rounded-full bg-accent-400" style={{ width: `${marks.share * 100}%` }} />
          </div>
        )}
      </div>
    </article>
  );
}
