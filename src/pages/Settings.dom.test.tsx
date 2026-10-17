import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

// The panes read the backend on mount; a stand-in IPC answers like the app does, so every section renders for real.
vi.hoisted(() => {
  const answers: Record<string, unknown> = {
    get_scrobble_settings: { enabled: true, confirm: false, delayMin: 0, gapAuto: true },
    get_airing_notify: true,
    get_stale_settings: { enabled: false, months: 6 },
    get_sequel_notify: false,
    get_media_detection: true,
    get_content_filter: "off",
    get_blur_adult: true,
    list_detection_overrides: [],
    get_jellyfin_settings: {
      url: "",
      connected: false,
      userName: "",
      serverName: "",
      device: "",
      localDevice: "PC",
      externalUrl: "",
      externalVerified: null,
      externalPlainHttp: false,
    },
    get_jellyfin_background: { enabled: false, supported: false, batteryExempt: null },
    get_mpv_ipc: { enabled: false, path: "", defaultPath: "", launchPath: "" },
    media_sessions: [],
  };
  Object.assign(window, {
    __TAURI_INTERNALS__: {
      invoke: async (cmd: string) => answers[cmd] ?? null,
      transformCallback: () => 0,
      metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
    },
  });
});

// The real setup module wires i18next to React, which the dom project's mocked `react-i18next` cannot serve.
vi.mock("@/i18n", () => ({
  getLanguageSetting: () => "system",
  setLanguageSetting: () => {},
  SUPPORTED_LANGUAGES: [{ value: "system", label: "System" }],
}));

import { renderWithProviders } from "@/test/render";
import { useContentFilter } from "@/stores/contentFilter";
import Settings from "@/pages/Settings";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  useContentFilter.setState({ ready: true, level: "off", blurAdult: true });
});

/** The pane list is a navigation bar like the sidebar, so the current pane wears the same pill. */
describe("Settings pane list", () => {
  it("marks the current pane with the navigation pill", () => {
    renderWithProviders(<Settings />, { route: "/settings?pane=appearance" });
    const current = screen.getByRole("button", { name: "settings.pane_appearance" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("nav-pill", "rounded-full");
  });
});
