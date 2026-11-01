import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { displayTitle, type MediaListEntry } from "@/api/types";
import { isBlocked, shouldBlur } from "@/lib/contentFilter";
import { countdown } from "@/lib/format";
import { greetingKey } from "@/lib/overview";
import { greetingLang, loadGreetings, loadedGreetings } from "@/lib/greetings/load";
import { allLines, candidates, fillGreeting, greetingFacts, pickGreeting, RECENT_SIZE } from "@/lib/greetings/pick";
import type { Catalogue } from "@/lib/greetings/types";
import { useContentFilter } from "@/stores/contentFilter";

const RECENT_KEY = "karasu-greeting-recent";
const SEEN_KEY = "karasu-overview-seen";
const DAY_MS = 86_400_000;

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function readSeen(): number | null {
  try {
    const at = Number(localStorage.getItem(SEEN_KEY));
    return at > 0 ? at : null;
  } catch {
    return null;
  }
}

/** One greeting per visit of the Overview, drawn from the catalogue and never one of the last thirty shown. */
export function useGreeting(name: string | null, anime: MediaListEntry[], manga: MediaListEntry[]): string {
  const { t, i18n } = useTranslation();
  const lang = greetingLang(i18n.language);
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const [now] = useState(() => new Date());
  const [seen] = useState(readSeen);

  const draw = (catalogue: Catalogue) => {
    const awayDays = seen == null ? 0 : Math.floor((now.getTime() - seen) / DAY_MS);
    const nameable = (e: MediaListEntry) => !isBlocked(e.media, level) && !shouldBlur(e.media, level, blurAdult);
    const facts = greetingFacts(anime, manga, now, awayDays, (e) => displayTitle(e.media.title), nameable);
    const ctx = { now, named: name != null, facts };
    const picked = pickGreeting(candidates(allLines(catalogue), ctx), readRecent(), Math.random);
    return picked && { id: picked.id, text: fillGreeting(picked, ctx, name, (s) => countdown(s, t)) };
  };

  // Drawn once per mount, so a re-render or a list refresh never swaps the line under the reader.
  const [greeting, setGreeting] = useState(() => {
    const catalogue = loadedGreetings(lang);
    return catalogue ? draw(catalogue) : null;
  });

  useEffect(() => {
    if (greeting) return;
    let live = true;
    loadGreetings(lang).then(
      (catalogue) => live && setGreeting(draw(catalogue)),
      () => {},
    );
    return () => {
      live = false;
    };
    // The draw happens once; later list or filter changes must not trigger a second one.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [greeting, lang]);

  useEffect(() => {
    if (!greeting) return;
    try {
      const recent = [greeting.id, ...readRecent().filter((id) => id !== greeting.id)].slice(0, RECENT_SIZE);
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
      // A storage that refuses only costs the next visit its memory of this line.
    }
  }, [greeting]);

  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, String(now.getTime()));
    } catch {
      // Without storage every visit simply reads as the first.
    }
  }, [now]);

  return greeting?.text ?? t(greetingKey(now.getHours(), name != null), { name });
}
