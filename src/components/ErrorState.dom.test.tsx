import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SyncStatus } from "@/api/types";
import { renderWithProviders } from "@/test/render";
import { durationShort } from "@/lib/relTime";

/** The limiter's reading, which a rate-limited page shows as its wait; `isTauri` gates the hook, so the module is mocked. */
const status = vi.fn<() => Promise<SyncStatus>>();
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  syncStatus: () => status(),
}));

import { ErrorState } from "./EmptyState";

const limiter = (throttledForMs: number | null): SyncStatus => ({
  connected: true,
  draining: false,
  queued: [],
  recent: [],
  traffic: { sources: [], throttled: 1, remaining: 0, limit: 30 },
  rate: { remaining: 0, limit: 30, observedAgoMs: 1_000, throttledForMs, throttleKind: throttledForMs == null ? null : "retryAfter" },
  inFlight: [],
  upcoming: [],
  lists: [],
});

/** The one shape a failed load takes: the reason in words, and a Retry that is one request per press. */
describe("ErrorState", () => {
  it("words the backend's code instead of printing it, and asks nothing by itself", () => {
    const onRetry = vi.fn();
    render(<ErrorState error="AniList answered 500" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent('common.error:{"message":"AniList answered 500"}');
    expect(onRetry).not.toHaveBeenCalled();
  });

  /** A rate limit is a wait that ends, not a failure: no "Error:", the limiter's own countdown, and Retry held until then. */
  it("shows AniList's wait for a rate limit and holds Retry until it is over", async () => {
    status.mockResolvedValue(limiter(38_000));
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState error="anilist.rateLimited" onRetry={onRetry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("common.rateLimitedTitle");
    expect(alert).not.toHaveTextContent("common.error");
    await waitFor(() =>
      expect(alert).toHaveTextContent(`common.rateLimitedWait:{"t":"${durationShort(38_000, "en")}"}`),
    );
    const button = screen.getByRole("button", { name: "common.retry" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await userEvent.setup({ delay: null }).click(button);
    // Never a second retry layer: the press during the wait asks nothing, and nothing asks by itself.
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("lets Retry ask once the wait is over", async () => {
    status.mockResolvedValue(limiter(null));
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState error="anilist.rateLimited" onRetry={onRetry} />);
    await waitFor(() => expect(screen.getByText("common.rateLimitedReady")).toBeInTheDocument());
    const button = screen.getByRole("button", { name: "common.retry" });
    expect(button).not.toHaveAttribute("aria-disabled");
    await userEvent.setup({ delay: null }).click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  /** The struck query means "nothing is there"; a failure to ask must never draw it. */
  it("never draws a page's visual for a rate limit", () => {
    status.mockResolvedValue(limiter(5_000));
    renderWithProviders(<ErrorState error="anilist.rateLimited" visual={<span>struck</span>} />);
    expect(screen.queryByText("struck")).toBeNull();
  });

  /** A failed query keeps its error while it asks again, so only the held button stops a second request. */
  it("asks once per press and holds the button until the answer is in", async () => {
    let settle: () => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    const user = userEvent.setup({ delay: null });
    render(<ErrorState error="AniList answered 500" onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: "common.retry" });
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveFocus();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await act(async () => settle());
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("keeps a page's own sentence around the reason, inline and without a button where nothing can be asked", () => {
    render(<ErrorState inline error="Network error: refused" title={(reason) => `list.loadError:${reason}`} />);
    expect(screen.getByRole("alert")).toHaveTextContent("list.loadError:common.offlineError");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
