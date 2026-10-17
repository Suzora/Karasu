import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import type { HeroMedia } from "@/api/queries";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders } from "@/test/render";
import { entry, media } from "@/test/fixtures";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const hero = vi.fn<() => Promise<HeroMedia[]>>();
vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  seasonHero: () => hero(),
}));

import { OverviewBanner } from "./OverviewBanner";

const art = (id: number): HeroMedia => ({
  id,
  type: "ANIME",
  title: { romaji: `Title ${id}`, english: null, native: null },
  bannerImage: `https://s4.anilist.co/banner/${id}.jpg`,
  coverImage: { extraLarge: null, large: null, color: null },
  relations: null,
  format: "TV",
  status: "RELEASING",
  episodes: 12,
  nextAiringEpisode: null,
  averageScore: 80,
  genres: [],
  isAdult: false,
});

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

beforeEach(() => {
  useContentFilter.setState({ ready: true, level: "off", blurAdult: true });
  hero.mockReset();
  hero.mockResolvedValue([art(7)]);
});

/** The Overview's banner: a greeting with a line of real data, the search, the image's source and the 48-hour strip. */
describe("OverviewBanner", () => {
  it("greets by name with a key the time of day picks", () => {
    renderWithProviders(<OverviewBanner name="Kyusetzu" anime={[]} strip={false} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/^dashboard\.greet(Morning|Day|Evening):\{"name":"Kyusetzu"\}$/);
  });

  it("submits the search to /search?q=", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <OverviewBanner name="Kyusetzu" anime={[]} strip={false} />
        <Where />
      </>,
    );
    await user.type(screen.getByRole("searchbox", { name: "dashboard.search" }), "frieren{Enter}");
    expect(screen.getByTestId("where")).toHaveTextContent("/search?q=frieren");
  });

  it("links the image credit to its title", async () => {
    renderWithProviders(<OverviewBanner name="Kyusetzu" anime={[]} strip={false} />);
    expect(await screen.findByRole("link", { name: /^dashboard\.imageCredit/ })).toHaveAttribute("href", "/media/7");
  });

  it("draws the strip only when asked, each title at its offset", () => {
    const now = Math.floor(Date.now() / 1000);
    const soon = entry({ id: 3, media: media({ id: 3, nextAiringEpisode: { episode: 2, airingAt: now + 43200 } }) });
    const { rerender } = renderWithProviders(<OverviewBanner name="Kyusetzu" anime={[soon]} strip={false} />);
    expect(screen.queryByRole("list", { name: "dashboard.strip" })).toBeNull();
    rerender(<OverviewBanner name="Kyusetzu" anime={[soon]} strip />);
    const item = screen.getByRole("list", { name: "dashboard.strip" }).querySelector("li")!;
    expect(parseFloat(item.style.left)).toBeCloseTo(25, 0);
  });
});
