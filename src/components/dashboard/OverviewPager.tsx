import { useRef, useState, type ReactNode } from "react";
import { pagerIndex } from "@/lib/overview";
import { cn } from "@/lib/utils";

/** The phone Overview as pages side by side: swiped sideways, the next one peeking in, floating dots to say and switch. */
export function OverviewPager({ pages }: { pages: { label: string; node: ReactNode }[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const pageWidth = () => (track.current?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
  const go = (i: number) => track.current?.scrollTo({ left: i * pageWidth(), behavior: "smooth" });
  return (
    <div className="relative">
      <div
        ref={track}
        data-pager
        onScroll={(e) => setAt(pagerIndex(e.currentTarget.scrollLeft, pageWidth(), pages.length))}
        className="-mx-4 flex items-start snap-x snap-mandatory scroll-px-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((p, i) => (
          <section key={p.label} aria-label={p.label} className={cn("w-pager-page min-w-0 shrink-0 snap-start", i < pages.length - 1 && "pr-3", i !== at && "max-h-screen overflow-hidden")}>
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
