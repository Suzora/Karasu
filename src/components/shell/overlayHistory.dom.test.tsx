import { afterEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, useLocation } from "react-router";
import type { ReactNode } from "react";
import ActionHost from "./ActionHost";
import CommandPalette from "./CommandPalette";
import { afterBackSettles } from "@/hooks/useBackClose";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { entry, listResult, media } from "@/test/fixtures";

/** A navigation chosen in an overlay waits for that overlay's history entry to unwind, or Back lands on a dead entry. */

afterEach(() => {
  signOut();
});

/** Where the router stands, URL query included, since a restored search lives there. */
function Where() {
  const { pathname, search } = useLocation();
  return <output aria-label="where">{pathname + search}</output>;
}

const where = () => screen.getByRole("status", { name: "where" });

/** Until no overlay entry is open or unwinding, so a test starts on a page entry and never behind an earlier close. */
const settled = () => act(() => new Promise<void>((resolve) => afterBackSettles(resolve)));

/** The real browser history through the router the app uses, so an overlay's own entries sit in the same stack. */
function renderInHistory(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        {ui}
        <Where />
      </HashRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

/** The Search page as "/" and the Search action see it: its field inside `<main>`, holding a query. */
function SearchPage() {
  return (
    <main id="main" tabIndex={-1}>
      <input aria-label="search field" data-page-search="" defaultValue="frieren" />
    </main>
  );
}

/** Back from the chosen page must reach the entry the overlay opened over, never the overlay's own entry left behind. */
async function expectBackToStart(start: unknown) {
  act(() => window.history.back());
  await waitFor(() => expect(where()).toHaveTextContent(/^\/$/));
  expect(window.history.state).toEqual(start);
}

function openPalette() {
  act(() => {
    window.dispatchEvent(new Event("open-command-palette"));
  });
}

describe("CommandPalette and history", () => {
  it("pushes a chosen page once its own entry has unwound", async () => {
    const user = userEvent.setup({ delay: null });
    await settled();
    signIn();
    renderInHistory(<CommandPalette />);
    const start: unknown = window.history.state;
    openPalette();
    expect(window.history.state).toMatchObject({ karasuBack: expect.any(Number) });
    await user.type(screen.getByRole("combobox"), "nav.calendar{Enter}");
    await waitFor(() => expect(where()).toHaveTextContent("/calendar"));
    expect(window.history.state).not.toHaveProperty("karasuBack");
    await expectBackToStart(start);
  });

  /** A bare push of `/search` would reset the search the URL holds, so the command refines it instead. */
  it("focuses the open Search page's field for the Search command and stays on that search", async () => {
    const user = userEvent.setup({ delay: null });
    await settled();
    signIn();
    renderWithProviders(
      <>
        <CommandPalette />
        <SearchPage />
        <Where />
      </>,
      { route: "/search?q=frieren" },
    );
    openPalette();
    await user.type(screen.getByRole("combobox"), "nav.search");
    // The command and the screen share the label, and the command's group comes first, so Enter picks the verb.
    expect(screen.getByRole("group", { name: "palette.groupActions" })).toContainElement(
      screen.getByRole("option", { selected: true }),
    );
    await user.keyboard("{Enter}");
    const field = screen.getByRole<HTMLInputElement>("textbox", { name: "search field" });
    await waitFor(() => expect(field).toHaveFocus());
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 7]);
    expect(where()).toHaveTextContent("/search?q=frieren");
  });
});

describe("ActionHost and history", () => {
  /** A card as the emitters render one: identity only, and the list cache answers the rest. */
  function Card() {
    return (
      <div data-media-id="1" data-media-type="ANIME" data-media-title="Cowboy Bebop">
        Cowboy Bebop
      </div>
    );
  }

  it("opens a title from the menu once the menu's own entry has unwound", async () => {
    await settled();
    const viewer = signIn();
    const queryClient = renderInHistory(
      <>
        <ActionHost />
        <Card />
      </>,
    );
    queryClient.setQueryData(["mediaList", "ANIME", viewer.id], listResult([entry({ media: media({ id: 1 }) })]));
    const start: unknown = window.history.state;
    fireEvent.contextMenu(screen.getByText("Cowboy Bebop"), { clientX: 40, clientY: 40 });
    expect(window.history.state).toMatchObject({ karasuBack: expect.any(Number) });
    fireEvent.click(screen.getByRole("menuitem", { name: "ctx.open" }));
    await waitFor(() => expect(where()).toHaveTextContent("/media/1"));
    expect(window.history.state).not.toHaveProperty("karasuBack");
    await expectBackToStart(start);
  });

  it("focuses the open Search page's field for the menu's Search action", async () => {
    await settled();
    signIn();
    renderWithProviders(
      <>
        <ActionHost />
        <SearchPage />
        <Where />
      </>,
      { route: "/search?q=frieren" },
    );
    fireEvent.contextMenu(screen.getByRole("main"), { clientX: 40, clientY: 40 });
    fireEvent.click(screen.getByRole("menuitem", { name: "nav.search" }));
    const field = screen.getByRole<HTMLInputElement>("textbox", { name: "search field" });
    await waitFor(() => expect(field).toHaveFocus());
    expect(where()).toHaveTextContent("/search?q=frieren");
  });
});
