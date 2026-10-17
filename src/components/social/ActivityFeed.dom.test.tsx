import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { ActivityPage } from "@/api/social";
import { renderWithProviders } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const fetchPage = vi.fn<(vars: unknown, page?: number, opts?: { source: string }) => Promise<ActivityPage>>();

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  activities: (vars: unknown, page?: number, opts?: { source: string }) => fetchPage(vars, page, opts),
}));

import { ActivityFeed } from "./ActivityFeed";

const USER = { id: 1, name: "Kyusetzu", avatar: null, isFollowing: null, isFollower: null };
const text = (id: number) => ({ __typename: "TextActivity", id, text: `post ${id}`, createdAt: 100, likeCount: 0, isLiked: false, replyCount: 0, siteUrl: `https://anilist.co/activity/${id}`, user: USER });
const page = (ids: number[], hasNextPage: boolean): ActivityPage => ({
  pageInfo: { total: ids.length, currentPage: 1, lastPage: hasNextPage ? 2 : 1, hasNextPage },
  activities: ids.map(text),
});

/** The feed the Overview's rail reuses: it may wait for the lists, names its request, and can draw plain rows. */
describe("ActivityFeed options", () => {
  it("does not request until enabled", async () => {
    fetchPage.mockReset();
    fetchPage.mockResolvedValue(page([1], false));
    const { rerender } = renderWithProviders(
      <ActivityFeed queryKey={["own", 1]} source={{ userId: 1 }} enabled={false} emptyTitle="none" />,
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(fetchPage).not.toHaveBeenCalled();
    rerender(<ActivityFeed queryKey={["own", 1]} source={{ userId: 1 }} enabled emptyTitle="none" />);
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
  });

  it("sends the request under the source it is given", async () => {
    fetchPage.mockReset();
    fetchPage.mockResolvedValue(page([1], false));
    renderWithProviders(<ActivityFeed queryKey={["own", 2]} source={{ userId: 1 }} requestSource="ownActivity" emptyTitle="none" />);
    await waitFor(() => expect(fetchPage).toHaveBeenCalledWith({ userId: 1 }, 1, { source: "ownActivity" }));
  });

  it("draws rows without the owner's name or a card frame in the row variant", async () => {
    fetchPage.mockReset();
    fetchPage.mockResolvedValue(page([1], false));
    renderWithProviders(<ActivityFeed queryKey={["own", 3]} source={{ userId: 1 }} variant="row" emptyTitle="none" />);
    const post = await screen.findByText("post 1");
    const row = post.closest("article")!;
    expect(row).not.toHaveClass("rounded-panel");
    expect(screen.queryByText("Kyusetzu")).toBeNull();
  });

  it("pages by a button only", async () => {
    fetchPage.mockReset();
    fetchPage.mockResolvedValueOnce(page([1], true));
    renderWithProviders(<ActivityFeed queryKey={["own", 4]} source={{ userId: 1 }} variant="row" emptyTitle="none" />);
    expect(await screen.findByRole("button", { name: "social.loadMorePlain" })).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
