import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

// A stand-in IPC that answers the tracking card's reads and records every call, so the unmute's write can be seen.
const calls = vi.hoisted(() => {
  const seen: { cmd: string; args: unknown }[] = [];
  const answers: Record<string, unknown> = {
    get_scrobble_settings: { enabled: true, confirm: false, delayMin: 0, gapAuto: true },
    get_airing_notify: true,
    get_stale_settings: { enabled: false, months: 6 },
    get_sequel_notify: false,
    get_media_detection: true,
  };
  Object.assign(window, {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string, args: unknown) => {
        seen.push({ cmd, args });
        return answers[cmd] ?? null;
      },
      transformCallback: () => 0,
      metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
    },
  });
  return seen;
});

import { renderWithProviders } from "@/test/render";
import { useAiringMutes } from "@/stores/airingMutes";
import { ScrobbleSection } from "./DetectionPane";

afterEach(() => {
  useAiringMutes.setState({ mutes: [], ids: new Set(), error: null });
  calls.length = 0;
});

describe("the muted titles under the new-episode switch", () => {
  it("lists nothing until a title is muted", async () => {
    renderWithProviders(<ScrobbleSection />);
    expect(await screen.findByText("settings.airingNotify")).toBeInTheDocument();
    expect(screen.queryByText("settings.airingMutes")).toBeNull();
  });

  it("lists a muted title as a link to its page and unmutes it with the cross", async () => {
    useAiringMutes.setState({ mutes: [{ mediaId: 42, title: "Frieren" }], ids: new Set([42]) });
    renderWithProviders(<ScrobbleSection />);

    expect(await screen.findByRole("link", { name: "Frieren" })).toHaveAttribute("href", "/media/42");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: 'settings.airingUnmute:{"title":"Frieren"}' }));
    });

    await waitFor(() =>
      expect(calls).toContainEqual({ cmd: "set_airing_mute", args: { mediaId: 42, title: "Frieren", muted: false } }),
    );
    expect(screen.queryByText("settings.airingMutes")).toBeNull();
  });
});

/** A count is typed into a draft and saved once, on leaving the field: clearing it to type a new one saved a 1 before. */
describe("the threshold field", () => {
  it("saves the retyped value once, on blur, and nothing while typing", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<ScrobbleSection />);
    const field = await screen.findByRole("spinbutton", { name: /settings\.threshold/ });
    await user.clear(field);
    await user.type(field, "15");
    expect(calls.some((c) => c.cmd === "set_scrobble_settings")).toBe(false);
    await user.tab();
    await waitFor(() => expect(calls.filter((c) => c.cmd === "set_scrobble_settings")).toHaveLength(1));
    expect(calls.find((c) => c.cmd === "set_scrobble_settings")?.args).toMatchObject({ delayMin: 15 });
  });
});
