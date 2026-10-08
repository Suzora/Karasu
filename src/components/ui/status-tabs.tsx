import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { EDGE_PX, edgeMask, useScrollEdges } from "./scroll-row";

export interface StatusTab<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** The underline's colour while this tab is the active one; the accent when absent. */
  color?: string;
}

/** One row of tabs that scrolls sideways instead of wrapping, with a single underline that slides to the active tab. */
export function StatusTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly StatusTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The tablist's accessible name. */
  label?: string;
  className?: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);
  // The strip's fades and its sideways wheel are the shared scroller's, so every scrolling row fades the same way.
  const { edges, read: readEdges } = useScrollEdges(stripRef, rowRef);
  // The tab holding the one tab stop while arrows walk the row; null means the active tab holds it.
  const [roving, setRoving] = useState<T | null>(null);

  // Relative to the row, which is the tabs' offset parent, so no padding of the page can shift the underline.
  const measure = useCallback(() => {
    const el = refs.current.get(value);
    setBar(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, [value]);

  // The signature covers everything that can change a tab's width: the labels and the counts.
  const signature = tabs.map((tab) => `${tab.label}:${tab.count ?? ""}`).join("|");
  useLayoutEffect(measure, [measure, signature]);

  // The row re-measures its underline when a font arrives or a count grows.
  useLayoutEffect(() => {
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // A tab chosen by a swipe or a URL may sit past the edge; the first placement jumps, later ones glide.
  const placed = useRef(false);
  useLayoutEffect(() => {
    const s = stripRef.current;
    const el = refs.current.get(value);
    if (!s || !el) return;
    const left = el.offsetLeft - EDGE_PX;
    const right = el.offsetLeft + el.offsetWidth + EDGE_PX - s.clientWidth;
    const target = s.scrollLeft > left ? left : s.scrollLeft < right ? right : null;
    const glide = placed.current && !prefersReducedMotion();
    placed.current = true;
    if (target === null) return;
    const x = Math.max(0, target);
    if (glide && typeof s.scrollTo === "function") s.scrollTo({ left: x, behavior: "smooth" });
    else s.scrollLeft = x;
    readEdges();
  }, [value, readEdges]);


  // Arrows only move focus; Enter and Space activate through the button, since every switch resets the list.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setRoving(tabs[next].value);
    refs.current.get(tabs[next].value)?.focus();
  };

  // Leaving the row hands the tab stop back to the active tab, so Tab always re-enters on the selected one.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!rowRef.current?.contains(e.relatedTarget as Node | null)) setRoving(null);
  };

  const stop = roving ?? value;
  const color = tabs.find((tab) => tab.value === value)?.color ?? "var(--color-accent-500)";

  return (
    <div
      ref={stripRef}
      onScroll={readEdges}
      // Pulled out by the tabs' own inset, so the first label lines up with the heading above it.
      className={cn(
        "-mx-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      style={edgeMask(edges)}
    >
      <div
        ref={rowRef}
        role="tablist"
        aria-label={label}
        onBlur={onBlur}
        className="relative flex w-max gap-3"
      >
        {tabs.map((tab, i) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                if (el) refs.current.set(tab.value, el);
                else refs.current.delete(tab.value);
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={tab.value === stop ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => {
                setRoving(null);
                onChange(tab.value);
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-inner px-1 pb-3 pt-1 text-ui font-medium transition-surface",
                // Inset, because the strip clips anything drawn outside a tab.
                "focus-inset",
                active ? "text-ink-100" : "text-ink-500 hover:text-ink-300",
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-2xs tabular-nums transition-surface",
                    active ? "bg-surface-700 text-ink-100" : "bg-surface-800 text-ink-600",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
        {bar && (
          <span
            aria-hidden="true"
            data-tab-line
            // The colour is the status, so High Contrast keeps it rather than flattening the line into the page.
            data-keep-colors
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-(--tab-line) transition-[left,width,background-color]"
            style={{ left: bar.left, width: bar.width, "--tab-line": color } as CSSProperties}
          />
        )}
      </div>
    </div>
  );
}
