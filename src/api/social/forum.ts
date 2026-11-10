import { gql } from "../anilist";
import { PAGE_INFO, type PageInfo, SOCIAL_MEDIA, SOCIAL_USER, type SocialMedia, type SocialUser } from "./shared";

/** Threads, comments and the forum index. */

// --- Forum ----------------------------------------------------------------

/** A list of threads with no `body`; sorted `REPLIED_AT_DESC`, a total order, which paging needs. */
export const THREADS_QUERY = `
query ($userId: Int, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    threads(userId: $userId, sort: REPLIED_AT_DESC) {
      id title replyCount viewCount likeCount isLiked isSticky isLocked
      repliedAt createdAt siteUrl
      user { ${SOCIAL_USER} }
      replyUser { id name }
      categories { id name }
    }
  }
}`;

export interface ThreadSummary {
  id: number;
  title: string | null;
  replyCount: number | null;
  viewCount: number | null;
  likeCount: number | null;
  isLiked: boolean | null;
  isSticky: boolean | null;
  isLocked: boolean | null;
  repliedAt: number | null;
  createdAt: number | null;
  siteUrl: string | null;
  user: SocialUser | null;
  replyUser: { id: number; name: string } | null;
  categories: { id: number; name: string }[] | null;
}

export interface ThreadPage {
  pageInfo: PageInfo;
  threads: ThreadSummary[];
}

/** Threads one user started; do not add `replyUserId`, it lists only threads where the user replied last. */
export async function threads(
  vars: { userId: number },
  page = 1,
): Promise<ThreadPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; threads: ThreadSummary[] } }>(
    THREADS_QUERY,
    { ...vars, page },
  );
  return { pageInfo: data.Page.pageInfo, threads: data.Page.threads ?? [] };
}

/** `replyCommentId` is the newest-reply jump's key; `lib/threadJump` resolves it past the paging cap. */
export const THREAD_QUERY = `
query ($id: Int!) {
  Thread(id: $id) {
    id title body replyCount viewCount likeCount isLiked isLocked isSticky
    isSubscribed repliedAt createdAt siteUrl replyCommentId
    user { ${SOCIAL_USER} }
    replyUser { ${SOCIAL_USER} }
    categories { id name }
    mediaCategories { ${SOCIAL_MEDIA} }
  }
}`;

export interface ThreadDetail extends Omit<ThreadSummary, "replyUser"> {
  body: string | null;
  isSubscribed: boolean | null;
  mediaCategories: SocialMedia[] | null;
  /** Who posted the newest reply, and which comment that is. */
  replyUser: SocialUser | null;
  replyCommentId: number | null;
}

export async function thread(id: number): Promise<ThreadDetail> {
  const data = await gql<{ Thread: ThreadDetail | null }>(THREAD_QUERY, { id });
  if (!data.Thread) throw new Error("NOT_FOUND");
  return data.Thread;
}

/** A page of comments; `childComments` is an untyped Json scalar, and `sort` is inert on the `threadId` shape. */
export const THREAD_COMMENTS_QUERY = `
query ($threadId: Int!, $page: Int, $userId: Int) {
  Page(page: $page, perPage: 10) {
    ${PAGE_INFO}
    threadComments(threadId: $threadId, userId: $userId) {
      id comment likeCount isLiked createdAt siteUrl
      user { ${SOCIAL_USER} }
      childComments
    }
  }
}`;

export interface CommentPage {
  pageInfo: PageInfo;
  /** Raw — `flattenComments` in `lib/comments` is what tightens these. */
  comments: unknown[];
}

export async function threadComments(
  threadId: number,
  page = 1,
  /** Narrows to one author — the second tier of the newest-reply jump. */
  userId?: number,
): Promise<CommentPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; threadComments: unknown[] } }>(
    THREAD_COMMENTS_QUERY,
    { threadId, page, userId: userId ?? null },
  );
  return { pageInfo: data.Page.pageInfo, comments: data.Page.threadComments ?? [] };
}

/** The tree a comment sits in, uncapped as a LIST field; never alias it, one not-found root nulls every sibling. */
export const THREAD_COMMENT_TREE_QUERY = `
query ($id: Int!) {
  ThreadComment(id: $id) {
    id comment likeCount isLiked createdAt siteUrl
    user { ${SOCIAL_USER} }
    childComments
  }
}`;

/** The newest reply's conversation in one request, shaped for `flattenComments`; empty when deleted. */
export async function threadCommentTree(id: number): Promise<unknown[]> {
  const data = await gql<{ ThreadComment: unknown[] | null }>(
    THREAD_COMMENT_TREE_QUERY,
    { id },
  );
  return data.ThreadComment ?? [];
}

/** One user's forum comments, newest first; `sort` is honoured on the `userId` shape and inert on `threadId`. */
export const USER_FORUM_COMMENTS_QUERY = `
query ($userId: Int!, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    threadComments(userId: $userId, sort: [ID_DESC]) {
      id comment likeCount createdAt
      thread { id title }
    }
  }
}`;

export interface UserForumComment {
  id: number;
  comment: string | null;
  likeCount: number | null;
  createdAt: number | null;
  thread: { id: number; title: string | null } | null;
}

export interface UserCommentPage {
  pageInfo: PageInfo;
  comments: UserForumComment[];
}

export async function userForumComments(
  userId: number,
  page = 1,
): Promise<UserCommentPage> {
  const data = await gql<{
    Page: { pageInfo: PageInfo; threadComments: UserForumComment[] };
  }>(USER_FORUM_COMMENTS_QUERY, { userId, page });
  return { pageInfo: data.Page.pageInfo, comments: data.Page.threadComments ?? [] };
}

export const SAVE_THREAD_COMMENT_MUTATION = `
mutation ($threadId: Int!, $comment: String!, $parentCommentId: Int) {
  SaveThreadComment(threadId: $threadId, comment: $comment, parentCommentId: $parentCommentId) {
    id comment createdAt likeCount isLiked siteUrl
    user { ${SOCIAL_USER} }
  }
}`;

export async function saveThreadComment(
  threadId: number,
  comment: string,
  parentCommentId?: number,
): Promise<unknown> {
  const data = await gql<{ SaveThreadComment: unknown }>(SAVE_THREAD_COMMENT_MUTATION, {
    threadId,
    comment,
    parentCommentId,
  });
  return data.SaveThreadComment;
}

export const TOGGLE_THREAD_SUBSCRIPTION_MUTATION = `
mutation ($threadId: Int!, $subscribe: Boolean!) {
  ToggleThreadSubscription(threadId: $threadId, subscribe: $subscribe) {
    id isSubscribed
  }
}`;

export async function toggleThreadSubscription(
  threadId: number,
  subscribe: boolean,
): Promise<{ id: number; isSubscribed: boolean | null }> {
  const data = await gql<{
    ToggleThreadSubscription: { id: number; isSubscribed: boolean | null };
  }>(TOGGLE_THREAD_SUBSCRIPTION_MUTATION, { threadId, subscribe });
  return data.ToggleThreadSubscription;
}

/** Creates a thread; create-only by decision, since editing and deleting stay on anilist.co. */
export const SAVE_THREAD_MUTATION = `
mutation ($title: String!, $body: String!, $categories: [Int]) {
  SaveThread(title: $title, body: $body, categories: $categories) {
    id
  }
}`;

export async function saveThread(input: {
  title: string;
  body: string;
  categories: number[];
}): Promise<{ id: number }> {
  const data = await gql<{ SaveThread: { id: number } }>(SAVE_THREAD_MUTATION, input);
  return data.SaveThread;
}

// --- Forum index ----------------------------------------------------------

/** AniList's forum categories, hardcoded because no root query lists them; Misc went into General (CLAUDE.md). */
export const THREAD_CATEGORIES: { id: number; name: string }[] = [
  { id: 1, name: "Anime" },
  { id: 2, name: "Manga" },
  { id: 3, name: "Light Novels" },
  { id: 4, name: "Visual Novels" },
  { id: 5, name: "Release Discussion" },
  { id: 7, name: "General" },
  { id: 8, name: "News" },
  { id: 9, name: "Music" },
  { id: 10, name: "Gaming" },
  { id: 11, name: "Site Feedback" },
  { id: 12, name: "Bug Reports" },
  { id: 13, name: "Site Announcements" },
  { id: 14, name: "List Customisation" },
  { id: 15, name: "Recommendations" },
  { id: 16, name: "Forum Games" },
  { id: 18, name: "AniList Apps" },
];

/** The forum index; `sort` is a variable because search wants `SEARCH_MATCH` and browsing `REPLIED_AT_DESC`. */
export const FORUM_THREADS_QUERY = `
query ($page: Int, $categoryId: Int, $search: String, $subscribed: Boolean, $sort: [ThreadSort]) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    threads(categoryId: $categoryId, search: $search, subscribed: $subscribed, sort: $sort) {
      id title replyCount viewCount likeCount isLiked isSticky isLocked
      repliedAt createdAt siteUrl
      user { ${SOCIAL_USER} }
      replyUser { id name }
      categories { id name }
    }
  }
}`;

export interface ForumQuery {
  categoryId?: number;
  search?: string;
  subscribed?: boolean;
}

export async function forumThreads(vars: ForumQuery, page = 1): Promise<ThreadPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; threads: ThreadSummary[] } }>(
    FORUM_THREADS_QUERY,
    {
      ...vars,
      page,
      // A search sorted by activity buries the match; browsing sorted by relevance is meaningless.
      sort: vars.search ? ["SEARCH_MATCH"] : ["IS_STICKY", "REPLIED_AT_DESC"],
    },
  );
  return { pageInfo: data.Page.pageInfo, threads: data.Page.threads ?? [] };
}
