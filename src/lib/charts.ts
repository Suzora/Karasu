/** Chart geometry for the statistics panels, in SVG user units with angles in degrees clockwise from twelve o'clock. */

export interface Point {
  x: number;
  y: number;
}

export function polar(cx: number, cy: number, r: number, deg: number): Point {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** One ring segment; a full circle is drawn as two half arcs, since an SVG arc whose ends coincide draws nothing. */
export function arcPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
): string {
  const sweep = Math.abs(a1 - a0);
  if (sweep >= 359.999) {
    const half = a0 + 180;
    return [
      ring(cx, cy, r1, a0, half),
      ring(cx, cy, r1, half, a0 + 359.999),
      "Z",
      ring(cx, cy, r0, a0, half),
      ring(cx, cy, r0, half, a0 + 359.999),
      "Z",
    ].join(" ");
  }
  const outerStart = polar(cx, cy, r1, a0);
  const outerEnd = polar(cx, cy, r1, a1);
  const innerEnd = polar(cx, cy, r0, a1);
  const innerStart = polar(cx, cy, r0, a0);
  const large = sweep > 180 ? 1 : 0;
  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${r1},${r1} 0 ${large} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerEnd.x},${innerEnd.y}`,
    `A${r0},${r0} 0 ${large} 0 ${innerStart.x},${innerStart.y}`,
    "Z",
  ].join(" ");
}

function ring(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const from = polar(cx, cy, r, a0);
  const to = polar(cx, cy, r, a1);
  return `M${from.x},${from.y} A${r},${r} 0 0 1 ${to.x},${to.y}`;
}

/** Slice boundaries for a set of values laid round a full turn. */
export function slices(values: number[]): { start: number; end: number }[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  if (total <= 0) return values.map(() => ({ start: 0, end: 0 }));
  let at = 0;
  return values.map((v) => {
    const start = at;
    at += (Math.max(0, v) / total) * 360;
    return { start, end: at };
  });
}
