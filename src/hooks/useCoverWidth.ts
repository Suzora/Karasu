import { useEffect, type RefObject } from "react";
import { coverWidth } from "@/lib/coverWidth";
import { useTheme } from "@/stores/theme";

/** Writes `--cover-w` on the main area, so every cover grid fits covers of one width whatever it stands beside. */
export function useCoverWidth(main: RefObject<HTMLElement | null>, phone: boolean) {
  const cols = useTheme((s) => s.coverCols);
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    // The page gutter and the grid gap the screens use, a phone's narrower; the grids read only the result.
    const gutter = phone ? 16 : 32;
    const gap = phone ? 12 : 16;
    const write = () => el.style.setProperty("--cover-w", `${coverWidth(el.clientWidth, cols, gutter, gap)}px`);
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => ro.disconnect();
  }, [main, cols, phone]);
}
