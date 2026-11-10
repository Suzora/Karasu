import { gql } from "../anilist";
import { isOffline, isRateLimited, isTokenRejected } from "@/lib/apiError";
import { activitiesById, normalizeSiteNotification, subjectActivityIds, type RawNotifActivity, type RawSiteNotification, type SiteNotifRow } from "@/lib/siteNotifications";
import { PAGE_INFO, type PageInfo } from "./shared";

/** AniList's own notifications. */

// --- Site notifications ----------------------------------------------------

/** The kinds the bell shows; ACTIVITY_MESSAGE stays out here, in the fragments and in the normalizer. */
export const SITE_NOTIF_TYPES = `
      AIRING, FOLLOWING, ACTIVITY_MENTION, ACTIVITY_REPLY, ACTIVITY_REPLY_SUBSCRIBED,
      ACTIVITY_LIKE, ACTIVITY_REPLY_LIKE, THREAD_COMMENT_MENTION, THREAD_COMMENT_REPLY,
      THREAD_SUBSCRIBED, THREAD_COMMENT_LIKE, THREAD_LIKE, RELATED_MEDIA_ADDITION,
      MEDIA_DATA_CHANGE, MEDIA_MERGE, MEDIA_DELETION, MEDIA_SUBMISSION_UPDATE,
      STAFF_SUBMISSION_UPDATE, CHARACTER_SUBMISSION_UPDATE`;

/** What every activity notification carries; its subject comes by `activityId`, since nested a list activity has no media. */
export const ACTIVITY_NOTIF = `id createdAt activityId user { id name }`;

/** What every forum comment notification carries, its comment aside. */
export const COMMENT_NOTIF = `id createdAt commentId user { id name } thread { id title }`;

/** A forum notification's comment, its text only; `childComments` is a raw tree many times the size. */
export const NOTIF_COMMENT = `comment { id comment }`;

/** The kinds whose fields do not change with the subject. */
export const SITE_NOTIF_OTHERS = `
      ... on AiringNotification { id createdAt episode media { id title { romaji english native } isAdult genres } }
      ... on FollowingNotification { id createdAt user { id name } }
      ... on ThreadLikeNotification { id createdAt user { id name } thread { id title } }
      ... on RelatedMediaAdditionNotification { id createdAt media { id title { romaji english native } isAdult genres } }
      ... on MediaDataChangeNotification { id createdAt reason media { id title { romaji english native } isAdult genres } }
      ... on MediaMergeNotification { id createdAt reason deletedMediaTitles media { id title { romaji english native } isAdult genres } }
      ... on MediaDeletionNotification { id createdAt reason deletedMediaTitle }
      ... on MediaSubmissionUpdateNotification { id createdAt status submittedTitle media { id title { romaji english native } isAdult genres } }
      ... on StaffSubmissionUpdateNotification { id createdAt status staff { id name { full } } }
      ... on CharacterSubmissionUpdateNotification { id createdAt status character { id name { full } } }`;

/** The bell's site view with each forum row's comment; activity subjects come from `NOTIF_SUBJECTS_QUERY`. */
export const SITE_NOTIFICATIONS_QUERY = `
query ($page: Int, $reset: Boolean) {
  Page(page: $page, perPage: 15) {
    ${PAGE_INFO}
    notifications(resetNotificationCount: $reset, type_in: [${SITE_NOTIF_TYPES}
    ]) {
      __typename
      ${SITE_NOTIF_OTHERS}
      ... on ActivityMentionNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplyNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplySubscribedNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityLikeNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplyLikeNotification { ${ACTIVITY_NOTIF} }
      ... on ThreadCommentMentionNotification { ${COMMENT_NOTIF} ${NOTIF_COMMENT} }
      ... on ThreadCommentReplyNotification { ${COMMENT_NOTIF} ${NOTIF_COMMENT} }
      ... on ThreadCommentSubscribedNotification { ${COMMENT_NOTIF} ${NOTIF_COMMENT} }
      ... on ThreadCommentLikeNotification { ${COMMENT_NOTIF} ${NOTIF_COMMENT} }
    }
  }
}`;

/** The same rows without their comments, for when one that errors fails the detailed answer. */
export const SITE_NOTIFICATIONS_PLAIN_QUERY = `
query ($page: Int, $reset: Boolean) {
  Page(page: $page, perPage: 15) {
    ${PAGE_INFO}
    notifications(resetNotificationCount: $reset, type_in: [${SITE_NOTIF_TYPES}
    ]) {
      __typename
      ${SITE_NOTIF_OTHERS}
      ... on ActivityMentionNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplyNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplySubscribedNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityLikeNotification { ${ACTIVITY_NOTIF} }
      ... on ActivityReplyLikeNotification { ${ACTIVITY_NOTIF} }
      ... on ThreadCommentMentionNotification { ${COMMENT_NOTIF} }
      ... on ThreadCommentReplyNotification { ${COMMENT_NOTIF} }
      ... on ThreadCommentSubscribedNotification { ${COMMENT_NOTIF} }
      ... on ThreadCommentLikeNotification { ${COMMENT_NOTIF} }
    }
  }
}`;

/** The bell's activity subjects by id; MESSAGE is not in type_in and has no fragment, so private mail names nothing. */
export const NOTIF_SUBJECTS_QUERY = `
query ($ids: [Int]) {
  Page(perPage: 50) {
    activities(id_in: $ids, type_in: [TEXT, ANIME_LIST, MANGA_LIST]) {
      __typename
      ... on ListActivity { id status progress user { id name } media { id title { romaji english native } isAdult genres coverImage { medium } } }
      ... on TextActivity { id text user { id name } }
    }
  }
}`;

export interface SiteNotifPage {
  pageInfo: PageInfo;
  rows: SiteNotifRow[];
}

/** Whether a failed detailed answer is worth the plain one: not when the token, the budget or the connection failed. */
export function wantsPlain(error: unknown): boolean {
  return !isTokenRejected(error) && !isRateLimited(error) && !isOffline(error);
}

export type SiteNotifAnswer = {
  Page: { pageInfo: PageInfo; notifications: (RawSiteNotification | null)[] | null };
};

export type SubjectsAnswer = { Page: { activities: (RawNotifActivity | null)[] | null } | null };

/** How long a page waits for its subjects; the limiter can hold a request far longer than rows already in hand should. */
export const SUBJECTS_WAIT_MS = 3000;

/** The page's activities by id, in one request; a failed, empty or slow answer leaves its rows without subjects. */
export async function notifSubjects(raws: (RawSiteNotification | null)[]): Promise<Map<number, RawNotifActivity>> {
  const ids = subjectActivityIds(raws);
  if (ids.length === 0) return new Map();
  // Page 1 has already spent AniList's unread count, so a subject that cannot come must not cost the rows that did.
  const answer = gql<SubjectsAnswer>(NOTIF_SUBJECTS_QUERY, { ids }, { source: "siteNotifSubjects" }).then(
    (data) => activitiesById(data.Page?.activities ?? []),
    () => new Map<number, RawNotifActivity>(),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<Map<number, RawNotifActivity>>((resolve) => {
    timer = setTimeout(() => resolve(new Map()), SUBJECTS_WAIT_MS);
  });
  try {
    return await Promise.race([answer, late]);
  } finally {
    clearTimeout(timer);
  }
}

/** `reset` is AniList's own mark-seen and belongs on the first page only; later pages are history, not news. */
export async function siteNotifications(page: number, reset: boolean): Promise<SiteNotifPage> {
  let data: SiteNotifAnswer;
  try {
    data = await gql<SiteNotifAnswer>(SITE_NOTIFICATIONS_QUERY, { page, reset }, { source: "siteNotifs" });
  } catch (e) {
    if (!wantsPlain(e)) throw e;
    // Its own source, so "Requests by source" shows how often a comment sank the detailed answer.
    data = await gql<SiteNotifAnswer>(SITE_NOTIFICATIONS_PLAIN_QUERY, { page, reset }, { source: "siteNotifsPlain" });
  }
  const raws = data.Page.notifications ?? [];
  const activities = await notifSubjects(raws);
  return {
    pageInfo: data.Page.pageInfo,
    rows: raws.map((raw) => normalizeSiteNotification(raw, activities)).filter((r): r is SiteNotifRow => r !== null),
  };
}

/** How much is waiting, for the bell's badge; one scalar off the viewer, and the feed's mark-seen zeroes it. */
export const SITE_NOTIF_COUNT_QUERY = `
query { Viewer { unreadNotificationCount } }`;

export async function siteNotifCount(): Promise<number> {
  const data = await gql<{ Viewer: { unreadNotificationCount: number | null } | null }>(
    SITE_NOTIF_COUNT_QUERY,
    {},
    { source: "notifCount" },
  );
  return data.Viewer?.unreadNotificationCount ?? 0;
}
