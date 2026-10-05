import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { lazyRoute } from "./lazyRoute";

function Page({ name }: { name: string }) {
  return <p>page {name}</p>;
}

describe("lazyRoute", () => {
  it("shows the fallback until the chunk arrives on a first visit", async () => {
    const Route = lazyRoute(() => Promise.resolve({ default: Page }), <p>loading</p>);
    render(<Route name="a" />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("page a")).toBeInTheDocument();
    expect(Route.isLoaded()).toBe(true);
  });

  it("renders a preloaded page in the same commit, with no fallback for a snapshot to catch", async () => {
    const Route = lazyRoute(() => Promise.resolve({ default: Page }), <p>loading</p>);
    await act(() => Route.preload());
    render(<Route name="b" />);
    expect(screen.queryByText("loading")).toBeNull();
    expect(screen.getByText("page b")).toBeInTheDocument();
  });

  it("downloads once however often it is asked, and asks again after a failure", async () => {
    const load = vi
      .fn<() => Promise<{ default: typeof Page }>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ default: Page });
    const Route = lazyRoute(load);
    await expect(Route.preload()).rejects.toThrow("offline");
    await Promise.all([Route.preload(), Route.preload()]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(Route.isLoaded()).toBe(true);
  });
});
