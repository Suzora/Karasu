import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { removeFollower, type FollowCounts, type UserPage, type UserProfile } from "@/api/social";
import { afterRemoval, followRelation, relationFlags, withoutUser, type FollowRelation } from "@/lib/follows";
import { useAuth } from "@/stores/auth";
import { showToast } from "@/stores/toast";

/** Removes someone from the viewer's followers once AniList has answered, since a follow cannot be given back. */
export function useRemoveFollower() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const viewerId = useAuth((s) => s.viewer?.id);

  const remove = useMutation({
    mutationFn: (vars: { userId: number; name: string }) => removeFollower(vars.userId),
    onSuccess: (_result, { userId, name }) => {
      if (viewerId != null) {
        // Read before any patch: a follower the viewer follows back was also one of the viewer's mutuals.
        const wasMutual = cachedRelation(qc, userId) === "mutual";
        // Out of the viewer's own two lists that hold followers, and their counts one lower.
        for (const scope of ["followers", "mutual"] as const) {
          qc.setQueryData<InfiniteData<UserPage>>(["social", scope, viewerId], (old) =>
            old ? { ...old, pages: withoutUser(old.pages, userId) } : old,
          );
        }
        qc.setQueryData<FollowCounts>(["social", "followCounts", viewerId], (old) =>
          old
            ? { ...old, followers: Math.max(0, old.followers - 1), mutual: wasMutual ? Math.max(0, old.mutual - 1) : old.mutual }
            : old,
        );
      }
      // Everywhere else they appear, they no longer follow the viewer; whether the viewer follows them stays.
      qc.setQueriesData<UserProfile>({ queryKey: ["social", "user"] }, (old) =>
        old && old.id === userId ? { ...old, ...relationFlags(afterRemoval(followRelation(old))) } : old,
      );
      for (const scope of ["followers", "following", "mutual", "userSearch"] as const) {
        qc.setQueriesData<InfiniteData<UserPage>>({ queryKey: ["social", scope] }, (old) => {
          if (!old || !old.pages.some((p) => p.users.some((u) => u.id === userId))) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              users: p.users.map((u) => (u.id === userId ? { ...u, ...relationFlags(afterRemoval(followRelation(u))) } : u)),
            })),
          };
        });
      }
      // No Undo: only they can follow again.
      showToast({ kind: "success", text: t("social.followerRemovedToast", { name }) });
    },
    onError: (_err, vars) => {
      showToast({
        kind: "error",
        text: t("social.removeFollowerFailed", { name: vars.name }),
        detail: t("social.followFailedDetail"),
        action: { label: t("common.retry"), run: () => remove.mutate(vars) },
      });
    },
  });

  return remove;
}

/** The relation cached for a user on any loaded list page, or "none" when no page holds them. */
function cachedRelation(qc: ReturnType<typeof useQueryClient>, userId: number): FollowRelation {
  for (const scope of ["followers", "mutual", "following", "userSearch"] as const) {
    for (const [, data] of qc.getQueriesData<InfiniteData<UserPage>>({ queryKey: ["social", scope] })) {
      for (const page of data?.pages ?? []) {
        const hit = page.users.find((u) => u.id === userId);
        if (hit) return followRelation(hit);
      }
    }
  }
  return "none";
}
