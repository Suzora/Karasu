import type { ReactNode } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Heart, MessageSquare } from "lucide-react";
import { isTauri } from "@/api/anilist";
import { userForumComments } from "@/api/social";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PerchRule } from "@/components/EmptyState";
import { Busy, Shimmer } from "@/components/Skeleton";
import { renderPlain } from "@/lib/anilistMarkdown";
import { nextPageParam } from "@/lib/paging";
import { relTimeFromSeconds } from "@/lib/relTime";
import { staggerDelay } from "@/lib/motion";
import { cardClass } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** One user's forum comments across every thread, newest first, paged by a button and never a scroll. */
export function UserComments({
  userId,
  emptyTitle,
  emptyActions,
}: {
  userId: number;
  emptyTitle: string;
  emptyActions?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const queryKey = ["social", "userComments", userId];

  const q = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => userForumComments(userId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => nextPageParam(last.pageInfo),
    enabled: isTauri && userId > 0,
    staleTime: 10 * 60 * 1000,
  });

  if (q.isLoading) {
    return (
      <Busy className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Shimmer key={i} className="h-16 w-full rounded-panel" index={i} />
        ))}
      </Busy>
    );
  }

  // First occurrence wins: ID_DESC pages shift between fetches, and a repeated row would be a duplicate React key.
  const seen = new Set<number>();
  const rows = (q.data?.pages ?? [])
    .flatMap((p) => p.comments)
    .filter((c) => !seen.has(c.id) && (seen.add(c.id), true));

  // Only when there is nothing on screen to lose — the `ThreadList` rule.
  if (q.error && !rows.length && !q.hasNextPage) {
    return (
      <ErrorState
        error={q.error}
        visual={<PerchRule />}
        onRetry={() => qc.resetQueries({ queryKey, exact: true })}
      />
    );
  }

  const footer = (
    <>
      {q.error && <ErrorState error={q.error} inline className="pt-1" />}
      {q.hasNextPage && (
        <div className="pt-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={q.isFetchingNextPage}
            onClick={() => void q.fetchNextPage()}
          >
            {q.isFetchingNextPage ? t("social.loadingMore") : t("social.loadMorePlain")}
          </Button>
        </div>
      )}
    </>
  );

  if (!rows.length) {
    return (
      <>
        <EmptyState
          visual={<PerchRule />}
          title={emptyTitle}
          actions={emptyActions}
        />
        {footer}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((c, i) => (
        <Link
          key={c.id}
          // The comment's own anchor, resolved by the thread page; a comment with no thread lands on the forum index.
          to={c.thread ? `/thread/${c.thread.id}?comment=${c.id}` : "/forum"}
          className={cn(cardClass("flat", { interactive: true }), "block animate-rise-in p-3")}
          style={{ animationDelay: `${staggerDelay(i)}ms` }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="size-3.5 shrink-0 text-ink-600" />
            <span className="min-w-0 truncate text-sm font-medium text-ink-100">
              {c.thread?.title ?? t("social.untitledThread")}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-3 text-2xs text-ink-600">
              {(c.likeCount ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="size-3.5" /> {c.likeCount}
                </span>
              )}
              {c.createdAt != null && relTimeFromSeconds(c.createdAt, i18n.language, t("notif.now"))}
            </span>
          </div>
          {/* The comment flattened to plain text through the shared parser; a spoiler stays the word "Spoiler" here. */}
          {c.comment && (
            <p className="mt-1.5 line-clamp-2 pl-5.5 text-xs leading-relaxed text-ink-500">
              {renderPlain(c.comment, 200, t("social.mdSpoiler"))}
            </p>
          )}
        </Link>
      ))}

      {footer}
    </div>
  );
}
