import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isTauri } from "@/api/anilist";
import { currentSeason, seasonHero, type HeroMedia } from "@/api/queries";
import { adultQueryArg, isBlocked } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";

/** The season's most popular title the content filter lets through, for the Overview's banner; one cached request. */
export function useSeasonArt(): HeroMedia | null {
  const [{ season, year }] = useState(currentSeason);
  const level = useContentFilter((s) => s.level);
  const ready = useContentFilter((s) => s.ready);
  const { data } = useQuery({
    queryKey: ["seasonHero", season, year, level],
    queryFn: () => seasonHero(season, year, adultQueryArg(level)),
    enabled: isTauri && ready,
    staleTime: 30 * 60 * 1000,
  });
  return (data ?? []).find((m) => !isBlocked(m, level)) ?? null;
}
