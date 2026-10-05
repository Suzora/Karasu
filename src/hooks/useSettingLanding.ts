import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** How long a deep link waits for its row; sections that read the backend first render it a beat late. */
const LANDING_WAIT_MS = 4000;

const FOCUSABLE = "select, input, textarea, button, [tabindex]:not([tabindex='-1'])";

/** Clears the outline on the first press or key, so it marks where the link landed and nothing after. */
function outlineUntilInteraction(el: HTMLElement): void {
  el.setAttribute("data-landed", "");
  const clear = () => {
    el.removeAttribute("data-landed");
    window.removeEventListener("pointerdown", clear, true);
    window.removeEventListener("keydown", clear, true);
  };
  window.addEventListener("pointerdown", clear, true);
  window.addEventListener("keydown", clear, true);
}

/** Lands a `?setting=` deep link on its `data-setting` row: centred, its control focused, outlined until touched. */
export function useSettingLanding(setting: string | null, onLanded: () => void): void {
  // The callback changes every render; the landing must not restart for that.
  const landed = useRef(onLanded);
  landed.current = onLanded;

  useEffect(() => {
    // The ids are constants in the code; anything else in the URL is ignored rather than built into a selector.
    if (!setting || !/^[A-Za-z][\w-]*$/.test(setting)) return;
    const selector = `[data-setting="${setting}"]`;
    const land = (el: HTMLElement) => {
      el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      el.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
      outlineUntilInteraction(el);
      landed.current();
    };

    const now = document.querySelector<HTMLElement>(selector);
    if (now) {
      land(now);
      return;
    }
    const watch = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      watch.disconnect();
      window.clearTimeout(timer);
      land(el);
    });
    watch.observe(document.body, { childList: true, subtree: true });
    const timer = window.setTimeout(() => watch.disconnect(), LANDING_WAIT_MS);
    return () => {
      watch.disconnect();
      window.clearTimeout(timer);
    };
  }, [setting]);
}
