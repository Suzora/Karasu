import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import * as api from "@/api/anilist";
import type { PlacedWidget, WidgetConfig } from "@/api/anilist";
import { afterBackSettles } from "@/hooks/useBackClose";
import { accentShades } from "@/lib/contrast";
import { cn } from "@/lib/utils";
import {
  WIDGET_COLOURS,
  WIDGET_OPACITIES,
  isWidgetKind,
  widgetOptions,
  widgetParam,
  type WidgetKind,
} from "@/lib/widgets";
import { isAndroid, usePlatform } from "@/stores/platform";
import { effectiveAccent, useTheme } from "@/stores/theme";
import { Card, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Row, Toggle } from "./shared";

/** A kind's name in the reader's language; a literal key per kind, so the key test sees each one. */
function kindName(kind: WidgetKind, t: (key: string) => string): string {
  switch (kind) {
    case "airing":
      return t("settings.widgetKind_airing");
    case "watching":
      return t("settings.widgetKind_watching");
    case "reading":
      return t("settings.widgetKind_reading");
    case "week":
      return t("settings.widgetKind_week");
    case "figures":
      return t("settings.widgetKind_figures");
    case "ring":
      return t("settings.widgetKind_ring");
    case "year":
      return t("settings.widgetKind_year");
  }
}

/** The placed home-screen widgets, each with its own settings; Android only, and nothing anywhere else. */
export function WidgetsSection() {
  const { t } = useTranslation();
  const android = isAndroid(usePlatform((s) => s.info));
  const [params, setParams] = useSearchParams();
  // The open sheet is named in the URL, so a widget's own configure link and a tap on a row are one path.
  const open = widgetParam(params.get("widget"));
  const { data: placed = [] } = useQuery({
    queryKey: ["placedWidgets"],
    queryFn: api.placedWidgets,
    enabled: api.isTauri && android,
    staleTime: 0,
  });
  const show = (id: number | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === null) next.delete("widget");
        else next.set("widget", String(id));
        return next;
      },
      { replace: true },
    );

  if (!android) return null;
  const widgets = placed.filter((w): w is PlacedWidget & { kind: WidgetKind } => isWidgetKind(w.kind));
  const current = widgets.find((w) => w.id === open);

  return (
    <Card>
      <CardTitle>{t("settings.widgetsTitle")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{widgets.length > 0 ? t("settings.widgetsHint") : t("settings.widgetsNone")}</p>
      {widgets.length > 0 && (
        <ul className="mt-3 space-y-1">
          {widgets.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => show(w.id)}
                className="flex w-full items-center justify-between rounded-control px-2 py-2 text-left text-sm text-ink-100 transition-surface hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-accent-400"
              >
                <span>{kindName(w.kind, t)}</span>
                <ChevronRight size={16} className="text-ink-600" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {current && <WidgetSheet key={current.id} widget={current} onClose={() => afterBackSettles(() => show(null))} />}
    </Card>
  );
}

/** One placed widget's settings; every change is stored at once, so the home screen follows while the sheet is open. */
function WidgetSheet({ widget, onClose }: { widget: PlacedWidget & { kind: WidgetKind }; onClose: () => void }) {
  const { t } = useTranslation();
  const options = widgetOptions(widget.kind);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  useEffect(() => {
    let live = true;
    api
      .widgetConfig(widget.id)
      .then((c) => live && setConfig(c))
      .catch(() => live && setConfig({}));
    return () => {
      live = false;
    };
  }, [widget.id]);

  const change = (patch: Partial<WidgetConfig>) => {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    void api.setWidgetConfig(widget.id, next).catch(() => {});
  };

  return (
    <Modal title={kindName(widget.kind, t)} onClose={onClose} size="md">
      {config && (
        <div className="space-y-3">
          <WidgetPreview kind={widget.kind} config={config} />
          {options.list && (
            <Row label={t("settings.widgetList")}>
              <Segmented
                aria-label={t("settings.widgetList")}
                value={config.list === "planning" ? "planning" : "current"}
                onChange={(list) => change({ list })}
                segments={[
                  { value: "current", label: t("settings.widgetList_current") },
                  { value: "planning", label: t("settings.widgetList_planning") },
                ]}
              />
            </Row>
          )}
          {options.media && (
            <Row label={t("settings.widgetMedia")}>
              <Segmented
                aria-label={t("settings.widgetMedia")}
                value={config.media === "manga" ? "manga" : "anime"}
                onChange={(media) => change({ media })}
                segments={[
                  { value: "anime", label: t("settings.widgetMedia_anime") },
                  { value: "manga", label: t("settings.widgetMedia_manga") },
                ]}
              />
            </Row>
          )}
          {options.compact && (
            <Toggle
              checked={config.compact === true}
              onChange={(compact) => change({ compact })}
              label={t("settings.widgetCompact")}
              hint={t("settings.widgetCompactHint")}
            />
          )}
          <Row label={t("settings.widgetAccent")}>
            <Segmented
              aria-label={t("settings.widgetAccent")}
              value={config.accent === "system" ? "system" : "app"}
              onChange={(accent) => change({ accent })}
              segments={[
                { value: "app", label: t("settings.widgetAccent_app") },
                { value: "system", label: t("settings.widgetAccent_system") },
              ]}
            />
          </Row>
          <Row label={t("settings.widgetOpacity")} hint={t("settings.widgetOpacityHint")}>
            <Segmented
              aria-label={t("settings.widgetOpacity")}
              value={String(config.opacity ?? 100)}
              onChange={(opacity) => change({ opacity: Number(opacity) })}
              segments={WIDGET_OPACITIES.map((o) => ({ value: String(o), label: `${o} %` }))}
            />
          </Row>
          {options.tap && (
            <Row label={t("settings.widgetTap")}>
              <Segmented
                aria-label={t("settings.widgetTap")}
                value={config.tap === "list" ? "list" : "title"}
                onChange={(tap) => change({ tap })}
                segments={[
                  { value: "title", label: t("settings.widgetTap_title") },
                  { value: "list", label: t("settings.widgetTap_list") },
                ]}
              />
            </Row>
          )}
        </div>
      )}
    </Modal>
  );
}

/** A sketch of the widget over a wallpaper: it shows what the accent, the opacity and the compact form do, not the titles. */
function WidgetPreview({ kind, config }: { kind: WidgetKind; config: WidgetConfig }) {
  const { t } = useTranslation();
  const accent = useTheme((s) => effectiveAccent(s.accentSource, s.accent, s.systemAccent));
  const [system, setSystem] = useState<string | null>(null);
  useEffect(() => {
    if (config.accent !== "system") return;
    let live = true;
    api
      .systemAccent()
      .then((hex) => live && setSystem(hex))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [config.accent]);
  const base = config.accent === "system" && system ? system : accent;
  const tint = accentShades(base, { light: false, contrast: "standard" }).a400;
  const opacity = config.opacity ?? 100;
  const muted = opacity < 100 ? WIDGET_COLOURS.mutedOverWallpaper : WIDGET_COLOURS.muted;
  const rest = widgetOptions(kind).compact && config.compact !== true;
  const block = { backgroundColor: WIDGET_COLOURS.track };

  return (
    <div
      aria-hidden
      className="rounded-panel p-4"
      style={{ background: "linear-gradient(140deg, var(--color-surface-600), var(--color-ink-600))" }}
    >
      <div
        className="mx-auto w-full max-w-xs rounded-panel p-3"
        style={{ backgroundColor: `rgb(${WIDGET_COLOURS.surface} / ${opacity}%)`, color: WIDGET_COLOURS.ink }}
      >
        <div className="text-xs font-semibold">{kindName(kind, t)}</div>
        <div className="mt-2 flex gap-3">
          <div className="h-16 w-11 shrink-0 rounded-control" style={block} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="h-2 w-12 rounded-full" style={{ backgroundColor: tint }} />
            <div className="mt-2 h-3 w-3/4 rounded-full" style={{ backgroundColor: WIDGET_COLOURS.ink }} />
            <div className="mt-auto h-2 w-1/3 rounded-full" style={{ backgroundColor: muted }} />
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full" style={block}>
              <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: tint }} />
            </div>
          </div>
        </div>
        <div className={cn("mt-3 grid grid-cols-3 gap-2", !rest && "hidden")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-6 w-4 shrink-0 rounded-control" style={block} />
              <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: muted }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
