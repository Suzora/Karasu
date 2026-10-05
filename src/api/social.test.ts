import { beforeEach, describe, expect, it, vi } from "vitest";

/** The bell's two query shapes and the one fallback between them, with the request itself stubbed. */

const gql = vi.hoisted(() => vi.fn());
vi.mock("./anilist", () => ({ gql, TTL: { minute: 60, hour: 3600, day: 86_400, week: 604_800 } }));

import { SITE_NOTIFICATIONS_PLAIN_QUERY, SITE_NOTIFICATIONS_QUERY, siteNotifications, wantsPlain } from "./social";
import { RATE_LIMITED, TOKEN_REJECTED } from "@/lib/apiError";

const empty = { Page: { pageInfo: { total: 0, currentPage: 1, hasNextPage: false }, notifications: [] } };

beforeEach(() => {
  gql.mockReset();
});

describe("the bell's notification queries", () => {
  it("ask for no private mail, no comment tree and none of AniList's English sentences, in either shape", () => {
    for (const query of [SITE_NOTIFICATIONS_QUERY, SITE_NOTIFICATIONS_PLAIN_QUERY]) {
      expect(query).not.toMatch(/MessageActivity|ACTIVITY_MESSAGE|ActivityMessageNotification|childComments|\bcontext\b/);
    }
  });

  it("ask for each activity's and comment's subject in the detailed shape only", () => {
    expect(SITE_NOTIFICATIONS_QUERY).toContain("... on ListActivity");
    expect(SITE_NOTIFICATIONS_QUERY).toContain("... on TextActivity");
    expect(SITE_NOTIFICATIONS_QUERY).toContain("comment { id comment }");
    expect(SITE_NOTIFICATIONS_QUERY).toContain("coverImage { medium }");
    expect(SITE_NOTIFICATIONS_PLAIN_QUERY).not.toMatch(/\bactivity \{|\bcomment \{|\btext\b/);
  });
});

describe("siteNotifications", () => {
  it("asks once when the detailed shape answers", async () => {
    gql.mockResolvedValueOnce(empty);
    await siteNotifications(1, true);
    expect(gql).toHaveBeenCalledTimes(1);
    expect(gql.mock.calls[0]).toEqual([SITE_NOTIFICATIONS_QUERY, { page: 1, reset: true }, { source: "siteNotifs" }]);
  });

  /** A deleted activity or comment can sink the whole detailed answer; the rows without subjects still come. */
  it("falls back once to the plain shape, under its own source, when AniList refuses the detailed one", async () => {
    gql.mockRejectedValueOnce(new Error("Not Found.")).mockResolvedValueOnce(empty);
    await siteNotifications(2, false);
    expect(gql).toHaveBeenCalledTimes(2);
    expect(gql.mock.calls[1]).toEqual([SITE_NOTIFICATIONS_PLAIN_QUERY, { page: 2, reset: false }, { source: "siteNotifsPlain" }]);
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
