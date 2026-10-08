import { useRef } from "react";
import { area, curveMonotoneX, line } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import { seriesDelay } from "@/lib/motion";
import { useElementWidth } from "@/hooks/useElementWidth";

/** The width laid out until the drawn one is measured. */
const FALLBACK_WIDTH = 620;

/** A smoothed area over years; `curveMonotoneX` never overshoots, and `pathLength={1}` keeps the draw-on pure markup. */
export function AreaChart({
  data,
  height = 150,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  // The drawn width as the viewBox, so a label is set at its type step rather than scaled under it.
  const W = useElementWidth(box) || FALLBACK_WIDTH;
  if (data.length < 2) return null;

  const padX = 14;
  const top = 16;
  const bottom = 20;
  const floor = height - bottom;

  const x = scalePoint<string>()
    .domain(data.map((d) => d.label))
    .range([padX, W - padX]);
  const y = scaleLinear()
    .domain([0, Math.max(...data.map((d) => d.value), 1)])
    .range([floor, top]);

  const pts = data.map((d) => ({ x: x(d.label) ?? 0, y: y(d.value) }));
  // Drawn at their real size the labels can collide, so every nth point is labelled, counted back from the newest.
  const longest = Math.max(...data.map((d) => Math.max(d.label.length, String(d.value).length)));
  const every = Math.max(1, Math.ceil((longest * 6 + 6) / ((W - 2 * padX) / (data.length - 1))));
  const labelled = (i: number) => (data.length - 1 - i) % every === 0;
  const areaPath = area<{ x: number; y: number }>()
    .x((p) => p.x)
    .y0(floor)
    .y1((p) => p.y)
    .curve(curveMonotoneX)(pts);
  const linePath = line<{ x: number; y: number }>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveMonotoneX)(pts);

  return (
    <div ref={box} className="w-full">
      <svg data-chart viewBox={`0 0 ${W} ${height}`} className="block w-full">
        <path d={areaPath ?? ""} fill="rgba(var(--accent-rgb), .14)" className="animate-fade-in" />
        <path
          d={linePath ?? ""}
          fill="none"
          stroke="var(--color-accent-500)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            ["--draw-length" as string]: 1,
            animation: "drawLine 900ms var(--ease-out-expo) forwards",
          }}
        />
        {pts.map((p, i) => (
          <g
            key={data[i].label}
            className="chart-in"
            style={{ animationDelay: `${seriesDelay(i, pts.length)}ms` }}
          >
            <title>{`${data[i].label}: ${data[i].value}`}</title>
            <circle cx={p.x} cy={p.y} r={2.5} fill="var(--color-accent-400)" />
            {labelled(i) && (
              <>
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  className="fill-ink-300 text-2xs font-medium tabular-nums"
                >
                  {data[i].value}
                </text>
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-ink-600 text-2xs tabular-nums"
                >
                  {data[i].label}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
