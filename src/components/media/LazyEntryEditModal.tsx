import { lazy, Suspense, type ComponentProps } from "react";
import type EntryEditModal from "./EntryEditModal";

const Modal = lazy(() => import("./EntryEditModal"));

/** The full entry editor, loaded with its first opening rather than with every list and card. */
export default function LazyEntryEditModal(props: ComponentProps<typeof EntryEditModal>) {
  return (
    <Suspense fallback={null}>
      <Modal {...props} />
    </Suspense>
  );
}
