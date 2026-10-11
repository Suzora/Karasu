import { lazy, Suspense, type ComponentProps } from "react";
import type EntryDialog from "./EntryDialog";

const Dialog = lazy(() => import("./EntryDialog"));

/** The entry editor, loaded with its first opening rather than with every list and card. */
export default function LazyEntryDialog(props: ComponentProps<typeof EntryDialog>) {
  return (
    <Suspense fallback={null}>
      <Dialog {...props} />
    </Suspense>
  );
}
