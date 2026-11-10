import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useNavigate } from "react-router";
import type { MediaListEntry } from "@/api/types";
import { canIncrement } from "@/components/list/shared";
import { isTyping } from "@/components/shell/KeyboardSheet";
import { nextFocusGrouped } from "@/lib/formatGroups";
import { nextFocus, ownsKeyboard, restingSurfaces, type Move } from "@/lib/roving";
import type { ShownStack } from "@/lib/stacks";

/** What the list's keys read and move: the entries in drawn order, the focus, the selection and the entry actions. */
interface ListKeys {
  scrollRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  /** True while a dialog of the list's own is up, which owns the keys for as long. */
  busy: boolean;
  nav: MediaListEntry[];
  /** The drawn sections' sizes while the list is grouped, null while it is flat. */
  sizes: number[] | null;
  columns: number;
  focus: number | null;
  setFocus: (index: number | null) => void;
  selectMode: boolean;
  setSelectMode: (on: boolean) => void;
  setSelected: Dispatch<SetStateAction<Set<number>>>;
  toggleSelect: (mediaId: number) => void;
  exitSelect: () => void;
  memberStack: Map<number, ShownStack<MediaListEntry>>;
  openStack: (id: string) => void;
  plusOne: (entry: MediaListEntry) => void;
  complete: (entry: MediaListEntry) => void;
  startEdit: (entry: MediaListEntry) => void;
  startRemove: (entry: MediaListEntry) => void;
}

/** The list's key group over a roving index, and Ctrl+F for its search field. */
export function useListKeys(k: ListKeys) {
  const navigate = useNavigate();

  /** The list's key group: a roving index rather than DOM focus, since a virtualized row unmounts when it scrolls away. */
  useEffect(() => {
    const { nav, focus, columns, sizes, selectMode, memberStack } = k;
    const onKey = (e: KeyboardEvent) => {
      // Anything modal owns the keyboard while it is up, and a field owns it while the caret is in one.
      if (isTyping() || document.querySelector("[data-overlay]")) return;
      // Any other focused control owns it too; keep this above the arrow branch, a focused select reads arrows as well.
      if (!ownsKeyboard(document.activeElement, restingSurfaces(k.scrollRef.current))) return;
      if (k.busy) return;
      if (e.altKey) return;
      if (nav.length === 0) return;

      const entry = focus === null ? undefined : nav[focus];

      const move = (direction: Move) => {
        e.preventDefault();
        const next = sizes
          ? nextFocusGrouped(focus, direction, columns, sizes)
          : nextFocus(focus, direction, columns, nav.length);
        if (next === null) return;
        k.setFocus(next);
        // Shift extends the selection one step at a time, which is what a range select is from a held anchor.
        if (e.shiftKey) {
          k.setSelectMode(true);
          k.setSelected((prev) => new Set(prev).add(nav[next].mediaId));
        }
      };

      switch (e.key) {
        case "ArrowRight":
          return move("right");
        case "ArrowLeft":
          return move("left");
        case "ArrowDown":
          return move("down");
        case "ArrowUp":
          return move("up");
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "a") {
          e.preventDefault();
          k.setSelectMode(true);
          k.setSelected(new Set(nav.map((x) => x.mediaId)));
        }
        return;
      }

      if (e.key === "Escape") {
        if (selectMode) k.exitSelect();
        else k.setFocus(null);
        return;
      }

      // Everything below acts on the focused entry, so there has to be one.
      if (focus === null || !entry) return;

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          const stacked = memberStack.get(entry.mediaId);
          if (stacked) k.openStack(stacked.stack.id);
          else navigate(`/media/${entry.media.id}`);
          break;
        }
        case " ":
          // Without this the page scrolls a screen down under the grid.
          e.preventDefault();
          // A stack takes the +1 on its front member, the one its cover shows.
          const front = memberStack.get(entry.mediaId)?.members[0] ?? entry;
          if (selectMode) k.toggleSelect(front.mediaId);
          else if (canIncrement(front)) k.plusOne(front);
          break;
        case "e":
          e.preventDefault();
          k.startEdit(entry);
          break;
        case "c":
          e.preventDefault();
          k.complete(entry);
          break;
        case "s":
          e.preventDefault();
          if (selectMode) k.exitSelect();
          else k.setSelectMode(true);
          break;
        case "Delete":
          e.preventDefault();
          k.startRemove(entry);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // Deliberately no dependency array: a missed entry would leave the keys acting on a stale list, and a rebind is cheap.
  });

  // Ctrl+F finds in this list rather than the page; bound apart from the key group, which stands down on an empty list.
  const { searchRef } = k;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "f") return;
      if (document.querySelector("[data-overlay]")) return;
      const field = searchRef.current;
      if (!field) return;
      e.preventDefault();
      field.focus();
      field.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchRef]);
}
