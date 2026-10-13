import { useEffect, useState } from "react";
import { getWhatsNew, isTauri, setWhatsNewSeen } from "@/api/anilist";
import LazyWhatsNew, { loadChangelog, preloadWhatsNew } from "@/components/overlays/LazyWhatsNew";
import { usePresentValue } from "@/hooks/usePresence";
import { whenIdle } from "@/lib/idle";
import { linesToRecord, pendingChanges, shouldRecord, upToDate, type Changelog, type Pending } from "@/lib/whatsNew";

/** Whether a dialog other than What's new is open; the dialog's body carries `data-whats-new` to tell them apart. */
const otherOverlay = () =>
  [...document.querySelectorAll("[data-overlay]")].some((el) => !el.querySelector("[data-whats-new]"));

/** After the first paint of a start on a new build, shows once what changed since the last one. */
export function WhatsNewAtStart() {
  const [shown, setShown] = useState<{ log: Changelog; pending: Pending } | null>(null);
  const [aside, setAside] = useState(false);

  useEffect(() => {
    if (!isTauri) return;
    let live = true;
    let watch: MutationObserver | undefined;
    const run = async () => {
      const seen = await getWhatsNew();
      if (!live || upToDate(seen)) return;
      const log = await loadChangelog();
      if (!live) return;
      const pending = pendingChanges(log, seen);
      if (!pending) {
        if (shouldRecord(seen)) await setWhatsNewSeen(linesToRecord(log));
        return;
      }
      await preloadWhatsNew();
      if (!live) return;
      // Recorded as it opens, so it shows once even if the window closes before it is read.
      const open = () => {
        if (!live || document.querySelector("[data-overlay]")) return false;
        watch?.disconnect();
        void setWhatsNewSeen(linesToRecord(log)).catch(() => {});
        setShown({ log, pending });
        return true;
      };
      // Another dialog that opened first keeps the keyboard; this one waits until it has gone.
      if (!open()) {
        watch = new MutationObserver(() => void open());
        watch.observe(document.body, { childList: true, subtree: true });
      }
    };
    whenIdle(() => void run().catch(() => {}));
    return () => {
      live = false;
      watch?.disconnect();
    };
  }, []);

  // A dialog that opens while this one is up, such as the sign-in merge, takes the screen; this one comes back after.
  useEffect(() => {
    if (!shown) return;
    const check = () => setAside(otherOverlay());
    check();
    const watch = new MutationObserver(check);
    watch.observe(document.body, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [shown]);

  const held = usePresentValue(aside ? null : shown);
  if (!held.value) return null;
  return <LazyWhatsNew log={held.value.log} pending={held.value.pending} leaving={held.leaving} onClose={() => setShown(null)} />;
}
