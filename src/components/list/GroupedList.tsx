import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight } from "lucide-react";
import { type MediaListEntry } from "@/api/types";
import { useColumnCount } from "@/hooks/useColumnCount";
import { useScrollMemory, type PlaceReader } from "@/hooks/useScrollMemory";
import { drawnEntries, groupRows, rowOfEntry, type EntryGroup } from "@/lib/listGroups";
import { offsetInRows, placeInRows, rowOfPlace } from "@/lib/scrollMemory";
import { cn } from "@/lib/utils";
import { useTheme } from "@/stores/theme";

const HEAD_PX = 44;

/** A status tab drawn as folding sections under a bar that jumps between them; one virtualizer over heads and rows. */
export function GroupedList({
  groups,
  label,
  dot,
  scrollRef,
  gridClassName,
  rowGap,
  estimateRowHeight,
  renderItem,
  focusIndex,
  onColumns,
  onDrawn,
  frameClassName,
  frameHead,
}: {
  groups: EntryGroup<MediaListEntry>[];
  label: (key: string) => string;
  dot?: (key: string) => ReactNode;
  scrollRef: RefObject<HTMLDivElement | null>;
  gridClassName: string;
  rowGap: number;
  estimateRowHeight: number;
  renderItem: (entry: MediaListEntry, index: number) => ReactNode;
  focusIndex?: number | null;
  onColumns?: (columns: number) => void;
  /** The entries in drawn order with their section sizes, which the keyboard walks instead of the flat list. */
  onDrawn?: (entries: MediaListEntry[], sizes: number[]) => void;
  /** A box around the rows, for the table layouts' border, and what sits in it above them. */
  frameClassName?: string;
  frameHead?: ReactNode;
}) {
  const { t } = useTranslation();
  const probeRef = useRef<HTMLDivElement>(null);
  const coverCols = useTheme((s) => s.coverCols);
  const columns = useColumnCount(probeRef, coverCols);
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set());
  const rows = useMemo(() => groupRows(groups, folded, columns), [groups, folded, columns]);
  const allFolded = groups.length > 0 && groups.every((g) => folded.has(g.key));

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i]?.kind === "head" ? HEAD_PX : estimateRowHeight),
    overscan: 4,
  });

  // The row at the top plus how far into it; one place for the whole scroller, as useScrollMemory asks.
  const place = useMemo<PlaceReader>(
    () => ({
      read: (el) => placeInRows(el.scrollTop, virtualizer.getVirtualItemForOffset(el.scrollTop), 1),
      offset: (saved, el) => {
        const { row, into } = rowOfPlace(saved, 1);
        const start = virtualizer.getOffsetForIndex(row, "start")?.[0];
        if (start === undefined) return null;
        const size = virtualizer.measurementsCache[row]?.size ?? estimateRowHeight;
        return offsetInRows(start, size, into, el.scrollHeight - el.clientHeight);
      },
    }),
    [virtualizer, estimateRowHeight],
  );
  useScrollMemory(scrollRef, "list", place);

  useLayoutEffect(() => {
    virtualizer.measure();
    virtualizer.elementsCache.forEach((el) => virtualizer.measureElement(el));
  }, [columns, folded, virtualizer]);

  useEffect(() => onColumns?.(columns), [columns, onColumns]);

  useEffect(() => {
    onDrawn?.(
      drawnEntries(rows),
      groups.filter((g) => !folded.has(g.key)).map((g) => g.entries.length),
    );
  }, [rows, groups, folded, onDrawn]);

  useEffect(() => {
    if (focusIndex == null) return;
    const row = rowOfEntry(rows, focusIndex);
    if (row !== null) virtualizer.scrollToIndex(row, { align: "auto" });
  }, [focusIndex, rows, virtualizer]);

  const toggle = (key: string) =>
    setFolded((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  // Opens the section first, so the jump lands on a head with its covers under it rather than on a folded line.
  const jump = (key: string) => {
    setFolded((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    requestAnimationFrame(() => {
      const at = groupRows(groups, new Set([...folded].filter((k) => k !== key)), columns).findIndex(
        (r) => r.kind === "head" && r.group.key === key,
      );
      if (at !== -1) virtualizer.scrollToIndex(at, { align: "start" });
    });
  };

  // One stop in the Tab order and the arrows inside it, as the status tabs work.
  const [barStop, setBarAt] = useState(0);
  const barCount = groups.length + 1;
  // Clamped, so a section that went away never leaves the bar with no stop at all.
  const barAt = Math.min(barStop, groups.length);
  const onBarKey = (e: KeyboardEvent<HTMLElement>) => {
    const moves: Record<string, number> = { ArrowLeft: barAt - 1, ArrowRight: barAt + 1, Home: 0, End: barCount - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = Math.min(Math.max(moves[e.key], 0), barCount - 1);
    setBarAt(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  const body = (
    <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((v) => {
        const row = rows[v.index];
        return (
          <div
            key={v.key}
            data-index={v.index}
            ref={virtualizer.measureElement}
            className={cn("absolute left-0 top-0 w-full", row.kind === "cards" && gridClassName)}
            style={{ transform: `translateY(${v.start}px)`, paddingBottom: row.kind === "cards" ? rowGap : 0 }}
          >
            {row.kind === "head" ? (
              <SectionHead
                name={label(row.group.key)}
                count={row.group.entries.length}
                open={row.open}
                dot={dot?.(row.group.key)}
                onToggle={() => toggle(row.group.key)}
              />
            ) : (
              row.entries.map((entry, i) => renderItem(entry, row.first + i))
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <nav
        aria-label={t("list.groupJump")}
        onKeyDown={onBarKey}
        className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden bg-surface-950 px-1 pb-2.5 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((g, i) => (
          <button
            key={g.key}
            type="button"
            tabIndex={i === barAt ? 0 : -1}
            onFocus={() => setBarAt(i)}
            onClick={() => jump(g.key)}
            className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface-850 px-2.5 text-xs text-ink-300 transition-surface hover:bg-surface-800 hover:text-ink-100"
          >
            {dot?.(g.key)}
            {label(g.key)}
            <span className="tabular-nums text-ink-500">{g.entries.length}</span>
          </button>
        ))}
        <button
          type="button"
          tabIndex={barAt === groups.length ? 0 : -1}
          onFocus={() => setBarAt(groups.length)}
          onClick={() => setFolded(allFolded ? new Set() : new Set(groups.map((g) => g.key)))}
          className="ml-auto flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs text-ink-500 transition-surface hover:bg-surface-850 hover:text-ink-100"
        >
          {allFolded ? t("list.groupOpenAll") : t("list.groupFoldAll")}
        </button>
      </nav>
      <div ref={probeRef} className={cn(gridClassName, "h-0")} aria-hidden>
        <div />
      </div>
      {frameClassName ? (
        <div className={frameClassName}>
          {frameHead}
          {body}
        </div>
      ) : (
        body
      )}
    </>
  );
}

function SectionHead({
  name,
  count,
  open,
  dot,
  onToggle,
}: {
  name: string;
  count: number;
  open: boolean;
  dot?: ReactNode;
  onToggle: () => void;
}) {
  const Caret = open ? ChevronDown : ChevronRight;
  return (
    <h3 className="pb-2 pt-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-9 w-full items-center gap-2 border-b border-surface-800 px-1 text-left text-sm font-semibold text-ink-100"
      >
        <Caret aria-hidden className="size-4 shrink-0 text-ink-500" />
        {dot}
        <span className="min-w-0 truncate">{name}</span>
        <span className="text-xs font-normal tabular-nums text-ink-500">{count}</span>
      </button>
    </h3>
  );
}
