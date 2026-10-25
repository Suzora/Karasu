import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import type { SocialUser, UserPage, UserProfile as Profile } from "@/api/social";
import { renderWithProviders, signIn, signOut } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const profile = vi.fn<(key: unknown) => Promise<Profile>>();
const followerPage = vi.fn<(userId: number) => Promise<UserPage>>();
const mutualPage = vi.fn<(userId: number) => Promise<UserPage>>();
const removeFollower = vi.fn<(userId: number) => Promise<SocialUser>>();
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  userProfile: (key: unknown) => profile(key),
  followers: (userId: number) => followerPage(userId),
  mutualFollowers: (userId: number) => mutualPage(userId),
  removeFollower: (userId: number) => removeFollower(userId),
  followCounts: () => Promise.resolve({ followers: 2, following: 3, mutual: 1 }),
}));

import UserProfile from "./UserProfile";

const person = (id: number, name: string) =>
  ({
    id,
    name,
    siteUrl: `https://anilist.co/user/${name}`,
    avatar: null,
    isFollowing: false,
    isFollower: false,
    isBlocked: false,
    previousNames: [],
    options: null,
    mediaListOptions: { scoreFormat: "POINT_10" },
    statistics: null,
    favourites: null,
  }) as unknown as Profile;

const user = (id: number, name: string, isFollowing = false): SocialUser =>
  ({ id, name, avatar: null, isFollowing, isFollower: true }) as SocialUser;

const page = (users: SocialUser[]): UserPage => ({
  pageInfo: { total: users.length, currentPage: 1, lastPage: 1, hasNextPage: false },
  users,
});

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

/** AniList's mutuals are their own tab with a count, read from the same request that counts the followers. */
describe("the profile's Mutuals tab", () => {
  it("lists who follows the profile and is followed back", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    mutualPage.mockResolvedValue(page([user(21, "Hoshi", true)]));
    mount("Mikan", "mutual");
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    expect(mutualPage).toHaveBeenCalledWith(11);
    expect(screen.getByRole("tab", { name: /social\.tabMutual/ })).toHaveTextContent("1");
  });
});

/** Removing a follower is the viewer's own profile's alone, always asked first, and never undone by Karasu. */
describe("removing a follower", () => {
  it("offers no removal on someone else's followers", async () => {
    signIn();
    profile.mockResolvedValue(person(11, "Mikan"));
    followerPage.mockResolvedValue(page([user(21, "Hoshi")]));
    mount("Mikan", "followers");
    await screen.findByText("Hoshi");
    expect(screen.queryByRole("button", { name: /social\.removeFollowerAria/ })).toBeNull();
  });

  it("asks, then removes the follower from the list once AniList agrees", async () => {
    const typist = userEvent.setup({ delay: null });
    const viewer = signIn();
    profile.mockResolvedValue(person(viewer.id, viewer.name));
    followerPage.mockResolvedValue(page([user(21, "Hoshi"), user(22, "Mikan", true)]));
    removeFollower.mockResolvedValue({ ...user(21, "Hoshi"), isFollower: false });
    mount(viewer.name, "followers");
    await screen.findByText("Hoshi");

    const [first] = screen.getAllByRole("button", { name: /social\.removeFollowerAria/ });
    await typist.click(first);
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Hoshi")).toBeInTheDocument();
    expect(removeFollower).not.toHaveBeenCalled();

    await typist.click(within(dialog).getByRole("button", { name: "social.removeFollowerShort" }));
    expect(removeFollower).toHaveBeenCalledWith(21);
    await waitFor(() => expect(screen.queryByText("Hoshi")).toBeNull());
    expect(screen.getByText("Mikan")).toBeInTheDocument();
  });

  it("keeps the follower when the question is cancelled", async () => {
    const typist = userEvent.setup({ delay: null });
    const viewer = signIn();
    profile.mockResolvedValue(person(viewer.id, viewer.name));
    followerPage.mockResolvedValue(page([user(21, "Hoshi")]));
    mount(viewer.name, "followers");
    await typist.click(await screen.findByRole("button", { name: /social\.removeFollowerAria/ }));
    await typist.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "common.cancel" }));
    expect(removeFollower).not.toHaveBeenCalled();
    expect(screen.getByText("Hoshi")).toBeInTheDocument();
  });
});
