import { canLendArt, type ContentFilterLevel, type Filterable } from "@/lib/contentFilter";

/** What a title's wide header draws: its own banner, a relative's while it has none, or its cover's colour. */
export type BannerSource =
  | { kind: "own"; src: string }
  | { kind: "related"; src: string; mediaId: number }
  | { kind: "wash"; tint: string | null };

interface Lender extends Filterable {
  id: number;
  bannerImage?: string | null;
}

/** The part of a detail answer or a hero title the choice reads. */
export interface BannerCandidate extends Filterable {
  bannerImage?: string | null;
  coverImage: { color?: string | null };
  relations?: { edges: ({ relationType?: string | null; node?: Lender | null } | null)[] } | null;
}

/** The relations whose banner may stand in, nearest first; CHARACTER and OTHER share too little to lend their art. */
const LENDERS = [
  "PREQUEL",
  "PARENT",
  "SEQUEL",
  "SIDE_STORY",
  "SPIN_OFF",
  "COMPILATION",
  "SUMMARY",
  "CONTAINS",
  "ALTERNATIVE",
  "SOURCE",
  "ADAPTATION",
];

/** A title's own banner, else the nearest relative's the filter allows, else a wash in its cover's colour. */
export function bannerSource(media: BannerCandidate, level: ContentFilterLevel): BannerSource {
  if (media.bannerImage) return { kind: "own", src: media.bannerImage };
  let best: { rank: number; src: string; mediaId: number } | null = null;
  for (const edge of media.relations?.edges ?? []) {
    const node = edge?.node;
    const rank = LENDERS.indexOf(edge?.relationType ?? "");
    if (!node?.bannerImage || rank < 0 || !canLendArt(node, media, level)) continue;
    if (!best || rank < best.rank) best = { rank, src: node.bannerImage, mediaId: node.id };
  }
  if (best) return { kind: "related", src: best.src, mediaId: best.mediaId };
  // Only a plain hex reaches a style; AniList sends one, and anything else falls back to the accent.
  const color = media.coverImage.color;
  return { kind: "wash", tint: color && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : null };
}
