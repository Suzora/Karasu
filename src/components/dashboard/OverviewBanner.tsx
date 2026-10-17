import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { displayTitle, type MediaListEntry } from "@/api/types";
import { MediaBanner } from "@/components/media/MediaBanner";
import { SearchField } from "@/components/ui/search-field";
import { useSeasonArt } from "@/hooks/useSeasonArt";
import { bannerSource } from "@/lib/bannerSource";
import { shouldBlur } from "@/lib/contentFilter";
import { countdown } from "@/lib/format";
import { greetingKey, stripItems, weekBounds, weekLine } from "@/lib/overview";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";

const STRIP_MARKS = [12, 24, 36];

/** The Overview's first block: a greeting over the season's art, a line of real data, the search and its picture's source. */
export function OverviewBanner({ name, anime, strip }: { name: string | null; anime: MediaListEntry[]; strip: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const art = useSeasonArt();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const [term, setTerm] = useState("");
  const now = Math.floor(Date.now() / 1000);
  const week = weekLine(anime, now, weekBounds(new Date()).weekEnd);
  const line =
    week.nextAt == null
      ? t("dashboard.weekLineNone")
      : week.count === 1
        ? t("dashboard.weekLineOne", { when: countdown(week.nextAt - now, t) })
        : t("dashboard.weekLine", { count: week.count, when: countdown(week.nextAt - now, t) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/search?${new URLSearchParams({ q })}` : "/search");
  };

  return (
    <section aria-label={t("dashboard.heroLabel")} className={cn("relative overflow-hidden rounded-hero bg-on-cover", strip ? "h-72" : "h-60")}>
      {art && <MediaBanner source={bannerSource(art, level)} veiled={shouldBlur(art, level, blurAdult)} />}
      <div aria-hidden className="pointer-events-none absolute inset-0 banner-scrim" />
      <div className={cn("relative flex h-full flex-col px-8", strip ? "pt-9" : "justify-center")}>
        <h1 className="text-title leading-tight text-on-cover-edge">{t(greetingKey(new Date().getHours(), name != null), { name })}</h1>
        <p className="mt-1.5 text-sm text-on-cover-edge/80">{line}</p>
        <form role="search" onSubmit={submit} className="mt-5 max-w-xl">
          <SearchField value={term} onChange={setTerm} label={t("dashboard.search")} placeholder={t("dashboard.search")} clearLabel={t("common.clear")} size="lg" className="rounded-full" />
        </form>
      </div>
      {strip && <Strip anime={anime} now={now} />}
      {art && (
        <Link
          to={`/media/${art.id}`}
          aria-label={t("dashboard.imageCredit", { title: displayTitle(art.title) })}
          className={cn("absolute right-5 text-2xs text-on-cover-edge/80 hover:text-on-cover-edge", strip ? "top-3" : "bottom-3")}
        >
          {t("dashboard.imageCredit", { title: displayTitle(art.title) })}
        </Link>
      )}
    </section>
  );
}

/** The next 48 hours as a line: now on the left, each title's cover where its episode airs. */
function Strip({ anime, now }: { anime: MediaListEntry[]; now: number }) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  return (
    <div className="absolute inset-x-8 bottom-12">
      <div className="relative h-px bg-on-cover-edge/20">
        <span aria-hidden className="absolute -top-1 left-0 size-2 rounded-full bg-on-cover-edge" />
        {STRIP_MARKS.map((h) => (
          <span key={h} aria-hidden className="absolute -top-1 h-2 w-px bg-on-cover-edge/20" style={{ left: `${(h / 48) * 100}%` }}>
            <span className="absolute left-1 top-2.5 whitespace-nowrap text-2xs text-on-cover-edge/80">{t("dashboard.stripHours", { n: h })}</span>
          </span>
        ))}
        <ul aria-label={t("dashboard.strip")}>
          {stripItems(anime, now).map(({ entry, offset }) => (
            <li key={entry.id} className="absolute -translate-x-1/2 -translate-y-full pb-1.5" style={{ left: `${offset * 100}%` }}>
              <Link to={`/media/${entry.mediaId}`} title={displayTitle(entry.media.title)} aria-label={displayTitle(entry.media.title)}>
                {entry.media.coverImage.large && <img src={entry.media.coverImage.large} alt="" className={cn("h-9 w-7 rounded-inner object-cover ring-2 ring-on-cover-edge/80", shouldBlur(entry.media, level, blurAdult) && "veil-thumb")} />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
