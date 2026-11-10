import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useNavigate, type NavigateFunction } from "react-router";
import { forgetPlaces } from "@/lib/scrollMemory";
import { renderWithProviders, signIn, signOut } from "@/test/render";

// `isTauri` stays false, so the library store and the status queries stand down and the page draws its empty state.
const list = vi.hoisted(() => vi.fn());
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  fetchMediaList: list,
}));

const scan = vi.hoisted(() => vi.fn());
vi.mock("@/api/library", async (orig) => ({
  ...(await orig<typeof import("@/api/library")>()),
  scanLibrary: scan,
}));

import { useToast } from "@/stores/toast";
import LocalLibrary from "./LocalLibrary";

const nav: { go: NavigateFunction } = { go: () => {} };

function Nav() {
  nav.go = useNavigate();
  return null;
}

function Harness() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/library" element={<LocalLibrary />} />
        <Route path="/settings" element={<p>settings page</p>} />
      </Routes>
    </>
  );
}

const scrollerOf = (el: HTMLElement) => el.closest<HTMLElement>(".overflow-y-auto")!;

beforeEach(() => {
  list.mockResolvedValue({ lists: [] });
  signIn();
});

afterEach(() => {
  signOut();
  forgetPlaces();
});

describe("Local library and Back", () => {
  it("returns to where the page was left when Back comes from a page it linked to", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/library" });

    const link = await screen.findByRole("link", { name: "library.toSettings" });
    const scroller = scrollerOf(link);
    scroller.scrollTop = 640;
    fireEvent.scroll(scroller);

    await user.click(link);
    expect(await screen.findByText("settings page")).toBeInTheDocument();
    act(() => nav.go(-1));

    const again = await screen.findByRole("link", { name: "library.toSettings" });
    await waitFor(() => expect(scrollerOf(again).scrollTop).toBe(640));
  });
});

describe("Local library's column", () => {
  it("keeps the folder and the rescan in the column even while the library is empty, with nothing to jump to", async () => {
    renderWithProviders(<Harness />, { route: "/library" });
    await screen.findByRole("link", { name: "library.toSettings" });
    const column = screen.getByRole("complementary");
    expect(within(column).getByRole("button", { name: /settings\.libraryScan/ })).toBeInTheDocument();
    expect(within(column).getByRole("button", { name: "library.change" })).toBeInTheDocument();
    expect(within(column).queryByRole("navigation")).toBeNull();
  });

  it("says so when a rescan fails, and stays quiet about a folder that was never set", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/library" });
    const button = await screen.findByRole("button", { name: /settings\.libraryScan/ });

    scan.mockRejectedValueOnce("No library folder set");
    await user.click(button);
    await waitFor(() => expect(scan).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).toBeEnabled());
    expect(useToast.getState().toast).toBeNull();

    scan.mockRejectedValueOnce("Cannot read the library folder");
    await user.click(button);
    await waitFor(() => expect(useToast.getState().toast?.text).toBe("library.scanFailed"));
  });

  it("says that part of it failed to load, where a failed list read used to look like an empty library", async () => {
    list.mockRejectedValue("AniList is unreachable");
    renderWithProviders(<Harness />, { route: "/library" });
    expect(await screen.findByRole("alert")).toHaveTextContent("library.partFailed");
  });
});
