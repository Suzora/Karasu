import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The heading every Overview section wears; `meta` is the quiet one-line justification a section sometimes owes. */
export function SectionHeader({
  icon: Icon,
  title,
  meta,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
  /** A link at the far end, such as the way to everything a section only samples. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Icon className="size-4 shrink-0 text-accent-400" />
      {/* The title keeps its width and the meta gives way first; the pair shrinks so an action never leaves the row. */}
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="max-w-full shrink-0 truncate text-base text-ink-100">
          {title}
        </h2>
        {meta && (
          <span className="min-w-0 truncate rounded-full bg-surface-850 px-2 label-text text-ink-500">
            {meta}
          </span>
        )}
      </div>
      <span className="flex-1" />
      {action && <span className="shrink-0">{action}</span>}
    </div>
  );
}
