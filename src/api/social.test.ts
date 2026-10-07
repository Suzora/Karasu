import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The bell's two query shapes, the one fallback between them and the subjects request, with the request stubbed. */

const gql = vi.hoisted(() => vi.fn());
vi.mock("./anilist", () => ({ gql, TTL: { minute: 60, hour: 3600, day: 86_400, week: 604_800 } }));

import {
  NOTIF_SUBJECTS_QUERY,
  SITE_NOTIFICATIONS_PLAIN_QUERY,
  SITE_NOTIFICATIONS_QUERY,
  USER_LIST_QUERY,
  siteNotifications,
  userList,
  wantsPlain,
} from "./social";
import { RATE_LIMITED, TOKEN_REJECTED } from "@/lib/apiError";

const empty = { Page: { pageInfo: { total: 0, currentPage: 1, hasNextPage: false }, notifications: [] } };

/** A page as AniList sends it: two likes on one list activity, a reply on a post, a follow and a thread reply. */
const page = {
  Page: {
    pageInfo: { total: 5, currentPage: 1, hasNextPage: false },
    notifications: [
      { __typename: "ActivityLikeNotification", id: 1, createdAt: 9, activityId: 300, user: { id: 7, name: "Mikan" } },
      { __typename: "ActivityLikeNotification", id: 2, createdAt: 8, activityId: 300, user: { id: 8, name: "Hoshi" } },
      { __typename: "ActivityReplyNotification", id: 3, createdAt: 7, activityId: 301, user: { id: 8, name: "Hoshi" } },
      { __typename: "FollowingNotification", id: 4, createdAt: 6, user: { id: 9, name: "Sora" } },
      {
        __typename: "ThreadCommentReplyNotification",
        id: 5,
        createdAt: 5,
        commentId: 555,
        user: { id: 9, name: "Sora" },
        thread: { id: 99, title: "Weekly talk" },
        comment: { id: 555, comment: "Agreed." },
      },
    ],
  },
};

const FRIEREN = { id: 42, title: { romaji: "Sousou no Frieren", english: "Frieren", native: null }, isAdult: false, genres: [] };

/** The subjects answer for the page above, in an order of AniList's choosing. */
const subjects = {
  Page: {
    activities: [
      { __typename: "TextActivity", id: 301, text: "Finally done.", user: { id: 1, name: "Kyusetzu" } },
      { __typename: "ListActivity", id: 300, status: "completed", progress: null, user: { id: 1, name: "Kyusetzu" }, media: FRIEREN },
    ],
  },
};

beforeEach(() => {
  gql.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const ACTIVITY_KINDS = [
  "ActivityMentionNotification",
  "ActivityReplyNotification",
  "ActivityReplySubscribedNotification",
  "ActivityLikeNotification",
  "ActivityReplyLikeNotification",
];

describe("the bell's notification queries", () => {
  it("ask for no private mail, no comment tree and none of AniList's English sentences, in either shape", () => {
    for (const query of [SITE_NOTIFICATIONS_QUERY, SITE_NOTIFICATIONS_PLAIN_QUERY]) {
      expect(query).not.toMatch(/MessageActivity|ACTIVITY_MESSAGE|ActivityMessageNotification|childComments|\bcontext\b/);
    }
  });

  /** Nested under a notification a list activity's media and user resolve null, so neither shape asks for one there. */
  it("ask for a comment in the detailed shape only, and for no activity in either", () => {
    expect(SITE_NOTIFICATIONS_QUERY).toContain("comment { id comment }");
    for (const query of [SITE_NOTIFICATIONS_QUERY, SITE_NOTIFICATIONS_PLAIN_QUERY]) {
      for (const kind of ACTIVITY_KINDS) expect(query).toContain(`... on ${kind} { id createdAt activityId user { id name } }`);
      expect(query).not.toMatch(/\bactivity\s*\{|\.\.\. on ListActivity|\.\.\. on TextActivity/);
    }
    expect(SITE_NOTIFICATIONS_PLAIN_QUERY).not.toMatch(/\bcomment \{|\btext\b/);
  });

  it("ask for activities by id with what a subject needs, and leave private mail out of the type and the fragments", () => {
    expect(NOTIF_SUBJECTS_QUERY).toContain("activities(id_in: $ids, type_in: [TEXT, ANIME_LIST, MANGA_LIST])");
    expect(NOTIF_SUBJECTS_QUERY).toContain(
      "... on ListActivity { id status progress user { id name } media { id title { romaji english native } isAdult genres coverImage { medium } } }",
    );
    expect(NOTIF_SUBJECTS_QUERY).toContain("... on TextActivity { id text user { id name } }");
    expect(NOTIF_SUBJECTS_QUERY).not.toMatch(/\bMESSAGE\b|MessageActivity|\bcontext\b/);
  });
});

describe("siteNotifications", () => {
  it("asks once when the detailed shape answers", async () => {
    gql.mockResolvedValueOnce(empty);
    await siteNotifications(1, true);
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql.mock.calls[0]).toEqual([SITE_NOTIFICATIONS_QUERY, { page: 1, reset: true }, { source: "siteNotifs" }]);
  });

  /** A comment that errors can sink the whole detailed answer; the rows without their comments still come. */
  it("falls back once to the plain shape, under its own source, when AniList refuses the detailed one", async () => {
    gql.mockRejectedValueOnce(new Error("Not Found.")).mockResolvedValueOnce(empty);
    await siteNotifications(2, false);
    expect(gql).toHaveBeenCalledTimes(2);
    expect(gql.mock.calls[1]).toEqual([SITE_NOTIFICATIONS_PLAIN_QUERY, { page: 2, reset: false }, { source: "siteNotifsPlain" }]);
  });

  it("asks for the page's activities once, by id, and joins each subject to its row", async () => {
    gql.mockImplementation(async (query: string) => (query === NOTIF_SUBJECTS_QUERY ? subjects : page));
    const { rows } = await siteNotifications(1, true);
    expect(gql).toHaveBeenCalledTimes(2);
    expect(gql.mock.calls[1]).toEqual([NOTIF_SUBJECTS_QUERY, { ids: [300, 301] }, { source: "siteNotifSubjects" }]);
    expect(rows.map((r) => r.subject?.kind ?? null)).toEqual(["list", "list", "text", null, "comment"]);
    expect(rows[0].subject).toMatchObject({ kind: "list", title: "Frieren", ownerName: "Kyusetzu" });
  });

  it("spends no subjects request on a page without an activity row", async () => {
    const quiet = { Page: { ...page.Page, notifications: page.Page.notifications.slice(3) } };
    gql.mockResolvedValueOnce(quiet);
    const { rows } = await siteNotifications(1, false);
    expect(gql).toHaveBeenCalledTimes(1);
    expect(rows.map((r) => r.subject?.kind ?? null)).toEqual([null, "comment"]);
  });

  /** Page 1 has already spent AniList's count by then, so the rows must come whatever happened to their subjects. */
  it("keeps the rows without subjects when the subjects request fails, and asks no more", async () => {
    for (const message of [TOKEN_REJECTED, RATE_LIMITED, "Network error: connection refused", "AniList answered 500"]) {
      gql.mockReset();
      gql.mockResolvedValueOnce(page).mockRejectedValueOnce(new Error(message));
      const { rows } = await siteNotifications(1, true);
      expect(gql).toHaveBeenCalledTimes(2);
      expect(rows).toHaveLength(5);
      expect(rows.map((r) => r.subject?.kind ?? null)).toEqual([null, null, null, null, "comment"]);
    }
  });

  /** The limiter can hold the subjects request well past a page's patience, and the rows are already in hand. */
  it("draws the rows without subjects when the subjects request is slow", async () => {
    vi.useFakeTimers();
    gql.mockResolvedValueOnce(page).mockReturnValueOnce(new Promise(() => {}));
    const pending = siteNotifications(1, true);
    await vi.advanceTimersByTimeAsync(10_000);
    const { rows } = await pending;
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.subject?.kind ?? null)).toEqual([null, null, null, null, "comment"]);
  });

  it("still asks for the subjects after the plain fallback, which keeps the activity ids", async () => {
    gql.mockRejectedValueOnce(new Error("Not Found.")).mockResolvedValueOnce(page).mockResolvedValueOnce(subjects);
    await siteNotifications(1, false);
    expect(gql.mock.calls.map((c) => c[2])).toEqual([
      { source: "siteNotifs" },
      { source: "siteNotifsPlain" },
      { source: "siteNotifSubjects" },
    ]);
  });

  it("spends no second request on a rejected token, a rate limit or a lost connection", async () => {
    for (const message of [TOKEN_REJECTED, RATE_LIMITED, "Network error: connection refused"]) {
      gql.mockReset();
      gql.mockRejectedValueOnce(new Error(message));
      await expect(siteNotifications(1, false)).rejects.toThrow(message);
      expect(gql).toHaveBeenCalledTimes(1);
      expect(wantsPlain(new Error(message))).toBe(false);
    }
    expect(wantsPlain(new Error("AniList answered 500"))).toBe(true);
  });
});

describe("userList", () => {
  it("names its spender and asks for no cache, since another user's list never rests on disk", async () => {
    gql.mockResolvedValueOnce({ MediaListCollection: { lists: [] } });
    await userList(11, "ANIME");
    expect(gql.mock.calls[0]).toEqual([USER_LIST_QUERY, { userId: 11, type: "ANIME" }, { source: "userList" }]);
  });
});
