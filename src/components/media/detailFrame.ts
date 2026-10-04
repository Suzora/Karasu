import { BANNER_RATIO } from "@/lib/bannerFit";
import { cn } from "@/lib/utils";

/** The detail page's frame, which `DetailSkeleton` draws too, so the page arrives exactly where the skeleton stood. */
export function detailFrame(phone: boolean) {
  return {
    /** A standard banner plus a band for the back button above and the cover below, capped at the desktop height. */
    header: { height: `min(16rem, calc(100cqw / ${BANNER_RATIO} + 5.5rem))` },
    column: "relative mx-auto max-w-4xl px-8 pb-10 2xl:max-w-none",
    /** Floated on the phone, so a title longer than the cover carries on beneath it; wider, it overlaps the banner. */
    row: cn("-mt-11 md:-mt-14", phone ? "flow-root" : "flex gap-6"),
    cover: cn("relative h-57 w-38 shrink-0", phone && "float-left mb-2 mr-5"),
    heading: cn("pt-16", !phone && "min-w-0 flex-1"),
    /** Below the cover whatever the title's length: a short title leaves air beside it, never a squeezed column. */
    facts: "clear-left space-y-2.5 pt-2.5",
    /** Prose left at a reading measure, metadata right taking the slack, since everything in it wraps and fills. */
    body: "mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,48rem)_minmax(0,1fr)] 2xl:items-start",
  };
}
