import { useCallback, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { FLICK_ELASTIC, FLICK_SLOP, isFlick, releaseVelocity, type FlickSample } from "@/lib/flick";

interface Drag {
  pointer: number;
  startY: number;
  samples: FlickSample[];
  moved: boolean;
}

/** A downward flick that dismisses, for mouse and touch alike; anything short of one springs back. */
export function useFlickDismiss(onDismiss: () => void) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<Drag | null>(null);
  // Set when a drag ends, so the click its release fires does not press the button under the finger.
  const swallow = useRef(false);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // A drag whose release fired no click must not eat the next press.
    swallow.current = false;
    drag.current = { pointer: e.pointerId, startY: e.clientY, samples: [{ y: e.clientY, t: e.timeStamp }], moved: false };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const travel = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.abs(travel) < FLICK_SLOP) return;
      d.moved = true;
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // A pointer the browser no longer tracks cannot be captured; the drag still follows it while it lasts.
      }
      setDragging(true);
    }
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 8) d.samples.shift();
    setOffset(Math.max(0, travel) * FLICK_ELASTIC);
  }, []);

  const end = useCallback(
    (e: PointerEvent<HTMLElement>, cancelled: boolean) => {
      const d = drag.current;
      if (!d || d.pointer !== e.pointerId) return;
      drag.current = null;
      if (!d.moved) return;
      swallow.current = true;
      setDragging(false);
      if (!cancelled && isFlick(e.clientY - d.startY, releaseVelocity(d.samples))) onDismiss();
      else setOffset(0);
    },
    [onDismiss],
  );

  const onClickCapture = useCallback((e: MouseEvent<HTMLElement>) => {
    if (!swallow.current) return;
    swallow.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const reset = useCallback(() => setOffset(0), []);

  const style: CSSProperties = {
    transform: offset > 0 ? `translateY(${offset}px)` : undefined,
    // Followed directly while held; let go short of a flick, it springs back on the arrival easing.
    transition: dragging ? "none" : "transform var(--duration-expressive) var(--ease-spring-soft)",
  };

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: PointerEvent<HTMLElement>) => end(e, false),
      onPointerCancel: (e: PointerEvent<HTMLElement>) => end(e, true),
      onClickCapture,
    },
    style,
    /** Puts the element back where it belongs, for the next toast after one was flicked away. */
    reset,
  };
}
