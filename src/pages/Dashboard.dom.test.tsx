import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { entry, listResult, media, nowPlaying } from "@/test/fixtures";
import { useNowPlaying } from "@/stores/nowPlaying";
import { useContentFilter } from "@/stores/contentFilter";

let width = 1300;
let phone = false;
vi.mock("@/hooks/useElementWidth", () => ({ useElementWidth: () => width }));
vi.mock("@/hooks/usePhoneShell", () => ({ usePhoneShell: () => phone }));

const lists = vi.fn();
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  fetchMediaList: (userId: number, type: string) => lists(userId, type),
}));
vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  seasonHero: async () => [],
}));
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  activities: async () => ({ pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false }, activities: [] }),
  favouriteBirthdays: async () => [],
}));
vi.mock("@/components/media/RecommendedSection", () => ({
  default: ({ type }: { type: string }) => <section><h2>{`rec-${type}`}</h2></section>,
}));

import Dashboard from "./Dashboard";

beforeEach(() => {
  useContentFilter.setState({ ready: true, level: "off", blurAdult: true });
  signIn();
  lists.mockReset();
  lists.mockImplementation(async (_u: number, type: string) =>
    type === "ANIME" ? listResult([entry({ id: 1, media: media({ id: 1, episodes: 12 }) })]) : listResult([]),
  );
});

afterEach(() => {
  width = 1300;
  phone = false;
  useNowPlaying.setState({ current: null });
  signOut();
});

const h2s = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

/** The Overview in the maintainer's order: banner, lists, continue, this week, coming up, recommendations; the rail beside. */
describe("Dashboard", () => {
  it("lays the middle out in the dictated order and the rail after it", async () => {
    renderWithProviders(<Dashboard />);
    await screen.findByText("dashboard.myLists");
    expect(h2s()).toEqual([
      "dashboard.myLists",
      "dashboard.continueBoth",
      "dashboard.thisWeek",
      "dashboard.comingUp",
      "rec-ANIME",
      "rec-MANGA",
      "dashboard.stats",
      "dashboard.ownActivity",
    ]);
  });

  it("puts the rail beside the page when there is room and below it when there is not", async () => {
    const { unmount } = renderWithProviders(<Dashboard />);
    expect((await screen.findByText("dashboard.stats")).closest("aside")).toHaveClass("sticky");
    unmount();
    width = 900;
    renderWithProviders(<Dashboard />);
    expect((await screen.findByText("dashboard.stats")).closest("aside")).not.toHaveClass("sticky");
  });

  it("leaves the detected title to the docked window on the phone", async () => {
    phone = true;
    useNowPlaying.setState({ current: nowPlaying() });
    renderWithProviders(<Dashboard />);
    await screen.findByText("dashboard.stats");
    expect(screen.queryByRole("region", { name: "dashboard.nowPlaying" })).toBeNull();
  });

  it("renders empty lists without a NaN anywhere", async () => {
    lists.mockImplementation(async () => listResult([]));
    const { container } = renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText("dashboard.stats")).toBeInTheDocument());
    expect(container.textContent).not.toContain("NaN");
    expect(container.textContent).not.toContain("0 / 0");
    expect(screen.getByText("dashboard.nothingWatching")).toBeInTheDocument();
  });
});
