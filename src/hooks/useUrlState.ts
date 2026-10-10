import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useLocation, useNavigationType, useSearchParams } from "react-router";
import { afterBackSettles } from "@/hooks/useBackClose";

/** The browser's current entry as the hash router keys it, or undefined where no router keeps state in the browser. */
function browserEntryKey(): string | undefined {
  const state = window.history.state as { key?: string; idx?: unknown } | null;
  if (typeof state?.idx !== "number") return undefined;
  return state.key || "default";
}

/** Runs the latest scheduled write once no overlay holds a history entry, and only onto the entry this page shows. */
export function useSettledWrite(): (write: () => void) => void {
  const { key } = useLocation();
  const queued = useRef<(() => void) | null>(null);
  // A write still waiting when the page goes would resolve against this route and replace the next page's URL.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // The entry the page last committed, and the one its own last replace made before React caught up with it.
  const committed = useRef(key);
  const own = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    committed.current = key;
    own.current = undefined;
  }, [key]);
  return useCallback((write: () => void) => {
    const waiting = queued.current !== null;
    queued.current = write;
    if (waiting) return;
    afterBackSettles(() => {
      const run = queued.current;
      queued.current = null;
      if (!run || !alive.current) return;
      // A link already pushed, or Back already left, while the page has not re-rendered: a replace would overwrite that.
      const at = browserEntryKey();
      if (at !== undefined && at !== committed.current && at !== own.current) return;
      run();
      own.current = browserEntryKey();
    });
  }, []);
}

/** Whether two param sets hold the same pairs, regardless of the order different names appear in. */
function sameParams(a: URLSearchParams, b: URLSearchParams): boolean {
  const left = new URLSearchParams(a);
  const right = new URLSearchParams(b);
  // The sort is stable, so values repeating one name keep their order.
  left.sort();
  right.sort();
  return left.toString() === right.toString();
}

/** Page state mirrored into the URL, so Back from a page opened here brings it back; the number counts visits. */
export function useUrlState<T>(
  parse: (params: URLSearchParams) => T,
  write: (prev: URLSearchParams, value: T) => URLSearchParams,
): [T, Dispatch<SetStateAction<T>>, number] {
  const [params, setParams] = useSearchParams();
  const { key } = useLocation();
  const navigation = useNavigationType();
  const [value, setValue] = useState(() => parse(params));
  // Bumped when another entry's URL replaces the state, so a draft that follows it (the typed query) can start over.
  const [visit, setVisit] = useState(0);
  const latest = useRef({ parse, write, params, value, setParams });
  latest.current = { parse, write, params, value, setParams };

  // A link to this page, or Back to another of its entries, brings that entry's URL; this page's own replaces do not.
  const seen = useRef(key);
  useEffect(() => {
    if (seen.current === key) return;
    seen.current = key;
    if (navigation === "REPLACE") return;
    setValue(latest.current.parse(latest.current.params));
    setVisit((n) => n + 1);
  }, [key, navigation]);

  const schedule = useSettledWrite();
  // On the value alone: `setParams` changes with every navigation, and a run then would write the state being replaced.
  useEffect(() => {
    const { write: toParams, params: now } = latest.current;
    if (sameParams(toParams(now, value), now)) return;
    schedule(() => latest.current.setParams((prev) => latest.current.write(prev, latest.current.value), { replace: true }));
  }, [value, schedule]);

  return [value, setValue, visit];
}
