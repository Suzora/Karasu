import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigationType, useSearchParams } from "react-router";
import type { MediaType } from "@/api/types";
import { useSettledWrite } from "@/hooks/useUrlState";
import { mergeView, parseListView, writeViewParams, type ViewPatch } from "@/lib/listFilters";

/** The list's view as its URL holds it, with the draft an open panel edits and the text filter that mirrors into `?q=`. */
export function useListView(type: MediaType) {
  // The view lives in the URL, so back from a detail page restores it and a sidebar click starts clean.
  const [params, setParams] = useSearchParams();
  // Read by the debounce at fire time, since its closure holds the params of the render that armed it.
  const paramsRef = useRef(params);
  paramsRef.current = params;
  // What an open panel has chosen but not yet written: the list draws it now, the URL gets it on close.
  const [draft, setDraft] = useState<ViewPatch>({});
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const view = useMemo(() => mergeView(parseListView(params, type), draft), [params, type, draft]);
  // The text filter alone keeps local state and mirrors into ?q= on a debounce, not a replaceState per keystroke.
  const [filter, setFilter] = useState(() => params.get("q") ?? "");
  // A link to the open list, or Back to another of its entries, brings that entry's text; the page's own replaces do not.
  const { key: entryKey } = useLocation();
  const navigation = useNavigationType();
  const [shownEntry, setShownEntry] = useState(entryKey);
  if (shownEntry !== entryKey) {
    setShownEntry(entryKey);
    if (navigation !== "REPLACE") setFilter(params.get("q") ?? "");
  }

  // Patches waiting for the overlays' history entries to unwind, merged in call order into one write.
  const queued = useRef<{ patch: ViewPatch; draft: boolean } | null>(null);
  const schedule = useSettledWrite();

  /** The one writer for the URL view; it waits out any overlay's entry, which a `replace` would overwrite. */
  const setView = useCallback(
    (patch: ViewPatch, fromDraft = false) => {
      queued.current = queued.current
        ? { patch: { ...queued.current.patch, ...patch }, draft: queued.current.draft || fromDraft }
        : { patch, draft: fromDraft };
      schedule(() => {
        const next = queued.current;
        queued.current = null;
        if (!next) return;
        setParams((prev) => writeViewParams(prev, next.patch), { replace: true });
        // In the same batch as the write, so the list never draws the old URL between draft and commit.
        if (next.draft) setDraft({});
      });
    },
    [setParams, schedule],
  );

  const editDraft = useCallback((patch: ViewPatch) => setDraft((d) => ({ ...d, ...patch })), []);
  const commitDraft = useCallback(() => {
    if (Object.keys(draftRef.current).length > 0) setView(draftRef.current, true);
  }, [setView]);

  // Read at fire time: the writer follows every navigation, and a timer must not be re-armed by one.
  const setViewRef = useRef(setView);
  setViewRef.current = setView;
  const flushQuery = useCallback(() => {
    if (filter.trim() !== (paramsRef.current.get("q") ?? "")) setViewRef.current({ q: filter });
  }, [filter]);

  // Mirror the text filter into ?q= on the same debounce the other searches use, one write when typing settles.
  useEffect(() => {
    const timer = setTimeout(flushQuery, 500);
    return () => clearTimeout(timer);
  }, [flushQuery]);

  return { view, filter, setFilter, setView, editDraft, commitDraft, flushQuery };
}

/** The writer `useListView` hands out, for the hooks that take it. */
export type SetView = ReturnType<typeof useListView>["setView"];
