import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

// A stand-in IPC that answers the card's reads and records every call, so the pick's write can be seen.
const ipc = vi.hoisted(() => {
  const seen: { cmd: string; args: unknown }[] = [];
  const answers: Record<string, unknown> = {
    list_custom_players: [{ process: "mpc-qt.exe", suffix: " - MPC-QT" }],
    list_player_windows: [{ process: "celluloid.exe", title: "Show - 05.mkv - Celluloid", suffix: " - Celluloid" }],
    add_custom_player: [
      { process: "mpc-qt.exe", suffix: " - MPC-QT" },
      { process: "celluloid.exe", suffix: " - Celluloid" },
    ],
    remove_custom_player: [],
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
import { usePlatform, type PlatformInfo } from "@/stores/platform";
import { PlayersSection } from "./DetectionPane";

const on = (os: string) => usePlatform.setState({ info: { os } as PlatformInfo });

afterEach(() => {
  usePlatform.setState({ info: null });
  ipc.length = 0;
});

describe("the players card", () => {
  it("draws nothing where window titles are not read", () => {
    on("linux");
    renderWithProviders(<PlayersSection />);
    expect(screen.queryByText("settings.players")).toBeNull();
  });

  it("lists the stored players and adds one from an open window", async () => {
    on("windows");
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<PlayersSection />);
    expect(await screen.findByText("mpc-qt.exe")).toBeInTheDocument();
    expect(screen.queryByText("Show - 05.mkv - Celluloid")).toBeNull();

    await user.click(screen.getByRole("button", { name: "settings.playersPick" }));
    expect(await screen.findByText("Show - 05.mkv - Celluloid")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "settings.playersKeep" }));
    await waitFor(() =>
      expect(ipc.find((c) => c.cmd === "add_custom_player")?.args).toEqual({ process: "celluloid.exe", suffix: " - Celluloid" }),
    );
    expect(await screen.findByRole("button", { name: "settings.playersRemove: celluloid.exe" })).toBeInTheDocument();
  });

  it("removes a player with its cross", async () => {
    on("windows");
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<PlayersSection />);
    await user.click(await screen.findByRole("button", { name: "settings.playersRemove: mpc-qt.exe" }));
    await waitFor(() => expect(ipc.find((c) => c.cmd === "remove_custom_player")?.args).toEqual({ process: "mpc-qt.exe" }));
    await waitFor(() => expect(screen.queryByText("mpc-qt.exe")).toBeNull());
  });
});
