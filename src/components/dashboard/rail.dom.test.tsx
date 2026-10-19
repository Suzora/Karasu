import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { ActivityPage, BirthdayPerson } from "@/api/social";
import { renderWithProviders, signIn, signOut, useLocalProfile } from "@/test/render";
import { nowPlaying } from "@/test/fixtures";
import { useNowPlaying } from "@/stores/nowPlaying";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const activities = vi.fn<(vars: unknown, page?: number, opts?: unknown) => Promise<ActivityPage>>();
const birthdays = vi.fn<(userId: number) => Promise<BirthdayPerson[]>>();
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  activities: (vars: unknown, page?: number, opts?: unknown) => activities(vars, page, opts),
  favouriteBirthdays: (userId: number) => birthdays(userId),
}));

import { OverviewRail } from "./OverviewRail";
import { useOverviewRail } from "@/stores/overviewRail";

const empty: ActivityPage = { pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false }, activities: [] };

beforeEach(() => {
  activities.mockReset();
  activities.mockResolvedValue(empty);
  birthdays.mockReset();
  birthdays.mockResolvedValue([]);
});

afterEach(() => {
  useNowPlaying.setState({ current: null });
  signOut();
});

/** The Overview's right column: the detected title when one plays, the statistics, one's own activity, birthdays. */
describe("OverviewRail", () => {
  it("shows the detected title first beside the page, and says so to the shell until it leaves", () => {
    signIn();
    useNowPlaying.setState({ current: nowPlaying() });
    const { unmount } = renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    expect(screen.getByRole("region", { name: "dashboard.nowPlaying" })).toBeInTheDocument();
    expect(useOverviewRail.getState().showsDetection).toBe(true);
    unmount();
    expect(useOverviewRail.getState().showsDetection).toBe(false);
  });

  it("leaves the detected title to the floating window when it is not beside the page", () => {
    signIn();
    useNowPlaying.setState({ current: nowPlaying() });
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside={false} ready />);
    expect(screen.queryByRole("region", { name: "dashboard.nowPlaying" })).toBeNull();
    expect(useOverviewRail.getState().showsDetection).toBe(false);
  });

  /** The activity is a short list that grows on a press, never a box of its own to scroll through. */
  it("shows five of one's own activities, a load-more button after them, and no scroller of its own", async () => {
    signIn();
    const USER = { id: 1, name: "Kyusetzu", avatar: null, isFollowing: null, isFollower: null };
    const post = (id: number) => ({ __typename: "TextActivity", id, text: `post ${id}`, createdAt: 100, likeCount: 0, isLiked: false, replyCount: 0, siteUrl: `https://anilist.co/activity/${id}`, user: USER });
    activities.mockResolvedValue({ pageInfo: { total: 8, currentPage: 1, lastPage: 1, hasNextPage: false }, activities: [1, 2, 3, 4, 5, 6, 7, 8].map(post) });
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside={false} ready />);
    const fifth = await screen.findByText("post 5");
    expect(screen.queryByText("post 6")).toBeNull();
    expect(screen.getByRole("button", { name: "social.loadMorePlain" })).toBeInTheDocument();
    for (let el: HTMLElement | null = fifth; el && el.tagName !== "ASIDE"; el = el.parentElement) {
      expect(el).not.toHaveClass("overflow-y-auto");
    }
  });

  it("starts with the statistics when nothing plays", () => {
    signIn();
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    const headings = screen.getAllByRole("heading").map((h) => h.textContent);
    expect(headings[0]).toBe("dashboard.stats");
  });

  it("asks for nothing in local mode and says the activity needs an account", async () => {
    useLocalProfile();
    renderWithProviders(<OverviewRail userId={0} anime={[]} manga={[]} settled beside ready />);
    expect(screen.getByText("dashboard.ownActivityNeedsAccount")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 20));
    expect(activities).not.toHaveBeenCalled();
    expect(birthdays).not.toHaveBeenCalled();
  });

  it("holds the activity request until the lists have settled", async () => {
    signIn();
    const { rerender } = renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled={false} beside ready />);
    await new Promise((r) => setTimeout(r, 20));
    expect(activities).not.toHaveBeenCalled();
    rerender(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    await waitFor(() => expect(activities).toHaveBeenCalledWith({ userId: 1 }, 1, { source: "ownActivity" }));
  });

  it("names today's birthdays only on a day that has some", async () => {
    signIn();
    const now = new Date();
    birthdays.mockResolvedValue([
      { id: 4, name: { full: "Frieren" }, image: { medium: null }, kind: "character", dateOfBirth: { month: now.getMonth() + 1, day: now.getDate() } } as BirthdayPerson,
    ]);
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    expect(await screen.findByText("Frieren")).toBeInTheDocument();
  });
});

describe("OverviewRail before and without data", () => {
  it("shows no figures before the lists have answered", () => {
    signIn();
    const { container } = renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled={false} beside ready={false} />);
    expect(container.textContent).not.toContain("0 %");
    expect(screen.queryByText("social.noActivitySelf")).toBeNull();
  });

  it("writes no 0 / 0 for an account with nothing running", () => {
    signIn();
    const { container } = renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    expect(container.textContent).not.toContain("0 / 0");
  });

  it("caches its feed with the profile's, so a like or a new post reaches it", async () => {
    signIn();
    const { queryClient } = renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    await waitFor(() => expect(queryClient.getQueryData(["social", "activities", 1])).toBeDefined());
  });

  it("keeps room for the activity and scrolls itself when the window is short", () => {
    signIn();
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    const aside = screen.getByText("dashboard.ownActivity").closest("aside")!;
    expect(aside).toHaveClass("overflow-y-auto");
    expect(screen.getByText("dashboard.ownActivity").closest("section")).toHaveClass("min-h-40");
  });

  it("never scrolls the feed sideways, whatever its buttons' hit areas reach", () => {
    signIn();
    renderWithProviders(<OverviewRail userId={1} anime={[]} manga={[]} settled beside ready />);
    const aside = screen.getByText("dashboard.ownActivity").closest("aside")!;
    expect(aside).toHaveClass("overflow-y-auto", "overflow-x-hidden");
  });
});
