import { lazy, Suspense, type ComponentProps } from "react";
import { Shimmer } from "@/components/Skeleton";
import type { NotifFeed as Feed } from "./NotifFeed";

const load = () => import("./NotifFeed");
const NotifFeed = lazy(() => load().then((m) => ({ default: m.NotifFeed })));

/** Starts the feed's download ahead of the first open, so the dropdown never waits on it. */
export function preloadNotifFeed(): void {
  void load().catch(() => {});
}

/** The bell's rows, loaded apart from the shell; the page that lists them all imports the feed directly. */
export function LazyNotifFeed(props: ComponentProps<typeof Feed>) {
  return (
    <Suspense fallback={<Shimmer className="m-3 h-16 rounded-control" />}>
      <NotifFeed {...props} />
    </Suspense>
  );
}
