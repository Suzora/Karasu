import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { useViewTransitions } from "./useViewTransitions";
import { renderWithProviders } from "@/test/render";
import { usePlatform, type PlatformInfo } from "@/stores/platform";

// Inside the app, which is the only place the platform's answer gates anything.
vi.mock("@/api/anilist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const platform = (viewTransitions: boolean): PlatformInfo => ({
  os: "linux",
  appImage: true,
  flatpak: false,
  storeUpdates: false,
  viewTransitions,
});

function Links() {
  useViewTransitions();
  const { pathname } = useLocation();
  return (
    <>
      <output>{pathname}</output>
      {/* Stands in for a link that closes its overlay and navigates itself. */}
      <a href="#/user/own" data-own-navigation onClick={(e) => e.preventDefault()}>
        own
      </a>
      <a href="#/user/plain">plain</a>
    </>
  );
}

/** The route each update callback had committed when it finished, which is the page the new snapshot would show. */
let updates: Promise<string | null | undefined>[] = [];
const start = vi.fn((update: () => Promise<void> | void) => {
  const result = update();
  // Read in the same microtask the browser would take the snapshot in, before anything else gets to render.
  const done = result instanceof Promise ? result.then(() => document.querySelector("output")?.textContent) : Promise.resolve(document.querySelector("output")?.textContent);
  updates.push(done);
  return { ready: done, finished: done };
});

beforeEach(() => {
  Object.defineProperty(document, "startViewTransition", { value: start, configurable: true });
  usePlatform.setState({ info: platform(true) });
});
afterEach(() => {
  updates = [];
  start.mockClear();
  Reflect.deleteProperty(document, "startViewTransition");
  usePlatform.setState({ info: null });
});

/** The document-level click hook that wraps in-app navigation in a View Transition. */
describe("useViewTransitions", () => {
  it("takes over a plain in-app link, and stands aside for one that navigates itself", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Links />);
    await user.click(screen.getByText("own"));
    expect(start).not.toHaveBeenCalled();
    await user.click(screen.getByText("plain"));
    expect(start).toHaveBeenCalledTimes(1);
  });

  /** The router commits inside `startTransition`, so the new snapshot has to wait for the commit, not a `flushSync`. */
  it("holds the new snapshot until the route has committed", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Links />);
    await user.click(screen.getByText("plain"));
    expect(updates).toHaveLength(1);
    expect(await updates[0]).toBe("/user/plain");
  });

  /** WebKitGTK without GPU compositing crashes the web process on `startViewTransition`, so the router navigates alone. */
  it("leaves the click to the router where the WebView cannot draw a transition", () => {
    usePlatform.setState({ info: platform(false) });
    renderWithProviders(<Links />);
    // Not cancelled: the click stays the router's, as it is with Reduce motion on.
    expect(fireEvent.click(screen.getByText("plain"))).toBe(true);
    expect(start).not.toHaveBeenCalled();
  });

  it("leaves the click to the router until the platform has answered", () => {
    usePlatform.setState({ info: null });
    renderWithProviders(<Links />);
    // Not cancelled: the click stays the router's, as it is with Reduce motion on.
    expect(fireEvent.click(screen.getByText("plain"))).toBe(true);
    expect(start).not.toHaveBeenCalled();
  });
});
