/** Runs once the window is idle, or shortly after where WebKitGTK has no `requestIdleCallback`. */
export function whenIdle(run: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run);
  else window.setTimeout(run, 300);
}
