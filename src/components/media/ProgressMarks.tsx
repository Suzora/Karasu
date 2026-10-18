import { progressMarks } from "@/lib/overview";
import { cn } from "@/lib/utils";

/** Progress under a cover: a tick per episode where they fit, a bar past that; the one form every cover caption uses. */
export function ProgressMarks({ progress, total }: { progress: number; total: number | null }) {
  const marks = progressMarks(progress, total);
  return marks.kind === "ticks" ? (
    <div aria-hidden className="flex gap-px">
      {Array.from({ length: marks.total }, (_, i) => (
        <span key={i} data-tick={i < marks.done ? "done" : "left"} className={cn("h-1 flex-1 rounded-mark", i < marks.done ? "bg-accent-400" : "bg-surface-700")} />
      ))}
    </div>
  ) : (
    <div aria-hidden className="h-1 overflow-hidden rounded-full bg-surface-700">
      <div className="h-full rounded-full bg-accent-400" style={{ width: `${marks.share * 100}%` }} />
    </div>
  );
}
