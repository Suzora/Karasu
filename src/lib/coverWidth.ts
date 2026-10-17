/** The narrowest a cover is ever drawn, so a score and one corner control still fit on it. */
export const COVER_MIN_PX = 88;

/** One cover's width: the main area split into `cols` covers between its gutters, with `gap` between neighbours. */
export function coverWidth(mainWidth: number, cols: number, gutter: number, gap: number): number {
  const n = Math.max(1, cols);
  const width = (mainWidth - 2 * gutter - (n - 1) * gap) / n;
  return Number.isFinite(width) && width > COVER_MIN_PX ? width : COVER_MIN_PX;
}
