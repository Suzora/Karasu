import { cn } from "@/lib/utils";

/** The detail page's frame, which `DetailSkeleton` draws too, so the page arrives exactly where the skeleton stood. */
export function detailFrame(phone: boolean) {
  return {
    /** The banner: tall on the phone, where it holds the cover, the titles and the facts. */
    hero: cn("relative overflow-hidden bg-on-cover", phone ? "h-80" : "h-72"),
    /** What follows the banner: one column on the phone, the standing side column beside the rest on the desktop. */
    body: phone ? "space-y-8 px-4 pb-12 pt-3" : "mx-auto grid max-w-6xl grid-cols-[17rem_minmax(0,1fr)] items-start gap-8 px-8 pb-12 pt-6",
    aside: "sticky top-6 min-w-0 space-y-4",
    cover: cn("relative shrink-0", phone ? "h-40 w-27" : "aspect-2/3 w-full"),
  };
}
