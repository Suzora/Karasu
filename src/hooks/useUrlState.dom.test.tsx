import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { HashRouter, MemoryRouter, useLocation, useNavigate, useNavigationType, type NavigateFunction } from "react-router";
import { useBackClose } from "./useBackClose";
import { useUrlState } from "./useUrlState";

const parse = (p: URLSearchParams) => p.get("q") ?? "";
const write = (prev: URLSearchParams, q: string) => {
  const p = new URLSearchParams(prev);
  if (q) p.set("q", q);
  else p.delete("q");
  return p;
};

const api: { set: (q: string) => void; navigate: NavigateFunction } = {
  set: () => {},
  navigate: () => {},
};

function Page() {
  const [q, setQ, visit] = useUrlState(parse, write);
  const location = useLocation();
  const navigation = useNavigationType();
  api.set = setQ;
  api.navigate = useNavigate();
  return <div data-testid="out">{`${q}|${visit}|${location.search}|${navigation}`}</div>;
}

function Overlay({ open }: { open: boolean }) {
  useBackClose(open, () => {});
  return null;
}

// Two names the writer always puts in one order, and one name whose values it sorts.
const parsePair = (p: URLSearchParams) => ({ a: p.get("a") ?? "", b: p.get("b") ?? "", g: p.getAll("g") });
const writePair = (prev: URLSearchParams, v: { a: string; b: string; g: string[] }) => {
  const p = new URLSearchParams(prev);
  for (const key of ["a", "b", "g"]) p.delete(key);
  if (v.a) p.append("a", v.a);
  if (v.b) p.append("b", v.b);
  for (const g of [...v.g].sort()) p.append("g", g);
  return p;
};

function Pair() {
  useUrlState(parsePair, writePair);
  const location = useLocation();
  const navigation = useNavigationType();
  return <div data-testid="out">{`${location.search}|${navigation}`}</div>;
}

const out = () => screen.getByTestId("out").textContent;

describe("useUrlState", () => {
  // The hash router tests leave a numeric `idx` in the browser's state, which a memory router's page would then trust.
  beforeEach(() => window.history.replaceState(null, "", "/"));

  it("reads the URL it arrives with and writes nothing on arrival", () => {
    render(
      <MemoryRouter initialEntries={["/search?q=frieren"]}>
        <Page />
      </MemoryRouter>,
    );
    expect(out()).toBe("frieren|0|?q=frieren|POP");
  });

  it("leaves an arrival URL alone when only the order of its names differs from what the writer would give", () => {
    render(
      <MemoryRouter initialEntries={["/search?b=2&a=1"]}>
        <Pair />
      </MemoryRouter>,
    );
    expect(out()).toBe("?b=2&a=1|POP");
  });

  it("still rewrites an arrival URL whose repeated values the writer would order differently", () => {
    render(
      <MemoryRouter initialEntries={["/search?g=B&g=A"]}>
        <Pair />
      </MemoryRouter>,
    );
    expect(out()).toBe("?g=A&g=B|REPLACE");
  });

  it("mirrors a change into the URL by replacing the entry", () => {
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <Page />
      </MemoryRouter>,
    );
    act(() => api.set("mob"));
    expect(out()).toBe("mob|0|?q=mob|REPLACE");
  });

  it("waits out an overlay's history entry, then writes the latest value once", async () => {
    window.history.replaceState({ usr: null, key: "search-entry", idx: 0 }, "", "#/search");
    const { rerender } = render(
      <HashRouter>
        <Page />
        <Overlay open />
      </HashRouter>,
    );
    const replace = vi.spyOn(window.history, "replaceState");
    act(() => api.set("a"));
    act(() => api.set("b"));
    // The state moves at once; only the URL waits, since a replace now would overwrite the overlay's entry.
    expect(out()).toBe("b|0||POP");
    expect(replace).not.toHaveBeenCalled();

    rerender(
      <HashRouter>
        <Page />
        <Overlay open={false} />
      </HashRouter>,
    );
    await waitFor(() => expect(window.location.hash).toBe("#/search?q=b"));
    expect(replace).toHaveBeenCalledTimes(1);
    replace.mockRestore();
  });

  it("takes the URL of a new visit by link, and of another entry by Back, and counts each", () => {
    render(
      <MemoryRouter initialEntries={["/search?q=first"]}>
        <Page />
      </MemoryRouter>,
    );
    act(() => api.navigate("/search?q=second"));
    expect(out()).toBe("second|1|?q=second|PUSH");
    act(() => api.navigate(-1));
    expect(out()).toBe("first|2|?q=first|POP");
  });

  it("drops a write once the browser has moved to an entry the page has not shown, rather than replacing that entry", () => {
    window.history.replaceState({ usr: null, key: "search-entry", idx: 0 }, "", "#/search");
    render(
      <HashRouter>
        <Page />
      </HashRouter>,
    );
    // A link's push that React has not committed yet: the browser is on the title's entry, the page still on Search.
    window.history.pushState({ usr: null, key: "title-entry", idx: 1 }, "", "#/media/1");
    act(() => api.set("frieren"));
    expect(window.location.hash).toBe("#/media/1");
    expect((window.history.state as { key: string }).key).toBe("title-entry");
  });

  it("writes through the hash router onto the entry the page shows", () => {
    window.history.replaceState({ usr: null, key: "search-entry", idx: 0 }, "", "#/search");
    render(
      <HashRouter>
        <Page />
      </HashRouter>,
    );
    act(() => api.set("frieren"));
    expect(window.location.hash).toBe("#/search?q=frieren");
    act(() => api.set("mob"));
    expect(window.location.hash).toBe("#/search?q=mob");
  });
});

