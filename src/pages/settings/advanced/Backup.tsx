import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { Row, Toggle } from "../shared";
import { commands, unwrap } from "@/api/tauri";

interface BackupSettings {
  enabled: boolean;
  keep: number;
  dir: string;
}

/** Daily local database snapshots, on by default; Rust owns the schedule, this card owns the two knobs. */
export function BackupSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [keepDraft, setKeepDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    commands.getBackupSettings().then(setSettings).catch(() => {});
  }, []);

  if (!settings) return null;

  // The toggles-above rollback idiom: paint first, await, un-paint on failure.
  const apply = async (next: { enabled: boolean; keep: number }) => {
    const prev = settings;
    setSettings({ ...settings, ...next });
    setError(null);
    try {
      await unwrap(commands.setBackupSettings(next.enabled, next.keep));
    } catch (e) {
      setSettings(prev);
      setError(backendErrorText(e, t));
    }
  };

  const applyKeep = () => {
    const parsed = Math.round(Number(keepDraft ?? ""));
    setKeepDraft(null);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 60 || parsed === settings.keep) {
      return;
    }
    void apply({ enabled: settings.enabled, keep: parsed });
  };

  return (
    <Card>
      <CardTitle>{t("settings.backup")}</CardTitle>
      <div className="mt-3 space-y-3">
        <Toggle
          checked={settings.enabled}
          onChange={(enabled) => apply({ enabled, keep: settings.keep })}
          label={t("settings.backupEnabled")}
          hint={t("settings.backupEnabledHint", { dir: settings.dir })}
        />
        <Row action label={t("settings.backupOpen")} hint={t("settings.backupRestoreHint")}>
          {(hintId) => (
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              aria-describedby={hintId}
              onClick={async () => {
                await unwrap(commands.openBackupDir()).catch((e) => setError(backendErrorText(e, t)));
              }}
            >
              <FolderOpen className="size-3.5" /> {t("settings.backupOpenButton")}
            </Button>
          )}
        </Row>
        <Row label={t("settings.backupKeep")} hint={t("settings.backupKeepHint")}>
          <Input
            type="number"
            min={1}
            max={60}
            value={keepDraft ?? String(settings.keep)}
            onChange={(e) => setKeepDraft(e.target.value)}
            onBlur={applyKeep}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyKeep();
              }
            }}
            disabled={!settings.enabled}
            className="w-20"
          />
        </Row>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
