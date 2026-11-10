import { useDeferredValue, useMemo } from "react";
import { displayTitle, STATUS_ORDER, type ListResult, type MediaListEntry, type MediaListStatus } from "@/api/types";
import { blockReason } from "@/lib/contentFilter";
import { customListNames } from "@/lib/customLists";
import { fuzzyScore, prepareDoc, prepareQuery, type FuzzyDoc } from "@/lib/fuzzy";
import { SORT_DEFAULT_DIR, tagSet, type ListView } from "@/lib/listFilters";
import { searchTitles } from "@/lib/search";
import { collectTags, tagsOf } from "@/lib/tags";
import type { ContentFilterLevel } from "@/lib/contentFilter";

// One collator, since localeCompare builds a fresh one per call; default options keep the ordering it gave.
const COLLATOR = new Intl.Collator();

/** The entries a list view draws: the fetched lists through the content filter, the tab, the filters and the sort. */
export function useListEntries(data: ListResult | undefined, view: ListView, filter: string, level: ContentFilterLevel) {
  const { tab, sort, dir, tag: tagFilter, format: formatFilter, country: countryFilter, list: listFilter } = view;

  // Filtered here, not in the cache the scrobbler and matcher read, so every byStatus consumer shares one check.
  const { byStatus, hiddenAdult, hiddenSuggestive } = useMemo(() => {
    const map = new Map<MediaListStatus, MediaListEntry[]>();
    let adult = 0;
    let suggestive = 0;
    for (const status of STATUS_ORDER) map.set(status, []);
    for (const group of data?.lists ?? []) {
      if (group.isCustomList) continue;
      for (const entry of group.entries) {
        // Counted by reason in the pass that drops them, so the disclosure line and the list can never disagree.
        const reason = blockReason(entry.media, level);
        if (reason) {
          if (reason === "adult") adult++;
          else suggestive++;
          continue;
        }
        map.get(entry.status)?.push(entry);
      }
    }
    return { byStatus: map, hiddenAdult: adult, hiddenSuggestive: suggestive };
  }, [data, level]);

  // Union of tags across the whole list, for the filter + editor autocomplete.
  const allTags = useMemo(
    () =>
      collectTags(
        [...byStatus.values()].flat().map((e) => e.notes),
      ),
    [byStatus],
  );

  // Custom list names from the entries' membership maps, never the groups' display name; lib/customLists says why.
  const listNames = useMemo(() => customListNames(data?.lists ?? []), [data]);

  /** Search and sort keys, derived once per list change instead of once per entry per keystroke. */
  const searchKeys = useMemo(() => {
    const map = new Map<
      number,
      { doc: FuzzyDoc; tags: string[]; title: string }
    >();
    for (const list of byStatus.values()) {
      for (const e of list) {
        map.set(e.id, {
          doc: prepareDoc(searchTitles(e.media)),
          tags: tagsOf(e.notes).map((x) => x.toLowerCase()),
          title: displayTitle(e.media.title),
        });
      }
    }
    return map;
  }, [byStatus]);

  // Keeps the text field responsive: the filtered list renders at a lower priority than the keystroke echo.
  const deferredFilter = useDeferredValue(filter);

  const entries = useMemo(() => {
    let list = byStatus.get(tab) ?? [];
    const q = deferredFilter.trim();
    // While a query is set, relevance owns the order; the chosen sort survives as the tiebreak.
    let scores: Map<number, number> | null = null;
    if (q) {
      const pq = prepareQuery(q);
      const found = new Map<number, number>();
      list = list.filter((e) => {
        const doc = searchKeys.get(e.id)?.doc;
        const s = doc ? fuzzyScore(doc, pq) : 0;
        if (s > 0) found.set(e.id, s);
        return s > 0;
      });
      scores = found;
    }
    if (tagFilter) {
      // Any chosen tag will do: tags are personal labels, and asking for all of them at once empties a list.
      const wanted = new Set(tagSet(tagFilter));
      list = list.filter((e) => searchKeys.get(e.id)?.tags.some((x) => wanted.has(x)));
    }
    if (formatFilter) {
      list = list.filter((e) => e.media.format === formatFilter);
    }
    if (countryFilter) {
      // Blobs cached before the field existed read undefined and must not pass a country the entry never claimed.
      list = list.filter((e) => e.media.countryOfOrigin === countryFilter);
    }
    if (listFilter) {
      list = list.filter((e) => e.customLists?.[listFilter] === true);
    }
    // Each comparator returns its key's default order; a flipped direction negates it wholesale.
    const flip = dir === SORT_DEFAULT_DIR[sort] ? 1 : -1;
    return [...list].sort((a, b) => {
      if (scores) {
        const d = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
        if (d !== 0) return d;
      }
      const cmp = (() => {
        switch (sort) {
          case "title":
            return COLLATOR.compare(
              searchKeys.get(a.id)?.title ?? "",
              searchKeys.get(b.id)?.title ?? "",
            );
          case "score":
            return b.score - a.score;
          case "progress":
            return b.progress - a.progress;
          default:
            return b.updatedAt - a.updatedAt;
        }
      })();
      return cmp * flip;
    });
  }, [byStatus, tab, deferredFilter, tagFilter, formatFilter, countryFilter, listFilter, sort, dir, searchKeys]);

  return { byStatus, hiddenAdult, hiddenSuggestive, allTags, listNames, searchKeys, deferredFilter, entries };
}
