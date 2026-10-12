import { useEffect, type RefObject } from "react";

/** The gap between the floating stack and the content it clears, so the last row ends above it rather than at its edge. */
const GAP_PX = 16;

/** Publishes the floating stack's height as `--float-inset`, which `float-clear` turns into room at a scroller's end. */
export function useFloatInset(stack: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const h = el.getBoundingClientRect().height;
      root.style.setProperty("--float-inset", h > 0 ? `${Math.ceil(h) + GAP_PX}px` : "0px");
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--float-inset");
    };
  }, [stack]);
}
