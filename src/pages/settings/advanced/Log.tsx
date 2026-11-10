import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DisclosurePanel } from "@/components/ui/disclosure";
import * as api from "@/api/anilist";
import { getLogDebug, getLogs, setLogDebug, type LogEntry } from "@/api/diagnostics";
import { backendErrorText } from "@/lib/backendError";
import { cn } from "@/lib/utils";
import { Toggle } from "../shared";
import { Spinner } from "@/components/ui/spinner";

/** The log in the app, fetched on first expand; a failed read shows an error, never an empty list. */
export function LogSection() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [debug, setDebug] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    getLogDebug().then(setDebug).catch(() => {});
  }, []);

  if (!api.isTauri) return null;

  const refresh = async () => {
    setBusy(true);
    setError(null);
    try {
      setEntries(await getLogs(200));
    } catch (e) {
      setError(backendErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const toggleDebug = async (enabled: boolean) => {
    const previous = debug;
    setDebug(enabled);
    try {
      await setLogDebug(enabled);
    } catch (e) {
      setDebug(previous);
      setError(backendErrorText(e, t));
    }
  };

  return (
    <Card>
      <CardTitle>{t("settings.log")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.logHint")}</p>

      <div className="mt-3 space-y-3">
        <Toggle
          checked={debug}
          onChange={toggleDebug}
          label={t("settings.logDebug")}
          hint={t("settings.logDebugHint")}
        />

        <div className="border-t border-hair pt-3">
          <button
            type="button"
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next && entries === null) refresh();
            }}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex w-full items-center gap-1.5 text-left text-sm text-ink-300 hover:text-ink-100 coarse:min-h-11"
          >
            <ChevronRight
              aria-hidden
              className={cn("size-3.5 transition-transform", open && "rotate-90")}
            />
            {t("settings.logShow")}
          </button>

          <DisclosurePanel open={open} id={panelId}>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={refresh}
                disabled={busy}
              >
                <Spinner spinning={busy} className="size-3.5" />
                {t("settings.refreshDebug")}
              </Button>
            </div>

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}

            {!error && entries !== null && entries.length === 0 && (
              <p className="mt-2 text-xs text-ink-600">{t("settings.logEmpty")}</p>
            )}

            {!error && entries !== null && entries.length > 0 && (
              <div className="mt-2 max-h-96 space-y-0.5 overflow-y-auto rounded-control bg-surface-850 p-2 font-mono text-2xs">
                {entries.map((e, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 text-ink-600">
                      {new Date(e.ms).toLocaleTimeString(i18n.language)}
                    </span>
                    <span
                      className={cn(
                        "w-10 shrink-0 uppercase",
                        e.level === "error" && "text-danger",
                        e.level === "warn" && "text-gold",
                        e.level === "info" && "text-ink-500",
                        e.level === "debug" && "text-ink-600",
                      )}
                    >
                      {e.level}
                    </span>
                    <span className="shrink-0 text-accent-400">{e.target}</span>
                    <span className="min-w-0 break-all text-ink-300">
                      {e.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DisclosurePanel>
        </div>
      </div>
    </Card>
  );
}
