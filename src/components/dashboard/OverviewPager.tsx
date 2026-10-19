import { useRef, useState, type ReactNode } from "react";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { pagerIndex } from "@/lib/overview";
import { cn } from "@/lib/utils";

/** The phone Overview as pages side by side: each the phone's width and its own scroller, dots to say and switch. */
export function OverviewPager({ pages }: { pages: { label: string; slot: string; node: ReactNode }[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  // A page is the track's whole width, so one step sideways is the track's own width.
  const step = () => track.current?.clientWidth ?? 0;
  const go = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: "smooth" });
  return (
    <div className="relative h-full">
      <div
        ref={track}
        data-pager
        onScroll={(e) => setAt(pagerIndex(e.currentTarget.scrollLeft, step(), pages.length))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p) => (
          <PagerPage key={p.slot} label={p.label} slot={p.slot}>
            {p.node}
          </PagerPage>
        ))}
      </div>
      <div className="pager-dots z-30 flex items-center gap-2 rounded-full bg-surface-800/95 px-3 py-2 shadow-float backdrop-blur">
        {pages.map((p, i) => (
          <button
            key={p.slot}
            type="button"
            aria-label={p.label}
            aria-current={i === at ? true : undefined}
            onClick={() => go(i)}
            className={cn("relative coarse:hit-area h-2 rounded-full transition-[width]", i === at ? "w-6 bg-accent-400" : "w-2 bg-surface-600")}
          />
        ))}
      </div>
    </div>
  );
}

/** One page: it scrolls on its own and keeps its own place, so the other page never moves with it. */
function PagerPage({ label, slot, children }: { label: string; slot: string; children: ReactNode }) {
  const scroller = useRef<HTMLElement>(null);
  useScrollMemory(scroller, slot);
  return (
    <section
      ref={scroller}
      aria-label={label}
      className="h-full w-full min-w-0 shrink-0 snap-start overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 pb-24 pt-4 float-clear"
    >
      {children}
    </section>
  );
}
