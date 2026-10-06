import { describe, expect, it } from "vitest";
import { hotkeyHintKey, hotkeyRetryable, hotkeyStatusKey } from "@/lib/hotkeyStatus";
import type { HotkeyStatus } from "@/api/bindings";

const status = (over: Partial<HotkeyStatus>): HotkeyStatus => ({
  backend: "portal",
  state: "bound",
  trigger: null,
  configurable: false,
  ...over,
});

describe("hotkeyStatusKey", () => {
  it("says nothing for a grab, or before a key is set", () => {
    expect(hotkeyStatusKey(null)).toBeNull();
    expect(hotkeyStatusKey(status({ backend: "grab", state: "bound" }))).toBeNull();
    expect(hotkeyStatusKey(status({ state: "off" }))).toBeNull();
  });

  it("names the desktop's key when it gave one, and points at its settings when it did not", () => {
    expect(hotkeyStatusKey(status({ trigger: "Ctrl+Shift+K" }))).toBe("settings.hotkeyBound");
    expect(hotkeyStatusKey(status({ trigger: null }))).toBe("settings.hotkeyBoundNoTrigger");
  });

  it("has a line for every way the portal can answer", () => {
    expect(hotkeyStatusKey(status({ state: "pending" }))).toBe("settings.hotkeyPending");
    expect(hotkeyStatusKey(status({ state: "noPortal" }))).toBe("settings.hotkeyNoPortal");
    expect(hotkeyStatusKey(status({ state: "noAppId" }))).toBe("settings.hotkeyNoAppId");
    expect(hotkeyStatusKey(status({ state: "denied" }))).toBe("settings.hotkeyDenied");
    expect(hotkeyStatusKey(status({ state: "failed" }))).toBe("settings.hotkeyFailed");
  });
});

describe("hotkeyHintKey and hotkeyRetryable", () => {
  it("words the hint for the portal only while the portal holds the key", () => {
    expect(hotkeyHintKey(status({}))).toBe("settings.hotkeyHintPortal");
    expect(hotkeyHintKey(status({ state: "noPortal" }))).toBe("settings.hotkeyHint");
    expect(hotkeyHintKey(status({ backend: "grab" }))).toBe("settings.hotkeyHint");
    expect(hotkeyHintKey(null)).toBe("settings.hotkeyHint");
  });

  it("lets the same key be asked again only after a refusal or a failure", () => {
    expect(hotkeyRetryable(status({ state: "denied" }))).toBe(true);
    expect(hotkeyRetryable(status({ state: "failed" }))).toBe(true);
    expect(hotkeyRetryable(status({ state: "bound" }))).toBe(false);
    expect(hotkeyRetryable(status({ backend: "grab", state: "failed" }))).toBe(false);
  });
});
