import { beforeEach, describe, expect, it, vi } from "vitest";

/** What the filterable search sends AniList, with the request stubbed. */

const gql = vi.hoisted(() => vi.fn());
vi.mock("./anilist", () => ({
  gql,
  currentScoreFormat: () => "POINT_10",
  TTL: { minute: 60, hour: 3600, day: 86_400, week: 604_800 },
}));

import { browseMedia } from "./queries";

const sent = () => gql.mock.calls[0][1] as Record<string, unknown>;

describe("the filterable search", () => {
  beforeEach(() => {
    gql.mockResolvedValue({ Page: { pageInfo: { hasNextPage: false }, media: [] } });
  });

  /** AniList leaves a manga's season year null, so a year asked as one matched no manga at all. */
  it("asks for a manga's year by the date it started", async () => {
    await browseMedia("MANGA", { year: 2020, sort: "POPULARITY_DESC" });
    expect(sent().startDateLike).toBe("2020%");
    expect(sent().seasonYear).toBeUndefined();
    expect(gql.mock.calls[0][0]).toContain("startDate_like: $startDateLike");
  });

  it("asks for an anime's year by its season year", async () => {
    await browseMedia("ANIME", { year: 2020, sort: "POPULARITY_DESC" });
    expect(sent().seasonYear).toBe(2020);
    expect(sent().startDateLike).toBeUndefined();
  });

  it("sends no year when none is chosen", async () => {
    await browseMedia("MANGA", { sort: "POPULARITY_DESC" });
    expect(sent().seasonYear).toBeUndefined();
    expect(sent().startDateLike).toBeUndefined();
  });
});
