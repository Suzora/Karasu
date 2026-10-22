import { useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { scaleLinear, scalePoint, scaleSqrt } from "d3-scale";
import { area, curveMonotoneX, stack, stackOffsetExpand, stackOrderNone, type SeriesPoint } from "d3-shape";
import { Card, CardTitle } from "@/components/ui/card";
import { useElementWidth } from "@/hooks/useElementWidth";
import type { Distribution } from "@/api/queries";
import type { MediaType } from "@/api/types";
import {
  OTHER_GENRES,
  OUTCOME_ORDER,
  type GenreDelta,
  type GenreDriftData,
  type GenreOutcome,
  type PaceRow,
  type ScorePair,
  type TimeShare as TimeShareData,
} from "@/lib/localStats";
import { statusColorVar } from "@/lib/statusColors";
import { compactCount, formatDecimal, formatSigned } from "@/lib/format";
import { seriesDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TONES } from "./tones";

/** The accent fill a highlighted bar or column takes, the same as `GradientBars`. */
const FILL = "linear-gradient(to right, var(--color-accent-600), var(--color-accent-400))";
const FILL_UP = "linear-gradient(to top, var(--color-accent-600), var(--color-accent-400))";
/** The ramp interleaved light and dark, so two neighbouring bands never share a grey. */
const DRIFT_TONES = [TONES[0], TONES[2], TONES[1], TONES[3], TONES[4], TONES[5]];
const FALLBACK_WIDTH = 560;

/** Cards packed at their own height into two columns, three on a wide window, so no card stretches to its neighbour. */
export function CardPack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("columns-1 gap-4 md:columns-2 2xl:columns-3 [&>*]:mb-4 [&>*]:min-w-0 [&>*]:break-inside-avoid", className)}>
      {children}
    </div>
  );
}

/** Key figures as compact tonal tiles, four to a row, eight on a wide window, two on the phone. */
export function FigureTiles({ tiles }: { tiles: { label: string; value: string; note?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
      {tiles.map((tile) => (
        <div key={tile.label} className="min-w-0 rounded-panel bg-surface-900 surface-outline px-3 py-2.5">
          <p className="truncate text-xl font-bold tabular-nums text-ink-100">{tile.value}</p>
          <p className="mt-0.5 truncate label-text text-ink-500" title={tile.label}>{tile.label}</p>
          {tile.note && <p className="truncate text-2xs text-ink-600" title={tile.note}>{tile.note}</p>}
        </div>
      ))}
    </div>
  );
}

function Swatch({ color, ring }: { color: string; ring?: boolean }) {
  return (
    <span
      data-keep-colors
      className={cn("size-2 shrink-0 rounded-mark", ring ? "ring-1 ring-ink-600" : "ring-1 ring-(--hair) ring-inset")}
      style={{ background: color }}
    />
  );
}

/** Every title the user scored against the community's mean, the fair line diagonal and the widest outliers named. */
export function ScoreScatter({ pairs, max, locale }: { pairs: ScorePair[]; max: number; locale: string }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const W = useElementWidth(box) || FALLBACK_WIDTH;
  if (pairs.length < 5) return null;
  // Near-square, so the diagonal reads as the fair line rather than a shallow slope.
  const H = Math.round(Math.min(W * 0.82, 380));
  const pad = { l: 30, r: 12, t: 14, b: 26 };
  const x = scaleLinear().domain([0, max]).range([pad.l, W - pad.r]);
  const y = scaleLinear().domain([0, max]).range([H - pad.b, pad.t]);
  const kinder = pairs.filter((p) => p.mine > p.community).length;
  const harsher = pairs.filter((p) => p.mine < p.community).length;
  const steps = x.ticks(5).filter((s) => s > 0);
  const short = (s: string) => (s.length > 22 ? `${s.slice(0, 21)}…` : s);
  const byDelta = [...pairs].sort((a, b) => a.mine - a.community - (b.mine - b.community));
  // A label goes only where no earlier label lies, so two outliers never print over each other.
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const labelled = new Set<number>();
  for (const p of [...byDelta.slice(0, 5), ...byDelta.slice(-5).reverse()]) {
    if (labelled.size >= 6) break;
    const left = p.community > max * 0.6;
    const w = short(p.title).length * 5.6;
    const cx = x(p.community) + (left ? -7 : 7);
    const b = { x0: left ? cx - w : cx, x1: left ? cx : cx + w, y0: y(p.mine) - 6, y1: y(p.mine) + 6 };
    if (boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)) continue;
    boxes.push(b);
    labelled.add(p.mediaId);
  }

  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.vsAll")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.vsAllHint", { kinder, harsher })}</p>
      <div ref={box} className="mt-3 w-full">
        <svg data-chart viewBox={`0 0 ${W} ${H}`} className="block w-full">
          {steps.map((s) => (
            <g key={s}>
              <line x1={x(0)} x2={x(max)} y1={y(s)} y2={y(s)} stroke="var(--color-surface-800)" strokeWidth={1} />
              <line x1={x(s)} x2={x(s)} y1={y(0)} y2={y(max)} stroke="var(--color-surface-800)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(s) + 3} textAnchor="end" className="fill-ink-600 text-2xs tabular-nums">{s}</text>
              <text x={x(s)} y={H - 8} textAnchor="middle" className="fill-ink-600 text-2xs tabular-nums">{s}</text>
            </g>
          ))}
          <line x1={x(0)} y1={y(0)} x2={x(max)} y2={y(max)} stroke="var(--color-ink-600)" strokeWidth={1} strokeDasharray="3 3" />
          <text x={x(max) - 4} y={y(max) + 12} textAnchor="end" className="fill-ink-600 text-2xs">{t("stats.vsAllSame")}</text>
          {pairs.map((p, i) => {
            const kind = p.mine > p.community;
            const named = labelled.has(p.mediaId);
            const left = p.community > max * 0.6;
            return (
              <g key={p.mediaId} className="chart-in" style={{ animationDelay: `${seriesDelay(i, pairs.length)}ms` }}>
                <title>{`${p.title}: ${formatDecimal(p.mine, locale, 1)} / ${formatDecimal(p.community, locale, 1)}`}</title>
                <circle
                  cx={x(p.community)}
                  cy={y(p.mine)}
                  r={named ? 4.5 : 3}
                  fill={kind ? "var(--color-accent-400)" : "var(--color-surface-600)"}
                  stroke={kind ? "none" : "var(--color-ink-600)"}
                  strokeWidth={0.75}
                />
                {named && (
                  <text
                    x={x(p.community) + (left ? -7 : 7)}
                    y={y(p.mine) + 3.5}
                    textAnchor={left ? "end" : "start"}
                    className="fill-ink-300 text-2xs"
                    stroke="var(--color-surface-950)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {short(p.title)}
                  </text>
                )}
              </g>
            );
          })}
          <text x={W - pad.r} y={H - 20} textAnchor="end" className="fill-ink-500 text-2xs">{t("stats.vsAllCommunity")} →</text>
          <text x={pad.l + 6} y={pad.t + 4} className="fill-ink-500 text-2xs">↑ {t("stats.vsAllYou")}</text>
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-ink-500">
        <span className="flex items-center gap-1.5"><Swatch color="var(--color-accent-400)" />{t("stats.legendKinder")}</span>
        <span className="flex items-center gap-1.5"><Swatch color="var(--color-surface-600)" ring />{t("stats.legendHarsher")}</span>
      </div>
    </Card>
  );
}

/** Mine minus the community's per genre, as bars either side of a zero line. */
export function GenreDeltas({ rows, locale }: { rows: GenreDelta[]; locale: string }) {
  const { t } = useTranslation();
  if (rows.length < 2) return null;
  const top = Math.max(...rows.map((r) => Math.abs(r.delta)), 0.5);
  const x = scaleLinear().domain([-top, top]).range([0, 100]).clamp(true);
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.genreDelta")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.genreDeltaHint")}</p>
      <div className="mt-3 flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.genre}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-300">{r.genre}</span>
              <span className="shrink-0 tabular-nums text-ink-100">
                {formatSigned(r.delta, locale, 1)}
                <span className="ml-1.5 text-ink-600">{r.count}×</span>
              </span>
            </div>
            <div className="relative mt-1 h-2 rounded-mark bg-surface-800" aria-hidden="true">
              <span className="absolute inset-y-0 left-1/2 w-px bg-ink-600" />
              <div
                data-keep-colors
                className="absolute inset-y-0 rounded-mark chart-in"
                style={{
                  left: `${Math.min(50, x(r.delta))}%`,
                  width: `${Math.max(Math.abs(x(r.delta) - 50), 1)}%`,
                  background: r.delta >= 0 ? FILL : "var(--color-surface-600)",
                  animationDelay: `${seriesDelay(i, rows.length)}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-2xs text-ink-500">
        <span>← {t("stats.genreDeltaHarsher")}</span>
        <span>{t("stats.genreDeltaKinder")} →</span>
      </div>
    </Card>
  );
}

/** How the started titles of each genre ended, as one stacked bar in the status colours. */
export function GenreOutcomes({ rows, type, locale }: { rows: GenreOutcome[]; type: MediaType; locale: string }) {
  const { t } = useTranslation();
  if (rows.length < 2) return null;
  const present = OUTCOME_ORDER.filter((s) => rows.some((r) => r.byStatus[s]));
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.genreOutcomes")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.genreOutcomesHint")}</p>
      <div className="mt-3 flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.genre}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-300">{r.genre}</span>
              <span className="shrink-0 tabular-nums text-ink-100">
                {t("stats.finishedShare", { n: Math.round(r.finished * 100) })}
                <span className="ml-1.5 text-ink-600">{r.total.toLocaleString(locale)}×</span>
              </span>
            </div>
            <div
              className="mt-1 flex h-2 gap-px overflow-hidden rounded-mark bg-surface-900 chart-in"
              style={{ animationDelay: `${seriesDelay(i, rows.length)}ms` }}
              aria-hidden="true"
            >
              {OUTCOME_ORDER.filter((s) => r.byStatus[s]).map((s) => (
                <span
                  key={s}
                  data-keep-colors
                  title={`${t(`status.${type}.${s}`)}: ${r.byStatus[s]}`}
                  style={{ width: `${((r.byStatus[s] ?? 0) / r.total) * 100}%`, background: statusColorVar(s) }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-ink-500">
        {present.map((s) => (
          <span key={s} className="flex items-center gap-1.5"><Swatch color={statusColorVar(s)} />{t(`status.${type}.${s}`)}</span>
        ))}
      </div>
    </Card>
  );
}

/** The top genres' share of each start year, as an expanded stack. */
export function GenreDrift({ data }: { data: GenreDriftData | null }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const W = useElementWidth(box) || FALLBACK_WIDTH;
  if (!data) return null;
  const H = 180;
  const pad = { l: 10, r: 10, t: 8, b: 20 };
  const series = stack<Record<string, number>>().keys(data.keys).order(stackOrderNone).offset(stackOffsetExpand)(data.rows);
  const x = scalePoint<number>().domain(data.years).range([pad.l, W - pad.r]);
  const y = scaleLinear().domain([0, 1]).range([H - pad.b, pad.t]);
  const yearAt = (i: number) => data.years[i];
  const path = area<SeriesPoint<Record<string, number>>>()
    .x((_, i) => x(yearAt(i)) ?? 0)
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(curveMonotoneX);
  const last = data.rows[data.rows.length - 1];
  const lastTotal = data.keys.reduce((s, k) => s + (last[k] ?? 0), 0) || 1;
  const label = (k: string) => (k === OTHER_GENRES ? t("stats.otherGenres") : k);
  // Every other year where they would crowd, counted back from the newest.
  const every = Math.max(1, Math.ceil(36 / ((W - pad.l - pad.r) / Math.max(1, data.years.length - 1))));
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.genreDrift")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.genreDriftHint")}</p>
      <div ref={box} className="mt-3 w-full">
        <svg data-chart viewBox={`0 0 ${W} ${H}`} className="block w-full">
          {series.map((s, i) => (
            <path
              key={s.key}
              d={path(s) ?? ""}
              fill={DRIFT_TONES[i % DRIFT_TONES.length]}
              stroke="var(--color-surface-950)"
              strokeWidth={1}
              className="animate-fade-in"
            >
              <title>{label(s.key)}</title>
            </path>
          ))}
          {data.years.map((yr, i) =>
            (data.years.length - 1 - i) % every === 0 ? (
              <text key={yr} x={x(yr)} y={H - 5} textAnchor="middle" className="fill-ink-600 text-2xs tabular-nums">{yr}</text>
            ) : null,
          )}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-ink-500">
        {data.keys.map((k, i) => (
          <span key={k || "other"} className="flex items-center gap-1.5">
            <Swatch color={DRIFT_TONES[i % DRIFT_TONES.length]} />
            {label(k)}
            <span className="tabular-nums text-ink-300">{Math.round(((last[k] ?? 0) / lastTotal) * 100)} %</span>
          </span>
        ))}
        <span className="ml-auto text-ink-600">{t("stats.sharesIn", { year: data.years[data.years.length - 1] })}</span>
      </div>
    </Card>
  );
}

function ColumnRow({ values, labels, caption }: { values: number[]; labels: string[]; caption: string }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const peak = Math.max(...values, 1);
  const top = values.indexOf(peak);
  return (
    <div>
      <p className="mb-1 flex justify-between text-2xs text-ink-500">
        <span>{caption}</span>
        <span className="tabular-nums">{labels[top]} {Math.round((peak / total) * 100)} %</span>
      </p>
      <div className="flex items-end gap-1" aria-hidden="true">
        {values.map((v, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <div className="relative h-14 w-full">
              <div
                data-keep-colors
                className="absolute inset-x-0 bottom-0 rounded-t-mark chart-in"
                style={{
                  height: `${Math.max((v / peak) * 100, 2)}%`,
                  background: i === top ? FILL_UP : "var(--color-surface-700)",
                  animationDelay: `${seriesDelay(i, values.length)}ms`,
                }}
              />
            </div>
            <span className="text-2xs leading-3 text-ink-600">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Activity by weekday from AniList's history and completions by calendar month from the list, in one card. */
export function Rhythm({ weekdays, months, locale }: { weekdays: number[] | null; months: number[] | null; locale: string }) {
  const { t } = useTranslation();
  if (!weekdays && !months) return null;
  const dayLabels = Array.from({ length: 7 }, (_, d) =>
    new Date(Date.UTC(2024, 0, 1 + d)).toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" }),
  );
  const monthLabels = Array.from({ length: 12 }, (_, m) =>
    new Date(Date.UTC(2000, m, 1)).toLocaleDateString(locale, { month: "narrow", timeZone: "UTC" }),
  );
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.rhythm")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.rhythmHint")}</p>
      <div className="mt-3 space-y-3">
        {weekdays && <ColumnRow values={weekdays} labels={dayLabels} caption={t("stats.rhythmWeekday")} />}
        {months && <ColumnRow values={months} labels={monthLabels} caption={t("stats.rhythmMonth")} />}
      </div>
    </Card>
  );
}

/** Days from start to finish per format: the median as a mark over the middle half, on a square-root axis. */
export function CompletionPace({ rows, locale, formatLabel }: { rows: PaceRow[]; locale: string; formatLabel: (f: string) => string }) {
  const { t } = useTranslation();
  if (rows.length === 0) return null;
  const x = scaleSqrt().domain([0, Math.max(...rows.map((r) => r.q3)) * 1.15]).range([0, 100]).clamp(true);
  const days = (n: number) =>
    n >= 60 ? t("stats.paceMonths", { n: formatDecimal(n / 30.44, locale, 1) }) : t("stats.paceDays", { n: Math.round(n) });
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.pace")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.paceHint")}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={r.format}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-300">{formatLabel(r.format)}</span>
              <span className="shrink-0 tabular-nums text-ink-100">
                {days(r.median)}
                <span className="ml-1.5 text-ink-600">{days(r.q1)} – {days(r.q3)} · {r.count}×</span>
              </span>
            </div>
            <div
              className="relative mt-1 h-2.5 rounded-mark bg-surface-800 chart-in"
              style={{ animationDelay: `${seriesDelay(i, rows.length)}ms` }}
              aria-hidden="true"
            >
              <div
                data-keep-colors
                className="absolute inset-y-0 rounded-mark"
                style={{ left: `${x(r.q1)}%`, width: `${Math.max(x(r.q3) - x(r.q1), 0.8)}%`, background: "var(--color-surface-600)" }}
              />
              <div data-keep-colors className="absolute inset-y-0 w-0.5" style={{ left: `${x(r.median)}%`, background: "var(--color-accent-400)" }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** The longest titles by watch time, each as a dot on one axis, with the running share of all watch time. */
export function TimeShare({ data, locale }: { data: TimeShareData | null; locale: string }) {
  const { t } = useTranslation();
  if (!data || data.rows.length < 3) return null;
  const top = data.rows.reduce((s, r) => s + r.minutes, 0);
  const x = scaleLinear().domain([0, data.rows[0].minutes]).range([0, 100]);
  let running = 0;
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.timeShare")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">
        {t("stats.timeShareHint", { share: Math.round((top / data.total) * 100), hours: Math.round(data.total / 60).toLocaleString(locale) })}
      </p>
      {/* The dot track gives way first on a narrow card, so a title keeps room to be read. */}
      <div className="@container mt-3 flex flex-col gap-1.5">
        {data.rows.map((r, i) => {
          running += r.minutes;
          return (
            <div key={r.mediaId} className="flex items-center gap-3 text-xs">
              <span className="w-4 shrink-0 text-right tabular-nums text-ink-600">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-ink-300" title={r.title}>{r.title}</span>
              <div className="relative hidden h-3 w-16 shrink-0 chart-in @xs:block @md:w-24" style={{ animationDelay: `${seriesDelay(i, data.rows.length)}ms` }} aria-hidden="true">
                <span className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-surface-600" style={{ width: `${x(r.minutes)}%` }} />
                <span
                  data-keep-colors
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${x(r.minutes)}%`, background: "var(--color-accent-400)" }}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular-nums text-ink-100">{t("stats.hours", { n: Math.round(r.minutes / 60).toLocaleString(locale) })}</span>
              <span className="w-10 shrink-0 text-right tabular-nums text-ink-600">{Math.round((running / data.total) * 100)} %</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Each length bucket with its count as a bar and the mean score beside it; the score is AniList's own figure. */
export function LengthCard({ lengths, type, locale }: { lengths: Distribution[]; type: MediaType; locale: string }) {
  const { t } = useTranslation();
  const rows = [...lengths].filter((d) => d.length).sort((a, b) => parseInt(a.length ?? "0", 10) - parseInt(b.length ?? "0", 10));
  if (rows.length === 0) return null;
  const peak = Math.max(...rows.map((d) => d.count), 1);
  const label = (d: Distribution) =>
    type !== "ANIME"
      ? t("stats.lengthBucketCh", { range: d.length })
      : d.length === "1"
        ? t("stats.lengthBucketEpOne", { range: d.length })
        : t("stats.lengthBucketEp", { range: d.length });
  return (
    <Card className="flex flex-col">
      <CardTitle>{t("stats.lengths")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("stats.lengthsHint")}</p>
      <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-2 text-xs">
        {rows.map((d) => (
          <div key={d.length} className="contents">
            <span className="max-w-32 truncate text-ink-500">{label(d)}</span>
            <div className="h-3 overflow-hidden rounded-inner bg-surface-800">
              <div className="h-full rounded-inner bg-accent-500" style={{ width: `${(d.count / peak) * 100}%` }} />
            </div>
            <span className="min-w-8 text-right tabular-nums text-ink-500">{compactCount(d.count, locale)}</span>
            <span className="w-8 text-right tabular-nums text-gold">
              {(d.meanScore ?? 0) > 0 ? formatDecimal(d.meanScore ?? 0, locale, 1) : "–"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
