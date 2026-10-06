import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ForeignListGroup, UserProfile } from "@/api/social";
import type { ListResult } from "@/api/types";
import { entry, listResult, media } from "@/test/fixtures";
import { renderWithProviders, signIn, signOut } from "@/test/render";

const fetchMine = vi.fn<(userId: number, type: string) => Promise<ListResult>>();

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  fetchMediaList: (userId: number, type: string) => fetchMine(userId, type),
}));

const theirs = vi.fn<(userId: number, type: string) => Promise<ForeignListGroup[]>>();

// The query definition closes over the module's own `userList`, so it is swapped here as well.
vi.mock("@/api/social", async (orig) => {
  const real = await orig<typeof import("@/api/social")>();
  return {
    ...real,
    userList: (userId: number, type: string) => theirs(userId, type),
    userListQuery: (userId: number, type: "ANIME" | "MANGA") => ({
      ...real.userListQuery(userId, type),
      queryFn: () => theirs(userId, type),
    }),
  };
});

import { UserLists } from "./UserLists";

// Ten, the floor below which an affinity is noise rather than taste.
const SCORES = [9, 8, 7, 6, 5, 4, 3, 7, 8, 2];

const them = {
  id: 11,
  name: "Mikan",
  siteUrl: "https://anilist.co/user/Mikan",
  about: null,
  avatar: null,
  bannerImage: null,
  donatorTier: null,
  donatorBadge: null,
  moderatorRoles: null,
  createdAt: null,
  updatedAt: null,
  isFollowing: null,
  isFollower: null,
  isBlocked: null,
  previousNames: [],
  options: null,
  mediaListOptions: null,
  statistics: null,
  favourites: null,
} as unknown as UserProfile;

function foreign(): ForeignListGroup[] {
  const entries = SCORES.map((score, i) => {
    const m = media({ id: 100 + i, title: { romaji: `Show ${i}`, english: null, native: null } });
    return { id: 900 + i, mediaId: m.id, status: "CURRENT", score, progress: 1, progressVolumes: null, media: m };
  });
  return [{ name: "Watching", status: "CURRENT", isCustomList: false, entries } as ForeignListGroup];
}

afterEach(() => {
  signOut();
  fetchMine.mockReset();
  theirs.mockReset();
});

describe("UserLists affinity strip", () => {
  it("reads the viewer's own list through a query, so it shows without a primed cache", async () => {
    signIn();
    theirs.mockResolvedValue(foreign());
    fetchMine.mockResolvedValue(
      listResult(
        SCORES.map((score, i) => entry({ id: i + 1, score, media: media({ id: 100 + i }) })),
      ),
    );

    renderWithProviders(<UserLists user={them} />);

    expect(await screen.findByText(/^social\.affinity:/)).toBeInTheDocument();
    expect(fetchMine).toHaveBeenCalledWith(6421433, "ANIME");
  });

  it("asks for no own list on the viewer's own profile", async () => {
    const viewer = signIn();
    theirs.mockResolvedValue(foreign());

    renderWithProviders(<UserLists user={{ ...them, id: viewer.id }} />);

    expect(await screen.findByText("Show 0")).toBeInTheDocument();
    expect(fetchMine).not.toHaveBeenCalled();
    expect(screen.queryByText(/^social\.affinity/)).toBeNull();
  });
});
