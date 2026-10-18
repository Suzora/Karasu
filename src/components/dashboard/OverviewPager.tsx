import { useRef, useState, type ReactNode } from "react";
import { pagerIndex } from "@/lib/overview";
import { cn } from "@/lib/utils";

/** The phone Overview as pages side by side: each the phone's width, swiped sideways, floating dots to say and switch. */
export function OverviewPager({ pages }: { pages: { label: string; node: ReactNode }[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  // The step from one page to the next, gap included, read off the second page's place.
  const step = () => (track.current?.children[1] as HTMLElement | undefined)?.offsetLeft ?? 0;
  const go = (i: number) => track.current?.scrollTo({ left: i * step(), behavior: "smooth" });
  return (
    <div className="relative">
      <div
        ref={track}
        data-pager
        onScroll={(e) => setAt(pagerIndex(e.currentTarget.scrollLeft, step(), pages.length))}
        className="-mx-4 flex items-start gap-8 snap-x snap-mandatory scroll-px-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p, i) => (
          <section key={p.label} aria-label={p.label} className={cn("w-full min-w-0 shrink-0 snap-start", i !== at && "max-h-screen overflow-hidden")}>
            {p.node}
          </section>
        ))}
      </div>
      <div className="pager-dots z-30 flex items-center gap-2 rounded-full bg-surface-800/95 px-3 py-2 shadow-float backdrop-blur">
        {pages.map((p, i) => (
          <button
            key={p.label}
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
