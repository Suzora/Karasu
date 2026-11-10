import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { useAuth } from "@/stores/auth";
import { useManualSync } from "@/hooks/useManualSync";
import type { ListResult } from "@/api/types";
import { cn } from "@/lib/utils";
import { NeedsAccount } from "../shared";
import { Trash2 } from "lucide-react";
import { displayTitle, type QueuedEdit, type SyncStatus } from "@/api/types";
import { isQueueField, queuedMediaId } from "@/lib/syncQueue";
import { fieldLabel } from "@/components/shell/SyncPanel";
import { IconButton } from "@/components/ui/icon-button";
import { Presence } from "@/components/ui/presence";
import ConfirmDialog from "@/components/overlays/ConfirmDialog";
import { Spinner } from "@/components/ui/spinner";
import { cardClass } from "@/components/ui/card";

/** The offline queue as rows; discard is behind a confirm, since a queued edit is the only copy of its write. */
export function QueueSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const mode = useAuth((s) => s.mode);
  const viewer = useAuth((s) => s.viewer);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [confirming, setConfirming] = useState<QueuedEdit | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The whole-app sync, not a bare queue flush: on the phone this pane is the only sync surface at all.
  const manual = useManualSync();

  const load = () => {
    if (!api.isTauri) return;
    api.syncStatus().then(setStatus).catch(() => {});
  };
  useEffect(load, []);

  if (mode !== "anilist" || !viewer) {
    return (
      <NeedsAccount title={t("settings.queueTitle")}>
        {t("settings.queueNeedsAccount")}
      </NeedsAccount>
    );
  }

  const entries = qc
    .getQueriesData<ListResult>({ queryKey: ["mediaList"] })
    .flatMap(([, data]) => data?.lists.flatMap((g) => g.entries) ?? []);

  const rows = status?.queued ?? [];

  const runSync = async () => {
    setError(null);
    await manual.sync();
    load();
  };

  const discard = async (edit: QueuedEdit) => {
    setConfirming(null);
    setError(null);
    try {
      await api.discardQueuedEdit(edit.id);
      load();
    } catch (e) {
      setError(backendErrorText(e, t));
    }
  };

  const label = (edit: QueuedEdit) => {
    const mediaId = queuedMediaId(edit, entries);
    const entry = entries.find((e) => e.mediaId === mediaId);
    return entry ? displayTitle(entry.media.title) : `#${edit.subject ?? "?"}`;
  };

  return (
    <Card>
      <CardTitle>{t("settings.queueTitle")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.queueHint")}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-600">{t("settings.queueEmpty")}</p>
      ) : (
        <ul className={cn(cardClass("sunken"), "mt-3 space-y-1 p-1.5")}>
            {rows.map((edit) => (
              <li
                key={edit.id}
                className="flex items-center gap-3 rounded-control bg-surface-900 surface-outline py-1.5 pl-3 pr-1"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-ink-100">
                    {label(edit)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-600">
                    {edit.kind === "delete"
                      ? t("settings.queueKindDelete")
                      : edit.fields
                          .filter(isQueueField)
                          .map((f) => fieldLabel(f, t))
                          .join(", ")}
                  </span>
                </span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirming(edit)}
                  aria-label={`${t("settings.queueDiscard")}: ${label(edit)}`}
                  title={t("settings.queueDiscard")}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </li>
            ))}
        </ul>
      )}
      <div className="mt-3">
        <Button onClick={() => void runSync()} disabled={manual.syncing || !manual.available}>
          <Spinner spinning={manual.syncing} className="size-4" />{" "}
          {manual.syncing ? t("settings.queueFlushing") : t("settings.queueFlush")}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <Presence value={confirming}>
        {(edit, leaving) => (
          <ConfirmDialog
            leaving={leaving}
            title={t("settings.queueDiscardTitle")}
            names={[label(edit)]}
            note={t("settings.queueDiscardNote")}
            confirmLabel={t("settings.queueDiscard")}
            onConfirm={() => void discard(edit)}
            onCancel={() => setConfirming(null)}
          />
        )}
      </Presence>
    </Card>
  );
}
