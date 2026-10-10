import { afterEach, describe, expect, it } from "vitest";
import { useRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from "react-router";
import { forgetPlaces, placeCount } from "@/lib/scrollMemory";
import { useScrollMemory, type PlaceReader } from "./useScrollMemory";

const nav: { go: NavigateFunction } = { go: () => {} };

function Nav() {
  nav.go = useNavigate();
  return null;
}

function Page({ name, reader }: { name: string; reader?: PlaceReader }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMemory(ref, "page", reader);
  return <div ref={ref} data-testid={`scroller-${name}`} />;
}

// Keyed per route, as `<main>` is in the app, so each visit is a fresh scroller at the top.
function app(reader?: PlaceReader) {
  return (
    <MemoryRouter initialEntries={["/a"]}>
      <Nav />
      <Routes>
        <Route path="/a" element={<Page key="a" name="a" reader={reader} />} />
        <Route path="/b" element={<Page key="b" name="b" />} />
      </Routes>
    </MemoryRouter>
  );
}

function scrollTo(name: string, top: number) {
  const el = screen.getByTestId(`scroller-${name}`);
  el.scrollTop = top;
  fireEvent.scroll(el);
}

// Several frames, so a restore that was going to happen has had its chance.
const frames = () => act(() => new Promise((r) => setTimeout(r, 80)));

afterEach(forgetPlaces);

describe("useScrollMemory", () => {
  it("brings a page back to where it was left when Back returns to it", async () => {
    render(app());
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    expect(screen.getByTestId("scroller-b").scrollTop).toBe(0);
    act(() => nav.go(-1));
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(640));
  });

  it("opens a page reached by a link at its top, however it was left before", async () => {
    render(app());
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    act(() => nav.go("/a"));
    await frames();
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
  });

  it("keeps the place across the page's own URL replace", async () => {
    render(app());
    scrollTo("a", 300);
    act(() => nav.go("/a?q=x", { replace: true }));
    act(() => nav.go("/b"));
    act(() => nav.go(-1));
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(300));
  });

  it("gives the page back to a reader who starts scrolling before the place can be reached", async () => {
    let ready = false;
    const reader: PlaceReader = { read: (el) => el.scrollTop, offset: (place) => (ready ? place : null) };
    render(app(reader));
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    act(() => nav.go(-1));
    fireEvent.wheel(screen.getByTestId("scroller-a"));
    ready = true;
    await frames();
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
  });

  it("brings each entry of an open page back to its own place, and a link to the open page starts at the top", async () => {
    render(app());
    scrollTo("a", 640);
    act(() => nav.go("/a?view=2"));
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(0));
    scrollTo("a", 100);
    act(() => nav.go(-1));
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(640));
    act(() => nav.go(1));
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(100));
  });

  it("ends a restore at a press anywhere, since a tab or a filter outside the scroller changes what it aims at", async () => {
    let ready = false;
    const reader: PlaceReader = { read: (el) => el.scrollTop, offset: (place) => (ready ? place : null) };
    render(app(reader));
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    act(() => nav.go(-1));
    fireEvent.pointerDown(document.body);
    ready = true;
    await frames();
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
  });

  it("ends a restore when the page replaces its own URL", async () => {
    let ready = false;
    const reader: PlaceReader = { read: (el) => el.scrollTop, offset: (place) => (ready ? place : null) };
    render(app(reader));
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    act(() => nav.go(-1));
    act(() => nav.go("/a?tab=2", { replace: true }));
    ready = true;
    await frames();
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
  });

  it("restores a reader that cannot measure at first, once it can", async () => {
    let ready = false;
    const reader: PlaceReader = { read: (el) => el.scrollTop, offset: (place) => (ready ? place : null) };
    render(app(reader));
    scrollTo("a", 640);
    act(() => nav.go("/b"));
    act(() => nav.go(-1));
    // Several frames with nothing measurable, so a restore that gave up at the first null would show here.
    await frames();
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
    ready = true;
    await waitFor(() => expect(screen.getByTestId("scroller-a").scrollTop).toBe(640));
  });

  it("remembers nothing for a replace on a scroller that never moved", async () => {
    render(app());
    act(() => nav.go("/a?tab=2", { replace: true }));
    act(() => nav.go("/b"));
    scrollTo("b", 300);
    act(() => nav.go(-1));
    await frames();
    // Nothing was remembered for the replaced entry, so Back leaves the fresh scroller where it starts.
    expect(screen.getByTestId("scroller-a").scrollTop).toBe(0);
    expect(placeCount()).toBe(1);
  });
});

