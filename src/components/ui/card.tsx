import { createContext, useContext, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** `raised` stands out of the page, `flat` is a row or block, `sunken` is a well inside either. */
export type CardVariant = "raised" | "flat" | "sunken";

const VARIANTS: Record<CardVariant, string> = {
  // Tone steps separate a card from the page; high contrast adds the border role through `surface-outline`.
  raised: "rounded-panel bg-surface-900 surface-outline",
  flat: "rounded-panel bg-surface-900 surface-outline",
  sunken: "rounded-control bg-surface-950 surface-outline",
};

/** The classes of a card, for one that must be a link, a form or an article; everything else renders `Card`. */
export function cardClass(variant: CardVariant = "raised", { interactive = false }: { interactive?: boolean } = {}) {
  return cn(VARIANTS[variant], interactive && "transition-surface hover:bg-surface-850");
}

/** A panel: `raised` with the surface fill and room to breathe, or a quieter variant. */
export function Card({
  variant = "raised",
  interactive = false,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant; interactive?: boolean }) {
  return (
    <div
      className={cn(cardClass(variant, { interactive }), variant === "raised" ? "p-5" : variant === "flat" ? "p-4" : "p-3", className)}
      {...props}
    />
  );
}

/** The level a card's title takes: a card under a group heading is one level below it, so the outline reads right. */
export const CardHeadingLevel = createContext<2 | 3>(2);

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const Tag = useContext(CardHeadingLevel) === 3 ? "h3" : "h2";
  return <Tag className={cn("text-base text-ink-100", className)} {...props} />;
}
