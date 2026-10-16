import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type NavigateFunction } from "react-router";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { media } from "@/test/fixtures";
import { useTheme } from "@/stores/theme";

const browse = vi.fn();
const sections = vi.fn();
const people = vi.fn();
const peoplePage = vi.fn();

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  browseMedia: (...args: unknown[]) => browse(...args),
  browseSections: (...args: unknown[]) => sections(...args),
  genreTagCollections: () => Promise.resolve({ genres: [], tags: [] }),
}));

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  browsePeople: (...args: unknown[]) => people(...args),
  browsePeoplePage: (...args: unknown[]) => peoplePage(...args),
}));

import Search from "./Search";

function Url() {
  const { search } = useLocation();
  return <output data-testid="url">{search}</output>;
}

beforeEach(() => {
  signIn();
  useContentFilter.setState({ level: "off", ready: true, error: null });
  browse.mockReset();
  browse.mockResolvedValue({ media: [], pageInfo: { hasNextPage: false } });
  sections.mockReset();
  sections.mockResolvedValue({});
  people.mockReset();
  people.mockResolvedValue({});
  peoplePage.mockReset();
});

afterEach(() => {
  signOut();
  useContentFilter.setState({ level: "strict", ready: false, error: null });
});

describe("Search in the URL", () => {
  it("brings back the query, the scope and a filter from the URL it returns to, without taking the focus", async () => {
    renderWithProviders(<Search />, { route: "/search?scope=MANGA&q=frieren&status=FINISHED" });

    const field = screen.getByRole("searchbox", { name: "search.placeholder" });
    expect(field).toHaveValue("frieren");
    expect(field).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "search.manga" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(browse).toHaveBeenCalled());
    const [type, filters] = browse.mock.calls[0];
    expect(type).toBe("MANGA");
    expect(filters).toMatchObject({ search: "frieren", status: "FINISHED" });
  });

  it("writes a picked scope into the URL and keeps the filters a flip does not touch", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search?scope=MANGA&format=NOVEL&status=FINISHED" },
    );

    await user.click(screen.getByRole("button", { name: "search.anime" }));

    // The format belongs to the other medium and goes; the status means the same for both and stays.
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^\?status=FINISHED$/));
  });

  it("keeps a format it arrives with, in the URL and in every request", async () => {
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search?scope=MANGA&q=frieren&format=NOVEL&status=FINISHED" },
    );
    await waitFor(() => expect(browse).toHaveBeenCalled());
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(screen.getByTestId("url")).toHaveTextContent("format=NOVEL");
    expect(browse.mock.calls.every(([, f]) => (f as { format?: string }).format === "NOVEL")).toBe(true);
  });

  it("takes the focus when reached by a link, so typing can start at once", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Go to="/search" />} />
        <Route path="/search" element={<Search />} />
      </Routes>,
    );
    await user.click(screen.getByRole("button", { name: "go" }));
    expect(await screen.findByRole("searchbox", { name: "search.placeholder" })).toHaveFocus();
  });
});

function Go({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  );
}

describe("Search on the way back", () => {
  const nav: { go: NavigateFunction } = { go: () => {} };
  function Nav() {
    nav.go = useNavigate();
    return null;
  }
  // A cache that outlives the page, as the app's does; the shared test client drops a query the moment it unmounts.
  function app() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/search?q=frieren"]}>
          <Nav />
          <Routes>
            <Route path="/search" element={<Search />} />
            <Route path="/media/:id" element={<p>title</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    return client;
  }

  afterEach(() => vi.useRealTimers());

  it("shows the pages it had without asking again, however old they are", async () => {
    app();
    await waitFor(() => expect(browse).toHaveBeenCalledTimes(1));
    act(() => nav.go("/media/1"));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    act(() => nav.go(-1));
    await screen.findByRole("searchbox", { name: "search.placeholder" });
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(browse).toHaveBeenCalledTimes(1);
  });

  it("shows the pages it had on Back to another entry of the page it is already on", async () => {
    app();
    await waitFor(() => expect(browse).toHaveBeenCalledTimes(1));
    // A link to the bare page keeps this component mounted and points its observer at another key.
    act(() => nav.go("/search"));
    await waitFor(() => expect(screen.getByRole("searchbox", { name: "search.placeholder" })).toHaveValue(""));
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    act(() => nav.go(-1));
    await waitFor(() => expect(screen.getByRole("searchbox", { name: "search.placeholder" })).toHaveValue("frieren"));
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(browse).toHaveBeenCalledTimes(1);
  });

  it("asks again once something marked the search out of date while it was away", async () => {
    const client = app();
    await waitFor(() => expect(browse).toHaveBeenCalledTimes(1));
    act(() => nav.go("/media/1"));
    await act(() => client.invalidateQueries());
    act(() => nav.go(-1));
    await waitFor(() => expect(browse).toHaveBeenCalledTimes(2));
  });
});

/** Nine filters stood open over the results on the desktop; they fold behind one control there as on the phone. */
describe("Search filters", () => {
  it("folds the filters behind one control that counts what is active", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Search />, { route: "/search?status=FINISHED" });
    expect(screen.queryByRole("combobox", { name: "search.statusLabel" })).toBeNull();
    const toggle = screen.getByRole("button", { name: /search\.filters/ });
    expect(toggle).toHaveTextContent("(1)");
    await user.click(toggle);
    expect(await screen.findByRole("combobox", { name: "search.statusLabel" })).toHaveValue("FINISHED");
  });
});


const title = (id: number, name: string, over: Record<string, unknown> = {}) =>
  ({ ...media({ id, title: { romaji: name, english: name, native: null } }), mediaListEntry: null, ...over });
const page = (...items: unknown[]) => ({ media: items });
const person = (id: number, name: string, favourites: number) => ({ id, name: { full: name }, image: null, favourites });

/** AniList's own search page shows these with nothing typed; Karasu shows them from one cached request a medium. */
describe("Search with nothing typed", () => {
  it("shows a medium's sections in AniList's order, each with a way to everything it samples", async () => {
    sections.mockResolvedValue({
      trending: page(title(1, "Trend One")),
      season: page(title(2, "Season One")),
      nextSeason: page(title(3, "Next One")),
      popular: page(title(4, "Popular One")),
      top: page(title(5, "Top One", { popularity: 490000 })),
    });
    renderWithProviders(<Search />, { route: "/search" });

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "search.browseTrending",
      "search.browseSeason",
      "search.browseNextSeason",
      "search.browsePopular",
      "search.browseTop",
    ]);
    expect(screen.getAllByRole("link", { name: /dashboard\.showAll/ })).toHaveLength(5);
    expect(screen.getByRole("link", { name: /#1/ })).toHaveTextContent("Top One");
    // The lens chips went with the sections, which open the same views.
    expect(screen.queryByRole("button", { name: /search\.chip/ })).toBeNull();
    expect(sections).toHaveBeenCalledTimes(1);
    expect(sections.mock.calls[0][0]).toBe("ANIME");
    expect(browse).not.toHaveBeenCalled();
  });

  it("shows manga its own sections, with no season among them", async () => {
    sections.mockResolvedValue({ trending: page(title(1, "A")), popular: page(title(2, "B")), manhwa: page(title(3, "C")), top: page(title(4, "D")) });
    renderWithProviders(<Search />, { route: "/search?scope=MANGA" });
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["search.browseTrending", "search.browsePopular", "search.browseManhwa", "search.browseTop"]);
    expect(sections.mock.calls[0][0]).toBe("MANGA");
  });

  it("hides what the content filter hides, counts a title in two sections once, and keeps AniList's ranks", async () => {
    useContentFilter.setState({ level: "strict", ready: true, error: null });
    const ecchi = title(9, "Hidden", { genres: ["Ecchi"] });
    sections.mockResolvedValue({
      trending: page(ecchi, title(1, "Shown")),
      top: page(title(5, "First"), ecchi, title(6, "Third")),
    });
    renderWithProviders(<Search />, { route: "/search" });

    await screen.findByText("Shown");
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByText(/list\.hiddenSuggestive/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /#1/ })).toHaveTextContent("First");
    expect(screen.getByRole("link", { name: /#3/ })).toHaveTextContent("Third");
    expect(screen.queryByRole("link", { name: /#2/ })).toBeNull();
  });

  it("opens a section's Show all as the paged grid under its name, with the way back", async () => {
    const user = userEvent.setup({ delay: null });
    sections.mockResolvedValue({ trending: page(title(1, "Trend One")) });
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search" },
    );

    await user.click(await screen.findByRole("link", { name: /search\.browseTrending/ }));
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^\?sort=TRENDING_DESC$/));
    await waitFor(() => expect(browse).toHaveBeenCalled());
    expect(browse.mock.calls[0][1]).toMatchObject({ sort: "TRENDING_DESC", search: undefined });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("search.browseTrending");

    await user.click(screen.getByRole("link", { name: "search.browseBack" }));
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^$/));
    expect(await screen.findAllByRole("heading", { level: 2 })).toHaveLength(1);
  });

  /** The old lenses set the sort alone, which counted as no filter, so three of the four fetched nothing at all. */
  it("browses a chosen sort with nothing typed, naming the section it is", async () => {
    renderWithProviders(<Search />, { route: "/search?scope=MANGA&sort=SCORE_DESC" });
    await waitFor(() => expect(browse).toHaveBeenCalled());
    expect(browse.mock.calls[0][0]).toBe("MANGA");
    expect(browse.mock.calls[0][1]).toMatchObject({ sort: "SCORE_DESC" });
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("search.browseTop");
    expect(sections).not.toHaveBeenCalled();
  });

  it("names no section once a Show all is refined", async () => {
    renderWithProviders(<Search />, { route: "/search?sort=TRENDING_DESC&genre=Drama" });
    await waitFor(() => expect(browse).toHaveBeenCalled());
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("shows characters today's birthdays and the most favourited, and staff theirs from the same answer", async () => {
    const user = userEvent.setup({ delay: null });
    people.mockResolvedValue({
      characterBirthdays: { characters: [person(1, "Kenma Kozume", 9943)] },
      characterFavourites: { characters: [person(2, "Satoru Gojou", 39511)] },
      staffBirthdays: { staff: [person(3, "Akari Kitou", 4943)] },
      staffFavourites: { staff: [person(4, "Kenjirou Tsuda", 20117)] },
    });
    renderWithProviders(<Search />, { route: "/search?scope=CHARACTERS" });

    expect(await screen.findByRole("link", { name: /Kenma Kozume/ })).toHaveAttribute("href", "/character/1");
    expect(screen.getByRole("link", { name: /Satoru Gojou/ })).toHaveTextContent("40k");
    // The heart is drawn, so the count says what it counts to a screen reader.
    expect(screen.getByRole("link", { name: /Satoru Gojou.*detail\.favorites/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "search.browseFavouriteCharacters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "search.staffScope" }));
    expect(await screen.findByRole("link", { name: /Akari Kitou/ })).toHaveAttribute("href", "/staff/3");
    expect(screen.getByRole("heading", { name: "search.browseFavouriteStaff" })).toBeInTheDocument();
    // One answer serves both scopes, keyed by AniList's day.
    expect(people).toHaveBeenCalledTimes(1);
    expect(people.mock.calls[0][0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("opens a people section's Show all as a list that pages on a button", async () => {
    const user = userEvent.setup({ delay: null });
    peoplePage
      .mockResolvedValueOnce({ pageInfo: { hasNextPage: true }, rows: [person(2, "Satoru Gojou", 39511)] })
      .mockResolvedValueOnce({ pageInfo: { hasNextPage: false }, rows: [person(5, "Levi", 38900)] });
    renderWithProviders(<Search />, { route: "/search?scope=CHARACTERS&browse=favourites" });

    expect(await screen.findByRole("link", { name: /Satoru Gojou/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("search.browseFavouriteCharacters");
    expect(peoplePage).toHaveBeenCalledWith("character", "favourites", 1);
    expect(people).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    expect(await screen.findByRole("link", { name: /Levi/ })).toBeInTheDocument();
    expect(peoplePage).toHaveBeenLastCalledWith("character", "favourites", 2);
  });

  it("drops the year on the way to manga, which has no season year to filter on", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search?year=2026&season=FALL&sort=POPULARITY_DESC" },
    );
    await user.click(screen.getByRole("button", { name: "search.manga" }));
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^\?scope=MANGA&sort=POPULARITY_DESC$/));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("search.browsePopular");
  });

  /** The sections have no sort, and a select that already showed Popularity could never be picked to open its grid. */
  it("shows the sections' sort as Relevance, so every other sort opens its grid", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search" },
    );
    await user.click(screen.getByRole("button", { name: /search\.filters/ }));
    const select = await screen.findByRole("combobox", { name: "list.sortLabel" });
    expect(select).toHaveValue("SEARCH_MATCH");
    await user.selectOptions(select, "POPULARITY_DESC");
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^\?sort=POPULARITY_DESC$/));
    expect(await screen.findByRole("heading", { level: 2, name: "search.browsePopular" })).toBeInTheDocument();
  });

  it("keeps a section's grid and its one request while a single character is typed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<Search />, { route: "/search?sort=TRENDING_DESC" });
      await waitFor(() => expect(browse).toHaveBeenCalledTimes(1));
      await user.type(screen.getByRole("searchbox", { name: "search.placeholder" }), "f");
      await act(() => vi.advanceTimersByTimeAsync(600));
      expect(browse).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("search.browseTrending");
    } finally {
      vi.useRealTimers();
    }
  });

  /** One character searched nothing, yet it once switched a filtered grid to relevance and asked for it again. */
  it("keeps a filtered grid's sort and its one request while a single character is typed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
      renderWithProviders(<Search />, { route: "/search?status=FINISHED" });
      await waitFor(() => expect(browse).toHaveBeenCalledTimes(1));
      await user.type(screen.getByRole("searchbox", { name: "search.placeholder" }), "f");
      await act(() => vi.advanceTimersByTimeAsync(600));
      expect(browse.mock.calls.map(([, f]) => (f as { sort: string }).sort)).toEqual(["POPULARITY_DESC"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("dates a manga in the top list by the year it started, since a manga has no season", async () => {
    sections.mockResolvedValue({
      top: page(title(4, "D", { type: "MANGA", format: "MANGA", season: null, seasonYear: null, startDate: { year: 1989 } })),
    });
    renderWithProviders(<Search />, { route: "/search?scope=MANGA" });
    expect(await screen.findByRole("link", { name: /#1/ })).toHaveTextContent("1989");
  });

  /** The notice says what the screen left out, so a hidden title past the covers a row draws is not in it. */
  it("counts no hidden title past the covers a row draws", async () => {
    const cols = useTheme.getState().coverCols;
    useContentFilter.setState({ level: "strict", ready: true, error: null });
    useTheme.setState({ coverCols: 2 });
    try {
      sections.mockResolvedValue({ trending: page(title(1, "A"), title(2, "B"), title(9, "X", { genres: ["Ecchi"] })) });
      renderWithProviders(<Search />, { route: "/search" });
      await screen.findByText("A");
      expect(screen.queryByText(/list\.hiddenSuggestive/)).toBeNull();
    } finally {
      useTheme.setState({ coverCols: cols });
    }
  });

  it("says a term is too short rather than showing the sections as its answer", async () => {
    renderWithProviders(<Search />, { route: "/search?q=K" });
    expect(await screen.findByText("search.prompt")).toBeInTheDocument();
    expect(sections).not.toHaveBeenCalled();
  });

  it("says a name is too short rather than showing the people sections as its answer", async () => {
    renderWithProviders(<Search />, { route: "/search?scope=CHARACTERS&q=Ai" });
    expect(await screen.findByText("search.entityPrompt")).toBeInTheDocument();
    expect(people).not.toHaveBeenCalled();
  });

  /** The page and its sections read the season once between them, or a season's turn names one grid after another. */
  it("names a section after the season the page opened in, across a season's turn", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(2026, 8, 30, 23, 59));
      const user = userEvent.setup({ delay: null });
      sections.mockResolvedValue({ trending: page(title(1, "T")), season: page(title(2, "S")), nextSeason: page(title(3, "N")) });
      renderWithProviders(<Search />, { route: "/search" });
      await screen.findByRole("link", { name: /search\.browseSeason/ });
      vi.setSystemTime(new Date(2026, 9, 1, 0, 1));
      await user.click(screen.getByRole("link", { name: /search\.browseTrending/ }));
      await user.click(await screen.findByRole("link", { name: "search.browseBack" }));
      await user.click(await screen.findByRole("link", { name: /search\.browseSeason/ }));
      expect(await screen.findByRole("heading", { level: 2, name: "search.browseSeason" })).toBeInTheDocument();
      expect(sections.mock.calls.every(([, now]) => (now as { season: string }).season === "SUMMER")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops a people list on the way to a medium", async () => {
    const user = userEvent.setup({ delay: null });
    peoplePage.mockResolvedValue({ pageInfo: { hasNextPage: false }, rows: [] });
    renderWithProviders(
      <>
        <Search />
        <Url />
      </>,
      { route: "/search?scope=STAFF&browse=birthdays" },
    );
    await user.click(screen.getByRole("button", { name: "search.anime" }));
    await waitFor(() => expect(screen.getByTestId("url")).toHaveTextContent(/^$/));
  });
});
