import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { singleActivity } from "@/api/social";
import { normalizeActivity, type RawActivity } from "@/lib/activity";
import { ActivityCard } from "@/components/social/ActivityCard";
import BackButton from "@/components/shell/BackButton";
import { EmptyState, ErrorState, StruckQuery } from "@/components/EmptyState";
import { Busy, Shimmer } from "@/components/Skeleton";
import { useContentFilter } from "@/stores/contentFilter";
import { isBlocked } from "@/lib/contentFilter";
import { isNotFound } from "@/lib/apiError";

/** One activity on its own page through the feed's `ActivityCard`; a `MessageActivity` reads as gone on purpose. */
export default function Activity() {
  const { t } = useTranslation();
  const { id } = useParams();
  const level = useContentFilter((s) => s.level);
  const activityId = Number(id);

  const query = useQuery({
    queryKey: ["social", "activity", activityId],
    queryFn: () => singleActivity(activityId),
    enabled: Number.isFinite(activityId),
    staleTime: 60_000,
  });

  const item =
    query.data != null ? normalizeActivity(query.data as RawActivity) : null;
  const filtered =
    item?.kind === "list" && isBlocked(item.media, level);
  // Only a not-found means the activity is gone; any other failure is a failure to ask (lib/apiError).
  const failed = query.data === undefined && query.error != null && !isNotFound(query.error);

  return (
    <div className="mx-auto max-w-2xl px-8 pb-12 pt-6">
      <BackButton />
      <div className="mt-4">
        {query.isLoading && (
          <Busy>
            <Shimmer className="h-28 w-full rounded-panel" />
          </Busy>
        )}
        {!query.isLoading && failed && (
          <ErrorState
            error={query.error}
            visual={<StruckQuery query={`#${id ?? ""}`} />}
            onRetry={() => query.refetch()}
          />
        )}
        {!query.isLoading && filtered && (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-300">{t("detail.filtered")}</p>
            <Link
              to="/settings?pane=appearance"
              className="mt-1 inline-block text-xs text-accent-400 hover:underline"
            >
              {t("detail.filteredHint")}
            </Link>
          </div>
        )}
        {!query.isLoading && !failed && !filtered && (
          item ? (
            <ActivityCard item={item} openReplies />
          ) : (
            <EmptyState
              visual={<StruckQuery query={`#${id ?? ""}`} />}
              title={t("social.activityGone")}
            />
          )
        )}
      </div>
    </div>
  );
}
