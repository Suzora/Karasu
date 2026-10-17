import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, signIn, signOut } from "@/test/render";

const activities = vi.fn<(...args: unknown[]) => Promise<unknown>>(() => Promise.resolve({ pageInfo: { hasNextPage: false, currentPage: 1 }, activities: [] }));

vi.mock("@/api/anilist", async (orig) => ({ ...(await orig<typeof import("@/api/anilist")>()), isTauri: true }));
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  activities: (...args: unknown[]) => activities(...args),
}));

import Social from "./Social";

beforeEach(() => {
  activities.mockClear();
});
afterEach(signOut);

/** The activity page's column: the feed and its kind, each a press that asks AniList once for that view. */
describe("Activity's column", () => {
  it("opens on the following feed with everything, and switches to everyone's on a press", async () => {
    const viewer = signIn();
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Social />, { route: "/social" });
    await waitFor(() => expect(activities).toHaveBeenCalledTimes(1));
    expect(activities.mock.calls[0][0]).toMatchObject({ isFollowing: true, types: ["ANIME_LIST", "MANGA_LIST", "TEXT"] });
    expect(screen.getByRole("button", { name: "social.feedFollowing" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "social.feedMine" }));
    await waitFor(() => expect(activities).toHaveBeenCalledTimes(2));
    expect(activities.mock.calls[1][0]).toMatchObject({ userId: viewer.id });
  });

  it("offers no status-updates view on everyone's feed", async () => {
    signIn();
    renderWithProviders(<Social />, { route: "/social?feed=everyone" });
    await waitFor(() => expect(activities).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "social.kindText" })).toBeNull();
    expect(screen.getByRole("button", { name: "social.kindAnime" })).toBeInTheDocument();
  });
});
