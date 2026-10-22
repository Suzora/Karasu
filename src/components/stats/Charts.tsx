import { Fragment, useRef } from "react";
import { arcPath, polar, slices } from "@/lib/charts";
import { seriesDelay } from "@/lib/motion";
import { useElementWidth } from "@/hooks/useElementWidth";

import { TONES } from "./tones";

export interface Slice {
  label: string;
  value: number;
  /** The group's own colour, a status's above all; without one the group takes the shared ramp. */
  color?: string;
  /** The fill class for the count on a `color` wedge, which the ramp's own inks were not chosen for. */
  ink?: string;
  /** `key` is what the parts were counted by, so a translated label never splits or merges them. */
  children?: { key?: string; label: string; value: number }[];
}

/** A sunburst of groups and their parts; children inherit the parent's hue stepped down in opacity. */
export function Sunburst({ data, size: fallback = 260 }: { data: Slice[]; size?: number }) {
  const box = useRef<HTMLDivElement>(null);
  // The drawn width as the viewBox, so the counts render at their type step instead of shrinking with the ring.
  const size = useElementWidth(box) || fallback;
  const c = size / 2;
  const inner = size * 0.17;
  const mid = size * 0.32;
  const outer = size * 0.49;
  const arcs = slices(data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div ref={box} className="w-full">
      <svg data-chart viewBox={`0 0 ${size} ${size}`} className="block w-full">
        {data.map((group, i) => {
          const tone = group.color ?? TONES[i % TONES.length];
          const span = arcs[i];
          const kids = group.children ?? [];
          const kidArcs = slices(kids.map((k) => k.value));
          const width = span.end - span.start;
          return (
            <Fragment key={group.label}>
              {/* Wedge and number arrive as one `<g>`, scaled not swept so the sweep cannot cross `ArcValue`'s threshold. */}
              <g
                className="chart-in"
                style={{ animationDelay: `${seriesDelay(i, data.length)}ms` }}
              >
                <path
                  d={arcPath(c, c, inner, mid, span.start, span.end)}
                  fill={tone}
                  stroke="var(--color-surface-900)"
                  strokeWidth={1}
                >
                  <title>{`${group.label}: ${group.value}`}</title>
                </path>
                {/* A group with its own colour brings its ink; of the ramp only the two accent tones carry `accent-ink`. */}
                <ArcValue
                  c={c}
                  r={(inner + mid) / 2}
                  from={span.start}
                  to={span.end}
                  value={group.value}
                  tone={group.ink ?? (i < 2 && !group.color ? "fill-accent-ink" : "fill-ink-100")}
                />
              </g>
              {/* The outer ring is the parent's hue faded over the card, so it takes the light ink throughout. */}
              {kids.map((kid, j) => {
                // The child's slice is its share of the parent's own wedge.
                const from = span.start + (kidArcs[j].start / 360) * width;
                const to = span.start + (kidArcs[j].end / 360) * width;
                return (
                  <g
                    key={kid.key ?? kid.label}
                    className="chart-in"
                    style={{
                      animationDelay: `${
                        seriesDelay(i, data.length) +
                        seriesDelay(j + 1, kids.length + 1) / 2
                      }ms`,
                    }}
                  >
                    <path
                      d={arcPath(c, c, mid + 1, outer, from, to)}
                      fill={tone}
                      opacity={Math.max(0.28, 0.82 - j * 0.13)}
                      stroke="var(--color-surface-900)"
                      strokeWidth={1}
                    >
                      <title>{`${group.label} · ${kid.label}: ${kid.value}`}</title>
                    </path>
                    <ArcValue
                      c={c}
                      r={(mid + outer) / 2}
                      from={from}
                      to={to}
                      value={kid.value}
                      tone="fill-ink-100"
                      halo
                    />
                  </g>
                );
              })}
            </Fragment>
          );
        })}
        <text
          x={c}
          y={c + 4}
          textAnchor="middle"
          className="animate-fade-in fill-ink-300 text-base font-semibold tabular-nums"
        >
          {total}
        </text>
      </svg>
    </div>
  );
}

/** A count inside its own wedge, only where the arc at its radius is wider than the number drawn there. */
function ArcValue({
  c,
  r,
  from,
  to,
  value,
  tone,
  halo = false,
}: {
  c: number;
  r: number;
  from: number;
  to: number;
  value: number;
  tone: string;
  /** A rim in the card's colour, for a ring whose faded fill alone leaves the ink short of 4.5:1. */
  halo?: boolean;
}) {
  if (((to - from) * Math.PI * r) / 180 < String(value).length * 7 + 6) return null;
  const at = polar(c, c, r, (from + to) / 2);
  return (
    <text
      x={at.x}
      y={at.y + 3}
      textAnchor="middle"
      className={`${tone} pointer-events-none text-xs font-medium tabular-nums`}
      {...(halo ? { stroke: "var(--color-surface-900)", strokeWidth: 2.5, strokeLinejoin: "round" as const, paintOrder: "stroke" } : {})}
    >
      {value}
    </text>
  );
}

/** A legend for whatever the sunburst or the stacked bar just drew, in the same colours. */
export function ToneLegend({
  items,
  locale,
}: {
  items: { label: string; value: number; color?: string }[];
  locale: string;
}) {
  // One column that may shrink, since beside a ring the legend is narrow and a second column cut labels to a few letters.
  return (
    <div className="grid grid-cols-1 gap-y-1.5">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          {/* The inset hairline keeps a pale swatch visible on a white panel. */}
          <span
            data-keep-colors
            className="size-2 shrink-0 rounded-mark ring-1 ring-(--hair) ring-inset"
            style={{ background: item.color ?? TONES[i % TONES.length] }}
          />
          <span className="min-w-0 flex-1 truncate text-ink-500" title={item.label}>
            {item.label}
          </span>
          <span className="shrink-0 tabular-nums text-ink-300">{item.value.toLocaleString(locale)}</span>
        </div>
      ))}
    </div>
  );
}


// `LineChart` lived here until `AreaChart` superseded it; nothing that dashes a stroke may put it into screen space.

