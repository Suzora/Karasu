import { Link } from "react-router";
import { UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SocialUser } from "@/api/social";
import { UserLockup } from "@/components/ui/user-lockup";
import { cardClass } from "@/components/ui/card";
import { FollowButton } from "./FollowButton";
import { IconButton } from "@/components/ui/icon-button";
import { followRelation, isSelf, relationBadgeKey } from "@/lib/follows";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

/** One person in a list; no bio line, because `FOLLOWERS_QUERY` does not ask for one and a page of bios is a heavy payload. */
export function UserRow({ user, onRemove }: { user: SocialUser; onRemove?: () => void }) {
  const viewerId = useAuth((st) => st.viewer?.id);
  const { t } = useTranslation();
  const relation = followRelation(user);
  const badgeKey = relationBadgeKey(relation);

  return (
    <div className={cn(cardClass("flat", { interactive: true }), "flex items-center gap-3 p-3")}>
      <Link
        to={`/user/${encodeURIComponent(user.name)}`}
        className="min-w-0 flex-1"
      >
        <UserLockup
          name={user.name}
          src={user.avatar?.medium}
          size="md"
          titleAttr
          nameClassName="text-sm"
          sub={
            badgeKey ? (
              <span className="block text-xs text-ink-600">
                {badgeKey === "social.badgeMutual"
                  ? t("social.badgeMutual")
                  : t("social.badgeFollowsYou")}
              </span>
            ) : undefined
          }
        />
      </Link>
      <FollowButton userId={user.id} name={user.name} flags={user} />
      {onRemove && !isSelf(viewerId, user.id) && (
        <IconButton variant="ghost" size="xs" aria-label={t("social.removeFollowerAria", { name: user.name })} title={t("social.removeFollower")} onClick={onRemove}>
          <UserX className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
