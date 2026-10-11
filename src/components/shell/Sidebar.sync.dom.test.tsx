import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import type { SyncStatus } from "@/api/types";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { durationShort } from "@/lib/relTime";

/** The limiter's reading the sidebar's line follows; `isTauri` gates the hook, so the module is mocked. */
const status = vi.fn<() => Promise<SyncStatus>>();
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  syncStatus: () => status(),
}));

import Sidebar from "./Sidebar";

const base: SyncStatus = {
  connected: true,
  draining: false,
  queued: [],
  recent: [],
  traffic: { sources: [], throttled: 0, remaining: 20, limit: 30 },
  rate: { remaining: 20, limit: 30, observedAgoMs: 1_000, throttledForMs: null, throttleKind: null },
  inFlight: [],
  upcoming: [],
  lists: [],
};

beforeEach(() => {
  signIn();
  status.mockReset();
});

afterEach(signOut);

/** The one status line people glance at must never call a throttled or unreachable AniList "synced". */
describe("Sidebar sync line", () => {
  it("says AniList is holding requests back, with the wait", async () => {
    status.mockResolvedValue({ ...base, rate: { ...base.rate, remaining: 0, throttledForMs: 38_000, throttleKind: "retryAfter" } });
    renderWithProviders(<Sidebar />);
    await waitFor(() =>
      expect(screen.getByText(`sync.limited:{"t":"${durationShort(38_000, "en")}"}`)).toBeInTheDocument(),
    );
    expect(screen.queryByText("sync.now")).toBeNull();
  });

  it("says AniList is unreachable while the newest request failed at the connection", async () => {
    status.mockResolvedValue({
      ...base,
      recent: [{ seq: 1, source: "list", operation: "Page", startedAgoMs: 900, durationMs: 0, pacedMs: 0, status: null, remainingAfter: null, outcome: "error" }],
    });
    renderWithProviders(<Sidebar />);
    await waitFor(() => expect(screen.getByText("sync.unreachable")).toBeInTheDocument());
  });

  it("keeps the list's own wording while nothing is wrong", async () => {
    status.mockResolvedValue(base);
    renderWithProviders(<Sidebar />);
    await waitFor(() => expect(status).toHaveBeenCalled());
    expect(screen.queryByText("sync.unreachable")).toBeNull();
    expect(screen.queryByText(/sync\.limited/)).toBeNull();
  });
});
