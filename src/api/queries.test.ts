import { beforeEach, describe, expect, it, vi } from "vitest";

/** What the filterable search sends AniList, with the request stubbed. */

const gql = vi.hoisted(() => vi.fn());
vi.mock("./anilist", () => ({
  gql,
  currentScoreFormat: () => "POINT_10",
  TTL: { minute: 60, hour: 3600, day: 86_400, week: 604_800 },
}));

import { browseMedia, seasonalAnime } from "./queries";

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

/** The season page draws every title of the season, so its counts per format are the season's and not page one's. */
describe("the season's titles", () => {
  const titles = (from: number, n: number) => Array.from({ length: n }, (_, i) => ({ id: from + i }));

  beforeEach(() => {
    gql.mockReset();
  });

  it("asks for every page until AniList says there is no next one", async () => {
    gql
      .mockResolvedValueOnce({ Page: { pageInfo: { hasNextPage: true }, media: titles(1, 50) } })
      .mockResolvedValueOnce({ Page: { pageInfo: { hasNextPage: true }, media: titles(51, 50) } })
      .mockResolvedValueOnce({ Page: { pageInfo: { hasNextPage: false }, media: titles(101, 7) } });
    const media = await seasonalAnime("FALL", 2026);
    expect(media).toHaveLength(107);
    expect(gql.mock.calls.map((c) => (c[1] as { page: number }).page)).toEqual([1, 2, 3]);
  });

  it("stops at its bound however many pages AniList claims, and keeps a title met twice once", async () => {
    gql.mockImplementation((_q: string, v: { page: number }) =>
      Promise.resolve({ Page: { pageInfo: { hasNextPage: true }, media: titles((v.page - 1) * 50, 51) } }),
    );
    const media = await seasonalAnime("FALL", 2026);
    expect(gql).toHaveBeenCalledTimes(6);
    expect(new Set(media.map((m) => m.id)).size).toBe(media.length);
  });
});
