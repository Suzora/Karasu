import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A stand-in IPC so `isTauri` holds and the card reads its settings as the app does.
const ipc = vi.hoisted(() => {
  const state = { calls: [] as [string, unknown][], answers: {} as Record<string, unknown> };
  Object.assign(window, {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string, args: unknown) => {
        state.calls.push([cmd, args]);
        return state.answers[cmd] ?? null;
      },
      transformCallback: () => 0,
      metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
    },
  });
  return state;
});

import { renderWithProviders } from "@/test/render";
import { SystemSection } from "./System";

function answer(gpu: { supported: boolean; wanted: boolean; active: boolean; forced: boolean }) {
  ipc.calls = [];
  ipc.answers = { get_autostart: false, get_close_to_tray: { enabled: true, tray: true }, get_gpu_compositing: gpu };
}

describe("the hardware acceleration row", () => {
  it("is absent where the WebView has no such switch", async () => {
    answer({ supported: false, wanted: false, active: true, forced: false });
    renderWithProviders(<SystemSection />);
    await screen.findByText("settings.closeToTray");
    expect(screen.queryByText("settings.gpu")).toBeNull();
  });

  it("saves the choice and says it waits for the next start", async () => {
    answer({ supported: true, wanted: false, active: false, forced: false });
    renderWithProviders(<SystemSection />);
    const label = await screen.findByText("settings.gpu");
    expect(screen.getByText("settings.gpuHint")).toBeInTheDocument();
    fireEvent.click(label);
    await waitFor(() => expect(ipc.calls).toContainEqual(["set_gpu_compositing", { enabled: true }]));
    expect(await screen.findByText("settings.gpuHint settings.gpuRestart")).toBeInTheDocument();
  });

  it("is locked where the environment already chose", async () => {
    answer({ supported: true, wanted: false, active: true, forced: true });
    renderWithProviders(<SystemSection />);
    expect(await screen.findByText("settings.gpuForced")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /settings\.gpu/ })).toBeDisabled();
  });
});
