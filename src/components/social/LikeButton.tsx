import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import type { LikeableType } from "@/api/social";
import { useSocialActions } from "@/hooks/useSocialActions";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

/** The look of a row's small reaction (a like, a reply count, Reply): a pill that presses, with a finger-sized target. */
export function reactionClass(active: boolean, activeTone = "text-ink-300"): string {
  return cn(
    "relative press coarse:hit-area flex items-center gap-1 rounded-inner px-1.5 py-0.5 text-2xs transition-surface hover:bg-surface-850",
    active ? activeTone : "text-ink-600 hover:text-ink-300",
  );
}

/** The heart is its own receipt and undo, so only a failed like gets a toast; see `useSocialActions`. */
export function LikeButton({
  id,
  type,
  activityId,
  likeCount,
  isLiked,
  onLike,
}: {
  id: number;
  type: LikeableType;
  activityId?: number;
  likeCount: number;
  isLiked: boolean;
  /** For a caller that keeps its own cache of the thing liked; otherwise the shared like mutation runs. */
  onLike?: () => void;
}) {
  const { t } = useTranslation();
  const mode = useAuth((s) => s.mode);
  const { like } = useSocialActions();
  // Nothing to like as without an account, and a disabled heart is an invitation with no explanation.
  if (mode !== "anilist") {
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 text-2xs text-ink-600">
        <Heart aria-hidden className="size-3.5" />
        <span className="tabular-nums">{likeCount}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => (onLike ? onLike() : like.mutate({ id, type, activityId }))}
      aria-pressed={isLiked}
      // The action, not the state: pressing a heart named "liked" would read as liking it.
      aria-label={isLiked ? t("social.unlike") : t("social.like")}
      className={reactionClass(isLiked, "text-danger")}
    >
      <Heart aria-hidden className={cn("size-3.5", isLiked && "fill-current")} />
      <span className="tabular-nums">{likeCount}</span>
    </button>
  );
}
