import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { usePlatform } from "@/stores/platform";
import { Row, Toggle } from "../shared";
import { backendErrorText } from "@/lib/backendError";
import { commands, unwrap } from "@/api/tauri";

interface MpvIpcSettings {
  enabled: boolean;
  path: string;
  defaultPath: string;
  launchPath: string;
}

/** The opt-in mpv IPC pipe; the hint quotes the effective path so the two sides of it cannot disagree. */
export function MpvSection() {
  const { t } = useTranslation();
  const platform = usePlatform((s) => s.info);
  const [settings, setSettings] = useState<MpvIpcSettings | null>(null);
  const [pathDraft, setPathDraft] = useState<string | null>(null);
  const [launchDraft, setLaunchDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    commands.getMpvIpc().then(setSettings).catch(() => {});
  }, []);

  if (!settings) return null;

  const apply = async (next: { enabled: boolean; path: string; launchPath: string }) => {
    const prev = settings;
    setSettings({ ...settings, ...next });
    setError(null);
    try {
      await unwrap(commands.setMpvIpc(next.enabled, next.path, next.launchPath));
    } catch (e) {
      setSettings(prev);
      setError(backendErrorText(e, t));
    }
  };

  const current = () => ({
    enabled: settings.enabled,
    path: settings.path,
    launchPath: settings.launchPath,
  });

  const applyPath = () => {
    const next = (pathDraft ?? settings.path).trim();
    setPathDraft(null);
    if (next === settings.path) return;
    void apply({ ...current(), path: next });
  };

  const applyLaunch = () => {
    const next = (launchDraft ?? settings.launchPath).trim();
    setLaunchDraft(null);
    if (next === settings.launchPath) return;
    void apply({ ...current(), launchPath: next });
  };

  return (
    <Card>
      <CardTitle>{t("settings.mpv")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">
        {t("settings.mpvHint", { path: settings.path })}
      </p>
      <div className="mt-3 space-y-3">
        <Toggle
          checked={settings.enabled}
          onChange={(enabled) => apply({ ...current(), enabled })}
          label={t("settings.mpvEnable")}
          hint={t("settings.mpvEnableHint")}
        />
        <Row
          label={t("settings.mpvPath")}
          hint={platform?.flatpak ? t("settings.mpvPathHintFlatpak") : t("settings.mpvPathHint")}
        >
          <Input
            value={pathDraft ?? settings.path}
            onChange={(e) => setPathDraft(e.target.value)}
            onBlur={applyPath}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyPath();
              }
            }}
            disabled={!settings.enabled}
            className="w-72"
          />
        </Row>
        {/* A sandboxed Karasu cannot start a program on the host, so the library opens files with the default player. */}
        {!platform?.flatpak && (
        <Row label={t("settings.mpvLaunch")} hint={t("settings.mpvLaunchHint")}>
          <Input
            value={launchDraft ?? settings.launchPath}
            onChange={(e) => setLaunchDraft(e.target.value)}
            onBlur={applyLaunch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLaunch();
              }
            }}
            placeholder={t("settings.mpvLaunchPlaceholder")}
            className="w-72"
          />
        </Row>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
