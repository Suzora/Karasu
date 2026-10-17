import { lazy, Suspense, useState } from "react";
import { useNowPlaying } from "@/stores/nowPlaying";
import { useOverviewRail } from "@/stores/overviewRail";

const DetectionPopup = lazy(() => import("./DetectionPopup"));

/** Loads the detection window with the first detection, and stands it down while the Overview's rail shows the title. */
export default function DetectionPopupGate() {
  const detected = useNowPlaying((s) => s.current !== null);
  const railShows = useOverviewRail((s) => s.showsDetection);
  const [armed, setArmed] = useState(false);
  if (detected && !armed) setArmed(true);
  if (!armed || railShows) return null;
  return (
    <Suspense fallback={null}>
      <DetectionPopup />
    </Suspense>
  );
}
