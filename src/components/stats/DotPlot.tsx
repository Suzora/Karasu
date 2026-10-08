import { scaleLinear } from "d3-scale";
import { Card, CardTitle } from "@/components/ui/card";
import { seriesDelay } from "@/lib/motion";
import { formatDecimal } from "@/lib/format";

/** A dumbbell plot: two scores per row on one 0-`max` axis, where `max` is the account's score scale top. */
export interface DotPlotRow {
  /** The row's key where labels can repeat, as two titles can. */
  id?: string | number;
  label: string;
  mine: number;
  other: number;
}

export function DotPlot({
  title,
  hint,
  rows,
  legendMine,
  legendOther,
  max = 10,
  locale,
}: {
  title: string;
  hint?: string;
  rows: DotPlotRow[];
  legendMine: string;
  legendOther: string;
  max?: number;
  locale: string;
}) {
  if (rows.length === 0) return null;
  const X = scaleLinear().domain([0, max]).range([3, 97]).clamp(true);

  return (
    <Card className="flex h-full flex-col">
      <CardTitle>{title}</CardTitle>
      {hint && <p className="mt-1 text-2xs text-ink-600">{hint}</p>}

      <div className="mt-4 flex flex-1 flex-col justify-around gap-3">
        {rows.map((r, i) => (
          <div key={r.id ?? r.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-300">{r.label}</span>
              <span className="shrink-0 tabular-nums text-ink-100">
                {formatDecimal(r.other, locale, 1)}
                <span className="mx-1 text-ink-600">→</span>
                {formatDecimal(r.mine, locale, 1)}
              </span>
            </div>
            <div
              className="relative mt-1 h-3 chart-in"
              aria-hidden="true"
              style={{ animationDelay: `${seriesDelay(i, rows.length)}ms` }}
            >
              {/* Lines only: the stretched viewBox would draw a dot as an ellipse, so the dots are spans. */}
              <svg
                data-chart
                className="absolute inset-0 size-full"
                viewBox="0 0 100 12"
                preserveAspectRatio="none"
              >
                {/* The axis, faint, so a lone pair still reads as a position. */}
                <line
                  x1="3"
                  y1="6"
                  x2="97"
                  y2="6"
                  stroke="var(--color-surface-800)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={X(r.other)}
                  y1="6"
                  x2={X(r.mine)}
                  y2="6"
                  stroke="var(--color-surface-600)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span
                data-keep-colors
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${X(r.other)}%`, background: "var(--color-graph-none)" }}
              />
              <span
                data-keep-colors
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${X(r.mine)}%`, background: "var(--color-accent-400)" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-2xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span
            data-keep-colors
            className="size-2 rounded-full"
            style={{ background: "var(--color-accent-400)" }}
          />
          {legendMine}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            data-keep-colors
            className="size-2 rounded-full"
            style={{ background: "var(--color-graph-none)" }}
          />
          {legendOther}
        </span>
      </div>
    </Card>
  );
}
