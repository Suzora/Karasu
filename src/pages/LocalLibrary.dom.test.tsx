import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useNavigate, type NavigateFunction } from "react-router";
import { forgetPlaces } from "@/lib/scrollMemory";
import { renderWithProviders, signIn, signOut } from "@/test/render";

// `isTauri` stays false, so the library store and the status queries stand down and the page draws its empty state.
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  fetchMediaList: () => Promise.resolve({ lists: [] }),
}));

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
