import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import type { ForeignListGroup, UserProfile as Profile } from "@/api/social";
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
const profile = vi.fn<(key: unknown) => Promise<Profile>>();
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
    userProfile: (key: unknown) => profile(key),
    followCounts: () => Promise.resolve({ followers: 0, following: 0 }),
  };
});

import UserProfile from "./UserProfile";

const SCORES = [9, 8, 7, 6, 5, 4, 3, 7, 8, 2];

const person = (id: number, name: string) =>
  ({
    id,
    name,
    siteUrl: `https://anilist.co/user/${name}`,
    about: null,
    avatar: null,
    bannerImage: null,
    donatorTier: null,
    donatorBadge: null,
    moderatorRoles: null,
    createdAt: null,
    updatedAt: null,
    isFollowing: false,
    isFollower: false,
    isBlocked: false,
    previousNames: [],
    options: null,
    mediaListOptions: { scoreFormat: "POINT_10" },
    statistics: null,
    favourites: null,
  }) as unknown as Profile;

function foreign(): ForeignListGroup[] {
  const entries = SCORES.map((score, i) => {
    const m = media({ id: 100 + i, title: { romaji: `Show ${i}`, english: null, native: null } });
    return { id: 900 + i, mediaId: m.id, status: "COMPLETED", score, progress: 1, progressVolumes: null, media: m };
  });
  return [{ name: "Completed", status: "COMPLETED", isCustomList: false, entries } as ForeignListGroup];
}

function mount(name: string, tab: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/user/:name" element={<UserProfile />} />
    </Routes>,
    { route: `/user/${name}?tab=${tab}` },
  );
}

afterEach(() => {
  signOut();
  vi.clearAllMocks();
});

describe("the profile's Compare tab", () => {
  it("is not there on the viewer's own profile, where a compare link falls back to the overview", async () => {
    const viewer = signIn();
    profile.mockResolvedValue(person(viewer.id, viewer.name));
    mount(viewer.name, "compare");
    expect(await screen.findByRole("tab", { name: /social\.tabLists/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /social\.tabCompare/ })).toBeNull();
    expect(screen.getByRole("tab", { name: /social\.tabOverview/ })).toHaveAttribute("aria-selected", "true");
    expect(theirs).not.toHaveBeenCalled();
  });

  it("compares another user's list and shares one request with the Lists tab", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    theirs.mockResolvedValue(foreign());
    fetchMine.mockResolvedValue(
      listResult(SCORES.map((score, i) => entry({ id: i + 1, score, status: "COMPLETED", media: media({ id: 100 + i }) }))),
    );
    const { queryClient } = mount("Mikan", "lists");
    await screen.findByText(/^social.affinity:/);
    // The test client forgets on sight; the app keeps a list for half an hour, which this stands in for.
    queryClient.setQueryDefaults(["social", "userList"], { gcTime: Infinity });

    await act(async () => {
      fireEvent.click(screen.getByRole("tab", { name: /social\.tabCompare/ }));
    });
    expect(await screen.findByText(/social\.compareTitle/)).toBeInTheDocument();
    expect(screen.getByText(/social\.comparePct/)).toBeInTheDocument();
    expect(theirs).toHaveBeenCalledTimes(1);
  });

  it("shows the gap between the means unrounded, on the viewer's scale", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    const theirsScores = [7, 7];
    const rows = theirsScores.map((score, i) => {
      const m = media({ id: 100 + i });
      return { id: 900 + i, mediaId: m.id, status: "COMPLETED", score, progress: 1, progressVolumes: null, media: m };
    });
    theirs.mockResolvedValue([{ name: "Completed", status: "COMPLETED", isCustomList: false, entries: rows } as ForeignListGroup]);
    fetchMine.mockResolvedValue(listResult([6, 7].map((score, i) => entry({ id: i + 1, score, status: "COMPLETED", media: media({ id: 100 + i }) }))));
    mount("Mikan", "compare");
    // Means of 6.5 and 7: rounding each to a whole point first would have shown 0.0.
    expect(await screen.findByText("+0.5")).toBeInTheDocument();
    expect(screen.getByText(/social\.affinityNone/)).toBeInTheDocument();
  });

  it("counts an entry hidden from the status lists as seen, though it sits only in a custom list", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    theirs.mockResolvedValue(foreign());
    const hidden = entry({ id: 1, score: 9, status: "COMPLETED", hiddenFromStatusLists: true, media: media({ id: 100 }) });
    fetchMine.mockResolvedValue({
      ...listResult([]),
      lists: [{ name: "Favs", status: null, isCustomList: true, entries: [hidden] }],
    });
    mount("Mikan", "compare");
    expect(await screen.findByText(/social\.compareTitle/)).toBeInTheDocument();
    // Show 0 is the hidden one: shared, so it is not offered back as unseen.
    expect(screen.queryByText("Show 0")).toBeNull();
    expect(screen.getByText("Show 1")).toBeInTheDocument();
  });

  it("keeps the type toggle when a list fails, so the other type stays one press away", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    theirs.mockRejectedValue(new Error("HTTP 502"));
    fetchMine.mockResolvedValue(listResult([]));
    mount("Mikan", "compare");
    expect(await screen.findByText(/common\.error/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /common\.manga/ })).toBeInTheDocument();
  });

  it("keeps a comparison it has when a later refetch fails, with the error beside it", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    theirs.mockResolvedValue(foreign());
    fetchMine.mockResolvedValue(
      listResult(SCORES.map((score, i) => entry({ id: i + 1, score, status: "COMPLETED", media: media({ id: 100 + i }) }))),
    );
    const { queryClient } = mount("Mikan", "compare");
    expect(await screen.findByText(/social\.compareTitle/)).toBeInTheDocument();
    theirs.mockRejectedValue(new Error("HTTP 502"));
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: ["social", "userList"] });
    });
    expect(await screen.findByText(/common\.error/)).toBeInTheDocument();
    expect(screen.getByText(/social\.compareTitle/)).toBeInTheDocument();
  });
});

