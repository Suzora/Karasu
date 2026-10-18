import { useState } from "react";
import { useInfiniteQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { isTauri } from "@/api/anilist";
import { activities, type ActivityPage, type ActivitySource } from "@/api/social";
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
  requestSource,
  enabled = true,
  variant = "card",
  step,
}: {
  queryKey: QueryKey;
  source: ActivitySource;
  emptyTitle: string;
  emptyHint?: string;
  /** The name the request is tallied under; without it the passthrough names it after its root field. */
  requestSource?: string;
  /** False holds the first request back, as the Overview does until its lists have answered. */
  enabled?: boolean;
  /** `row` draws the entries flat inside a panel of the caller's, without each one's frame and owner. */
  variant?: "card" | "row";
  /** Shows this many entries and this many more per press, asking AniList for a page only once those run out. */
  step?: number;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const level = useContentFilter((s) => s.level);
  const [shown, setShown] = useState(step ?? Infinity);

  const q = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => activities(source, pageParam, requestSource ? { source: requestSource } : undefined),
    initialPageParam: 1,
    getNextPageParam: (last: ActivityPage) => nextPageParam(last.pageInfo),
    enabled: isTauri && enabled,
    staleTime: 2 * 60 * 1000,
  });

  // A held query is pending, not empty: without data it must not say there is nothing.
  if (q.isLoading || (!enabled && !q.data)) {
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

  const visible = items.slice(0, shown);
  const more = items.length > shown || q.hasNextPage;
  const loadMore = () => {
    const next = shown + (step ?? 0);
    if (step) setShown(next);
    // A page is asked for only once the entries already in hand cannot fill the next step.
    if (q.hasNextPage && items.length < (step ? next : Infinity)) void q.fetchNextPage();
  };

  return (
    <div className="space-y-2">
      {visible.map((item, i) => (
        <div
          key={`${item.kind}-${item.id}`}
          className="animate-rise-in"
          style={{ animationDelay: `${staggerDelay(i)}ms` }}
        >
          <ActivityCard item={item} variant={variant} />
        </div>
      ))}

      {q.error && <ErrorState error={q.error} inline className="pt-1" />}
      {more && (
        <div className="pt-1">
          <Button
            variant="secondary"
            size="sm"
            disabled={q.isFetchingNextPage}
            onClick={loadMore}
          >
            {q.isFetchingNextPage ? t("social.loadingMore") : t("social.loadMorePlain")}
          </Button>
        </div>
      )}
    </div>
  );
}
