import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { effectiveAccent, setSystemAccentProvider, setSystemBarsSink, useTheme } from "./theme";

/** The system accent is one more source for the ramp, never a replacement for the colour the user picked. */

const root = () => document.documentElement.style.getPropertyValue("--color-accent-500");

beforeEach(() => {
  localStorage.clear();
  setSystemAccentProvider(() => Promise.resolve(null));
  useTheme.setState({ accent: "#4b3fc7", accentSource: "custom", systemAccent: null });
});

afterEach(() => {
  setSystemAccentProvider(() => Promise.resolve(null));
});

describe("effectiveAccent", () => {
  it("prefers the system colour only when chosen and known", () => {
    expect(effectiveAccent("custom", "#111111", "#222222")).toBe("#111111");
    expect(effectiveAccent("system", "#111111", "#222222")).toBe("#222222");
    expect(effectiveAccent("system", "#111111", null)).toBe("#111111");
  });
});

describe("useTheme's accent source", () => {
  it("reads the system colour through the provider and paints it while the source is system", async () => {
    setSystemAccentProvider(() => Promise.resolve("#0078D4"));
    act(() => useTheme.getState().setAccentSource("system"));
    await act(() => useTheme.getState().refreshSystemAccent());
    expect(useTheme.getState().systemAccent).toBe("#0078d4");
    expect(root()).toBe("#0078d4");
    expect(localStorage.getItem("karasu-accent-source")).toBe("system");
  });

  it("keeps the user's own colour underneath and comes back to it", async () => {
    setSystemAccentProvider(() => Promise.resolve("#0078d4"));
    act(() => useTheme.getState().setAccentSource("system"));
    await act(() => useTheme.getState().refreshSystemAccent());
    act(() => useTheme.getState().setAccentSource("custom"));
    expect(useTheme.getState().accent).toBe("#4b3fc7");
    expect(root()).toBe("#4b3fc7");
  });

  it("treats a refused or malformed answer as no system colour", async () => {
    setSystemAccentProvider(() => Promise.reject(new Error("no portal")));
    await act(() => useTheme.getState().refreshSystemAccent());
    expect(useTheme.getState().systemAccent).toBeNull();
    setSystemAccentProvider(() => Promise.resolve("blue"));
    await act(() => useTheme.getState().refreshSystemAccent());
    expect(useTheme.getState().systemAccent).toBeNull();
  });

  it("asks again on focus only while following the system", async () => {
    const provider = vi.fn(() => Promise.resolve("#0078d4"));
    setSystemAccentProvider(provider);
    act(() => useTheme.getState().init());
    await Promise.resolve();
    const calls = provider.mock.calls.length;
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(provider.mock.calls.length).toBe(calls);
    act(() => useTheme.getState().setAccentSource("system"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(provider.mock.calls.length).toBe(calls + 1);
  });
});

describe("useTheme's contrast", () => {
  afterEach(() => act(() => useTheme.getState().setContrast("system")));

  it("marks the document for the high-contrast palette and clears the mark again", () => {
    act(() => useTheme.getState().setContrast("high"));
    expect(document.documentElement.dataset.contrast).toBe("more");
    expect(localStorage.getItem("karasu-contrast")).toBe("high");
    expect(document.documentElement.style.getPropertyValue("--hair")).toBe("var(--color-surface-600)");
    act(() => useTheme.getState().setContrast("standard"));
    expect(document.documentElement.dataset.contrast).toBeUndefined();
  });

  it("moves a mid-tone accent's fill until its label reads at 7:1", () => {
    act(() => useTheme.getState().setAccent("#808080"));
    act(() => useTheme.getState().setContrast("standard"));
    const standard = root();
    act(() => useTheme.getState().setContrast("high"));
    expect(root()).not.toBe(standard);
  });

  it("follows the OS request only while set to system", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query === "(prefers-contrast: more)" })) as typeof window.matchMedia;
    try {
      act(() => useTheme.getState().setContrast("system"));
      expect(document.documentElement.dataset.contrast).toBe("more");
      act(() => useTheme.getState().setContrast("standard"));
      expect(document.documentElement.dataset.contrast).toBeUndefined();
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("useTheme's system bars", () => {
  afterEach(() => {
    act(() => useTheme.getState().setContrast("system"));
    act(() => useTheme.getState().setMode("dark"));
    setSystemBarsSink(() => {});
  });

  it("hands every new look to the sink, and nothing for a change the strips do not show", () => {
    const sink = vi.fn();
    act(() => useTheme.getState().setMode("dark"));
    act(() => useTheme.getState().setContrast("standard"));
    setSystemBarsSink(sink);
    act(() => useTheme.getState().setMode("light"));
    // The test window is desktop-shaped: no bottom bar, so the page's ground runs under both strips.
    expect(sink).toHaveBeenLastCalledWith({ status: "#f4f6f8", navigation: "#f4f6f8", light: true });
    act(() => useTheme.getState().setAccent("#e0457b"));
    expect(sink).toHaveBeenCalledTimes(1);
    act(() => useTheme.getState().setContrast("high"));
    expect(sink).toHaveBeenLastCalledWith({ status: "#ffffff", navigation: "#ffffff", light: true });
    act(() => useTheme.getState().setMode("dark"));
    expect(sink).toHaveBeenLastCalledWith({ status: "#050608", navigation: "#050608", light: false });
    expect(sink).toHaveBeenCalledTimes(3);
  });

  it("continues the phone shell's bottom bar under the navigation strip", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query === "(max-width: 767px)" })) as typeof window.matchMedia;
    try {
      const sink = vi.fn();
      act(() => useTheme.getState().setContrast("standard"));
      setSystemBarsSink(sink);
      act(() => useTheme.getState().setMode("light"));
      expect(sink).toHaveBeenLastCalledWith({ status: "#f4f6f8", navigation: "#ffffff", light: true });
    } finally {
      window.matchMedia = original;
    }
  });
});
