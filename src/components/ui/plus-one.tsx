import { cn } from "@/lib/utils";

/** The step-forward glyph: "+1" in figures, so it never reads as the plus that adds a title to a list. */
export function PlusOne({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("text-xs font-bold leading-none tabular-nums", className)}>
      +1
    </span>
  );
}
