import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import KarasuMark from "@/components/KarasuMark";
import { Button } from "@/components/ui/button";
import { backendErrorText } from "@/lib/backendError";
import { cn } from "@/lib/utils";

/** An empty surface, said out loud; each visual differs on purpose, and only here does the corvid show itself. */
export function EmptyState({
  icon: Icon,
  visual,
  title,
  hint,
  actions,
  className,
}: {
  /** A plain glyph at the empty-state size, for a state no drawn visual below fits. */
  icon?: LucideIcon;
  visual?: ReactNode;
  title: string;
  hint?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center py-10 text-center", className)}>
      {Icon ? <Icon aria-hidden className="size-8 text-ink-600" /> : visual}
      <p className="mt-4 text-base font-medium text-ink-300">{title}</p>
      {hint && (
        <p className="mt-1 max-w-80 text-2xs leading-relaxed text-ink-600">
          {hint}
        </p>
      )}
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

/** A load that failed, in the reader's language, with one press to ask again; `inline` for a fold, a footer or a row. */
export function ErrorState({
  error,
  onRetry,
  inline = false,
  title,
  visual,
  className,
}: {
  error: unknown;
  /** One request the user asked for, its promise returned so the button holds until it settles; omit where none can be. */
  onRetry?: () => unknown;
  inline?: boolean;
  /** The sentence around the reason, for a page that names what failed to load. */
  title?: (reason: string) => string;
  visual?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const reason = backendErrorText(error, t);
  // A failed query keeps its error while it asks again, so the button is what says a second press is not needed.
  const retry = () => {
    if (pending) return;
    const out = onRetry?.();
    if (out instanceof Promise) {
      setPending(true);
      void out.finally(() => setPending(false));
    }
  };
  const message = title ? title(reason) : t("common.error", { message: reason });
  if (inline) {
    return (
      <div role="alert" className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-danger", className)}>
        <span className="min-w-0">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={retry} aria-disabled={pending || undefined} aria-busy={pending || undefined}>
            {t("common.retry")}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div role="alert" className={className}>
      <EmptyState
        // The alert reads its sentence alone; a struck id or a drawn mark is decoration to a screen reader.
        visual={visual && <div aria-hidden="true">{visual}</div>}
        title={message}
        actions={
          onRetry && (
            // Held with aria-disabled, since a disabled button would drop keyboard focus to the page while it waits.
            <Button variant="outline" size="control" onClick={retry} aria-disabled={pending || undefined} aria-busy={pending || undefined}>
              {t("common.retry")}
            </Button>
          )
        }
      />
    </div>
  );
}

/** A rule fading to nothing with the mark perched on it, for a queue that has run out rather than one never filled. */
export function PerchRule() {
  return (
    <div className="relative h-8 w-full max-w-80">
      <span className="section-rule absolute inset-x-0 bottom-0 block" />
      {/* The bird lands on arrival; the full-colour mark, because a flat silhouette vanishes inside its own disc. */}
      <KarasuMark className="animate-land absolute bottom-0 left-1/2 size-6 -translate-x-1/2 opacity-70" />
    </div>
  );
}

/** Graded tick marks, an empty schedule drawn as the thing it is missing. */
export function TickMarks({ count = 7 }: { count?: number }) {
  // Graded rather than uniform so it reads as a chart with no data, not as a decorative divider.
  const heights = [40, 64, 28, 80, 36, 56, 24];
  return (
    <div className="flex h-20 items-end gap-2.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="w-px bg-surface-700"
          style={{ height: `${heights[i % heights.length]}%` }}
        />
      ))}
    </div>
  );
}

/** A dashed 2:3 cover that never got filled, holding the mark. */
export function CoverOutline() {
  return (
    <div className="grid h-30 w-20 place-items-center rounded-control border border-dashed border-surface-700">
      {/* Barely alive, as nothing else here competes; not on PerchRule's bird, whose `land` owns the same transform. */}
      <KarasuMark className="animate-idle-float size-13 opacity-80" />
    </div>
  );
}

/** Three empty folders, stacked and knocked slightly out of true. */
export function FolderStack() {
  return (
    <div className="relative h-24 w-22" aria-hidden="true">
      {[-7, 3, 0].map((angle, i) => (
        <span
          key={angle}
          className="absolute left-1/2 h-15 w-22 -translate-x-1/2 rounded-inner border border-dashed border-surface-700"
          style={{ top: `${i * 0.75}rem`, transform: `translateX(-50%) rotate(${angle}deg)` }}
        />
      ))}
    </div>
  );
}

/** A year in outline; stroked, not filled, or it is the loudest thing on a screen whose message is nothing. */
export function OutlineYear({ year }: { year: number }) {
  return (
    <p
      className="font-brand text-[7rem] font-extrabold leading-none tracking-tight"
      style={{
        color: "transparent",
        WebkitTextStroke: "1px var(--color-surface-700)",
      }}
    >
      {year}
    </p>
  );
}

/** The query that found nothing, struck through; seeing the string answers a typo or a forgotten filter. */
export function StruckQuery({ query }: { query: string }) {
  return (
    <p className="max-w-full truncate text-[2.5rem] font-bold leading-none text-surface-700 line-through">
      {query}
    </p>
  );
}
