import { lazy, Suspense, useState, type ComponentType, type ReactNode } from "react";

/** A route split out of the entry chunk that still renders synchronously once its chunk is in. */
export interface LazyRoute<P extends object> {
  (props: P): ReactNode;
  /** Starts the chunk's download once; later calls share the first. */
  preload: () => Promise<void>;
  isLoaded: () => boolean;
}

/** Like `React.lazy`, but a loaded module renders directly, so a View Transition's `flushSync` never commits a fallback. */
export function lazyRoute<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null,
): LazyRoute<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<void> | null = null;
  const preload = () =>
    (pending ??= load().then(
      (m) => {
        loaded = m.default;
      },
      (e: unknown) => {
        // A failed download may be retried by the next visit, rather than failing every one after it.
        pending = null;
        throw e;
      },
    ));
  const Lazy = lazy(() => preload().then(() => ({ default: loaded as ComponentType<P> })));

  function Route(props: P) {
    // Chosen once per mount, so a chunk landing mid-visit cannot swap the element type and remount the page.
    const [Direct] = useState(() => loaded);
    if (Direct) return <Direct {...props} />;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  }
  return Object.assign(Route, { preload, isLoaded: () => loaded !== null });
}

/** Runs once the window is idle, or shortly after where WebKitGTK has no `requestIdleCallback`. */
export function whenIdle(run: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run);
  else window.setTimeout(run, 300);
}
