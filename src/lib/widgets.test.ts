import { describe, expect, it } from "vitest";
import { WIDGET_KINDS, isWidgetKind, widgetOptions, widgetParam, widgetRoute, widgetSettingsPath } from "./widgets";

describe("widget links", () => {
  it("routes a widget's configure link to that widget's settings", () => {
    expect(widgetRoute("karasu://widget/42")).toBe("/settings?pane=appearance&widget=42");
    expect(widgetRoute("karasu://widget/42/")).toBe(widgetSettingsPath(42));
  });

  it("opens only the pages a widget's header names", () => {
    expect(widgetRoute("karasu://open/list")).toBe("/list");
    expect(widgetRoute("karasu://open/manga")).toBe("/manga");
    expect(widgetRoute("karasu://open/calendar")).toBe("/calendar");
    expect(widgetRoute("karasu://open/stats")).toBe("/stats");
    expect(widgetRoute("karasu://open/settings")).toBeNull();
  });

  it("answers null for anything that is not a widget link", () => {
    for (const href of ["karasu://widget/abc", "karasu://widget/", "https://anilist.co/anime/1", "karasu://open/../x", ""]) {
      expect(widgetRoute(href), href).toBeNull();
    }
  });

  it("reads a widget id only from digits", () => {
    expect(widgetParam("17")).toBe(17);
    expect(widgetParam("17a")).toBeNull();
    expect(widgetParam(null)).toBeNull();
  });
});

describe("widget options", () => {
  it("offers the list choice to the continue widgets and the medium to the statistics", () => {
    expect(widgetOptions("watching")).toEqual({ list: true, media: false, compact: true, tap: true });
    expect(widgetOptions("ring")).toEqual({ list: false, media: true, compact: false, tap: false });
    expect(widgetOptions("week")).toEqual({ list: false, media: false, compact: false, tap: true });
  });

  it("knows every kind and no other", () => {
    for (const kind of WIDGET_KINDS) expect(isWidgetKind(kind)).toBe(true);
    expect(isWidgetKind("clock")).toBe(false);
  });
});
