import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { detailFrame } from "./detailFrame";

/** The detail page's head: a tall banner holding cover, titles and facts on the phone, the titles and facts on the desktop. */
export function DetailHero({
  phone,
  banner,
  cover,
  title,
  subtitle,
  meta,
}: {
  phone: boolean;
  banner: ReactNode;
  /** Drawn in the banner on the phone only; the desktop shows it at the top of its side column. */
  cover: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  meta: ReactNode;
}) {
  return (
    <div className={detailFrame(phone).hero}>
      {banner}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-on-cover via-on-cover/70 to-transparent" />
      <div className={cn("absolute inset-x-0 bottom-0 flex items-end", phone ? "gap-4 px-4 pb-4" : "mx-auto max-w-6xl px-8 pb-6")}>
        {phone && cover}
        <div className="min-w-0 flex-1 pb-1 text-on-cover-edge">
          {title}
          {subtitle}
          <div className="mt-2 text-on-cover-edge/80">{meta}</div>
        </div>
      </div>
    </div>
  );
}
