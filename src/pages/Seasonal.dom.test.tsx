import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation, useNavigationType } from "react-router";
import type { MediaWithListStatus } from "@/api/queries";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { currentSeason } from "@/api/queries";

/** Proves the JSX carries the grouping `lib/formatGroups.test.ts` proves; `isTauri` is the mock seam. */
const seasonal = vi.fn();

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  seasonalAnime: (...args: unknown[]) => seasonal(...args),
}));

import Seasonal from "./Seasonal";

let nextId = 1;
const media = (format: string | null, over: Partial<MediaWithListStatus> = {}) =>
  ({
    id: nextId++,
    type: "ANIME",
    title: { romaji: `Title ${nextId}`, english: null, native: null },
    coverImage: { large: null },
    format,
    genres: [],
    mediaListEntry: null,
    ...over,
  }) as unknown as MediaWithListStatus;

beforeEach(() => {
  nextId = 1;
  signIn();
  // The page renders nothing until the stored filter level has been read.
  useContentFilter.setState({ level: "off", ready: true, error: null });
  seasonal.mockReset();
});

afterEach(() => {
  signOut();
  useContentFilter.setState({ level: "strict", ready: false, error: null });
});

const headings = () =>
  screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

describe("Seasonal grouping", () => {
  it("orders the sections by format, not by what AniList sent", async () => {
    seasonal.mockResolvedValue({
      media: [media("MUSIC"), media("MOVIE"), media("TV"), media("OVA")],
    });
    renderWithProviders(<Seasonal />);
    await waitFor(() => expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4));
    expect(headings()).toEqual([
      "format.TV",
      "format.MOVIE",
      "format.OVA",
      "format.MUSIC",
    ]);
  });

  /** A heading over nothing is worse than no heading. */
  it("shows only the formats this season has", async () => {
    seasonal.mockResolvedValue({ media: [media("TV"), media("TV")] });
    renderWithProviders(<Seasonal />);
    await waitFor(() => expect(headings()).toEqual(["format.TV"]));
  });

  /** A format AniList adds later has to land somewhere rather than drop off the page. */
  it("keeps an unknown format under a trailing heading", async () => {
    seasonal.mockResolvedValue({
      media: [media("TV"), media("HOLOGRAM"), media(null)],
    });
    renderWithProviders(<Seasonal />);
    await waitFor(() =>
      expect(headings()).toEqual(["format.TV", "seasonal.otherFormats"]),
    );
    // Both oddities are in it — two cards under one heading.
    const other = screen.getByRole("heading", { name: "seasonal.otherFormats" })
      .parentElement!.parentElement!;
    expect(within(other).getAllByRole("link").length).toBeGreaterThanOrEqual(2);
  });

  it("counts each section beside its heading", async () => {
    seasonal.mockResolvedValue({
      media: [media("TV"), media("TV"), media("TV"), media("MOVIE")],
    });
    renderWithProviders(<Seasonal />);
    await waitFor(() => expect(headings()).toEqual(["format.TV", "format.MOVIE"]));
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  /** The badge only appears with the filter off, since `adultQueryArg` excludes adult titles server-side otherwise. */
  it("marks adult titles, and only those", async () => {
    seasonal.mockResolvedValue({
      media: [media("TV", { isAdult: true }), media("TV", { isAdult: false })],
    });
    renderWithProviders(<Seasonal />);
    await waitFor(() => expect(screen.getByText("18+")).toBeInTheDocument());
    expect(screen.getAllByText("18+")).toHaveLength(1);
  });

  it("renders every title exactly once across the sections", async () => {
    seasonal.mockResolvedValue({
      media: [media("TV"), media("MOVIE"), media("TV"), media("MUSIC")],
    });
    renderWithProviders(<Seasonal />);
    await waitFor(() => expect(headings()).toHaveLength(3));
    expect(document.querySelectorAll("[data-media-id]")).toHaveLength(4);
  });
});

describe("Seasonal in the URL", () => {
  it("opens the season its URL names, so Back from a title lands on the season it was opened from", async () => {
    seasonal.mockResolvedValue({ media: [] });
    renderWithProviders(<Seasonal />, { route: "/seasonal?season=SPRING&year=2019" });
    await waitFor(() => expect(seasonal).toHaveBeenCalled());
    expect(seasonal.mock.calls[0].slice(0, 2)).toEqual(["SPRING", 2019]);
  });

  it("leaves a bare URL bare: no replace, no new entry", async () => {
    seasonal.mockResolvedValue({ media: [] });
    renderWithProviders(
      <>
        <Seasonal />
        <Url />
      </>,
      { route: "/seasonal" },
    );
    const url = () => screen.getByTestId("url");
    const key = url().dataset.key;
    await act(async () => {});
    await waitFor(() => expect(seasonal).toHaveBeenCalled());
    const now = currentSeason();
    expect(seasonal.mock.calls[0].slice(0, 2)).toEqual([now.season, now.year]);
    expect(url()).toBeEmptyDOMElement();
    expect(url().dataset.key).toBe(key);
    expect(url().dataset.nav).toBe("POP");
  });

  it("writes explicit parameters for any other season, and a bare URL again on the way back", async () => {
    const user = userEvent.setup({ delay: null });
    seasonal.mockResolvedValue({ media: [] });
    renderWithProviders(
      <>
        <Seasonal />
        <Url />
      </>,
      { route: "/seasonal" },
    );
    const now = currentSeason();
    const order = ["WINTER", "SPRING", "SUMMER", "FALL"];
    const i = order.indexOf(now.season);
    const next = i === 3 ? `season=WINTER&year=${now.year + 1}` : `season=${order[i + 1]}&year=${now.year}`;

    await user.click(screen.getByRole("button", { name: "seasonal.next" }));
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(`?${next}`));
    expect(screen.getByTestId("url").dataset.nav).toBe("REPLACE");

    await user.click(screen.getByRole("button", { name: "seasonal.prev" }));
    await waitFor(() => expect(screen.getByTestId("url")).toBeEmptyDOMElement());
    expect(screen.getByTestId("url").dataset.nav).toBe("REPLACE");
  });
});

/** The location the page sits on: its search, the history entry's key and how it was reached. */
function Url() {
  const { search, key } = useLocation();
  const navigation = useNavigationType();
  return (
    <output data-testid="url" data-key={key} data-nav={navigation}>
      {search}
    </output>
  );
}
