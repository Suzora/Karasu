import { scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { Card, CardTitle } from "@/components/ui/card";
import { seriesDelay } from "@/lib/motion";

/** The fill's accent gradient, left to right, so the bar's end carries the light. */
const FILL = "linear-gradient(to right, var(--color-accent-600), var(--color-accent-400))";

/** Accent-gradient bars, one row per labelled value; `domain` pins the axis so a score bar is not scaled to its top row. */
export function GradientBars({
  title,
  hint,
  rows,
  domain,
}: {
  title: string;
  hint?: string;
  rows: { label: string; value: number; text: string; sub?: string }[];
  domain?: number;
}) {
  if (rows.length === 0) return null;

  const top = domain ?? max(rows, (r) => r.value) ?? 1;
  const x = scaleLinear().domain([0, top]).range([0, 100]).clamp(true);

  return (
    <Card className="flex h-full flex-col">
      <CardTitle>{title}</CardTitle>
      {hint && <p className="mt-1 text-2xs text-ink-600">{hint}</p>}
      <div className="mt-4 flex flex-1 flex-col justify-around gap-2.5">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-300">{r.label}</span>
              <span className="shrink-0 tabular-nums text-ink-100">
                {r.text}
                {r.sub && <span className="ml-1.5 text-2xs text-ink-600">{r.sub}</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-mark bg-surface-800" aria-hidden="true">
              <div
                data-keep-colors
                className="h-full rounded-mark chart-in"
                style={{
                  width: `${Math.max(x(r.value), 1)}%`,
                  background: FILL,
                  animationDelay: `${seriesDelay(i, rows.length)}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
