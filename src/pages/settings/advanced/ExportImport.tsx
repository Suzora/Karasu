import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { buildJsonExport, buildMalXml } from "@/lib/malExport";
import { parseMalXml } from "@/lib/malImport";
import { parseJsonExport } from "@/lib/jsonImport";
import { resolveMalChunk } from "@/api/queries";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { showToast } from "@/stores/toast";
import type { ListResult, Media, MediaType } from "@/api/types";
import { NeedsAccount } from "../shared";
import { commands, unwrap } from "@/api/tauri";

/** A count of entries with its noun, one or many, for the export and import receipts. */
function entriesText(n: number, t: (key: string, vars?: Record<string, unknown>) => string): string {
  return t("settings.entryCount", { count: n });
}

/** Exports the lists as MAL XML per medium or Karasu's JSON, in both modes; `lib/malExport` composes the files. */
export function ExportSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  const format = useScoreFormat();
  const [busy, setBusy] = useState(false);

  if (mode === "none") return null;
  const userId = viewer?.id ?? 0;

  const flat = (r: ListResult) => {
    const seen = new Set<number>();
    return r.lists
      .filter((g) => !g.isCustomList)
      .flatMap((g) => g.entries)
      .filter((e) => (seen.has(e.mediaId) ? false : (seen.add(e.mediaId), true)));
  };

  const load = (type: MediaType) =>
    qc
      .fetchQuery({
        queryKey: ["mediaList", type, userId],
        queryFn: () => api.fetchMediaList(userId, type),
      })
      .then(flat);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      showToast({ kind: "error", text: t("settings.exportFailed"), detail: backendErrorText(e, t) });
    } finally {
      setBusy(false);
    }
  };

  const exportMal = (type: MediaType) =>
    run(async () => {
      const entries = await load(type);
      const { xml, count, skipped, omitted } = buildMalXml(entries, type, format);
      if (count === 0) {
        showToast({ kind: "error", text: t("settings.exportEmpty") });
        return;
      }
      const name = type === "ANIME" ? "karasu-anime.xml" : "karasu-manga.xml";
      if (await api.saveText(xml, name, "MyAnimeList XML", "xml")) {
        showToast({
          kind: "success",
          text:
            skipped > 0
              ? t("settings.exportDoneSkipped", { entries: entriesText(count, t), skipped })
              : t("settings.exportDone", { entries: entriesText(count, t) }),
          // Two different absences, two lines: no MAL id is a limit of the format, private is the user's choice.
          detail:
            omitted > 0 ? t("settings.exportOmittedPrivate", { n: omitted }) : undefined,
        });
      }
    });

  const exportJson = () =>
    run(async () => {
      const [anime, manga] = await Promise.all([load("ANIME"), load("MANGA")]);
      if (anime.length === 0 && manga.length === 0) {
        showToast({ kind: "error", text: t("settings.exportEmpty") });
        return;
      }
      const json = buildJsonExport(anime, manga, format, Date.now());
      if (await api.saveText(json, "karasu-export.json", "JSON", "json")) {
        showToast({
          kind: "success",
          text: t("settings.exportDone", { entries: entriesText(anime.length + manga.length, t) }),
        });
      }
    });

  return (
    <Card>
      <CardTitle>{t("settings.export")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.exportHint")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => exportMal("ANIME")}>
          {t("settings.exportAnime")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => exportMal("MANGA")}>
          {t("settings.exportManga")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={exportJson}>
          {t("settings.exportJson")}
        </Button>
      </div>
    </Card>
  );
}

/** MAL XML into the local list only, since an account import is one mutation per entry against the shared budget. */
export function ImportSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const mode = useAuth((s) => s.mode);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  // Signed in, the section is unavailable rather than irrelevant, so it says so instead of vanishing.
  if (mode !== "local") {
    return (
      <NeedsAccount title={t("settings.import")}>
        {t("settings.importAniListHint")}
      </NeedsAccount>
    );
  }

  const importMal = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const xml = await unwrap(commands.openText("MyAnimeList XML", "xml"));
      if (xml == null) return;
      const parsed = parseMalXml(xml);
      if (parsed.rows.length === 0) {
        showToast({ kind: "error", text: t("settings.importNothing") });
        return;
      }

      const ids = [...new Set(parsed.rows.map((r) => r.idMal))];
      const byMal = new Map<number, Media>();
      for (let i = 0; i < ids.length; i += 50) {
        setProgress(
          t("settings.importResolving", {
            done: Math.min(i + 50, ids.length),
            total: ids.length,
          }),
        );
        const media = await resolveMalChunk(ids.slice(i, i + 50), parsed.type);
        for (const m of media) {
          if (m.idMal != null) byMal.set(m.idMal, m);
        }
      }

      setProgress(t("settings.importWriting"));
      let imported = 0;
      let unmatched = parsed.skipped;
      for (const row of parsed.rows) {
        const media = byMal.get(row.idMal);
        if (!media) {
          unmatched += 1;
          continue;
        }
        // Local scores are ten-point, which is MAL's own scale, so no conversion by construction.
        await api.saveListEntry(
          {
            mediaId: media.id,
            status: row.status,
            progress: row.progress,
            progressVolumes: row.progressVolumes,
            score: row.score,
            repeat: row.repeat,
          },
          media,
        );
        imported += 1;
      }

      await qc.invalidateQueries({ queryKey: ["mediaList"] });
      showToast({
        kind: "success",
        text:
          unmatched > 0
            ? t("settings.importDoneUnmatched", { entries: entriesText(imported, t), unmatched })
            : t("settings.importDone", { entries: entriesText(imported, t) }),
      });
    } catch (e) {
      showToast({ kind: "error", text: t("settings.importFailed"), detail: backendErrorText(e, t) });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  /** Karasu's own JSON back in; no requests, as the file carries the media id and a format-independent `scoreRaw`. */
  const importJson = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const text = await unwrap(commands.openText("Karasu JSON", "json"));
      if (text == null) return;
      const parsed = parseJsonExport(text);
      if (parsed.rows.length === 0) {
        showToast({ kind: "error", text: t("settings.importNothing") });
        return;
      }

      setProgress(t("settings.importWriting"));
      for (const row of parsed.rows) {
        await api.saveListEntry(
          {
            mediaId: row.mediaId,
            status: row.status,
            // Local scores are ten-point; the raw scale is where every format converges, so one conversion suffices.
            score: row.scoreRaw / 10,
            progress: row.progress,
            progressVolumes: row.progressVolumes,
            repeat: row.repeat,
            notes: row.notes ?? undefined,
            private: row.private,
            startedAt: row.startedAt ?? undefined,
            completedAt: row.completedAt ?? undefined,
          },
          // Keep the media argument, as the MAL path does; without it local mode shows a title-less card forever.
          row.media,
        );
      }

      await qc.invalidateQueries({ queryKey: ["mediaList"] });
      showToast({
        kind: "success",
        text:
          parsed.skipped > 0
            ? t("settings.importDoneUnmatched", {
                entries: entriesText(parsed.rows.length, t),
                unmatched: parsed.skipped,
              })
            : t("settings.importDone", { entries: entriesText(parsed.rows.length, t) }),
      });
    } catch (e) {
      showToast({ kind: "error", text: t("settings.importFailed"), detail: backendErrorText(e, t) });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Card>
      <CardTitle>{t("settings.import")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.importHint")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="secondary" disabled={busy} onClick={importMal}>
          {t("settings.importMal")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={importJson}>
          {t("settings.importJson")}
        </Button>
        {progress && <span className="text-xs text-ink-500">{progress}</span>}
      </div>
      <p className="mt-2 text-xs text-ink-600">{t("settings.importJsonHint")}</p>
    </Card>
  );
}
