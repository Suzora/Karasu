import { gql } from "../anilist";
import { ACTIVITY_USER, PAGE_INFO, type PageInfo, SOCIAL_MEDIA, SOCIAL_USER, type SocialUser } from "./shared";

/** The activity feeds and the mutations on them. */

// --- Activities -----------------------------------------------------------

/** Profile tab and the feeds; `lib/feedView` builds `type_in` without `MESSAGE`, and no fragment or normalizer takes one. */
export const ACTIVITY_QUERY = `
query ($userId: Int, $isFollowing: Boolean, $types: [ActivityType], $page: Int, $sort: [ActivitySort]) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    activities(
      userId: $userId
      isFollowing: $isFollowing
      type_in: $types
      sort: $sort
    ) {
      __typename
      ... on ListActivity {
        id status progress createdAt likeCount isLiked isPinned replyCount siteUrl
        user { ${ACTIVITY_USER} }
        media { ${SOCIAL_MEDIA} }
      }
      ... on TextActivity {
        id text createdAt likeCount isLiked isPinned replyCount siteUrl
        user { ${ACTIVITY_USER} }
      }
    }
  }
}`;

/** One activity by id, where a notification lands; the feed's two fragments, and no `MessageActivity` either. */
export const SINGLE_ACTIVITY_QUERY = `
query ($id: Int!) {
  Activity(id: $id) {
    __typename
    ... on ListActivity {
      id status progress createdAt likeCount isLiked isPinned replyCount siteUrl
      user { ${ACTIVITY_USER} }
      media { ${SOCIAL_MEDIA} }
    }
    ... on TextActivity {
      id text createdAt likeCount isLiked isPinned replyCount siteUrl
      user { ${ACTIVITY_USER} }
    }
  }
}`;

export async function singleActivity(id: number): Promise<unknown | null> {
  const data = await gql<{ Activity: unknown | null }>(SINGLE_ACTIVITY_QUERY, { id });
  return data.Activity ?? null;
}

export interface ActivityPage {
  pageInfo: PageInfo;
  /** Raw union members — `normalizeActivity` in `lib/activity` tightens these. */
  activities: unknown[];
}

/** The Overview's own feed, named so the sync panel can say who spent the request; never cached, like every feed. */
export const OWN_ACTIVITY = { source: "ownActivity" } as const;

/** A feed's filter: a user's own, the following feed, or everyone's (neither), with the kinds `lib/feedView` names. */
export type ActivitySource = ({ userId: number } | { isFollowing: true } | Record<never, never>) & { types?: string[] };

export async function activities(
  vars: ActivitySource,
  page = 1,
  opts?: { source: string },
): Promise<ActivityPage> {
  // Never `MESSAGE`: private mail is excluded here as in the fragments and the normalizer.
  const types = (vars.types ?? ["ANIME_LIST", "MANGA_LIST", "TEXT"]).filter((x) => x !== "MESSAGE");
  const data = await gql<{ Page: { pageInfo: PageInfo; activities: unknown[] } }>(
    ACTIVITY_QUERY,
    {
      ...vars,
      types,
      page,
      // A pin floats on its own profile while a feed stays a timeline; both are total orders, as paging needs.
      sort: "userId" in vars ? ["PINNED", "ID_DESC"] : ["ID_DESC"],
    },
    opts,
  );
  return { pageInfo: data.Page.pageInfo, activities: data.Page.activities ?? [] };
}

// --- Mutations ------------------------------------------------------------

/** Returns only the fields the cache patch needs, so a follow never costs a refetch. */
export const TOGGLE_FOLLOW_MUTATION = `
mutation ($userId: Int!) {
  ToggleFollow(userId: $userId) { id name isFollowing isFollower }
}`;

/** Ends someone's following of the viewer; AniList answers with the user whose follow was removed. */
export const DELETE_FOLLOWER_MUTATION = `
mutation ($userId: Int!) {
  DeleteFollower(userId: $userId) { id name isFollowing isFollower }
}`;

/** Likes for anything likeable; `MessageActivity` gets no fragment, so private mail cannot round-trip. */
export const TOGGLE_LIKE_MUTATION = `
mutation ($id: Int!, $type: LikeableType!) {
  ToggleLikeV2(id: $id, type: $type) {
    __typename
    ... on ListActivity  { id likeCount isLiked }
    ... on TextActivity  { id likeCount isLiked }
    ... on ActivityReply { id likeCount isLiked }
    ... on Thread        { id likeCount isLiked }
    ... on ThreadComment { id likeCount isLiked }
  }
}`;

export type LikeableType = "ACTIVITY" | "ACTIVITY_REPLY" | "THREAD" | "THREAD_COMMENT";

export interface LikeResult {
  id: number;
  likeCount: number;
  isLiked: boolean;
}

export async function toggleLike(id: number, type: LikeableType): Promise<LikeResult> {
  const data = await gql<{ ToggleLikeV2: LikeResult }>(TOGGLE_LIKE_MUTATION, { id, type });
  return data.ToggleLikeV2;
}

/** Replies to one activity, loaded per expansion rather than nested in `ACTIVITY_QUERY`; they are flat. */
export const ACTIVITY_REPLIES_QUERY = `
query ($activityId: Int!) {
  Page(perPage: 50) {
    ${PAGE_INFO}
    activityReplies(activityId: $activityId) {
      id text createdAt likeCount isLiked
      user { ${SOCIAL_USER} }
    }
  }
}`;

export interface ActivityReply {
  id: number;
  text: string | null;
  createdAt: number;
  likeCount: number | null;
  isLiked: boolean | null;
  user: SocialUser | null;
}

export async function activityReplies(activityId: number): Promise<ActivityReply[]> {
  const data = await gql<{ Page: { activityReplies: ActivityReply[] } }>(
    ACTIVITY_REPLIES_QUERY,
    { activityId },
  );
  return data.Page.activityReplies ?? [];
}

export const SAVE_ACTIVITY_REPLY_MUTATION = `
mutation ($activityId: Int!, $text: String!) {
  SaveActivityReply(activityId: $activityId, text: $text) {
    id text createdAt likeCount isLiked
    user { ${SOCIAL_USER} }
  }
}`;

export async function saveActivityReply(
  activityId: number,
  text: string,
): Promise<ActivityReply> {
  const data = await gql<{ SaveActivityReply: ActivityReply }>(
    SAVE_ACTIVITY_REPLY_MUTATION,
    { activityId, text },
  );
  return data.SaveActivityReply;
}

export interface ToggleFollowResult {
  id: number;
  name: string;
  isFollowing: boolean | null;
  isFollower: boolean | null;
}

export async function toggleFollow(userId: number): Promise<ToggleFollowResult> {
  const data = await gql<{ ToggleFollow: ToggleFollowResult }>(
    TOGGLE_FOLLOW_MUTATION,
    { userId },
  );
  return data.ToggleFollow;
}

export async function removeFollower(userId: number): Promise<ToggleFollowResult> {
  const data = await gql<{ DeleteFollower: ToggleFollowResult }>(DELETE_FOLLOWER_MUTATION, { userId });
  return data.DeleteFollower;
}

/** Post a status update, a carve-out CLAUDE.md records; answers in the `ACTIVITY_QUERY` shape for the feed. */
export const SAVE_TEXT_ACTIVITY_MUTATION = `
mutation ($text: String!) {
  SaveTextActivity(text: $text) {
    id text createdAt likeCount isLiked replyCount siteUrl
    user { ${SOCIAL_USER} }
  }
}`;

export interface SavedTextActivity {
  id: number;
  text: string | null;
  createdAt: number;
  likeCount: number | null;
  isLiked: boolean | null;
  replyCount: number | null;
  siteUrl: string | null;
  user: SocialUser | null;
}

export async function saveTextActivity(text: string): Promise<SavedTextActivity> {
  const data = await gql<{ SaveTextActivity: SavedTextActivity }>(
    SAVE_TEXT_ACTIVITY_MUTATION,
    { text },
  );
  return data.SaveTextActivity;
}

/** Deleting is the only way back — AniList has no edit for a text activity. */
export const DELETE_ACTIVITY_MUTATION = `
mutation ($id: Int!) { DeleteActivity(id: $id) { deleted } }`;

export async function deleteActivity(id: number): Promise<boolean> {
  const data = await gql<{ DeleteActivity: { deleted: boolean } }>(
    DELETE_ACTIVITY_MUTATION,
    { id },
  );
  return data.DeleteActivity?.deleted === true;
}

/** Pin or unpin one of the viewer's activities; the profile feed sorts pinned first, so a pin floats. */
export const TOGGLE_ACTIVITY_PIN_MUTATION = `
mutation ($id: Int!, $pinned: Boolean) {
  ToggleActivityPin(id: $id, pinned: $pinned) {
    ... on ListActivity { id isPinned }
    ... on TextActivity { id isPinned }
  }
}`;

export async function toggleActivityPin(
  id: number,
  pinned: boolean,
): Promise<{ id: number; isPinned: boolean | null } | null> {
  const data = await gql<{
    ToggleActivityPin: { id: number; isPinned: boolean | null } | null;
  }>(TOGGLE_ACTIVITY_PIN_MUTATION, { id, pinned });
  return data.ToggleActivityPin;
}
