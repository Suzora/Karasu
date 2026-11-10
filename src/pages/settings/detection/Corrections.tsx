import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { displayTitle } from "@/api/types";
import { findCachedMedia } from "@/hooks/useCachedMedia";
import * as api from "@/api/anilist";
import { clearDetectionOverride, listDetectionOverrides, type DetectionOverride } from "@/stores/nowPlaying";
import { backendErrorText } from "@/lib/backendError";
import { cardClass } from "@/components/ui/card";

/** The now-playing card's corrections, reviewable and revocable here; absent until there is one. */
export function DetectionCorrectionsSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [rows, setRows] = useState<DetectionOverride[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!api.isTauri) return;
    listDetectionOverrides().then(setRows).catch(() => {});
  };
  useEffect(load, []);

  if (!rows || rows.length === 0) return null;

  // The label was stored at pick time; an entry the list cache holds is re-spelt in the current title language.
  const labelOf = (row: DetectionOverride) => {
    const cached = findCachedMedia(qc, row.mediaId);
    return cached ? displayTitle(cached.entry.media.title) : row.displayTitle;
  };

  const remove = async (row: DetectionOverride) => {
    setError(null);
    try {
      await clearDetectionOverride({
        title: row.title,
        // Back to the `null` the command expects; `-1` is the storage sentinel, not the API's business.
        season: row.season < 0 ? null : row.season,
        mediaType: row.mediaType,
      });
      load();
    } catch (e) {
      setError(backendErrorText(e, t));
    }
  };

  return (
    <Card>
      <CardTitle>{t("settings.corrections")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.correctionsHint")}</p>
      <ul className={cn(cardClass("sunken"), "mt-3 space-y-1 p-1.5")}>
        {rows.map((row) => (
          <li
            key={`${row.mediaType}-${row.season}-${row.title}`}
            className="flex items-center gap-3 rounded-control bg-surface-900 surface-outline py-1.5 pl-3 pr-1"
          >
            <span className="min-w-0 flex-1">
              <Link
                to={`/media/${row.mediaId}`}
                className="block truncate text-xs text-ink-100 hover:text-accent-400"
              >
                {labelOf(row)}
              </Link>
              <span className="mt-0.5 block truncate text-xs text-ink-600">
                {t("settings.correctionsFrom", { title: row.title })}
                {row.season > 0 && ` · S${row.season}`}
                {row.episodeOffset !== 0 &&
                  ` · ${t("settings.correctionsOffset", {
                    offset: row.episodeOffset > 0 ? `+${row.episodeOffset}` : row.episodeOffset,
                  })}`}
              </span>
            </span>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => remove(row)}
              aria-label={`${t("library.clearMatch")}: ${labelOf(row)}`}
              title={t("library.clearMatch")}
            >
              <X className="size-3.5" />
            </IconButton>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
