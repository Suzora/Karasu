import { useRef } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import { displayTitle, type MediaListEntry } from "@/api/types";
import { buttonClass } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useElementWidth } from "@/hooks/useElementWidth";
import { fromList, type ListAiring } from "@/lib/calendar";
import { stackTops, timetableSlot, weekBounds } from "@/lib/overview";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { cn } from "@/lib/utils";

/** Below this width seven columns are too narrow to name a title, and the week reads better as a list of days. */
const TIMETABLE_MIN = 640;
/** The timetable's height, which the hours divide. */
const PLAN_H = 220;
/** Room the last card of a day needs, so one airing late at night does not hang out of its column. */
const CARD_H = 40;

/** This week as a timetable: days as columns, the hour downwards, a line for now; a list of days where it is narrow. */
export function WeekPlan({ anime }: { anime: MediaListEntry[] }) {
  const { t, i18n } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const now = Math.floor(Date.now() / 1000);
  const { dayStarts, weekEnd } = weekBounds(new Date());
  const week = fromList(anime, now, weekEnd - 1);
  const days = dayStarts.slice(0, 7).map((s) => new Date(s * 1000));
  const veil = (a: ListAiring) => (shouldBlur(a.entry.media, level, blurAdult) ? "veil-thumb" : "");
  const dayName = (i: number) => (i === 0 ? t("dashboard.today") : days[i].toLocaleDateString(i18n.language, { weekday: "short", day: "numeric" }));
  const time = (a: ListAiring) => new Date(a.airingAt * 1000).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
  const onDay = (i: number) => week.filter((a) => timetableSlot(a.airingAt, dayStarts)?.day === i);

  return (
    <section>
      <SectionHeader
        icon={CalendarDays}
        title={t("dashboard.thisWeek")}
        action={<Link to="/calendar" className={buttonClass("text", "text")}>{t("dashboard.fullCalendar")}</Link>}
      />
      <div ref={box} className="mt-3 rounded-panel bg-surface-900 p-3 surface-outline">
        {width >= TIMETABLE_MIN ? (
          <ul className="grid grid-cols-7 gap-1.5">
            {days.map((_, i) => {
              const items = onDay(i);
              const tops = stackTops(items.map((a) => timetableSlot(a.airingAt, dayStarts)?.fraction ?? 0), PLAN_H - CARD_H, CARD_H);
              const height = Math.max(PLAN_H, (tops[tops.length - 1] ?? 0) + CARD_H);
              return (
              <li key={i} data-day={i} aria-label={dayName(i)}>
                <p className={cn("pb-2 text-center text-xs", i === 0 ? "text-accent-400" : "text-ink-500")}>{dayName(i)}</p>
                <div className={cn("relative rounded-inner", i === 0 ? "bg-accent-500/10" : "bg-surface-850")} style={{ height }}>
                  {i === 0 && <span aria-hidden className="absolute inset-x-0 z-10 border-t-2 border-accent-400" style={{ top: (timetableSlot(now, dayStarts)?.fraction ?? 0) * (PLAN_H - CARD_H) }} />}
                  {items.map((a, k) => (
                    <Link
                      key={a.entry.id}
                      to={`/media/${a.mediaId}`}
                      className="absolute inset-x-1 z-20 flex items-center gap-1.5 rounded-inner bg-surface-800 p-1 pr-1.5 transition-surface hover:bg-surface-700"
                      style={{ top: tops[k] }}
                    >
                      {a.entry.media.coverImage.large && <img src={a.entry.media.coverImage.large} alt="" className={cn("h-8 w-6 shrink-0 rounded-mark object-cover", veil(a))} />}
                      <span className="min-w-0">
                        <span className="block truncate text-2xs text-ink-100">{displayTitle(a.entry.media.title)}</span>
                        <span className="block truncate text-2xs tabular-nums text-ink-500">{time(a)} · {t("calendar.ep", { n: a.episode })}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </li>
              );
            })}
          </ul>
        ) : week.length === 0 ? (
          <p className="px-2 py-2 text-sm text-ink-500">{t("dashboard.weekLineNone")}</p>
        ) : (
          <ul className="space-y-0.5">
            {days.flatMap((_, i) =>
              onDay(i).map((a, k) => (
                <li key={a.entry.id}>
                  <Link to={`/media/${a.mediaId}`} className="flex items-center gap-3 rounded-control px-2 py-2 transition-surface hover:bg-surface-850">
                    <span className={cn("w-14 shrink-0 text-xs", i === 0 ? "text-accent-400" : "text-ink-500")}>{k === 0 ? dayName(i) : ""}</span>
                    {a.entry.media.coverImage.large && <img src={a.entry.media.coverImage.large} alt="" className={cn("h-10 w-7 shrink-0 rounded-mark object-cover", veil(a))} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ui text-ink-100">{displayTitle(a.entry.media.title)}</span>
                      <span className="block text-xs text-ink-500">{t("common.episode", { n: a.episode })} · {time(a)}</span>
                    </span>
                  </Link>
                </li>
              )),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
