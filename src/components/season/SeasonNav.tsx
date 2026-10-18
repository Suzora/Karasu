import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownWideNarrow, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, Disc3, EyeOff, Film, MonitorPlay, Shapes, Sparkles, Timer, Tv } from "lucide-react";
import type { Season } from "@/api/queries";
import { Popover } from "@/components/ui/popover";
import { FORMAT_ORDER } from "@/lib/formatGroups";
import { formatLabel } from "@/lib/format";
import type { SeasonFilters } from "@/lib/seasonView";
import { cn } from "@/lib/utils";

const SEASONS: Season[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

/** One glyph per format, so the column is scannable without reading. */
export const FORMAT_ICON: Record<string, typeof Tv> = {
  TV: Tv,
  MOVIE: Film,
  TV_SHORT: Timer,
  SPECIAL: Sparkles,
  OVA: Disc3,
  ONA: MonitorPlay,
  MUSIC: Clapperboard,
};

const rowClass = "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11";
const restClass = "text-ink-300 hover:bg-surface-850 hover:text-ink-100";

/** The year in large type between its two arrows; an arrow with nowhere to go is disabled. */
export function YearStepper({
  year,
  onStep,
  canPrev = true,
  canNext = true,
}: {
  year: number;
  onStep: (step: 1 | -1) => void;
  canPrev?: boolean;
  canNext?: boolean;
}) {
  const { t } = useTranslation();
  const arrow = "press grid size-10 shrink-0 place-items-center rounded-full text-ink-500 transition-surface hover:bg-surface-850 hover:text-ink-100 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onStep(-1)} disabled={!canPrev} aria-label={t("seasonal.prevYear")} className={arrow}>
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <span aria-live="polite" className="flex-1 text-center text-title tabular-nums text-ink-100">
        {year}
      </span>
      <button type="button" onClick={() => onStep(1)} disabled={!canNext} aria-label={t("seasonal.nextYear")} className={arrow}>
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}

/** The four seasons as one choice: a 2×2 field in the column, a single row on the phone; arrows move between them. */
export function SeasonField({ season, onPick, row = false }: { season: Season; onPick: (s: Season) => void; row?: boolean }) {
  const { t } = useTranslation();
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = SEASONS[(i + step + 4) % 4];
    onPick(next);
    (e.currentTarget.parentElement?.children[SEASONS.indexOf(next)] as HTMLElement | undefined)?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={t("seasonal.seasons")}
      className={cn("grid gap-1 bg-surface-900 p-1 surface-outline", row ? "grid-cols-4 rounded-full" : "grid-cols-2 rounded-panel")}
    >
      {SEASONS.map((s, i) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={s === season}
          tabIndex={s === season ? 0 : -1}
          onClick={() => onPick(s)}
          onKeyDown={(e) => onKey(e, i)}
          className={cn("press rounded-full py-2 text-center text-sm transition-surface coarse:min-h-11", s === season ? "nav-pill" : restClass)}
        >
          {t(`season.${s}`)}
        </button>
      ))}
    </div>
  );
}

interface FormatProps {
  counts: Record<string, number>;
  total: number;
  filters: SeasonFilters;
  onChange: (patch: Partial<SeasonFilters>) => void;
}

/** The formats the season holds with their counts, then the two switches; `onPicked` closes the phone's sheet. */
export function FormatNav({ counts, total, filters, onChange, onPicked }: FormatProps & { onPicked?: () => void }) {
  const { t } = useTranslation();
  const formats = FORMAT_ORDER.filter((f) => counts[f]);
  const other = total - formats.reduce((n, f) => n + counts[f], 0);
  const pick = (format: string) => {
    onChange({ format });
    onPicked?.();
  };
  const item = (value: string, label: string, n: number, Icon: typeof Tv | null) => (
    <button key={value || "all"} type="button" aria-pressed={filters.format === value} onClick={() => pick(value)} className={cn(rowClass, filters.format === value ? "nav-pill" : restClass)}>
      {Icon && <Icon aria-hidden className="size-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums opacity-70">{n}</span>
    </button>
  );
  // A switch, not a pick: its track says on or off even when no row in the group is chosen.
  const toggle = (on: boolean, label: string, Icon: typeof Tv, patch: Partial<SeasonFilters>) => (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(patch)} className={cn(rowClass, restClass)}>
      <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
      {/* Wraps rather than truncating: the track takes the room a truncated label would need. */}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      <span
        aria-hidden
        className={cn(
          "inline-flex h-4.75 w-8.5 shrink-0 items-center rounded-full border transition-surface",
          on ? "border-accent-600 bg-accent-600" : "border-surface-700 bg-surface-700",
        )}
      >
        <span className={cn("size-4.25 rounded-full transition-[translate,background-color]", on ? "translate-x-3.75 bg-accent-ink" : "bg-ink-100")} />
      </span>
    </button>
  );
  return (
    <div className="space-y-0.5">
      <p className="px-4 pb-1 label-text text-ink-500">{t("seasonal.formats")}</p>
      {item("", t("seasonal.allFormats"), total, null)}
      {formats.map((f) => item(f, formatLabel(f, t), counts[f], FORMAT_ICON[f] ?? Shapes))}
      {other > 0 && !filters.format && (
        <p className="flex items-center gap-3 px-4 py-2 text-sm text-ink-500">
          <Shapes aria-hidden className="size-4 shrink-0 opacity-70" />
          <span className="min-w-0 flex-1 truncate">{t("seasonal.otherFormats")}</span>
          <span className="text-xs tabular-nums opacity-70">{other}</span>
        </p>
      )}
      <div className="mx-3 my-3 h-px bg-surface-850" />
      <p className="px-4 pb-1 label-text text-ink-500">{t("seasonal.show")}</p>
      {toggle(filters.unlisted, t("seasonal.unlisted"), EyeOff, { unlisted: !filters.unlisted })}
      {toggle(filters.byScore, t("seasonal.byScore"), ArrowDownWideNarrow, { byScore: !filters.byScore })}
    </div>
  );
}

/** The phone's form of the format column: a field naming the chosen format, opening the column in a sheet. */
export function FormatPicker(props: FormatProps) {
  const { t } = useTranslation();
  const { filters, counts, total } = props;
  const label = filters.format ? formatLabel(filters.format, t) : t("seasonal.allFormats");
  const narrowed = filters.unlisted || filters.byScore;
  return (
    <Popover
      label={t("seasonal.formats")}
      variant="sheet"
      className="w-full"
      renderTrigger={(p) => (
        <button
          type="button"
          {...p}
          aria-label={t("seasonal.formatPick", { format: label })}
          className="flex w-full items-center gap-3 rounded-panel bg-surface-900 px-4 py-3 text-left surface-outline transition-surface hover:bg-surface-850"
        >
          <span className="text-base text-ink-100">{label}</span>
          <span className="text-sm tabular-nums text-ink-500">{filters.format ? counts[filters.format] ?? 0 : total}</span>
          {narrowed && <span aria-hidden className="size-1.5 rounded-full bg-accent-400" />}
          <span className="flex-1" />
          <ChevronDown aria-hidden className="size-4 text-ink-500" />
        </button>
      )}
    >
      {(api) => <FormatNav {...props} onPicked={api.close} />}
    </Popover>
  );
}
