import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

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
