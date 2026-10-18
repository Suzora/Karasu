import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Library } from "lucide-react";
import type { MediaListEntry, MediaType } from "@/api/types";
import { SectionHeader } from "@/components/ui/section-header";
import { shelfStatuses, spineHeight } from "@/lib/overview";
import { statusColorVar } from "@/lib/statusColors";
import { cn } from "@/lib/utils";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";

/** How many spines a shelf tries to hold; the tile clips whatever does not fit its width. */
const SPINES = 12;

/** My lists as shelves: each status a row of its titles' cover spines on a rule in the status colour, and its count. */
export function ListShelves({ anime, manga, cols }: { anime: MediaListEntry[]; manga: MediaListEntry[]; cols: number }) {
  const { t } = useTranslation();
  const [type, setType] = useState<MediaType>("ANIME");
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const list = type === "ANIME" ? anime : manga;
  const toggle = (
    <div className="flex rounded-full bg-surface-900 surface-outline p-1">
      {(["ANIME", "MANGA"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === type}
          onClick={() => setType(v)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition-surface", v === type ? "nav-pill" : "text-ink-500 hover:text-ink-100")}
        >
          {t(v === "ANIME" ? "common.anime" : "common.manga")} {(v === "ANIME" ? anime : manga).length}
        </button>
      ))}
    </div>
  );
  return (
    <section>
      <SectionHeader icon={Library} title={t("dashboard.myLists")} action={toggle} />
      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {shelfStatuses().map((status) => {
          const items = list.filter((e) => e.status === status);
          const label = t(`status.${type}.${status}`);
          return (
            <Link
              key={status}
              to={`${type === "ANIME" ? "/list" : "/manga"}?tab=${status}`}
              aria-label={`${label}, ${items.length}`}
              className="block rounded-panel bg-surface-900 p-3 pb-2.5 surface-outline transition-surface hover:bg-surface-850"
            >
              <div data-shelf-rule className="flex h-20 items-end gap-1 overflow-hidden border-b-2 pb-px" style={{ borderColor: statusColorVar(status) }}>
                {items.slice(0, SPINES).map((e, i) =>
                  e.media.coverImage.large ? (
                    <img key={e.id} src={e.media.coverImage.large} alt="" loading="lazy" className={cn("w-3.5 shrink-0 rounded-t-mark object-cover", shouldBlur(e.media, level, blurAdult) && "veil-thumb")} style={{ height: `${spineHeight(e.mediaId, i)}%` }} />
                  ) : null,
                )}
                {items.length === 0 && <span className="pb-2 text-xs text-ink-600">{t("dashboard.shelfEmpty")}</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="truncate text-ui text-ink-100">{label}</span>
                <span className="ml-auto font-brand text-base tabular-nums text-ink-300">{items.length}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
