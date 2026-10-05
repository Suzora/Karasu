import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import { useViewTransitions } from "./useViewTransitions";
import { renderWithProviders } from "@/test/render";

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
});
afterEach(() => {
  updates = [];
  start.mockClear();
  Reflect.deleteProperty(document, "startViewTransition");
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
});
