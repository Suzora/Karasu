import { create } from "zustand";
import { isTauri } from "@/api/anilist";
import { commands } from "@/api/tauri";

/** Where Karasu is running, read once at startup; `null` until then, and consumers guard on that rather than guess. */
export interface PlatformInfo {
  os: string;
  /** Running from an AppImage: the updater works and portable mode has a home. */
  appImage: boolean;
  /** Running inside a Flatpak: the app folder is read-only, and an autostart entry would never leave the sandbox. */
  flatpak: boolean;
  /** Built for a store (Flathub, F-Droid) that delivers the updates, so the app neither checks nor offers one. */
  storeUpdates: boolean;
  /** Whether the WebView can draw a View Transition; WebKitGTK without GPU compositing crashes on one. */
  viewTransitions: boolean;
}

interface PlatformState {
  info: PlatformInfo | null;
  load: () => Promise<void>;
}

export const usePlatform = create<PlatformState>((set, get) => ({
  info: null,
  load: async () => {
    if (!isTauri || get().info) return;
    set({ info: await commands.platformInfo() });
  },
}));

/** True only when we know it is Linux — never as a default. */
export const isLinux = (info: PlatformInfo | null) => info?.os === "linux";

/** True only when we know it is Android: the capability key, never the width key `usePhoneShell` answers. */
export const isAndroid = (info: PlatformInfo | null) => info?.os === "android";

/** Whether a View Transition may start: in the app only once Rust has said the WebView can draw one, never as a guess. */
export const canViewTransition = (info: PlatformInfo | null) => !isTauri || info?.viewTransitions === true;
