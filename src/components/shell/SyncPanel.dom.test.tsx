import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { SyncStatus } from "@/api/types";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { durationShort } from "@/lib/relTime";

/** The one command the panel wraps; `isTauri` is false under jsdom and the hook gates on it, so the module is mocked. */
const status = vi.fn<() => Promise<SyncStatus>>();

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  syncStatus: () => status(),
  flushQueue: () => Promise.resolve(0),
}));

import SyncPanel from "./SyncPanel";

const IDLE: SyncStatus = {
  connected: true,
  draining: false,
  queued: [],
  recent: [],
  traffic: { sources: [], throttled: 0, remaining: 24, limit: 30 },
  inFlight: [],
  upcoming: [],
  lists: [],
  rate: {
    remaining: 24,
    limit: 30,
    observedAgoMs: 900,
    throttledForMs: null,
    throttleKind: null,
  },
};

const panel = () => (
  <SyncPanel label="Show sync details">
    <span>1 change queued</span>
  </SyncPanel>
);

beforeEach(() => {
  signIn();
  status.mockReset();
  status.mockResolvedValue(IDLE);
});

afterEach(signOut);

describe("SyncPanel", () => {
  it("costs nothing until it is opened", async () => {
    renderWithProviders(panel());
    // Cheap, but still a round-trip per tick with nothing to look at while the panel is shut.
    await waitFor(() => expect(screen.getByRole("button")).toBeInTheDocument());
    expect(status).not.toHaveBeenCalled();
  });

  it("opens on the trigger and reads the status", async () => {
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(status).toHaveBeenCalled();
  });

  /** The shared popover marks itself, so the list behind cannot act on a key meant for the panel. */
  it("marks itself as an overlay while it is up", async () => {
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveAttribute("data-overlay"));
  });

  it("returns focus to the trigger when Escape closes it", async () => {
    renderWithProviders(panel());
    const trigger = screen.getByRole("button", { name: "Show sync details" });
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  /** Proves a failed read renders as one, since the reassuring headline would call an unreadable state "synced". */
  it("renders a failed read rather than the synced headline", async () => {
    status.mockRejectedValue(new Error("database is locked"));
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText(/database is locked/)).toBeInTheDocument());
    expect(screen.queryByText("syncPanel.hlSynced")).toBeNull();
  });

  it("opens on one sentence and the budget it has measured", async () => {
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText("syncPanel.hlSynced")).toBeInTheDocument());
    expect(screen.getByText('syncPanel.budgetLeft:{"left":24,"limit":30}')).toBeInTheDocument();
    expect(screen.getByText("syncPanel.budgetHint")).toBeInTheDocument();
  });

  /** Proves the line says "unmeasured" rather than rendering the seed as a measurement. */
  it("says the budget is unmeasured rather than inventing one", async () => {
    status.mockResolvedValue({
      ...IDLE,
      rate: { ...IDLE.rate, remaining: null, limit: null },
    });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText("syncPanel.budgetUnknown")).toBeInTheDocument());
  });

  /** Pins both `ThrottleKind` branches, so a real 429 never renders as the app pacing itself. */
  it("names a 429 and a self-imposed pause differently, with the wait rounded up", async () => {
    status.mockResolvedValue({
      ...IDLE,
      rate: { ...IDLE.rate, throttledForMs: 117_400, throttleKind: "retryAfter" },
    });
    const { unmount } = renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText("syncPanel.hlLimited")).toBeInTheDocument());
    expect(screen.getByText(durationShort(117_400, "en"))).toBeInTheDocument();
    unmount();

    status.mockResolvedValue({
      ...IDLE,
      rate: { ...IDLE.rate, throttledForMs: 400, throttleKind: "preflight" },
    });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText("syncPanel.hlPacing")).toBeInTheDocument());
  });

  it("says who is asking AniList right now", async () => {
    status.mockResolvedValue({ ...IDLE, inFlight: [{ source: "airing", startedAgoMs: 300, waiting: false }] });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() =>
      expect(screen.getByText('syncPanel.hlAsking:{"source":"syncPanel.src_airing"}')).toBeInTheDocument(),
    );
  });

  /** The plan reads top to bottom as what happens next, a switched-off pass last. */
  it("lists the planned passes soonest first", async () => {
    status.mockResolvedValue({
      ...IDLE,
      upcoming: [
        { pass: "stale", dueInMs: null, running: false, off: true },
        { pass: "sequel", dueInMs: 3_600_000, running: false, off: false },
        { pass: "airing", dueInMs: 60_000, running: false, off: false },
      ],
      lists: [{ mediaType: "ANIME", freshForMs: 0 }],
    });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getByText("syncPanel.src_sequel")).toBeInTheDocument());
    const order = ["syncPanel.listANIME", "syncPanel.src_airing", "syncPanel.src_sequel", "syncPanel.src_stale"].map((k) =>
      screen.getByText(k),
    );
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByText("syncPanel.listStale")).toBeInTheDocument();
    expect(screen.getByText("syncPanel.nextOff")).toBeInTheDocument();
  });

  /** Senders read in words; the raw operation and timings wait under Details, where a bug report finds them. */
  it("names each request's sender and folds the raw figures away", async () => {
    const req = (seq: number, source: string, operation: string, pacedMs: number) => ({
      seq,
      source,
      operation,
      startedAgoMs: 1_200 * seq,
      durationMs: 940,
      pacedMs,
      status: 200,
      remainingAfter: 28,
      outcome: "ok" as const,
    });
    status.mockResolvedValue({ ...IDLE, recent: [req(2, "list", "MediaListCollection", 0), req(1, "gql:Foo", "Foo", 800)] });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));

    await waitFor(() => expect(screen.getByText("syncPanel.src_list")).toBeInTheDocument());
    // A source without a label still shows, as its raw name.
    expect(screen.getByText("gql:Foo")).toBeInTheDocument();
    expect(screen.queryByText(/MediaListCollection/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "syncPanel.secDetails" }));
    await waitFor(() => expect(screen.getByText(/MediaListCollection/)).toBeInTheDocument());
    // Only the row that waited carries the pacing figure; a column on every healthy row would bury it.
    expect(screen.getByText('syncPanel.paced:{"ms":800}')).toBeInTheDocument();
    expect(screen.queryByText('syncPanel.paced:{"ms":0}')).toBeNull();
  });

  /** A limited or failed request is said in words, since its colour alone tells a reader nothing. */
  it("names a limited and a failed request beside the healthy dot", async () => {
    const req = (seq: number, outcome: "ok" | "throttled" | "error") => ({
      seq,
      source: "airing",
      operation: `Op${seq}`,
      startedAgoMs: 1_000,
      durationMs: 100,
      pacedMs: 0,
      status: outcome === "ok" ? 200 : outcome === "throttled" ? 429 : 500,
      remainingAfter: 20,
      outcome,
    });
    status.mockResolvedValue({ ...IDLE, recent: [req(3, "error"), req(2, "throttled"), req(1, "ok")] });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    await waitFor(() => expect(screen.getAllByText(/syncPanel.outcomeFailed/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/syncPanel.outcomeLimited/).length).toBeGreaterThan(0);
  });

  it("labels a queued row by what it changes", async () => {
    status.mockResolvedValue({
      ...IDLE,
      queued: [
        {
          id: 1,
          kind: "save",
          subject: 21,
          fields: ["progress", "status"],
          queuedAt: Math.floor(Date.now() / 1000) - 120,
        },
      ],
    });
    renderWithProviders(panel());
    fireEvent.click(screen.getByRole("button", { name: "Show sync details" }));
    // No cached title, so the row shows the id rather than vanishing: the count must match the pending badge.
    await waitFor(() =>
      expect(screen.getByText('syncPanel.rowUntitled:{"id":21}')).toBeInTheDocument(),
    );
    expect(
      screen.getByText("syncPanel.fieldProgress, syncPanel.fieldStatus"),
    ).toBeInTheDocument();
  });
});
