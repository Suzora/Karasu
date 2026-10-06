import type { HotkeyStatus } from "@/api/bindings";

/** The status line under the hotkey row, as an i18n key; a grab says nothing, since it either worked or errored. */
export type HotkeyStatusKey =
  | "settings.hotkeyPending"
  | "settings.hotkeyBound"
  | "settings.hotkeyBoundNoTrigger"
  | "settings.hotkeyNoPortal"
  | "settings.hotkeyNoAppId"
  | "settings.hotkeyDenied"
  | "settings.hotkeyFailed";

/** The row's hint: the portal's own while it holds the key, the grab's wherever the grab is what works. */
export function hotkeyHintKey(status: HotkeyStatus | null): "settings.hotkeyHintPortal" | "settings.hotkeyHint" {
  return status?.backend === "portal" && status.state !== "noPortal" ? "settings.hotkeyHintPortal" : "settings.hotkeyHint";
}

/** Whether pressing Enter on the same key should ask the desktop again, after a refusal or a failure. */
export function hotkeyRetryable(status: HotkeyStatus | null): boolean {
  return status?.backend === "portal" && (status.state === "denied" || status.state === "failed");
}

export function hotkeyStatusKey(status: HotkeyStatus | null): HotkeyStatusKey | null {
  if (!status || status.backend !== "portal") return null;
  switch (status.state) {
    case "off":
      return null;
    case "pending":
      return "settings.hotkeyPending";
    // Hyprland and the like bind the key in their own config, so the portal can answer with no key at all.
    case "bound":
      return status.trigger ? "settings.hotkeyBound" : "settings.hotkeyBoundNoTrigger";
    case "noPortal":
      return "settings.hotkeyNoPortal";
    case "noAppId":
      return "settings.hotkeyNoAppId";
    case "denied":
      return "settings.hotkeyDenied";
    case "failed":
      return "settings.hotkeyFailed";
  }
}
