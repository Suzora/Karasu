import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { displayTitle } from "@/api/types";
import { findCachedMedia } from "@/hooks/useCachedMedia";
import { backendErrorText } from "@/lib/backendError";
import { useAiringMutes } from "@/stores/airingMutes";
import type { AiringMute } from "@/api/anilist";
import { cardClass } from "@/components/ui/card";

/** One collator for the muted titles, hoisted so a render does not build a new one. */
const TITLE_ORDER = new Intl.Collator(undefined, { sensitivity: "base" });

/** Titles whose new episodes Karasu keeps quiet about, under the switch they belong to; absent until one is muted. */
export function AiringMutesList() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const mutes = useAiringMutes((s) => s.mutes);
  const setMuted = useAiringMutes((s) => s.setMuted);
  const error = useAiringMutes((s) => s.error);
  if (mutes.length === 0) return null;

  // Stored at mute time; an entry the list cache still holds is re-spelt in the current title language.
  const labelOf = (row: AiringMute) => {
    const cached = findCachedMedia(qc, row.mediaId);
    return cached ? displayTitle(cached.entry.media.title) : row.title;
  };
  const rows = mutes
    .map((row) => ({ row, label: labelOf(row) }))
    .sort((a, b) => TITLE_ORDER.compare(a.label, b.label));

  return (
    <div className="ml-1 border-l-2 border-hair pl-3">
      <p className="text-xs font-medium text-ink-300">{t("settings.airingMutes")}</p>
      <p className="mt-0.5 text-xs text-ink-500">{t("settings.airingMutesHint")}</p>
      <ul className={cn(cardClass("sunken"), "mt-2 space-y-1 p-1.5")}>
        {rows.map(({ row, label }) => (
          <li
            key={row.mediaId}
            className="flex items-center gap-3 rounded-control bg-surface-900 surface-outline py-1 pl-3 pr-1"
          >
            <Link
              to={`/media/${row.mediaId}`}
              className="min-w-0 flex-1 truncate text-xs text-ink-100 hover:text-accent-400"
            >
              {label}
            </Link>
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => void setMuted(row.mediaId, row.title, false)}
              aria-label={t("settings.airingUnmute", { title: label })}
              title={t("settings.airingUnmute", { title: label })}
            >
              <X className="size-3.5" />
            </IconButton>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-danger">{backendErrorText(error, t)}</p>}
    </div>
  );
}
