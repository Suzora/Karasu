import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

/** The width an edge's fade takes, and the room kept beside an item scrolled into view so the fade never covers it. */
export const EDGE_PX = 32;

export interface ScrollEdges {
  start: boolean;
  end: boolean;
}

/** The mask that fades whichever edge has more beyond it; none when everything fits. */
export function edgeMask(edges: ScrollEdges): CSSProperties | undefined {
  if (!edges.start && !edges.end) return undefined;
  return {
    maskImage: `linear-gradient(90deg, ${edges.start ? `transparent, #000 ${EDGE_PX}px` : "#000"}, ${
      edges.end ? `#000 calc(100% - ${EDGE_PX}px), transparent` : "#000"
    })`,
  };
}

/** Which edges of a sideways scroller hide content, re-read when it or its content resizes; a vertical wheel scrolls it. */
export function useScrollEdges(
  scroller: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
): { edges: ScrollEdges; read: () => void } {
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });

  // One stable function that reads the edges now, so the effects below and a caller's own can depend on it freely.
  const latest = useRef(() => {});
  latest.current = () => {
    const s = scroller.current;
    if (!s) return;
    const start = s.scrollLeft > 1;
    const end = s.scrollLeft + s.clientWidth < s.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  };
  const [read] = useState(() => () => latest.current());

  // The scroller narrows with the window and the content grows when a font arrives; either moves an edge.
  useLayoutEffect(() => {
    const ro = new ResizeObserver(read);
    if (scroller.current) ro.observe(scroller.current);
    if (content.current) ro.observe(content.current);
    read();
    return () => ro.disconnect();
  }, [read, scroller, content]);

  // Only takes the wheel when it actually moved something, so a page scroll passes over a row that fits.
  useLayoutEffect(() => {
    const s = scroller.current;
    if (!s) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const before = s.scrollLeft;
      s.scrollLeft += e.deltaY;
      if (s.scrollLeft !== before) e.preventDefault();
    };
    s.addEventListener("wheel", onWheel, { passive: false });
    return () => s.removeEventListener("wheel", onWheel);
  }, [scroller]);

  return { edges, read };
}

/** A row that scrolls sideways under a fade at whichever edge has more, instead of cutting its last item mid-word. */
export function ScrollRow({
  className,
  innerClassName,
  children,
}: {
  /** On the scroller, for its place in the layout. */
  className?: string;
  /** On the row inside it, which holds the items and their gaps. */
  innerClassName?: string;
  children: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { edges, read } = useScrollEdges(scroller, content);
  return (
    <div
      ref={scroller}
      onScroll={read}
      className={cn("overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      style={edgeMask(edges)}
    >
      <div ref={content} className={cn("flex w-max", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
