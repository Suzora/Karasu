import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isTauri } from "@/api/anilist";
import { currentSeason, seasonHero, type HeroMedia } from "@/api/queries";
import { adultQueryArg, isBlocked } from "@/lib/contentFilter";
import { pickHero } from "@/lib/overview";
import { useContentFilter } from "@/stores/contentFilter";

const LAST_KEY = "karasu-hero-last";

function readLast(): number | null {
  try {
    const id = Number(localStorage.getItem(LAST_KEY));
    return id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** One of the season's ten most popular titles the content filter lets through, drawn anew on every visit. */
export function useSeasonArt(): HeroMedia | null {
  const [{ season, year }] = useState(currentSeason);
  const level = useContentFilter((s) => s.level);
  const ready = useContentFilter((s) => s.ready);
  // Fixed per mount, so a refetch or a re-render keeps the title this visit started with.
  const [draw] = useState(Math.random);
  const [last] = useState(readLast);
  const { data } = useQuery({
    queryKey: ["seasonHero", season, year, level],
    queryFn: () => seasonHero(season, year, adultQueryArg(level)),
    enabled: isTauri && ready,
    staleTime: 30 * 60 * 1000,
  });
  const art = pickHero((data ?? []).filter((m) => !isBlocked(m, level)), last, draw);

  useEffect(() => {
    if (!art) return;
    try {
      localStorage.setItem(LAST_KEY, String(art.id));
    } catch {
      // Without storage the next visit may draw the same title again, and nothing else is lost.
    }
  }, [art]);

  return art;
}
