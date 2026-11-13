/** The Android home-screen widgets as the app sees them: their links into Karasu and what each kind can be told. */

/** The seven kinds, as `WidgetRefresher.placed` names them. */
export const WIDGET_KINDS = ["airing", "watching", "reading", "week", "figures", "ring", "year"] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

export function isWidgetKind(kind: string): kind is WidgetKind {
  return (WIDGET_KINDS as readonly string[]).includes(kind);
}

/** The pages a widget's header may open, by the name Widgets.kt writes after `karasu://open/`. */
const OPEN: Record<string, string> = {
  list: "/list",
  manga: "/manga",
  calendar: "/calendar",
  stats: "/stats",
};

/** The route to one placed widget's settings. */
export function widgetSettingsPath(id: number): string {
  return `/settings?pane=appearance&widget=${id}`;
}

/** The internal route for a link a widget sends, or `null` for anything else. */
export function widgetRoute(href: string): string | null {
  const configure = /^karasu:\/\/widget\/(\d{1,10})\/?$/.exec(href);
  if (configure) return widgetSettingsPath(Number(configure[1]));
  const open = /^karasu:\/\/open\/([a-z]+)\/?$/.exec(href);
  return open ? (OPEN[open[1]] ?? null) : null;
}

/** The widget id a settings URL names, or `null`. */
export function widgetParam(value: string | null): number | null {
  return value !== null && /^\d{1,10}$/.test(value) ? Number(value) : null;
}

/** Which settings a kind has; the accent and the opacity belong to all of them. */
export interface WidgetOptions {
  list: boolean;
  media: boolean;
  compact: boolean;
  tap: boolean;
}

export function widgetOptions(kind: WidgetKind): WidgetOptions {
  const stats = kind === "figures" || kind === "ring" || kind === "year";
  return {
    list: kind === "watching" || kind === "reading",
    media: stats,
    compact: kind !== "week" && kind !== "ring",
    tap: !stats,
  };
}

/** The opacity steps the sheet offers; the lowest is the floor Rust enforces. */
export const WIDGET_OPACITIES = [70, 80, 90, 100] as const;

/** The widgets' fixed dark colours for the sheet's preview, which a light theme must not flip. */
export const WIDGET_COLOURS = {
  surface: "11 13 18",
  ink: "#f0f2f5",
  muted: "#9da3af",
  mutedOverWallpaper: "#c8ccd6",
  track: "#2a2f39",
} as const;
