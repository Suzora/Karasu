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

/** A section heading that hasn't arrived: the rule stays, the words don't. */
export function HeaderSkeleton({ index = 0 }: { index?: number }) {
  return (
    <Busy className="flex items-center gap-2.5">
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
  return (
    <Busy>
      {/* A query container of its own, as on the page, so the header's height reads the same width. */}
      <div className="@container">
        <div style={frame.header}>
          <Shimmer index={0} className="size-full rounded-none" />
        </div>
      </div>
      <div className={frame.column}>
        <div className={frame.row}>
          <Shimmer index={1} className={cn(frame.cover, "rounded-cover")} />
          <div className={frame.heading}>
            {/* Its own formatting context, so beside the phone's floated cover the bars narrow instead of running under it. */}
            <div className="flow-root">
              <Shimmer index={2} className={phone ? "h-6 w-full" : "h-6 w-2/3"} />
              {phone && <Shimmer index={3} className="mt-2 h-6 w-3/4" />}
              <Shimmer index={4} className="mt-3 h-4 w-2/5" />
            </div>
            {phone ? (
              <div className={frame.facts}>
                <div className="space-y-2.5 py-0.5">
                  <Shimmer index={5} className="h-3.5 w-full" />
                  <Shimmer index={6} className="h-3.5 w-1/3" />
                </div>
                {chips}
                <div className="flex gap-2">
                  <Shimmer index={10} className="h-11 min-w-0 flex-1 rounded-panel" />
                  <Shimmer index={11} className="size-11 shrink-0 rounded-panel" />
                  <Shimmer index={12} className="size-11 shrink-0 rounded-panel" />
                </div>
              </div>
            ) : (
              <>
                <Shimmer index={5} className="mt-3.5 h-9 w-40 rounded-control" />
                <Shimmer index={6} className="mt-3 h-3.5 w-1/2" />
                <div className="mt-3">{chips}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Shimmer index={10} className="h-7.5 w-24 rounded-control" />
                  <Shimmer index={11} className="h-3 w-28" />
                </div>
              </>
            )}
          </div>
        </div>
        <div className={frame.body}>
          <Shimmer index={13} className="h-36 rounded-panel" />
        </div>
      </div>
    </Busy>
  );
}
