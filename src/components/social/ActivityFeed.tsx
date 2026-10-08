import { useInfiniteQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isTauri } from "@/api/anilist";
import { activities, type ActivityPage } from "@/api/social";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, PerchRule } from "@/components/EmptyState";
import { Busy, Shimmer } from "@/components/Skeleton";
import { cardClass } from "@/components/ui/card";
import { normalizeActivity, type FeedItem } from "@/lib/activity";
import { nextPageParam } from "@/lib/paging";
import { isBlocked } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { staggerDelay } from "@/lib/motion";
import { ActivityCard } from "./ActivityCard";
import { cn } from "@/lib/utils";

/** Activity feed paged by a button, never a scroll; no remaining count, because `pageInfo.total` is a capped sentinel. */
export function ActivityFeed({
  queryKey,
  source,
  emptyTitle,
  emptyHint,
}: {
  queryKey: QueryKey;
  source: { userId: number } | { isFollowing: true };
  emptyTitle: string;
  emptyHint?: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const level = useContentFilter((s) => s.level);

  const q = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => activities(source, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: ActivityPage) => nextPageParam(last.pageInfo),
    enabled: isTauri,
    staleTime: 2 * 60 * 1000,
  });

  if (q.isLoading) {
    return (
      <Busy className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(cardClass("flat"), "flex gap-3 p-3")}>
            <Shimmer className="aspect-2/3 w-11 rounded-inner" index={i} />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-3 w-28 rounded-inner" index={i} />
              <Shimmer className="h-3 w-full rounded-inner" index={i + 1} />
            </div>
          </div>
        ))}
      </Busy>
    );
  }

  // `normalizeActivity` drops private messages; the content filter runs here because `Page.activities` cannot.
  const items: FeedItem[] = (q.data?.pages ?? [])
    .flatMap((p) => p.activities)
    .map((raw) => normalizeActivity(raw as Parameters<typeof normalizeActivity>[0]))
    .filter((i): i is FeedItem => i !== null)
    .filter((i) => (i.kind === "list" && i.media ? !isBlocked(i.media, level) : true));

  // Only when there is nothing on screen to lose — the `ThreadList` rule.
  if (q.error && !items.length) {
    return (
      <ErrorState
        error={q.error}
        visual={<PerchRule />}
        onRetry={() => qc.resetQueries({ queryKey, exact: true })}
      />
    );
  }

  if (!items.length) {
    return <EmptyState visual={<PerchRule />} title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="animate-rise-in"
          style={{ animationDelay: `${staggerDelay(i)}ms` }}
        >
          <ActivityCard item={item} />
        </div>
      ))}

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
    </div>
  );
}
