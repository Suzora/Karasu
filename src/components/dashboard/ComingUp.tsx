import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { displayTitle, type MediaListEntry } from "@/api/types";
import { buttonClass } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { countdown } from "@/lib/format";
import { comingUp } from "@/lib/overview";
import { cn } from "@/lib/utils";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";

/** Coming up: the next episodes of what is watched or planned, soonest first; the whole week is the calendar's. */
export function ComingUp({ anime }: { anime: MediaListEntry[] }) {
  const { t, i18n } = useTranslation();
  const now = Math.floor(Date.now() / 1000);
  const rows = comingUp(anime, now);
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  return (
    <section>
      <SectionHeader
        icon={Clock}
        title={t("dashboard.comingUp")}
        action={<Link to="/calendar" className={buttonClass("text", "text")}>{t("dashboard.fullCalendar")}</Link>}
      />
      <div className="mt-3 rounded-panel bg-surface-900 px-2 py-1.5 surface-outline">
        {rows.length === 0 ? (
          <p className="px-3 py-3 text-sm text-ink-500">{t("dashboard.comingUpEmpty")}</p>
        ) : (
          rows.map((e, i) => {
            const at = e.media.nextAiringEpisode!.airingAt;
            return (
              <Link key={e.id} to={`/media/${e.mediaId}`} className="flex items-center gap-3.5 rounded-control px-3 py-2.5 transition-surface hover:bg-surface-850">
                {e.media.coverImage.large && <img src={e.media.coverImage.large} alt="" loading="lazy" className={cn("h-11 w-8 shrink-0 rounded-mark object-cover", shouldBlur(e.media, level, blurAdult) && "veil-thumb")} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui text-ink-100">{displayTitle(e.media.title)}</span>
                  <span className="block text-xs text-ink-500">
                    {t("common.episode", { n: e.media.nextAiringEpisode!.episode })} ·{" "}
                    {e.status === "PLANNING" ? t("dashboard.plannedNote") : t("dashboard.atProgress", { n: e.progress })}
                  </span>
                </span>
                <span className="hidden w-28 shrink-0 text-xs text-ink-500 sm:block">
                  {new Date(at * 1000).toLocaleDateString(i18n.language, { weekday: "short", day: "numeric", month: "short" })}
                </span>
                <span className={cn("shrink-0 rounded-inner px-2 py-1 text-2xs tabular-nums", i === 0 ? "bg-accent-500 text-accent-ink" : "bg-surface-800 text-ink-300")}>
                  {t("dashboard.inTime", { when: countdown(at - now, t) })}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
