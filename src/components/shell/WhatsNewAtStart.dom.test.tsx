import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Pending, Seen } from "@/lib/whatsNew";
import { changeSection, changelog } from "@/test/fixtures";
import { WhatsNewAtStart } from "./WhatsNewAtStart";

const api = vi.hoisted(() => ({ getWhatsNew: vi.fn(), setWhatsNewSeen: vi.fn() }));
vi.mock("@/api/anilist", () => ({ isTauri: true, ...api }));

const lazy = vi.hoisted(() => ({ loadChangelog: vi.fn(), preloadWhatsNew: vi.fn() }));
vi.mock("@/components/overlays/LazyWhatsNew", () => ({
  ...lazy,
  // The dialog itself is tested on its own; here it only has to say which lines it was handed.
  default: ({ pending }: { pending: Pending }) => (
    <div role="dialog" data-overlay>
      <span data-whats-new>{pending.unreleased?.groups.flatMap((g) => g.lines.map((l) => l.id)).join(" ")}</span>
    </div>
  ),
}));

/** A Nightly with two Unreleased lines, after 1.44.0. */
const LOG = changelog({ unreleased: changeSection(null, { added: ["One.", "Two."] }) });
const [ONE, TWO] = LOG.unreleased.groups[0].lines.map((l) => l.id);

const seen = (version: string | null, lines: string[] | null): Seen => ({ current: "1.44.9.882", version, lines, channel: "prerelease" });

/** Mounts the gate and lets its idle callback and the promises after it run. */
async function start(mark: Seen) {
  api.getWhatsNew.mockResolvedValue(mark);
  render(<WhatsNewAtStart />);
  await act(() => vi.advanceTimersByTimeAsync(400));
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  api.setWhatsNewSeen.mockResolvedValue(undefined);
  lazy.loadChangelog.mockResolvedValue(LOG);
  lazy.preloadWhatsNew.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
  document.querySelectorAll("[data-blocker]").forEach((el) => el.remove());
});

describe("WhatsNewAtStart", () => {
  it("loads nothing when this build has already recorded its mark", async () => {
    await start(seen("1.44.9.882", []));
    expect(lazy.loadChangelog).not.toHaveBeenCalled();
    expect(api.setWhatsNewSeen).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the lines this start has not shown before, and records every line once as it opens", async () => {
    await start(seen("1.44.5.878", [ONE]));
    expect(await screen.findByRole("dialog")).toHaveTextContent(TWO);
    expect(screen.getByRole("dialog")).not.toHaveTextContent(ONE);
    expect(api.setWhatsNewSeen).toHaveBeenCalledTimes(1);
    expect(api.setWhatsNewSeen).toHaveBeenCalledWith([ONE, TWO]);
  });

  it("records without a dialog when an update brings nothing new", async () => {
    await start(seen("1.44.5.878", [ONE, TWO]));
    expect(api.setWhatsNewSeen).toHaveBeenCalledWith([ONE, TWO]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("records silently on a fresh install, whose mark names this build with no lines yet", async () => {
    await start(seen("1.44.9.882", null));
    expect(api.setWhatsNewSeen).toHaveBeenCalledWith([ONE, TWO]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("neither shows nor records after a downgrade, so the newer mark stays", async () => {
    await start(seen("9.9.9.9", []));
    expect(api.setWhatsNewSeen).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("waits for a dialog that opened first, and records only once it shows", async () => {
    const blocker = document.createElement("div");
    blocker.setAttribute("data-overlay", "");
    blocker.setAttribute("data-blocker", "");
    document.body.append(blocker);
    await start(seen("1.44.5.878", []));
    expect(screen.queryByText(`${ONE} ${TWO}`)).not.toBeInTheDocument();
    expect(api.setWhatsNewSeen).not.toHaveBeenCalled();

    await act(async () => blocker.remove());
    expect(await screen.findByText(`${ONE} ${TWO}`)).toBeInTheDocument();
    expect(api.setWhatsNewSeen).toHaveBeenCalledTimes(1);
  });

  it("steps aside for a dialog that opens over it, and comes back once that one has gone", async () => {
    await start(seen("1.44.5.878", []));
    expect(await screen.findByText(`${ONE} ${TWO}`)).toBeInTheDocument();
    const merge = document.createElement("div");
    merge.setAttribute("data-overlay", "");
    merge.setAttribute("data-blocker", "");
    await act(async () => document.body.append(merge));
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.queryByText(`${ONE} ${TWO}`)).not.toBeInTheDocument();

    await act(async () => merge.remove());
    expect(await screen.findByText(`${ONE} ${TWO}`)).toBeInTheDocument();
    expect(api.setWhatsNewSeen).toHaveBeenCalledTimes(1);
  });

  it("records nothing when the dialog's code cannot load, so the next start tries again", async () => {
    lazy.preloadWhatsNew.mockRejectedValue(new Error("chunk"));
    await start(seen("1.44.5.878", []));
    expect(api.setWhatsNewSeen).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
