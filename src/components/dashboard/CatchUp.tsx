import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FastForward } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { ContinueCard } from "@/components/dashboard/ContinueRow";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useListMutations } from "@/hooks/useListMutations";
import type { CatchUp } from "@/lib/overview";

/** The narrowest a card may get before the grid holds one fewer, the continue row's measure. */
const CARD_MIN = 150;
const GAP = 12;

/** Airing anime with aired episodes left unwatched, every one of them as a continue card; gone once caught up. */
export function CatchUpRow({ userId, items }: { userId: number; items: CatchUp[] }) {
  const { t } = useTranslation();
  const grid = useRef<HTMLDivElement>(null);
  const width = useElementWidth(grid);
  const cols = width > 0 ? Math.max(2, Math.floor((width + GAP) / (CARD_MIN + GAP))) : 6;
  const save = useListMutations(userId, "ANIME").save;
  if (items.length === 0) return null;
  const owed = items.reduce((n, c) => n + c.behind, 0);
  return (
    <section>
      <SectionHeader icon={FastForward} title={t("dashboard.catchUp")} meta={owed === 1 ? t("dashboard.catchUpOne") : t("dashboard.catchUpCount", { n: owed })} />
      <div ref={grid} className="mt-3 grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.map((c) => (
          <ContinueCard
            key={c.entry.id}
            entry={c.entry}
            type="ANIME"
            catchUp={c}
            onPlusOne={() => save.mutate({ mediaId: c.entry.mediaId, progress: c.entry.progress + 1 })}
          />
        ))}
      </div>
    </section>
  );
}
