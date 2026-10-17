import { useMemo, useRef } from "react";
import { Loader } from "@/components/ui/loader";
import { useNavigate } from "react-router";
import { useColumnCount } from "@/hooks/useColumnCount";
import { useGridRoving } from "@/hooks/useGridRoving";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useUrlState } from "@/hooks/useUrlState";
import {
  parsePeriod,
  parseSeasonFilters,
  seasonSections,
  writePeriod,
  writeSeasonFilters,
  yearStep,
  type Period,
  type SeasonFilters,
} from "@/lib/seasonView";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Shapes } from "lucide-react";
import { currentSeason, seasonalAnime } from "@/api/queries";
import { isTauri } from "@/api/anilist";
import SeasonCard from "@/components/media/SeasonCard";
import { FORMAT_ICON, FormatNav, FormatPicker, SeasonField, YearStepper } from "@/components/season/SeasonNav";
import { adultQueryArg, isBlocked } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { EmptyState, ErrorState, TickMarks } from "@/components/EmptyState";
import { SectionHeader } from "@/components/ui/section-header";
import { flattenGroups } from "@/lib/formatGroups";
import { formatLabel } from "@/lib/format";

/** A bare URL means the season it is now, so an entry left across a season's turn reopens on the new one. */
const readPeriod = (params: URLSearchParams): Period => parsePeriod(params, currentSeason());
const writeSeasonal = (prev: URLSearchParams, p: Period): URLSearchParams => writePeriod(prev, p, currentSeason());

export default function Seasonal() {
  const { t } = useTranslation();
  const phone = usePhoneShell();
  // In the URL, so Back from a title lands on the season and the filters it was opened from.
  const [{ season, year }, setPeriod] = useUrlState(readPeriod, writeSeasonal);
  const [filters, setFilters] = useUrlState(parseSeasonFilters, writeSeasonFilters);
  const changeFilters = (patch: Partial<SeasonFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollMemory(scrollRef, "seasonal");

  const level = useContentFilter((s) => s.level);
  const filterReady = useContentFilter((s) => s.ready);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["seasonal", season, year, level],
    queryFn: () => seasonalAnime(season, year, 1, adultQueryArg(level)),
    enabled: isTauri && filterReady,
    staleTime: 30 * 60 * 1000,
  });

  const visible = useMemo(() => (data?.media ?? []).filter((m) => !isBlocked(m, level)), [data, level]);
  const { groups, counts, total } = useMemo(() => seasonSections(visible, filters), [visible, filters]);
  // Grouped, then flattened back, so the roving index counts in the order the eye reads.
  const results = useMemo(() => flattenGroups(groups), [groups]);
  const sections = useMemo(() => groups.map((g) => g.items.length), [groups]);

  // Arrow keys over the cards as in the list view; `useColumnCount` reads the resolved grid, not the CSS.
  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useColumnCount(gridRef, results.length);
  const navigate = useNavigate();
  const { focus } = useGridRoving({
    count: results.length,
    columns,
    sections,
    onOpen: (i) => {
      const m = results[i];
      if (m) navigate(`/media/${m.id}`);
    },
  });

  const stepYear = (step: 1 | -1) => setPeriod((p) => yearStep(p, step));
  const pickSeason = (s: Period["season"]) => setPeriod((p) => ({ ...p, season: s }));
  const formatProps = { counts, total, filters, onChange: changeFilters };

  const body = (
    <>
      {error && (
        <ErrorState error={error} onRetry={() => refetch()} inline={groups.length > 0} className={groups.length > 0 ? "mb-4" : undefined} />
      )}
      {isLoading && <Loader label={t("seasonal.loading")} />}
      {!isLoading && !error && results.length === 0 && (
        // Four verticals rather than the schedule's seven: a season is a shorter unit than a week.
        <EmptyState visual={<TickMarks count={4} />} title={t(total > 0 ? "seasonal.emptyFiltered" : "seasonal.empty")} />
      )}
      {groups.length > 0 && (
        <div className="@container space-y-7">
          {groups.map((group) => (
            <section key={group.format ?? "other"}>
              <SectionHeader
                icon={FORMAT_ICON[group.format ?? ""] ?? Shapes}
                title={group.format ? formatLabel(group.format, t) : t("seasonal.otherFormats")}
                meta={String(group.items.length)}
                className="mb-3"
              />
              {/* Only the first section is measured: every section shares one track list. */}
              <div ref={group.offset === 0 ? gridRef : undefined} className="grid grid-cols-1 gap-3 @2xl:grid-cols-2 @6xl:grid-cols-3">
                {group.items.map((m, i) => (
                  <SeasonCard key={m.id} media={m} focused={group.offset + i === focus} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );

  if (phone) {
    return (
      <div ref={scrollRef} className="h-full space-y-4 overflow-y-auto px-8 pb-12 pt-4 float-clear">
        <h1 className="sr-only">{t("seasonal.title")}</h1>
        <YearStepper year={year} onStep={stepYear} />
        <SeasonField season={season} onPick={pickSeason} row />
        <FormatPicker {...formatProps} />
        {body}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <h1 className="sr-only">{t("seasonal.title")}</h1>
      <aside className="w-60 shrink-0 space-y-4 overflow-y-auto pb-8 pl-5 pr-3 pt-6">
        <YearStepper year={year} onStep={stepYear} />
        <SeasonField season={season} onPick={pickSeason} />
        <FormatNav {...formatProps} />
      </aside>
      <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto pb-12 pl-2 pr-8 pt-6 float-clear">
        {body}
      </div>
    </div>
  );
}
