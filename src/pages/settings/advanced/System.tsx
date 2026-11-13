import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { usePlatform } from "@/stores/platform";
import { Row, Toggle } from "../shared";
import { listen } from "@tauri-apps/api/event";
import type { GpuCompositing, HotkeyStatus } from "@/api/bindings";
import { hotkeyHintKey, hotkeyRetryable, hotkeyStatusKey, type HotkeyStatusKey } from "@/lib/hotkeyStatus";
import type { TFunction } from "i18next";
import { commands, unwrap } from "@/api/tauri";

interface CloseToTray {
  enabled: boolean;
  tray: boolean;
}

/** The hotkey's status line, each key spelt literally so the key test can find it. */
function hotkeyStatusText(t: TFunction, key: HotkeyStatusKey, trigger: string): string {
  switch (key) {
    case "settings.hotkeyPending":
      return t("settings.hotkeyPending");
    case "settings.hotkeyBound":
      return t("settings.hotkeyBound", { trigger });
    case "settings.hotkeyBoundNoTrigger":
      return t("settings.hotkeyBoundNoTrigger");
    case "settings.hotkeyNoPortal":
      return t("settings.hotkeyNoPortal");
    case "settings.hotkeyNoAppId":
      return t("settings.hotkeyNoAppId");
    case "settings.hotkeyDenied":
      return t("settings.hotkeyDenied");
    case "settings.hotkeyFailed":
      return t("settings.hotkeyFailed");
  }
}

/** How Karasu behaves as a program on this desktop, kept apart from the unrelated update settings. */
export function SystemSection() {
  const { t } = useTranslation();
  const platform = usePlatform((s) => s.info);
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [closeTray, setCloseTray] = useState<CloseToTray | null>(null);
  const [gpu, setGpu] = useState<GpuCompositing | null>(null);
  const [hotkey, setHotkey] = useState<string | null>(null);
  const [hotkeyDraft, setHotkeyDraft] = useState("");
  const [hotkeyStatus, setHotkeyStatus] = useState<HotkeyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    commands.getAutostart().then(setAutostart);
    commands.getCloseToTray().then(setCloseTray);
    commands.getGpuCompositing().then(setGpu);
    // Listening before reading, so a status announced in between is not lost; the desktop answers after its own dialog.
    const un = listen<HotkeyStatus>("hotkey-status", (e) => setHotkeyStatus(e.payload));
    void Promise.all([commands.getGlobalHotkey(), commands.globalHotkeyStatus()]).then(([v, status]) => {
      setHotkey(v ?? "");
      setHotkeyDraft(v ?? "");
      setHotkeyStatus(status);
    });
    return () => void un.then((f) => f());
  }, []);
  const statusKey = hotkeyStatusKey(hotkeyStatus);

  // Paint first, await, roll back on failure, or a refused write reads "on" for the rest of the session.
  const toggleAutostart = async (enabled: boolean) => {
    setAutostart(enabled);
    setError(null);
    try {
      await unwrap(commands.setAutostart(enabled));
    } catch (e) {
      setAutostart(!enabled);
      setError(backendErrorText(e, t));
    }
  };

  const toggleCloseTray = async (enabled: boolean) => {
    setCloseTray((prev) => (prev ? { ...prev, enabled } : prev));
    setError(null);
    try {
      await unwrap(commands.setCloseToTray(enabled));
    } catch (e) {
      setCloseTray((prev) => (prev ? { ...prev, enabled: !enabled } : prev));
      setError(backendErrorText(e, t));
    }
  };

  const toggleGpu = async (enabled: boolean) => {
    setGpu((prev) => (prev ? { ...prev, wanted: enabled } : prev));
    setError(null);
    try {
      await unwrap(commands.setGpuCompositing(enabled));
    } catch (e) {
      setGpu((prev) => (prev ? { ...prev, wanted: !enabled } : prev));
      setError(backendErrorText(e, t));
    }
  };

  // Same rollback idiom: the OS can refuse an accelerator, and Rust registers before it stores one.
  const applyHotkey = async (askAgain = false) => {
    const next = hotkeyDraft.trim();
    // The same key goes through only from Enter after a refusal, or every blur would put the desktop's dialog up.
    const retry = askAgain && next !== "" && hotkeyRetryable(hotkeyStatus);
    if (hotkey === null || (next === hotkey && !retry)) return;
    setError(null);
    try {
      await unwrap(commands.setGlobalHotkey(next || null));
      setHotkey(next);
      setHotkeyDraft(next);
    } catch (e) {
      setHotkeyDraft(hotkey);
      setError(backendErrorText(e, t));
    }
  };

  return (
    <Card>
      <CardTitle>{t("settings.app")}</CardTitle>
      <div className="mt-3 space-y-3">
        {/* Hidden in an AppImage, whose entry would name a gone mount, and in a Flatpak, whose entry stays in the sandbox. */}
        {autostart !== null && !platform?.appImage && !platform?.flatpak && (
          <Toggle
            checked={autostart}
            onChange={toggleAutostart}
            label={t("settings.autostart")}
            hint={t("settings.autostartHint")}
          />
        )}

        {/* Linux alone: WebKitGTK picks its renderer once per start, so the row says when a change is still waiting. */}
        {gpu?.supported && (
          <Toggle
            checked={gpu.forced ? gpu.active : gpu.wanted}
            onChange={toggleGpu}
            disabled={gpu.forced}
            setting="gpu"
            label={t("settings.gpu")}
            hint={
              gpu.forced
                ? t("settings.gpuForced")
                : gpu.wanted !== gpu.active
                  ? `${t("settings.gpuHint")} ${t("settings.gpuRestart")}`
                  : t("settings.gpuHint")
            }
          />
        )}

        {/* Locked off without a tray; hiding into one that does not exist makes the window unreachable. */}
        {closeTray !== null && (
          <Toggle
            checked={closeTray.enabled}
            onChange={toggleCloseTray}
            disabled={!closeTray.tray}
            label={t("settings.closeToTray")}
            hint={
              closeTray.tray
                ? t("settings.closeToTrayHint")
                : t("settings.closeToTrayNoTray")
            }
          />
        )}

        {hotkey !== null && hotkeyStatus !== null && (
          <Row
            label={t("settings.hotkey")}
            hint={hotkeyHintKey(hotkeyStatus) === "settings.hotkeyHintPortal" ? t("settings.hotkeyHintPortal") : t("settings.hotkeyHint")}
          >
            <Input
              value={hotkeyDraft}
              onChange={(e) => setHotkeyDraft(e.target.value)}
              onBlur={() => void applyHotkey()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyHotkey(true);
                }
              }}
              placeholder={t("settings.hotkeyPlaceholder")}
              className="w-48"
            />
          </Row>
        )}
        {statusKey && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-xs text-ink-500" role="status">
              {hotkeyStatusText(t, statusKey, hotkeyStatus?.trigger ?? "")}
            </p>
            {/* The desktop keeps the key once bound, so a change goes through its own dialog where it offers one. */}
            {hotkeyStatus?.state === "bound" && hotkeyStatus.configurable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void unwrap(commands.configureGlobalHotkey()).catch((e) => setError(backendErrorText(e, t)))}
              >
                {t("settings.hotkeyConfigure")}
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Card>
  );
}
