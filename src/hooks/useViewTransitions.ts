import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { prefersReducedMotion } from "@/lib/motion";
import { canViewTransition, usePlatform } from "@/stores/platform";

/** Marks the cover that should morph into the detail hero. */
export const HERO_ATTR = "data-hero-cover";
/** The `view-transition-name` both ends of that morph share. */
const HERO_NAME = "karasu-hero";

/** The longest the new snapshot waits for the route to commit; past it the browser would abandon the transition anyway. */
const COMMIT_WAIT_MS = 1500;

/** Wraps in-app navigation in a View Transition by intercepting clicks; the new snapshot waits for the route's commit. */
export function useViewTransitions(routeReady: (to: string) => boolean = () => true) {
  const navigate = useNavigate();
  const { key: routeKey } = useLocation();
  // The router commits inside `startTransition`, which `flushSync` cannot hurry, so the callback waits for this instead.
  const committed = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    committed.current?.();
    committed.current = null;
  }, [routeKey]);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;

    const onClick = (e: MouseEvent) => {
      // Anything but a plain left click belongs to the browser (new windows, the Linux middle-click paste).
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      // In-app routes only; under the hash router anything not `#/…` is an external link the opener handles.
      if (!anchor || !href?.startsWith("#/")) return;
      if (anchor.target && anchor.target !== "_self") return;
      // A link that closes its overlay before it navigates does the navigating itself; taking it over would push twice.
      if (anchor.hasAttribute("data-own-navigation")) return;

      const to = href.slice(1);
      if (to === `${location.hash.slice(1) || "/"}`) return;

      // With motion off this must not intercept at all, so check the setting before taking the click over.
      if (prefersReducedMotion()) return;
      // Read at the click, not at mount: the platform answers after the first render.
      if (!canViewTransition(usePlatform.getState().info)) return;
      // A page whose chunk is not in yet would snapshot an empty pane, so that first visit navigates plainly.
      if (!routeReady(to)) return;

      e.preventDefault();

      // The name goes on the clicked cover only; two nodes carrying it in one snapshot make the browser skip the pairing.
      const cover = anchor.querySelector<HTMLElement>(`[${HERO_ATTR}]`);
      if (cover) cover.style.viewTransitionName = HERO_NAME;

      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            committed.current = resolve;
            void navigate(to);
            window.setTimeout(resolve, COMMIT_WAIT_MS);
          }),
      );
      // Keep the `ready` handler; a skipped transition rejects both promises, and an unhandled one is a console error.
      transition.ready.catch(() => {});
      transition.finished
        .finally(() => {
          if (cover) cover.style.viewTransitionName = "";
        })
        .catch(() => {});
    };

    // Keep the capture phase; in bubble phase `<Link>` has already navigated and this listener bails every time.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate, routeReady]);
}
