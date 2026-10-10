import { useEffect, useRef, useState, type RefObject } from "react";
import { useLocation, useNavigationType } from "react-router";
import { RESTORE_MS, recallPlace, rememberPlace, restoreStep } from "@/lib/scrollMemory";

/** How a scroller's place is read and found again: pixels by default, an item index for a virtualized list. */
export interface PlaceReader {
  read: (el: HTMLElement) => number;
  /** The scroll offset that shows `place` in `el`, or null while it cannot be known yet. */
  offset: (place: number, el: HTMLElement) => number | null;
}

const PIXELS: PlaceReader = { read: (el) => el.scrollTop, offset: (place) => place };

/** One arrival at a history entry: Back brings that entry's remembered place, a link brings none. */
interface Arrival {
  key: string;
  place: number | undefined;
  /** The page mounted with it; a later arrival found the page already open on another entry. */
  first: boolean;
}

/** Remembers where `scroller` was left per history entry and, arriving by Back, scrolls there again once it can. */
export function useScrollMemory(
  scroller: RefObject<HTMLElement | null>,
  slot: string,
  reader: PlaceReader = PIXELS,
): void {
  const { key } = useLocation();
  const navigation = useNavigationType();
  const recall = () => (navigation === "POP" ? recallPlace(`${key}:${slot}`) : undefined);
  // Read during render, before this arrival's own scrolling can overwrite it.
  const [arrival, setArrival] = useState<Arrival>(() => ({ key, place: recall(), first: true }));
  // A replace is the page writing its own view, so it is no arrival and the place carries over instead.
  if (arrival.key !== key && navigation !== "REPLACE") setArrival({ key, place: recall(), first: false });
  const restoring = useRef(arrival.place !== undefined);
  // The running restore's stop, so a view the page changes on its own ends it.
  const stopRestore = useRef<(() => void) | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;
  const readerRef = useRef(reader);
  readerRef.current = reader;

  // Scrolls back to this arrival's remembered place, or to the top for a link to the page that is already open.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const saved = arrival.place;
    if (saved === undefined) {
      restoring.current = false;
      // A link to the page that is already open starts it over, at the top.
      if (!arrival.first) el.scrollTop = 0;
      return;
    }
    restoring.current = true;
    const started = performance.now();
    let stable = 0;
    let frame = 0;
    const stop = () => {
      restoring.current = false;
      stopRestore.current = null;
      cancelAnimationFrame(frame);
      el.removeEventListener("wheel", stop);
      window.removeEventListener("pointerdown", stop, true);
      window.removeEventListener("touchstart", stop, true);
      window.removeEventListener("keydown", stop, true);
    };
    const step = () => {
      const next = restoreStep(el.scrollTop, readerRef.current.offset(saved, el), stable);
      stable = next.stable;
      if (next.scrollTo !== null) el.scrollTop = next.scrollTo;
      if (next.done) {
        stop();
        rememberPlace(`${keyRef.current}:${slot}`, readerRef.current.read(el));
      } else if (performance.now() - started > RESTORE_MS) stop();
      else frame = requestAnimationFrame(step);
    };
    // Any press or key ends it, wherever it lands: a tab, a filter or the sidebar changes the view the restore aims at.
    el.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("pointerdown", stop, true);
    window.addEventListener("touchstart", stop, { capture: true, passive: true });
    window.addEventListener("keydown", stop, true);
    stopRestore.current = stop;
    frame = requestAnimationFrame(step);
    return stop;
  }, [arrival, scroller, slot]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const record = () => {
      if (!restoring.current) rememberPlace(`${keyRef.current}:${slot}`, readerRef.current.read(el));
    };
    el.addEventListener("scroll", record, { passive: true });
    return () => el.removeEventListener("scroll", record);
  }, [scroller, slot]);

  // The page's own replace mints a new entry key: a restore still aiming at the old view ends, and the place carries over.
  const lastKey = useRef(key);
  useEffect(() => {
    const old = lastKey.current;
    lastKey.current = key;
    if (navigation !== "REPLACE" || old === key) return;
    stopRestore.current?.();
    const el = scroller.current;
    if (!el) return;
    const place = readerRef.current.read(el);
    // Nothing to carry for a scroller that never moved, or every replace would fill the map with zeros.
    if (place !== 0 || recallPlace(`${old}:${slot}`) !== undefined) rememberPlace(`${key}:${slot}`, place);
  }, [key, navigation, scroller, slot]);
}
