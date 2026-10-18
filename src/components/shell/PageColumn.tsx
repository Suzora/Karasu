import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";
import { Busy, Shimmer } from "@/components/Skeleton";
import { usePhoneShell } from "@/hooks/usePhoneShell";

/** A screen's title with its Japanese line under it, and the page's one action at the end of that line. */
export function PageTitle({ title, jp, action, className }: { title: ReactNode; jp: string; action?: ReactNode; className?: string }) {
  return (
    <div data-page-title className={cn("px-1", className)}>
      <h1 className="text-page text-ink-100">{title}</h1>
      <div className="flex min-h-5 items-center gap-2">
        <span lang="ja" className="font-brand-jp text-ui tracking-lockup text-ink-600">
          {jp}
        </span>
        {action && <span className="ml-auto flex shrink-0 items-center gap-1">{action}</span>}
      </div>
    </div>
  );
}

/** A column row's classes, chosen or at rest; every pill and link in a column takes these. */
export function columnRow(on = false) {
  return cn(
    "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11",
    on ? "nav-pill" : "text-ink-300 hover:bg-surface-850 hover:text-ink-100",
  );
}

/** A heading for a group of rows in a column, with the inset the rows' own text starts at. */
export function ColumnLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("px-4 pb-1 label-text text-ink-500", className)}>{children}</p>;
}

/** The line between a column's groups. */
export function ColumnRule() {
  return <div className="mx-3 my-3 h-px bg-surface-850" />;
}

/** The desktop page beside its column in one geometry; `own` scrolls the content alone, `page` lets `<main>` scroll both. */
export function ColumnPage({
  column,
  children,
  scroll = "own",
  contentRef,
  className,
  columnClassName,
  contentClassName,
}: {
  column: ReactNode;
  children: ReactNode;
  scroll?: "own" | "page";
  contentRef?: Ref<HTMLDivElement>;
  className?: string;
  columnClassName?: string;
  contentClassName?: string;
}) {
  const own = scroll === "own";
  return (
    <div className={cn("flex", own && "h-full", className)}>
      <aside className={cn("w-60 shrink-0 space-y-1 pb-8 pl-5 pr-3 pt-6", own ? "overflow-y-auto" : "self-start", columnClassName)}>
        {column}
      </aside>
      <div ref={contentRef} className={cn("min-w-0 flex-1 pb-12 pl-2 pr-8 pt-6", own && "overflow-y-auto", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

/** A column page before anything is known about it, such as the account: the frame drawn, its words and rows not. */
export function ColumnPageSkeleton() {
  const phone = usePhoneShell();
  const blocks = (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Shimmer key={i} index={i} className="h-32 rounded-panel" />
      ))}
    </div>
  );
  if (phone) {
    return (
      <Busy className="space-y-4 px-4 pt-4">
        <Shimmer className="h-7 w-40" />
        <Shimmer className="h-12 rounded-panel" />
        {blocks}
      </Busy>
    );
  }
  return (
    <Busy className="flex">
      <div className="w-60 shrink-0 space-y-2 pb-8 pl-5 pr-3 pt-6">
        <Shimmer className="mb-4 ml-1 h-7 w-36" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Shimmer key={i} index={i} className="h-10 rounded-full" />
        ))}
      </div>
      <div className="min-w-0 flex-1 pb-12 pl-2 pr-8 pt-6">{blocks}</div>
    </Busy>
  );
}
