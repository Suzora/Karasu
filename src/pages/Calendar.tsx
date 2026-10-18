import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Download, LayoutGrid, List as ListIcon } from "lucide-react";
import { airingWeek, type AiringSlot } from "@/api/queries";
import { fetchMediaList, isTauri, saveText } from "@/api/anilist";
import { buildIcs } from "@/lib/ical";
import { IconButton } from "@/components/ui/icon-button";
import { displayTitle, type Media, type MediaListEntry } from "@/api/types";
import {
  addDays,
  bucketByLocalDay,
  foldQuietDays,
  fromList,
  localMidnight,
  fromSchedule,
  releaseState,
  weekDays,
  type ReleaseState,
} from "@/lib/calendar";
import {
  effectiveView,
  loadCalendarView,
  saveCalendarView,
  weekFits,
  type CalendarView,
} from "@/lib/calendarView";
import { useElementWidth } from "@/hooks/useElementWidth";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { ColumnPage, PageTitle, columnRow } from "@/components/shell/PageColumn";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { isBlocked } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { useAuth } from "@/stores/auth";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, ErrorState, TickMarks } from "@/components/EmptyState";
import { Busy, Shimmer } from "@/components/Skeleton";
import { backendErrorText } from "@/lib/backendError";
import { showToast } from "@/stores/toast";
import { cn } from "@/lib/utils";

/** Two lenses over one week fetch: "all" is the whole schedule, "mine" is it narrowed to the list. */

type Lens = "mine" | "all";

/** One rendered row, whichever lens produced it. */
interface Slot {
  key: string;
  airingAt: number;
  episode: number;
  media: Pick<Media, "id" | "title" | "coverImage">;
  entry: MediaListEntry | null;
}

const MINE_STATUSES = ["CURRENT", "REPEATING", "PLANNING"] as const;

/** What the grid assumes before its first measurement, so a desktop never flashes the agenda. */
const WEEK_ASSUMED = 1280;

/** Unix seconds now, read once per render so every card agrees on what has aired. */
const nowSec = () => Math.floor(Date.now() / 1000);

function stateOf(slot: Slot, now: number): ReleaseState {
  if (!slot.entry) return slot.airingAt > now ? "upcoming" : "watched";
  return releaseState(slot.airingAt, slot.episode, slot.entry.progress, now);
}

/** The airing week grid; week and lens live in the URL, and it is anime only since manga has no schedule. */
export default function Calendar() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const viewer = useAuth((s) => s.viewer);
  const userId = viewer?.id ?? 0;
  const level = useContentFilter((s) => s.level);

  const lens: Lens = params.get("lens") === "all" ? "all" : "mine";
  // The week runs seven days from today, as the Overview's does, so what it promises is what this page opens on.
  const currentWeek = localMidnight(Math.floor(Date.now() / 1000));
  const rawWeek = Number(params.get("week"));
  // A week param snaps to the local midnight of its day; the seven days run from there.
  const week = Number.isFinite(rawWeek) && rawWeek > 0 ? localMidnight(rawWeek) : currentWeek;
  const weekEnd = addDays(week, 7);
  const days = weekDays(week);

  const setView = (patch: { lens?: Lens; week?: number }) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (patch.lens !== undefined) {
          if (patch.lens === "mine") p.delete("lens");
          else p.set("lens", patch.lens);
        }
        if (patch.week !== undefined) {
          if (patch.week === currentWeek) p.delete("week");
          else p.set("week", String(patch.week));
        }
        return p;
      },
      { replace: true },
    );
  };

  // The cached list serves both lenses, on the same key as the list page so it is almost always a hit.
  const list = useQuery({
    queryKey: ["mediaList", "ANIME", userId],
    queryFn: () => fetchMediaList(userId, "ANIME"),
    enabled: isTauri,
  });

  const entries = useMemo(
    () =>
      list.data?.lists
        .filter((g) => !g.isCustomList)
        .flatMap((g) => g.entries)
        .filter((e) => !isBlocked(e.media, level)) ?? [],
    [list.data, level],
  );

  const onList = useMemo(
    () => new Map(entries.map((e) => [e.mediaId, e])),
    [entries],
  );

  // One fetch serves both lenses, not keyed on the filter level, so a lens or filter change costs nothing.
  const all = useQuery({
    queryKey: ["calendar", week],
    queryFn: () => airingWeek(week, weekEnd),
    enabled: isTauri,
    staleTime: 30 * 60 * 1000,
  });

  const slots: Slot[] = useMemo(() => {
    if (lens === "mine") {
      // The list's own next episode draws at once and offline; the schedule adds the rest of the week when it lands.
      const toSlot = (x: { airingAt: number; episode: number; entry: MediaListEntry }): Slot => ({
        key: `l${x.entry.id}-${x.episode}`,
        airingAt: x.airingAt,
        episode: x.episode,
        media: x.entry.media,
        entry: x.entry,
      });
      const scheduled = fromSchedule(all.data ?? [], onList, [...MINE_STATUSES]).map(toSlot);
      const seen = new Set(scheduled.map((x) => x.key));
      const projected = fromList(entries, week, weekEnd, [...MINE_STATUSES]).map(toSlot);
      return [...scheduled, ...projected.filter((x) => !seen.has(x.key))].sort(
        (a, b) => a.airingAt - b.airingAt,
      );
    }
    return (all.data ?? [])
      .filter((s: AiringSlot) => !isBlocked(s.media as Media, level))
      .map((s) => ({
        key: `a${s.id}`,
        airingAt: s.airingAt,
        episode: s.episode,
        media: s.media,
        entry: onList.get(s.media.id) ?? null,
      }));
  }, [lens, entries, all.data, level, onList, week, weekEnd]);

  const buckets = useMemo(() => bucketByLocalDay(slots, days), [slots, days]);
  const todayMidnight = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  })();

  const weekLabel = `${new Date(week * 1000).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
  })} – ${new Date(addDays(week, 6) * 1000).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
  })}`;

  // Under "mine" the projection draws immediately; a failed schedule fetch only costs the aired episodes.
  const active = lens === "all" ? all : list;
  const loading = active.isLoading;
  const error = active.data ? null : active.error;
  // What failed behind slots already drawn: a refresh of either, or under "mine" the schedule that adds aired episodes.
  const behind = lens === "mine" ? (all.error ?? (list.data ? list.error : null)) : all.data ? all.error : null;
  const retryBehind = () =>
    Promise.all([all.error ? all.refetch() : null, lens === "mine" && list.error ? list.refetch() : null]);

  const [chosen, setChosen] = useState<CalendarView>(loadCalendarView);
  const scroller = useRef<HTMLDivElement>(null);
  useScrollMemory(scroller, "calendar");
  const width = useElementWidth(scroller);
  const phone = usePhoneShell();
  const measured = width === 0 ? WEEK_ASSUMED : width;
  const view = effectiveView(chosen, measured, phone);
  const chooseView = (v: CalendarView) => {
    setChosen(v);
    saveCalendarView(v);
  };
  const viewSegments = [
    ...(weekFits(measured, phone) ? [{ value: "week" as const, label: t("calendar.viewWeek") }] : []),
    { value: "tiles" as const, label: t("calendar.viewTiles") },
    { value: "agenda" as const, label: t("calendar.viewAgenda") },
  ];
  const now = nowSec();
  const exportIcs = () =>
    saveText(
      buildIcs(
        slots.map((s) => ({
          uid: `karasu-${s.media.id}-ep${s.episode}@karasu`,
          start: s.airingAt,
          durationMin: 25,
          summary: `${displayTitle(s.media.title)} — ${t("calendar.ep", { n: s.episode })}`,
        })),
        // Unix *seconds*, like every timestamp in the file.
        Math.floor(Date.now() / 1000),
      ),
      `karasu-airing-${week}.ics`,
      "iCalendar",
      "ics",
    ).catch((e: unknown) =>
      showToast({ kind: "error", text: t("calendar.exportFailed"), detail: backendErrorText(e, t) }),
    );

  const download = slots.length > 0 && (
    // The export is the slots the grid draws, with stable UIDs so a re-export updates instead of duplicating.
    <IconButton variant="ghost" size="sm" round onClick={() => void exportIcs()} aria-label={t("calendar.exportIcs")} title={t("calendar.exportIcs")}>
      <Download className="size-4" />
    </IconButton>
  );
  const stepper = (
    <div className="flex items-center gap-1 rounded-full bg-surface-900 p-1 surface-outline">
      <IconButton variant="ghost" size="sm" round onClick={() => setView({ week: addDays(week, -7) })} aria-label={t("calendar.prevWeek")}>
        <ChevronLeft className="size-4" />
      </IconButton>
      <span aria-live="polite" className="flex-1 whitespace-nowrap px-1 text-center text-sm tabular-nums text-ink-100">
        {weekLabel}
      </span>
      <IconButton variant="ghost" size="sm" round onClick={() => setView({ week: addDays(week, 7) })} aria-label={t("calendar.nextWeek")}>
        <ChevronRight className="size-4" />
      </IconButton>
    </div>
  );
  const backToThisWeek = week !== currentWeek && (
    <button type="button" onClick={() => setView({ week: currentWeek })} className="press rounded-full px-4 py-1.5 text-left text-xs text-accent-400 transition-surface hover:bg-surface-850">
      {t("calendar.thisWeek")}
    </button>
  );
  const navRow = (on: boolean, label: string, onClick: () => void, Icon?: typeof Download, count?: number, hint?: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={hint !== undefined}
      title={hint}
      className={cn(columnRow(on), "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-300")}
    >
      {Icon && <Icon aria-hidden className="size-4 shrink-0 opacity-70" />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span title={t("calendar.countHint", { n: count })} className="text-xs tabular-nums opacity-70">
          {count}
        </span>
      )}
    </button>
  );
  const viewIcon = { week: CalendarDays, tiles: LayoutGrid, agenda: ListIcon } as const;

  const body = (
    <>
      {!error && behind != null && <ErrorState inline error={behind} onRetry={retryBehind} className="mb-3" />}
      {error ? (
        <ErrorState error={error} onRetry={() => active.refetch()} />
      ) : loading ? (
        <Busy className={cn("gap-2", view === "week" ? "grid grid-cols-7" : "flex flex-col")}>
          {days.map((day, i) => (
            <Shimmer key={day} className={cn("rounded-panel", view === "week" ? "h-72" : "h-16")} index={i} />
          ))}
        </Busy>
      ) : slots.length === 0 ? (
        <EmptyState
          visual={<TickMarks />}
          title={t(lens === "mine" ? "calendar.emptyMine" : "calendar.emptyAll")}
          hint={lens === "mine" ? t("calendar.emptyMineHint") : undefined}
        />
      ) : view === "week" ? (
        <div className="grid grid-cols-7 items-stretch gap-2">
          {days.map((day, i) => (
            <DayColumn key={day} day={day} isToday={day === todayMidnight} slots={buckets[i]} now={now} />
          ))}
        </div>
      ) : (
        // A run of days with nothing airing is one quiet line; the week grid keeps its columns, which are the dates.
        <div className="flex flex-col gap-5">
          {foldQuietDays(days, buckets, todayMidnight).map((run) =>
            run.quiet ? (
              <QuietDays key={run.days[0]} days={run.days} />
            ) : (
              <DaySection
                key={run.days[0]}
                day={run.days[0]}
                isToday={run.days[0] === todayMidnight}
                slots={run.items}
                now={now}
                tiles={view === "tiles"}
              />
            ),
          )}
        </div>
      )}
    </>
  );

  if (phone) {
    return (
      <div ref={scroller} className="h-full space-y-4 overflow-y-auto px-8 pb-12 pt-4 float-clear">
        <PageTitle title={t("calendar.title")} jp="カレンダー" action={download} />
        {stepper}
        {backToThisWeek}
        <div className="flex items-center gap-2">
          <Segmented
            className="flex-1 [&>button]:flex-1"
            aria-label={t("calendar.lens")}
            value={lens}
            onChange={(v) => setView({ lens: v as Lens })}
            segments={[
              { value: "mine", label: t("calendar.lensMine") },
              { value: "all", label: t("calendar.lensAll") },
            ]}
          />
          <Segmented
            aria-label={t("calendar.view")}
            value={view}
            onChange={chooseView}
            segments={viewSegments.map((sg) => {
              const Icon = viewIcon[sg.value];
              return { value: sg.value, title: sg.label, label: <Icon aria-hidden className="size-4" /> };
            })}
          />
        </div>
        {body}
      </div>
    );
  }

  return (
    <ColumnPage
      contentRef={scroller}
      // The week grid draws only where its columns fit; the stable gutter keeps the scrollbar from flipping that.
      contentClassName="[scrollbar-gutter:stable] float-clear"
      column={
        <>
        <PageTitle title={t("calendar.title")} jp="カレンダー" action={download} className="mb-3" />
        {stepper}
        {backToThisWeek}
        <p className="px-4 pb-1 pt-3 label-text text-ink-500">{t("calendar.showHeading")}</p>
        {navRow(lens === "mine", t("calendar.lensMine"), () => setView({ lens: "mine" }), undefined, lens === "mine" ? slots.length : undefined)}
        {navRow(lens === "all", t("calendar.lensAll"), () => setView({ lens: "all" }), undefined, lens === "all" ? slots.length : undefined)}
        <div className="mx-3 my-3 h-px bg-surface-850" />
        <p className="px-4 pb-1 label-text text-ink-500">{t("calendar.layoutHeading")}</p>
        {/* The week stays in the column when the window is too narrow for it, disabled and saying why, so the rows hold still. */}
        {!weekFits(measured, phone) && <span key="week" className="block">{navRow(false, t("calendar.viewWeek"), () => {}, viewIcon.week, undefined, t("calendar.weekTooNarrow"))}</span>}
        {viewSegments.map((sg) => navRow(view === sg.value, sg.label, () => chooseView(sg.value), viewIcon[sg.value]))}
        </>
      }
    >
      {body}
    </ColumnPage>
  );
}

/** Adjacent days with nothing airing, as one muted line naming the first and last of them. */
function QuietDays({ days }: { days: number[] }) {
  const { t, i18n } = useTranslation();
  const weekday = (day: number) => new Date(day * 1000).toLocaleDateString(i18n.language, { weekday: "long" });
  const first = days[0];
  const last = days[days.length - 1];
  return (
    <p className="dense-text flex items-baseline gap-2 text-ink-600">
      <span className="font-semibold text-ink-500">
        {first === last ? weekday(first) : `${weekday(first)} – ${weekday(last)}`}
      </span>
      <span>· {t("calendar.emptyDay")}</span>
      <span className="section-rule self-center" />
    </p>
  );
}

/** A day of the stacked views: a dated header, then tiles or rows; an empty today says so in one muted line. */
function DaySection({
  day,
  isToday,
  slots,
  now,
  tiles,
}: {
  day: number;
  isToday: boolean;
  slots: Slot[];
  now: number;
  tiles: boolean;
}) {
  const { t, i18n } = useTranslation();
  const date = new Date(day * 1000);
  return (
    <section
      aria-label={
        date.toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" }) +
        (isToday ? ` · ${t("calendar.today")}` : "")
      }
    >
      <header className="mb-2 flex items-baseline gap-2">
        <span className={cn("text-lg", isToday ? "text-accent-400" : "text-ink-100")}>
          {date.toLocaleDateString(i18n.language, { weekday: "long" })}
        </span>
        <span className="text-sm tabular-nums text-ink-500">
          {date.toLocaleDateString(i18n.language, { day: "numeric", month: "short" })}
        </span>
        {isToday && <span className="nav-pill rounded-full px-2 text-xs">{t("calendar.today")}</span>}
      </header>
      {slots.length === 0 ? (
        <p className="dense-text px-2.5 text-ink-600">{t("calendar.emptyDay")}</p>
      ) : tiles ? (
        <div className="media-grid gap-3">
          {slots.map((s) => (
            <CalendarTile key={s.key} slot={s} state={stateOf(s, now)} />
          ))}
        </div>
      ) : (
        <div className="@container grid grid-cols-1 gap-2 @3xl:grid-cols-2">
          {slots.map((s) => (
            <CalendarAgendaRow key={s.key} slot={s} state={stateOf(s, now)} />
          ))}
        </div>
      )}
    </section>
  );
}

/** The on-list pip: a check for watched (or, upcoming, simply on the list), a hollow ring for an aired episode still owed. */
function StateMarker({ slot, state }: { slot: Slot; state: ReleaseState }) {
  const { t } = useTranslation();
  if (!slot.entry) return null;
  // Three shapes, so watched, aired-but-unwatched and upcoming never share a mark; the word joins the link's name.
  if (state === "unwatched") {
    return (
      <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-accent-500/15 text-accent-400">
        <Circle aria-hidden className="size-2" strokeWidth={3} />
        <span className="sr-only">{t("calendar.unwatched")}</span>
      </span>
    );
  }
  if (state === "watched") {
    return (
      <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
        <Check aria-hidden className="size-2.5" />
        <span className="sr-only">{t("calendar.watched")}</span>
      </span>
    );
  }
  return (
    <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-ink-500/15 text-ink-500">
      <Bookmark aria-hidden className="size-2" />
      <span className="sr-only">{t(`status.ANIME.${slot.entry.status}`)}</span>
    </span>
  );
}

/** The tiles view's card: the cover with the time and the state on the art, the title and episode under it. */
function CalendarTile({ slot, state }: { slot: Slot; state: ReleaseState }) {
  const { t, i18n } = useTranslation();
  const title = displayTitle(slot.media.title);
  const released = state !== "upcoming";
  return (
    <Link
      to={`/media/${slot.media.id}`}
      title={title}
      className={cn("group block transition-surface", released && "opacity-55 hover:opacity-100 focus-visible:opacity-100")}
    >
      <div data-cover className="relative aspect-[3/4] overflow-hidden rounded-panel bg-surface-900">
        {slot.media.coverImage.large && (
          <img src={slot.media.coverImage.large} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-on-cover/75 px-2 py-0.5 text-2xs tabular-nums text-on-cover-edge">
          {new Date(slot.airingAt * 1000).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="absolute right-2 top-2">
          <StateMarker slot={slot} state={state} />
        </span>
      </div>
      <p className="mt-2 line-clamp-2 px-0.5 text-ui font-medium leading-snug text-ink-100">{title}</p>
      <p className="mt-0.5 px-0.5 text-xs text-ink-500">{t("calendar.ep", { n: slot.episode })}</p>
    </Link>
  );
}

/** One card of the agenda: the time, the cover, the title with its episode, and the state. */
function CalendarAgendaRow({ slot, state }: { slot: Slot; state: ReleaseState }) {
  const { t, i18n } = useTranslation();
  const title = displayTitle(slot.media.title);
  return (
    <Link
      to={`/media/${slot.media.id}`}
      title={title}
      className={cn(
        "flex items-center gap-3 rounded-panel bg-surface-900 surface-outline p-2.5 transition-surface hover:bg-surface-850",
        state !== "upcoming" && "opacity-55 hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <span className="w-12 shrink-0 text-center text-sm tabular-nums text-ink-100">
        {new Date(slot.airingAt * 1000).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
      </span>
      {slot.media.coverImage.large && (
        <img src={slot.media.coverImage.large} alt="" loading="lazy" className="aspect-[3/4] w-12 shrink-0 rounded-inner object-cover" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink-100">{title}</span>
        <span className="block text-xs text-ink-500">{t("calendar.ep", { n: slot.episode })}</span>
      </span>
      <StateMarker slot={slot} state={state} />
    </Link>
  );
}

function DayColumn({
  day,
  isToday,
  slots,
  now,
}: {
  day: number;
  isToday: boolean;
  slots: Slot[];
  now: number;
}) {
  const { t, i18n } = useTranslation();
  const date = new Date(day * 1000);

  return (
    <section
      aria-label={
        date.toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" }) +
        (isToday ? ` · ${t("calendar.today")}` : "")
      }
      className={cn("flex min-h-96 flex-col gap-2 rounded-panel p-2", isToday ? "bg-accent-500/5 ring-1 ring-accent-500/40" : "bg-surface-900/50 surface-outline")}
    >
      <header className={cn("flex items-baseline justify-between gap-1 rounded-full px-2.5 py-1 text-sm", isToday ? "nav-pill" : "text-ink-300")}>
        <span>{date.toLocaleDateString(i18n.language, { weekday: "short" })}</span>
        <span className="tabular-nums">{date.toLocaleDateString(i18n.language, { day: "numeric" })}</span>
      </header>
      {slots.map((s) => (
        <CalendarCard key={s.key} slot={s} state={stateOf(s, now)} />
      ))}
    </section>
  );
}

/** One airing in a day column: a picture strip over the time, the episode, the state and the title. */
function CalendarCard({ slot, state }: { slot: Slot; state: ReleaseState }) {
  const { t, i18n } = useTranslation();
  const title = displayTitle(slot.media.title);
  const released = state !== "upcoming";

  return (
    <Link
      to={`/media/${slot.media.id}`}
      title={title}
      className={cn(
        "block overflow-hidden rounded-inner bg-surface-850 transition-surface hover:bg-surface-800",
        released && "opacity-55 hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      {slot.media.coverImage.large && (
        <img src={slot.media.coverImage.large} alt="" loading="lazy" className="aspect-video w-full object-cover" />
      )}
      <div className="p-2">
        <p className="flex items-center gap-1 text-2xs tabular-nums text-accent-400">
          {new Date(slot.airingAt * 1000).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
          <span className="text-ink-500">· {t("calendar.ep", { n: slot.episode })}</span>
          <span className="ml-auto">
            <StateMarker slot={slot} state={state} />
          </span>
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-100">{title}</p>
      </div>
    </Link>
  );
}
