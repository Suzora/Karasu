import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate, type NavigateFunction } from "react-router";
import type { ThreadPage, ThreadSummary } from "@/api/social";
import { forgetPlaces } from "@/lib/scrollMemory";
import { renderWithProviders, signIn, signOut } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  forumThreads: (): Promise<ThreadPage> =>
    Promise.resolve({
      pageInfo: { total: 1, currentPage: 1, lastPage: 1, hasNextPage: false },
      threads: [
        {
          id: 7,
          title: "Thread 7",
          replyCount: 0,
          viewCount: 0,
          likeCount: 0,
          isLiked: false,
          isLocked: false,
          isSticky: false,
          repliedAt: 0,
          createdAt: 0,
          siteUrl: null,
          user: null,
          replyUser: null,
          categories: null,
        } as ThreadSummary,
      ],
    }),
}));

import Forum from "./Forum";

const nav: { go: NavigateFunction } = { go: () => {} };

function Nav() {
  nav.go = useNavigate();
  return null;
}

/** Every history key the router has shown, in order: a replace mints a new one even when the URL stays the same. */
const keys: string[] = [];

function Probe() {
  const { key, pathname, search } = useLocation();
  useEffect(() => {
    if (keys[keys.length - 1] !== key) keys.push(key);
  }, [key]);
  return <output aria-label="where">{pathname + search}</output>;
}

function Harness() {
  return (
    <>
      <Nav />
      <Probe />
      <Routes>
        <Route path="/forum" element={<Forum />} />
        <Route path="/thread/:id" element={<p>thread page</p>} />
      </Routes>
    </>
  );
}

const scrollerOf = (el: HTMLElement) => el.closest<HTMLElement>(".overflow-y-auto")!;

const where = () => screen.getByRole("status", { name: "where" });

beforeEach(() => {
  keys.length = 0;
  signIn();
});

afterEach(() => {
  signOut();
  forgetPlaces();
});

describe("Forum and Back", () => {
  it("returns to where the threads were left when Back comes from a thread", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum" });

    const thread = await screen.findByRole("link", { name: /Thread 7/ });
    const scroller = scrollerOf(thread);
    scroller.scrollTop = 640;
    fireEvent.scroll(scroller);

    await user.click(thread);
    expect(await screen.findByText("thread page")).toBeInTheDocument();
    act(() => nav.go(-1));

    const again = await screen.findByRole("link", { name: /Thread 7/ });
    await waitFor(() => expect(scrollerOf(again).scrollTop).toBe(640));
  });

  it("returns to the place in a lens picked after the page opened", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum" });

    await screen.findByRole("link", { name: /Thread 7/ });
    await user.click(screen.getByRole("button", { name: "forum.lensSubscribed" }));
    const thread = await screen.findByRole("link", { name: /Thread 7/ });
    const scroller = scrollerOf(thread);
    scroller.scrollTop = 480;
    fireEvent.scroll(scroller);

    await user.click(thread);
    expect(await screen.findByText("thread page")).toBeInTheDocument();
    act(() => nav.go(-1));

    const again = await screen.findByRole("link", { name: /Thread 7/ });
    await waitFor(() => expect(scrollerOf(again).scrollTop).toBe(480));
  });

  it("opens another lens at its top, since the scroller outlives the lens", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum" });

    const scroller = scrollerOf(await screen.findByRole("link", { name: /Thread 7/ }));
    scroller.scrollTop = 640;
    fireEvent.scroll(scroller);

    await user.click(screen.getByRole("button", { name: "forum.lensSubscribed" }));
    await screen.findByRole("link", { name: /Thread 7/ });
    expect(scroller).toBeInTheDocument();
    expect(scroller.scrollTop).toBe(0);
  });
});

describe("Forum and its ?q=", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const settle = () => act(() => vi.advanceTimersByTimeAsync(1500));

  it("leaves a page that arrives with a ?q= on its own entry", async () => {
    renderWithProviders(<Harness />, { route: "/forum?q=x" });
    await screen.findByRole("link", { name: /Thread 7/ });
    await settle();
    expect(keys).toHaveLength(1);
    expect(where()).toHaveTextContent("/forum?q=x");
  });

  it("leaves a page that arrives with no query on its own entry", async () => {
    renderWithProviders(<Harness />, { route: "/forum" });
    await screen.findByRole("link", { name: /Thread 7/ });
    await settle();
    expect(keys).toHaveLength(1);
    expect(where()).toHaveTextContent(/^\/forum$/);
  });

  it("replaces once for a lens click, not again when the debounce settles", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum" });
    await screen.findByRole("link", { name: /Thread 7/ });
    await user.click(screen.getByRole("button", { name: "forum.lensSubscribed" }));
    await settle();
    expect(keys).toHaveLength(2);
    expect(where()).toHaveTextContent("/forum?lens=subscribed");
  });

  it("writes a typed term to ?q= once", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum" });
    await screen.findByRole("link", { name: /Thread 7/ });
    await user.click(screen.getByRole("button", { name: "forum.lensSearch" }));
    await user.type(screen.getByRole("searchbox", { name: "forum.searchPlaceholder" }), "frieren");
    await settle();
    expect(where()).toHaveTextContent("/forum?lens=search&q=frieren");
    expect(keys).toHaveLength(3);
    await settle();
    expect(keys).toHaveLength(3);
  });

  it("holds a typed term back while a dialog's history entry is open, then writes it", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Harness />, { route: "/forum?lens=search" });
    await user.type(await screen.findByRole("searchbox", { name: "forum.searchPlaceholder" }), "frieren");
    await user.click(screen.getByRole("button", { name: "forum.newThread" }));
    await settle();
    expect(where()).toHaveTextContent(/^\/forum\?lens=search$/);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(where()).toHaveTextContent("/forum?lens=search&q=frieren"));
    expect(keys).toHaveLength(2);
  });
});
