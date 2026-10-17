import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { progressMarks } from "@/lib/overview";
import { cn } from "@/lib/utils";

/** Your place in a title: the status control, one tick per episode (a bar past forty), what is left and what comes next. */
export function ProgressBand({
  status,
  progress,
  total,
  unit,
  children,
  className,
}: {
  status: ReactNode;
  /** Null when the title is not on the list, which leaves the status control alone. */
  progress: number | null;
  total: number | null;
  unit: "episodes" | "chapters";
  /** The next episode, the time left and the actions, under the count. */
  children?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const marks = progress == null ? null : progressMarks(progress, total);
  return (
    <section className={cn("space-y-4 rounded-panel bg-surface-900 p-4 surface-outline", className)}>
      {status}
      {marks && progress != null && (
        <div>
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="font-brand text-2xl text-ink-100">{progress}</span>
            <span className="text-sm text-ink-500">/ {total ?? "?"} {t(unit === "episodes" ? "detail.unitEpisodes" : "detail.unitChapters")}</span>
            {total ? <span className="ml-auto text-xs text-ink-500">{t("detail.remaining", { n: Math.max(0, total - progress) })}</span> : null}
          </div>
          {marks.kind === "ticks" ? (
            <div className="flex gap-0.5">
              {Array.from({ length: marks.total }, (_, i) => (
                <span
                  key={i}
                  data-tick={i < marks.done ? "done" : i === marks.done ? "next" : "left"}
                  className={cn("h-2 flex-1 rounded-mark", i < marks.done ? "bg-accent-400" : i === marks.done ? "bg-ink-500" : "bg-surface-700")}
                />
              ))}
            </div>
          ) : (
            <div data-bar className="h-2 overflow-hidden rounded-full bg-surface-700">
              <div className="h-full rounded-full bg-accent-400" style={{ width: `${marks.share * 100}%` }} />
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
