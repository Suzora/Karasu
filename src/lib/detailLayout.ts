/** One part of the detail page below its header and progress band. */
export type DetailSection =
  | "description"
  | "altTitles"
  | "info"
  | "tags"
  | "episodes"
  | "trailer"
  | "statuses"
  | "scores"
  | "cast"
  | "related"
  | "trend"
  | "reviews"
  | "links";

/** The maintainer's phone order of 2026-10-17; trend, tags, trailer and related sit where his list left them out. */
const PHONE: DetailSection[] = ["description", "altTitles", "info", "tags", "episodes", "trailer", "statuses", "scores", "cast", "related", "trend", "reviews", "links"];

/** Which parts go in the desktop's standing side column and which in the scrolling one, top to bottom. */
export function detailSections(phone: boolean): { side: DetailSection[]; main: DetailSection[] } {
  if (phone) return { side: [], main: PHONE };
  return {
    side: ["info", "links"],
    main: ["description", "scores", "statuses", "related", "cast", "episodes", "trailer", "trend", "reviews", "altTitles", "tags"],
  };
}
