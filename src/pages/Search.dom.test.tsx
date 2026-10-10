import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type NavigateFunction } from "react-router";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders, signIn, signOut } from "@/test/render";

const browse = vi.fn();

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  browseMedia: (...args: unknown[]) => browse(...args),
  genreTagCollections: () => Promise.resolve({ genres: [], tags: [] }),
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

