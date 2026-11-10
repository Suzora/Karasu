import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DisclosurePanel } from "@/components/ui/disclosure";
import { cn } from "@/lib/utils";
import { mediaSessions, type MediaSession } from "@/stores/nowPlaying";
import { backendErrorText } from "@/lib/backendError";
import { Spinner } from "@/components/ui/spinner";

/** What every media session reports, fetched on first expand; on Linux this pass is all of local detection. */
export function MediaSessionSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const [sessions, setSessions] = useState<MediaSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      setSessions(await mediaSessions());
      setError(null);
    } catch (e) {
      // Keep null, not []: an empty list means idle, while unreachable means the feature is down.
      setSessions(null);
      setError(backendErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && sessions === null) refresh();
  };

  return (
    <Card>
      <CardTitle>{t("settings.mediaSessionsTitle")}</CardTitle>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-3 flex items-center gap-1 text-xs text-ink-500 hover:text-ink-300 coarse:min-h-11"
      >
        <ChevronRight
          aria-hidden
          className={cn("size-3.5 transition-transform", open && "rotate-90")}
        />
        {t("settings.detectionDebug")}
      </button>
      <DisclosurePanel open={open} id={panelId} className="mt-2 space-y-2">
        <p className="text-xs text-ink-600">
          {t("settings.detectionDebugHint")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={refresh}
          disabled={busy}
        >
          <Spinner spinning={busy} className="size-3.5" />{" "}
          {t("settings.refreshDebug")}
        </Button>
        {error && (
          <p className="text-xs text-danger">
            {t("settings.detectionDebugFailed", { message: error })}
          </p>
        )}
        {!error && sessions?.length === 0 && (
          <p className="text-xs text-ink-600">
            {t("settings.detectionDebugEmpty")}
          </p>
        )}
        {sessions?.map((s, i) => (
          <div
            key={`${s.appId}-${i}`}
            className="rounded-control bg-surface-850 p-2 text-xs"
          >
            <p className="break-all font-medium text-ink-100">{s.appId}</p>
            <dl className="mt-1 grid grid-cols-[5rem_1fr] gap-x-2 gap-y-0.5 text-ink-500">
              <dt>title</dt>
              <dd className="break-all text-ink-300">{s.title || "—"}</dd>
              <dt>artist</dt>
              <dd className="break-all text-ink-300">{s.artist || "—"}</dd>
              <dt>album</dt>
              <dd className="break-all text-ink-300">{s.album || "—"}</dd>
              <dt>type</dt>
              <dd className="text-ink-300">{s.playbackType}</dd>
              <dt>status</dt>
              <dd className="text-ink-300">{s.status}</dd>
              {/* MPRIS only; rendered when present so the Windows diagnostic looks exactly as it did. */}
              {s.url && (
                <>
                  <dt>url</dt>
                  <dd className="break-all text-ink-300">{s.url}</dd>
                </>
              )}
            </dl>
          </div>
        ))}
      </DisclosurePanel>
    </Card>
  );
}
