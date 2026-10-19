import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { useContentFilter } from "@/stores/contentFilter";
import { entry, media } from "@/test/fixtures";

const mutate = vi.fn();
vi.mock("@/hooks/useListMutations", () => ({
  useListMutations: () => ({ save: { mutate } }),
}));

let width = 1000;
vi.mock("@/hooks/useElementWidth", () => ({
  useElementWidth: () => width,
}));

import { ListShelves } from "./ListShelves";
import { ContinueRow } from "./ContinueRow";
import { CatchUpRow } from "./CatchUp";
import { WeekPlan } from "./WeekPlan";
import { ComingUp } from "./ComingUp";
import { WEEK_SECS, catchUp } from "@/lib/overview";

const NOW = Math.floor(Date.now() / 1000);

describe("ListShelves", () => {
  it("puts one spine per entry on a rule in the status colour, with the count under it", () => {
    const watching = [1, 2, 3].map((id) => entry({ id, status: "CURRENT", media: media({ id }) }));
    renderWithProviders(<ListShelves anime={watching} manga={[]} cols={6} />);
    const shelf = screen.getByRole("link", { name: /status\.ANIME\.CURRENT/ });
    expect(shelf.querySelectorAll("img")).toHaveLength(3);
    expect(shelf.querySelector("[data-shelf-rule]")?.getAttribute("style")).toContain("var(--color-status-current)");
    expect(within(shelf).getByText("3")).toBeInTheDocument();
  });

  it("switches to the manga shelves", () => {
    const read = entry({ id: 9, status: "CURRENT", media: media({ id: 9, type: "MANGA" }) });
    renderWithProviders(<ListShelves anime={[]} manga={[read]} cols={6} />);
    fireEvent.click(screen.getByRole("button", { name: /manga/i }));
    expect(screen.getByRole("link", { name: /status\.MANGA\.CURRENT/ }).querySelectorAll("img")).toHaveLength(1);
  });
});

describe("ContinueRow", () => {
  it("counts a twelve-episode title in ticks and a three-hundred-chapter one in a bar", () => {
    const short = entry({ id: 1, progress: 3, updatedAt: 2, media: media({ id: 1, episodes: 12 }) });
    const long = entry({ id: 2, progress: 2, updatedAt: 1, media: media({ id: 2, type: "MANGA", episodes: null, chapters: 300 }) });
    renderWithProviders(<ContinueRow userId={1} anime={[short]} manga={[long]} />);
    const cards = screen.getAllByRole("article");
    expect(cards[0].querySelectorAll("[data-tick]")).toHaveLength(12);
    expect(cards[0].querySelectorAll('[data-tick="done"]')).toHaveLength(3);
    expect(cards[1].querySelectorAll("[data-tick]")).toHaveLength(0);
    expect(cards[1].querySelector("[data-bar]")).not.toBeNull();
  });

  it("writes the title and the ticks under the cover, never on it", () => {
    const e = entry({ id: 1, progress: 3, media: media({ id: 1, episodes: 12 }) });
    renderWithProviders(<ContinueRow userId={1} anime={[e]} manga={[]} />);
    const cover = screen.getByRole("article").querySelector("[data-cover]")!;
    expect(cover).not.toHaveTextContent("Cowboy Bebop");
    expect(cover.querySelectorAll("[data-tick]")).toHaveLength(0);
    expect(screen.getByRole("article")).toHaveTextContent("Cowboy Bebop");
  });

  it("saves the next episode from the +1 in its ring", () => {
    mutate.mockReset();
    const e = entry({ id: 1, mediaId: 1, progress: 3, media: media({ id: 1, episodes: 12 }) });
    renderWithProviders(<ContinueRow userId={1} anime={[e]} manga={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "common.plusOne" }));
    expect(mutate).toHaveBeenCalledWith({ mediaId: 1, progress: 4 });
  });
});

describe("CatchUpRow", () => {
  const airing = (id: number, progress: number, episode: number) =>
    entry({ id, progress, updatedAt: id, media: media({ id, episodes: 12, nextAiringEpisode: { episode, airingAt: NOW + 3600 } }) });

  it("shows every title behind with its count, the next episode and the aired episodes outlined", () => {
    const items = catchUp([airing(1, 3, 6), airing(2, 0, 2)], NOW);
    renderWithProviders(<CatchUpRow userId={1} items={items} />);
    expect(screen.getByRole("heading", { name: "dashboard.catchUp" })).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(cards[1]).toHaveTextContent("dashboard.catchUpBadge");
    expect(cards[1]).toHaveTextContent("dashboard.catchUpNext");
    expect(cards[1].querySelectorAll('[data-tick="done"]')).toHaveLength(3);
    expect(cards[1].querySelectorAll('[data-tick="aired"]')).toHaveLength(2);
  });

  it("saves the next episode from the +1", () => {
    renderWithProviders(<CatchUpRow userId={1} items={catchUp([airing(7, 3, 6)], NOW)} />);
    fireEvent.click(screen.getByRole("button", { name: "common.plusOne" }));
    expect(mutate).toHaveBeenCalledWith({ mediaId: 7, progress: 4 });
  });

  it("draws nothing once every title is caught up", () => {
    const { container } = renderWithProviders(<CatchUpRow userId={1} items={catchUp([airing(1, 5, 6)], NOW)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("leaves the continue row without the titles it shows", () => {
    const behind = airing(1, 0, 4);
    const current = entry({ id: 2, progress: 1, updatedAt: 0, media: media({ id: 2, episodes: 12 }) });
    renderWithProviders(<ContinueRow userId={1} anime={[behind, current]} manga={[]} skip={new Set([1])} />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});

describe("WeekPlan", () => {
  const airing = entry({ id: 5, media: media({ id: 5, nextAiringEpisode: { episode: 9, airingAt: NOW + 2 * 86400 } }) });

  it("draws seven day columns with the episode in its column when there is room", () => {
    width = 1000;
    renderWithProviders(<WeekPlan anime={[airing]} />);
    const columns = screen.getAllByRole("listitem", { name: /./ }).filter((li) => li.dataset.day != null);
    expect(columns).toHaveLength(7);
    expect(within(columns[2]).getByRole("link")).toHaveAttribute("href", "/media/5");
  });

  it("falls back to a list of days when narrow", () => {
    width = 500;
    renderWithProviders(<WeekPlan anime={[airing]} />);
    expect(document.querySelector("[data-day]")).toBeNull();
    expect(screen.getByRole("link", { name: /Cowboy Bebop/ })).toHaveAttribute("href", "/media/5");
  });
});

describe("ComingUp", () => {
  it("lists what lies past this week and planned titles, not this week's episodes", () => {
    const later = entry({ id: 1, media: media({ id: 1, title: { romaji: "Later", english: "Later", native: null }, nextAiringEpisode: { episode: 2, airingAt: NOW + WEEK_SECS + 600 } }) });
    const thisWeek = entry({ id: 2, media: media({ id: 2, title: { romaji: "Soon", english: "Soon", native: null }, nextAiringEpisode: { episode: 2, airingAt: NOW + 600 } }) });
    renderWithProviders(<ComingUp anime={[later, thisWeek]} />);
    expect(screen.getByText("Later")).toBeInTheDocument();
    expect(screen.queryByText("Soon")).toBeNull();
  });
});

describe("empty and adult", () => {
  it("says so when nothing is being watched or read", () => {
    renderWithProviders(<ContinueRow userId={1} anime={[]} manga={[]} />);
    expect(screen.getByText("dashboard.nothingWatching")).toBeInTheDocument();
  });

  it("says so when nothing airs this week, in the list form", () => {
    width = 500;
    renderWithProviders(<WeekPlan anime={[]} />);
    expect(screen.getByText("dashboard.weekLineNone")).toBeInTheDocument();
  });

  it("stacks two episodes at the same hour instead of drawing one over the other", () => {
    width = 1000;
    const at = NOW + 2 * 86400;
    const a = entry({ id: 5, media: media({ id: 5, nextAiringEpisode: { episode: 9, airingAt: at } }) });
    const b = entry({ id: 6, media: media({ id: 6, nextAiringEpisode: { episode: 3, airingAt: at } }) });
    renderWithProviders(<WeekPlan anime={[a, b]} />);
    const tops = [...document.querySelectorAll<HTMLElement>("[data-day] a")].map((l) => parseFloat(l.style.top));
    expect(tops).toHaveLength(2);
    expect(Math.abs(tops[1] - tops[0])).toBeGreaterThanOrEqual(40);
  });

  it("veils an explicit title's spine while the blur setting is on", () => {
    useContentFilter.setState({ ready: true, level: "off", blurAdult: true });
    const adult = entry({ id: 1, status: "CURRENT", media: media({ id: 1, isAdult: true }) });
    renderWithProviders(<ListShelves anime={[adult]} manga={[]} cols={6} />);
    expect(screen.getByRole("link", { name: /status\.ANIME\.CURRENT/ }).querySelector("img")).toHaveClass("veil-thumb");
  });
});
