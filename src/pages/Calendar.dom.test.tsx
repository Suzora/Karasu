import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useNavigate, type NavigateFunction } from "react-router";
import type { AiringSlot } from "@/api/queries";
import { forgetPlaces } from "@/lib/scrollMemory";
import { renderWithProviders, signIn, signOut } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  fetchMediaList: () => Promise.resolve({ lists: [] }),
}));

vi.mock("@/api/queries", async (orig) => ({
  ...(await orig<typeof import("@/api/queries")>()),
  airingWeek: (gt: number): Promise<AiringSlot[]> =>
    Promise.resolve([
      {
        id: 1,
        episode: 3,
        airingAt: gt + 3600,
        media: {
          id: 154587,
          type: "ANIME",
          title: { romaji: "Frieren", english: null, native: null },
          coverImage: { large: null },
          format: "TV",
          isAdult: false,
          genres: [],
        },
      } as unknown as AiringSlot,
    ]),
}));

import Calendar from "./Calendar";

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
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/media/:id" element={<p>title page</p>} />
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

describe("Calendar and Back", () => {
  it("returns to where the week was left when Back comes from a title it opened", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/calendar?lens=all" });

    const slot = await screen.findByRole("link", { name: /Frieren/ });
    const scroller = scrollerOf(slot);
    scroller.scrollTop = 640;
    fireEvent.scroll(scroller);

    await user.click(slot);
    expect(await screen.findByText("title page")).toBeInTheDocument();
    act(() => nav.go(-1));

    const again = await screen.findByRole("link", { name: /Frieren/ });
    await waitFor(() => expect(scrollerOf(again).scrollTop).toBe(640));
  });
});
