import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { detailFrame } from "@/components/media/detailFrame";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { skeletonDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Title and metadata bar widths, coprime in length so the pair does not repeat in step with the stagger. */
const TITLE_W = ["w-11/12", "w-3/4", "w-5/6", "w-2/3", "w-full", "w-4/5", "w-3/5"];
const META_W = ["w-1/2", "w-2/5", "w-3/5", "w-1/3", "w-5/12"];

/** One placeholder block; `index` offsets the sweep so the cells do not light as one flat page-sized pulse. */
export function Shimmer({
  index = 0,
  className,
}: {
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("shimmer-fill rounded-inner", className)}
      // The phase offset lives in lib/motion beside the other stagger vocabulary, so the two rhythms stay together.
      style={{ "--shimmer-offset": `${skeletonDelay(index)}ms` } as CSSProperties}
    />
  );
}

/** A skeleton's frame: one status with a hidden caption, as `Loader` announces its own, and the blocks kept silent. */
export function Busy({ className, children }: { className?: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div role="status">
      <span className="sr-only">{t("common.loading")}</span>
      <div className={className} aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** A cover grid that has not loaded yet, at the real track width so nothing moves sideways when the covers arrive. */
export function CoverGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Busy className="media-grid gap-x-4 gap-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Shimmer index={i} className="aspect-2/3 w-full rounded-control" />
          {/* Widths come from the index, not `Math.random`: a re-render must not reshuffle them. */}
          <Shimmer index={i} className={cn("mt-2 h-2.5", TITLE_W[i % TITLE_W.length])} />
          <Shimmer index={i} className={cn("mt-1.5 h-2", META_W[i % META_W.length])} />
        </div>
      ))}
    </Busy>
  );
}

/** Tonal cards that have not loaded, in the grid the caller's cards will take, so the page keeps its shape. */
export function CardGridSkeleton({ count = 6, className, cardClassName = "h-28" }: { count?: number; className?: string; cardClassName?: string }) {
  return (
    <Busy className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Shimmer key={i} index={i} className={cn("rounded-panel", cardClassName)} />
      ))}
    </Busy>
  );
}

/** A section heading that hasn't arrived: the rule stays, the words don't. */
export function HeaderSkeleton({ index = 0 }: { index?: number }) {
  return (
    <Busy className="flex h-6 items-center gap-2.5">
      <Shimmer index={index} className="size-4 rounded-inner" />
      <Shimmer index={index} className="h-3.5 w-36" />
      <span className="section-rule" />
    </Busy>
  );
}

/** Widths for the genre chips that have not arrived; their height is the chips' own. */
const CHIP_W = ["w-16", "w-12", "w-14"];

/** The detail screen while it loads, in the page's own frame, so the page arrives where the skeleton stood. */
export function DetailSkeleton() {
  const phone = usePhoneShell();
  const frame = detailFrame(phone);
  const chips = (
    <div className="flex gap-1.5">
      {CHIP_W.map((w, i) => (
        <Shimmer key={w} index={7 + i} className={cn("h-4.5", w)} />
      ))}
    </div>
  );
  const band = <Shimmer index={10} className="h-44 w-full rounded-panel" />;
  return (
    <Busy>
      <div className={frame.hero}>
        <Shimmer index={0} className="absolute inset-0 size-full rounded-none" />
        <div className={cn("absolute inset-x-0 bottom-0 flex items-end", phone ? "gap-4 px-4 pb-4" : "mx-auto max-w-6xl px-8 pb-6")}>
          {phone && <Shimmer index={1} className={cn(frame.cover, "rounded-cover")} />}
          <div className="min-w-0 flex-1 space-y-2 pb-1">
            <Shimmer index={2} className={phone ? "h-6 w-full" : "h-8 w-2/3"} />
            <Shimmer index={4} className="h-4 w-2/5" />
            <Shimmer index={5} className="h-3.5 w-3/5" />
          </div>
        </div>
      </div>
      {phone ? (
        <div className={frame.body}>
          <div className="space-y-4">
            {chips}
            {band}
          </div>
          <Shimmer index={13} className="h-36 rounded-panel" />
        </div>
      ) : (
        <div className={frame.body}>
          <div className={frame.aside}>
            <Shimmer index={1} className={cn(frame.cover, "rounded-cover")} />
            {chips}
            {band}
          </div>
          <Shimmer index={13} className="h-36 rounded-panel" />
        </div>
      )}
    </Busy>
  );
}
