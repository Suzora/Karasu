import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { usePlatform } from "@/stores/platform";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  getUpdateCheckAuto: () => Promise.resolve(true),
  getUpdateChannel: () => Promise.resolve("stable"),
  getApkDownloadMetered: () => Promise.resolve(false),
}));

vi.mock("@/api/tauri", async (orig) => {
  const real = await orig<typeof import("@/api/tauri")>();
  return {
    ...real,
    commands: {
      ...real.commands,
      getAutostart: () => Promise.resolve(false),
      getCloseToTray: () => Promise.resolve(null),
      getGlobalHotkey: () => Promise.resolve(null),
      globalHotkeyStatus: () => Promise.resolve({ backend: "grab", state: "off", trigger: null, configurable: false }),
      getPortableStatus: () => Promise.resolve({ portable: false, dir: "/data", other: null }),
      getMpvIpc: () => Promise.resolve({ enabled: true, path: "/run/user/1000/karasu-mpv", defaultPath: "", launchPath: "" }),
    },
  };
});

import { PortableSection, SystemSection, UpdatesSection } from "./AdvancedPane";
import { MpvSection } from "./DetectionPane";

afterEach(() => usePlatform.setState({ info: null }));

function mount(flatpak: boolean) {
  usePlatform.setState({ info: { os: "linux", appImage: false, flatpak, storeUpdates: flatpak, viewTransitions: false } });
  return renderWithProviders(
    <>
      <SystemSection />
      <PortableSection />
      <UpdatesSection />
      <MpvSection />
    </>,
  );
}

describe("settings inside a Flatpak", () => {
  it("offers autostart and portable mode on an ordinary Linux install", async () => {
    mount(false);
    expect(await screen.findByText("settings.autostart")).toBeInTheDocument();
    expect(await screen.findByText("settings.portable")).toBeInTheDocument();
    expect(await screen.findByText("settings.updates")).toBeInTheDocument();
    expect(await screen.findByText("settings.mpvLaunch")).toBeInTheDocument();
  });

  it("offers neither inside the sandbox, whose entry never leaves it and whose app folder is read-only", async () => {
    mount(true);
    expect(await screen.findByText("settings.app")).toBeInTheDocument();
    await Promise.resolve();
    expect(await screen.findByText("settings.mpvPathHintFlatpak")).toBeInTheDocument();
    expect(screen.queryByText("settings.autostart")).toBeNull();
    expect(screen.queryByText("settings.portable")).toBeNull();
    // The store delivers updates and the sandbox cannot start a host mpv, so neither is offered.
    expect(screen.queryByText("settings.updates")).toBeNull();
    expect(screen.queryByText("settings.mpvLaunch")).toBeNull();
  });
});
