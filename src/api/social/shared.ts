import type { Media, MediaType } from "../types";

/** The shapes and query fragments every part of the social surface shares. */

// --- Shared shapes --------------------------------------------------------

export interface PageInfo {
  total: number;
  currentPage: number;
  lastPage?: number;
  hasNextPage: boolean;
}

export const PAGE_INFO = `pageInfo { total currentPage lastPage hasNextPage }`;

/** Deliberately smaller than `MEDIA_FIELDS`; `isAdult` and `genres` exist only for lib/contentFilter. */
export const SOCIAL_MEDIA = `
  id
  type
  title { romaji english native }
  coverImage { large }
  format
  isAdult
  genres
`;

/** Media as it comes back from a social query — the `SOCIAL_MEDIA` subset. */
export type SocialMedia = Pick<
  Media,
  "id" | "title" | "coverImage" | "format" | "genres"
> & { type?: MediaType; isAdult?: boolean | null };

/** A user as every *list* of users returns them. No `about`: see `FOLLOWERS_QUERY`. */
export interface SocialUser {
  id: number;
  name: string;
  avatar: { medium: string | null } | null;
  isFollowing: boolean | null;
  isFollower: boolean | null;
  /** Asked for only where an activity's author is drawn; `donatorLabel` decides whether a badge shows. */
  donatorTier?: number | null;
  donatorBadge?: string | null;
}

export const SOCIAL_USER = `id name avatar { medium } isFollowing isFollower`;

/** An activity's author, with the donator fields the feed's badge reads, as the website shows them since 2026-11-04. */
export const ACTIVITY_USER = `${SOCIAL_USER} donatorTier donatorBadge`;
