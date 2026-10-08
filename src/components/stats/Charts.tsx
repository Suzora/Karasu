import { Fragment, useRef } from "react";
import {
  arcPath,
  pointsAttr,
  polar,
  radarPoints,
  slices,
  squarify,
} from "@/lib/charts";
import { motionDuration, seriesDelay } from "@/lib/motion";
import { useElementWidth } from "@/hooks/useElementWidth";

import { TONES, onAccent } from "./tones";

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
}: {
  c: number;
  r: number;
  from: number;
  to: number;
  value: number;
  tone: string;
}) {
  if (((to - from) * Math.PI * r) / 180 < String(value).length * 7 + 6) return null;
  const at = polar(c, c, r, (from + to) / 2);
  return (
    <text
      x={at.x}
      y={at.y + 3}
      textAnchor="middle"
      className={`${tone} pointer-events-none text-xs font-medium tabular-nums`}
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

/** A radar shows the shape of a taste, not its ranking: a spike is a specialist, a hexagon an omnivore. */
export function RadarChart({
  axes,
  size = 260,
  locale,
}: {
  axes: { label: string; value: number }[];
  size?: number;
  locale: string;
}) {
  const c = size / 2;
  const r = size * 0.32;
  const max = Math.max(...axes.map((a) => a.value), 1);
  const shape = radarPoints(
    axes.map((a) => a.value),
    max,
    c,
    c,
    r,
  );

  return (
    <svg data-chart viewBox={`0 0 ${size} ${size}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((step) => (
        <polygon
          key={step}
          points={pointsAttr(radarPoints(axes.map(() => 1), 1, c, c, r * step))}
          fill="none"
          stroke="var(--color-surface-800)"
          strokeWidth={1}
        />
      ))}
      {/* What the rings are worth; without a scale the polygon is a shape rather than a measurement. */}
      {[0.5, 1].map((step) => (
        <text
          key={step}
          x={c + 3}
          y={c - r * step + 3}
          className="fill-ink-600 text-2xs tabular-nums"
        >
          {Math.round(max * step)}
        </text>
      ))}
      {axes.map((axis, i) => {
        const end = polar(c, c, r, (i * 360) / axes.length);
        return (
          <line
            key={axis.label}
            x1={c}
            y1={c}
            x2={end.x}
            y2={end.y}
            stroke="var(--color-surface-800)"
            strokeWidth={1}
          />
        );
      })}
      {/* The rings and axes are the frame and are simply there; the polygon is the data, so it arrives. */}
      <g className="chart-in">
        <polygon
          points={pointsAttr(shape)}
          fill="rgba(var(--accent-rgb), .22)"
          stroke="var(--color-accent-500)"
          strokeWidth={1.5}
        />
      </g>
      {shape.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2.5}
          fill="var(--color-accent-400)"
          className="chart-in"
          // After the polygon, so the vertices land on a shape already in place rather than racing it.
          style={{
            animationDelay: `${motionDuration(90) + seriesDelay(i, shape.length)}ms`,
          }}
        >
          <title>{`${axes[i].label}: ${axes[i].value}`}</title>
        </circle>
      ))}
      {axes.map((axis, i) => {
        const at = polar(c, c, r + size * 0.115, (i * 360) / axes.length);
        return (
          <Fragment key={axis.label}>
            <text
              x={at.x}
              y={at.y}
              textAnchor="middle"
              className="fill-ink-500 text-2xs"
            >
              {axis.label.length > 12 ? `${axis.label.slice(0, 11)}…` : axis.label}
            </text>
            {/* The count under its own axis label, so the numbers read beside the shape instead of on hover. */}
            <text
              x={at.x}
              y={at.y + 9}
              textAnchor="middle"
              className="fill-ink-300 text-2xs font-medium tabular-nums"
            >
              {axis.value.toLocaleString(locale)}
            </text>
          </Fragment>
        );
      })}
    </svg>
  );
}

// `LineChart` lived here until `AreaChart` superseded it; nothing that dashes a stroke may put it into screen space.

/** A treemap, area for count so the long tail shows; labels only where the tile can hold them. */
export function Treemap({
  data,
  width: fallback = 1000,
  height = 300,
}: {
  data: { label: string; value: number }[];
  /** The width laid out until the drawn one is measured. */
  width?: number;
  height?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  // Tiles laid out in the drawn width, so a label is set at its type step rather than scaled under it.
  const width = useElementWidth(box) || fallback;
  const items = data.filter((d) => d.value > 0);
  const rects = squarify(
    items.map((d) => d.value),
    width,
    height,
  );

  // No pixel height and no `preserveAspectRatio` override; a pinned height leaves most of a wide card empty.
  return (
    <div ref={box} className="w-full">
      <svg data-chart viewBox={`0 0 ${width} ${height}`} className="block w-full">
        {rects.map((r, i) => {
          // ViewBox units per character, enough to decide whether a name fits rather than clip it mid-word.
          const fits = Math.floor((r.w - 14) / 5.4);
          const label = items[i].label;
          const named = r.w > 44 && r.h > 30;
          const numbered = !named && r.w > 26 && r.h > 14;
          return (
            <g
              key={label}
              className="chart-in"
              // Keep `seriesDelay`; `staggerDelay`'s cycle restarts mid-chart and the arrival visibly stalls.
              style={{ animationDelay: `${seriesDelay(i, rects.length)}ms` }}
            >
              <rect
                x={r.x}
                y={r.y}
                width={Math.max(0, r.w - 2)}
                height={Math.max(0, r.h - 2)}
                rx={4}
                fill={TONES[i % TONES.length]}
                opacity={Math.max(0.35, 1 - i * 0.06)}
              >
                <title>{`${label}: ${items[i].value}`}</title>
              </rect>
              {named && (
                <>
                  <text
                    x={r.x + 7}
                    y={r.y + 17}
                    className={`${onAccent(i)} text-2xs font-medium`}
                  >
                    {label.length > fits ? `${label.slice(0, Math.max(1, fits))}…` : label}
                  </text>
                  <text
                    x={r.x + 7}
                    y={r.y + 30}
                    className={`${onAccent(i)} text-2xs tabular-nums`}
                  >
                    {items[i].value}
                  </text>
                </>
              )}
              {/* Too narrow for a name but wide enough for a figure, so the tile still says how big it is. */}
              {numbered && (
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + 3}
                  textAnchor="middle"
                  className={`${onAccent(i)} text-2xs tabular-nums`}
                >
                  {items[i].value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
