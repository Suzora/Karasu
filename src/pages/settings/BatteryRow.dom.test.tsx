import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A stand-in IPC so `isTauri` holds and the card reads its schedule and the background state as the app does.
const ipc = vi.hoisted(() => {
  const state = {
    calls: [] as string[],
    answers: {} as Record<string, unknown>,
  };
  Object.assign(window, {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string) => {
        state.calls.push(cmd);
        return state.answers[cmd] ?? null;
      },
      transformCallback: () => 0,
      metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
    },
  });
  return state;
});

import { openUrl } from "@tauri-apps/plugin-opener";
import { renderWithProviders, signIn } from "@/test/render";
import { NotificationScheduleSection } from "./AniListPane";

function answer(background: { supported: boolean; batteryExempt: boolean | null }) {
  ipc.calls = [];
  ipc.answers = {
    get_notif_schedule: 30,
    get_jellyfin_background: { enabled: false, ...background },
  };
}

beforeEach(() => {
  signIn();
  vi.mocked(openUrl).mockClear();
});

describe("the notification card's battery row", () => {
  it("is offered on Android with no Jellyfin, and asks for the exemption", async () => {
    answer({ supported: true, batteryExempt: false });
    renderWithProviders(<NotificationScheduleSection />);
    // The row is a `<label>`, so its whole text names the button; find it by its own words instead.
    const allow = (await screen.findByText("settings.batteryAllow")).closest("button")!;
    expect(allow).toBeInTheDocument();
    expect(screen.getByText("settings.battery")).toBeInTheDocument();
    // The old hint sent the reader to a Jellyfin card that a phone without Jellyfin never shows.
    expect(screen.queryByText("settings.notifScheduleAndroidHint")).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="pane=detection"]')).toBeNull();

    fireEvent.click(allow);
    await waitFor(() => expect(ipc.calls).toContain("request_battery_exemption"));
  });

  it("names no vendor and points at dontkillmyapp.com instead", async () => {
    answer({ supported: true, batteryExempt: false });
    renderWithProviders(<NotificationScheduleSection />);
    const link = await screen.findByRole("link", { name: "dontkillmyapp.com" });
    expect(link).toHaveAttribute("href", "https://dontkillmyapp.com/");
    fireEvent.click(link);
    expect(openUrl).toHaveBeenCalledWith("https://dontkillmyapp.com/");
    expect(ipc.calls).not.toContain("request_battery_exemption");
  });

  /** The row is a group, not a label: its text presses nothing, and the button it holds is described by the hint. */
  it("asks for the exemption from its button alone, which the hint describes", async () => {
    answer({ supported: true, batteryExempt: false });
    renderWithProviders(<NotificationScheduleSection />);
    fireEvent.click(await screen.findByText("settings.batteryHint"));
    expect(ipc.calls).not.toContain("request_battery_exemption");
    const button = screen.getByRole("button", { name: "settings.batteryAllow" });
    expect(button).toHaveAccessibleDescription("settings.batteryHint");
    fireEvent.click(button);
    await waitFor(() => expect(ipc.calls).toContain("request_battery_exemption"));
    expect(openUrl).not.toHaveBeenCalled();
  });

  it("says so once Karasu is exempt", async () => {
    answer({ supported: true, batteryExempt: true });
    renderWithProviders(<NotificationScheduleSection />);
    expect(await screen.findByText("settings.batteryAllowed")).toBeInTheDocument();
    expect(screen.queryByText("settings.batteryAllow")).not.toBeInTheDocument();
  });

  it("is left out on the desktop", async () => {
    answer({ supported: false, batteryExempt: null });
    renderWithProviders(<NotificationScheduleSection />);
    expect(await screen.findByText("settings.notifSchedule")).toBeInTheDocument();
    await waitFor(() => expect(ipc.calls).toContain("get_jellyfin_background"));
    expect(screen.queryByText("settings.battery")).not.toBeInTheDocument();
  });
});
