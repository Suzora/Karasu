import { lazy, Suspense, type ComponentProps } from "react";
import type { Changelog } from "@/lib/whatsNew";
import type WhatsNewDialog from "./WhatsNewDialog";

const load = () => import("./WhatsNewDialog");
const Dialog = lazy(load);

/** The changelog as data, a chunk of its own, so a start whose mark is already this build's never loads it. */
export const loadChangelog = (): Promise<Changelog> => import("virtual:changelog").then((m) => m.default);

/** Fetches the dialog's code before its first render, so a start that shows it never waits on the fallback. */
export const preloadWhatsNew = () => load();

/** The changelog dialog, loaded with its first opening rather than with the shell. */
export default function LazyWhatsNew(props: ComponentProps<typeof WhatsNewDialog>) {
  return (
    <Suspense fallback={null}>
      <Dialog {...props} />
    </Suspense>
  );
}
