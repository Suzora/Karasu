import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link } from "react-router";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { entry, listResult, media } from "@/test/fixtures";
import { signIn } from "@/test/render";
import MediaList from "./MediaList";

/** The header against a real browser history: a panel's choice must reach the URL without costing a back press. */

vi.mock("@/api/anilist", async (original) => ({
  ...(await original<typeof import("@/api/anilist")>()),
  fetchMediaList: vi.fn(async () =>
    listResult([
      entry({ id: 1, media: media({ id: 1, format: "TV" }) }),
      entry({ id: 2, media: media({ id: 2, format: "MOVIE" }) }),
    ]),
  ),
  flushQueue: vi.fn(async () => {}),
}));

function page(url: string, beside?: ReactNode) {
  window.history.replaceState(null, "", "/start");
  window.history.pushState(null, "", url);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <MediaList type="ANIME" />
        {beside}
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

/** Past every pending history traversal; jsdom delivers a `back()` a task later, as a browser does. */
const onPanelEntry = () => (window.history.state as { karasuBack?: number } | null)?.karasuBack !== undefined;
const chips = () => screen.queryByRole("group", { name: "list.activeFilters" });

beforeEach(() => {
  document.documentElement.setAttribute("data-reduce-motion", "");
  signIn();
});
afterEach(async () => {
  vi.useRealTimers();
  cleanup();
  document.documentElement.removeAttribute("data-reduce-motion");
  await waitFor(() => {
    if (onPanelEntry()) throw new Error("a panel's history entry is still unwinding");
  });
});

describe("MediaList header", () => {
  /** A replace while the panel's entry is on top would overwrite it, and the next back would undo the filter. */
  it("writes a panel's filter on close and leaves back to leave the page", async () => {
    page("/list");
    fireEvent.click(await screen.findByRole("button", { name: "list.filters" }));
    fireEvent.click(screen.getByRole("button", { name: "format.TV" }));
    // Drawn at once from the draft, before the URL has it.
    expect(within(chips()!).getByRole("button", { name: /format\.TV/ })).toBeInTheDocument();
    expect(window.location.search).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "common.done" }));
    await waitFor(() => expect(window.location.search).toBe("?format=TV"));
    expect(onPanelEntry()).toBe(false);
    window.history.back();
    await waitFor(() => expect(window.location.pathname).toBe("/start"));
  });

  it("lets a chip pressed as the panel closes win over the panel's own choice", async () => {
    page("/list");
    fireEvent.click(await screen.findByRole("button", { name: "list.filters" }));
    fireEvent.click(screen.getByRole("button", { name: "format.TV" }));
    const chip = within(chips()!).getByRole("button", { name: /format\.TV/ });
    fireEvent.pointerDown(chip);
    fireEvent.click(chip);
    await waitFor(() => expect(chips()).toBeNull());
    expect(window.location.search).toBe("");
  });

  it("finds in the list on Ctrl+F even on an empty tab, and not under an open panel", async () => {
    page("/list?tab=PAUSED");
    const search = await screen.findByRole("searchbox", { name: "list.searchLabel" });
    fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    expect(search).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "list.filters" }));
    const panel = screen.getByRole("dialog", { name: "list.filters" });
    await waitFor(() => expect(panel).toContainElement(document.activeElement as HTMLElement));
    fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    expect(panel).toContainElement(document.activeElement as HTMLElement);
  });

  /** An empty tab is a fact about the list; blaming the filter for it would send the user hunting for a cause. */
  it("calls an empty tab empty even while a filter is set", async () => {
    page("/list?tab=PAUSED&format=TV");
    expect(await screen.findByText(/^list\.emptyTab:/)).toBeInTheDocument();
    expect(screen.queryByText(/^list\.noMatch/)).toBeNull();
  });

  it("clears every filter and the search from the no-match state", async () => {
    page("/list?format=OVA&q=zzz");
    fireEvent.click(await screen.findByRole("button", { name: "list.clearFilter" }));
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(screen.getByRole("searchbox", { name: "list.searchLabel" })).toHaveValue("");
  });
});

describe("MediaList text filter", () => {
  const field = () => screen.getByRole("searchbox", { name: "list.searchLabel" });
  const toList = <Link to="/list">open list</Link>;
  /** Past the 500 ms debounce, on a clock the test owns; installed after the list drew so the query is not faked. */
  const settle = () => act(() => vi.advanceTimersByTimeAsync(600));
  const clock = () => vi.useFakeTimers({ shouldAdvanceTime: true });

  it("writes what is typed into ?q= once, after typing settles", async () => {
    page("/list");
    await screen.findByRole("searchbox", { name: "list.searchLabel" });
    clock();
    const replace = vi.spyOn(window.history, "replaceState");
    await userEvent.setup({ delay: null }).type(field(), "fri");
    expect(window.location.search).toBe("");
    await settle();
    expect(window.location.search).toBe("?q=fri");
    expect(replace.mock.calls.filter(([, , url]) => String(url).includes("q=fri"))).toHaveLength(1);
    replace.mockRestore();
  });

  /** The page's own replace changes what the router hands out; the debounce must keep the time it had. */
  it("does not restart the typing debounce when another control writes the URL", async () => {
    page("/list");
    await screen.findByRole("searchbox", { name: "list.searchLabel" });
    clock();
    await userEvent.setup({ delay: null }).type(field(), "fri");
    await act(() => vi.advanceTimersByTimeAsync(250));
    fireEvent.click(screen.getByRole("tab", { name: /status\.ANIME\.PAUSED/ }));
    await waitFor(() => expect(window.location.search).toBe("?tab=PAUSED"));
    await act(() => vi.advanceTimersByTimeAsync(280));
    expect(window.location.search).toContain("q=fri");
  });

  it("starts a link to the open list without the text typed on the entry it left", async () => {
    page("/list?q=x", toList);
    await waitFor(() => expect(field()).toHaveValue("x"));
    clock();
    fireEvent.click(screen.getByRole("link", { name: "open list" }));
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(field()).toHaveValue("");
    // The old text must not come back through the debounce, which the navigation itself used to re-arm.
    await settle();
    expect(window.location.search).toBe("");
    expect(field()).toHaveValue("");
  });

  it("brings the text back with Back, and leaves that entry's URL as it was", async () => {
    page("/list?q=x", toList);
    await waitFor(() => expect(field()).toHaveValue("x"));
    clock();
    fireEvent.click(screen.getByRole("link", { name: "open list" }));
    await waitFor(() => expect(field()).toHaveValue(""));
    await settle();
    act(() => window.history.back());
    await waitFor(() => expect(window.location.search).toBe("?q=x"));
    expect(field()).toHaveValue("x");
    await settle();
    expect(window.location.search).toBe("?q=x");
  });

  /** The sidebar's push, typing on the new entry, then Back: the first entry must not be written into. */
  it("does not carry text typed on one entry into the entry Back returns to", async () => {
    page("/list?tab=PLANNING", toList);
    await screen.findByRole("searchbox", { name: "list.searchLabel" });
    clock();
    fireEvent.click(screen.getByRole("link", { name: "open list" }));
    await waitFor(() => expect(window.location.search).toBe(""));
    await userEvent.setup({ delay: null }).type(field(), "fri");
    await settle();
    expect(window.location.search).toBe("?q=fri");
    act(() => window.history.back());
    await waitFor(() => expect(window.location.search).toBe("?tab=PLANNING"));
    expect(field()).toHaveValue("");
    await settle();
    expect(window.location.search).toBe("?tab=PLANNING");
  });
});
