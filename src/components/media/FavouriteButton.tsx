import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import type { FavouriteKind } from "@/api/social";
import { useFavourite } from "@/hooks/useFavourite";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { showToast } from "@/stores/toast";

/** The favourite heart: nothing without an account, and disabled with a reason when AniList blocks the toggle. */
export function FavouriteButton({
  kind,
  id,
  isFavourite,
  blocked,
  square = false,
}: {
  kind: FavouriteKind;
  id: number;
  isFavourite: boolean | null;
  blocked?: boolean | null;
  /** The phone's action row: a square with the heart alone, the same height as the controls beside it. */
  square?: boolean;
}) {
  const { t } = useTranslation();
  const mode = useAuth((s) => s.mode);
  const fav = useFavourite(kind);
  const reasonId = useId();

  if (mode !== "anilist") return null;

  const on = isFavourite === true;

  return (
    <button
      type="button"
      // Pressable while blocked, so the reason reaches a keyboard and a finger and not only a hovering mouse.
      onClick={() => (blocked ? showToast({ kind: "info", text: t("detail.favouriteBlocked") }) : fav.mutate({ id }))}
      disabled={fav.isPending}
      aria-disabled={blocked ? true : undefined}
      aria-describedby={blocked ? reasonId : undefined}
      aria-pressed={on}
      // The action, not the state: a control announced as "Favourited" implies pressing it would favourite.
      aria-label={on ? t("detail.unfavouriteAria") : t("detail.favouriteAria")}
      title={blocked ? t("detail.favouriteBlocked") : undefined}
      className={cn(
        "flex items-center gap-1.5 border transition-surface",
        square ? "size-11 shrink-0 justify-center rounded-panel bg-surface-900" : "rounded-control px-2.5 py-1.5 text-xs",
        blocked
          ? "cursor-not-allowed border-hair text-ink-600 opacity-55"
          : on
            ? "border-danger/50 text-danger hover:bg-danger/10"
            : "border-surface-700 text-ink-500 hover:border-surface-600 hover:text-ink-300",
      )}
    >
      <Heart className={cn(square ? "size-5" : "size-3.5", on && "fill-current")} />
      {!square && (on ? t("detail.favourited") : t("detail.favourite"))}
      {blocked && (
        <span id={reasonId} className="sr-only">
          {t("detail.favouriteBlocked")}
        </span>
      )}
    </button>
  );
}
