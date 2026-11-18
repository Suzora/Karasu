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

function answer(
  gpu: { supported: boolean; wanted: boolean; active: boolean; forced: boolean },
  start: { autostart?: boolean; hidden?: boolean; tray?: boolean } = {},
) {
  ipc.calls = [];
  ipc.answers = {
    get_autostart: start.autostart ?? false,
    get_start_hidden: start.hidden ?? false,
    get_close_to_tray: { enabled: true, tray: start.tray ?? true },
    get_gpu_compositing: gpu,
  };
}

const noGpu = { supported: false, wanted: false, active: true, forced: false };

describe("the start-in-tray row", () => {
  it("saves the choice while Karasu starts with the system", async () => {
    answer(noGpu, { autostart: true });
    renderWithProviders(<SystemSection />);
    const label = await screen.findByText("settings.startHidden");
    expect(screen.getByText("settings.startHiddenHint")).toBeInTheDocument();
    fireEvent.click(label);
    await waitFor(() => expect(ipc.calls).toContainEqual(["set_start_hidden", { enabled: true }]));
  });

  it("is locked while Karasu does not start with the system", async () => {
    answer(noGpu, { autostart: false, hidden: true });
    renderWithProviders(<SystemSection />);
    await screen.findByText("settings.startHidden");
    expect(screen.getByRole("switch", { name: /settings\.startHidden/ })).toBeDisabled();
  });

  it("is locked and says why without a tray", async () => {
    answer(noGpu, { autostart: true, tray: false });
    renderWithProviders(<SystemSection />);
    expect(await screen.findByText("settings.startHiddenNoTray")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /settings\.startHidden/ })).toBeDisabled();
  });
});

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
