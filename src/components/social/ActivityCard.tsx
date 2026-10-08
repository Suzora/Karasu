import { useId, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ExternalLink, MessageSquare, Pin } from "lucide-react";
import { formatProgress, PROGRESS_VERBS, splitSentence, type FeedItem } from "@/lib/activity";
import { displayTitle } from "@/api/types";
import { isTauri } from "@/api/anilist";
import { activityReplies } from "@/api/social";
import { UserLockup } from "@/components/ui/user-lockup";
import { Button } from "@/components/ui/button";
import { DisclosurePanel } from "@/components/ui/disclosure";
import { Shimmer } from "@/components/Skeleton";
import { cardClass } from "@/components/ui/card";
import { Markdown } from "./Markdown";
import { MarkdownTextarea } from "./MarkdownTextarea";
import { sentenceFor } from "./activitySentence";
import { relTimeFromSeconds } from "@/lib/relTime";
import { validatePost } from "@/lib/composer";
import { canTogglePin } from "@/lib/donator";
import { useSocialActions } from "@/hooks/useSocialActions";
import { useActivityPost } from "@/hooks/useActivityPost";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/EmptyState";
import { LikeButton, reactionClass } from "./LikeButton";
import { IconButton } from "@/components/ui/icon-button";
import { shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";

/** The list-activity sentence, translated whole, with the title link in its slot. */
function ListSentence({ item }: { item: Extract<FeedItem, { kind: "list" }> }) {
  const { t } = useTranslation();

  const titleLink = item.media ? (
    <Link to={`/media/${item.media.id}`} className="text-accent-400 hover:underline">
      {displayTitle(item.media.title)}
    </Link>
  ) : null;

  // Missing a verb, title or needed progress, AniList's own words beat a sentence with a hole in it.
  if (
    item.verb === null ||
    item.media === null ||
    (PROGRESS_VERBS.has(item.verb) && item.progress === null)
  ) {
    return (
      <p>
        <span>{item.rawStatus}</span>
        {item.progress && (
          <span className="tabular-nums text-ink-100"> {formatProgress(item.progress)}</span>
        )}
        {titleLink && <> {titleLink}</>}
      </p>
    );
  }

  const n = item.progress ? formatProgress(item.progress) : undefined;
  const { before, after } = splitSentence(sentenceFor(item.verb, t, n));
  return (
    <p>
      {before}
      {titleLink}
      {after}
    </p>
  );
}

/** The flat reply list AniList returns — one level, which is its own shape. */
function ActivityReplies({ activityId }: { activityId: number }) {
  const { t, i18n } = useTranslation();
  const mode = useAuth((s) => s.mode);
  const { reply } = useSocialActions();
  const [draft, setDraft] = useState("");

  const q = useQuery({
    queryKey: ["social", "activityReplies", activityId],
    queryFn: () => activityReplies(activityId),
    enabled: isTauri,
    staleTime: 60 * 1000,
  });

  const check = validatePost(draft);
  const submitReply = () => {
    if (!check.ok || reply.isPending) return;
    reply.mutate({ activityId, text: check.text }, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="mt-3 space-y-2 border-l-2 border-hair pl-3">
      {q.isLoading && <Shimmer className="h-3 w-32 rounded-inner" />}
      {/* A failed fetch says nothing about the thread, so it must not fall through to "no replies yet". */}
      {q.error && (
        <ErrorState
          inline
          error={q.error}
          title={(reason) => t("social.repliesFailed", { message: reason })}
          onRetry={() => q.refetch()}
          className="text-2xs"
        />
      )}
      {q.data?.map((r) => (
        <div key={r.id} className="text-sm">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/user/${encodeURIComponent(r.user?.name ?? "")}`}
              className="min-w-0"
            >
              <UserLockup
                name={r.user?.name ?? "—"}
                src={r.user?.avatar?.medium}
                size="sm"
                nameClassName="text-xs font-medium text-ink-300"
                sub={
                  <span className="block text-2xs text-ink-600">
                    {relTimeFromSeconds(r.createdAt, i18n.language, t("notif.now"))}
                  </span>
                }
              />
            </Link>
            <LikeButton
              id={r.id}
              type="ACTIVITY_REPLY"
              activityId={activityId}
              likeCount={r.likeCount ?? 0}
              isLiked={r.isLiked === true}
            />
          </div>
          <Markdown source={r.text} className="mt-1" />
        </div>
      ))}
      {!q.isLoading && !q.error && !q.data?.length && (
        <p className="text-2xs text-ink-600">{t("social.noReplies")}</p>
      )}

      {mode === "anilist" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitReply();
          }}
          className="pt-1"
        >
          <MarkdownTextarea
            variant="compact"
            value={draft}
            onChange={setDraft}
            onSubmit={submitReply}
            placeholder={t("social.replyPlaceholder")}
            rows={1}
            actions={
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!check.ok || reply.isPending}
              >
                {reply.isPending ? t("social.posting") : t("social.postReply")}
              </Button>
            }
          />
        </form>
      )}
    </div>
  );
}

export function ActivityCard({
  item,
  openReplies = false,
}: {
  item: FeedItem;
  /** Start with the reply thread unfolded — the activity page's case. */
  openReplies?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [repliesOpen, setRepliesOpen] = useState(openReplies);
  const repliesId = useId();
  const viewer = useAuth((s) => s.viewer);
  const self = viewer !== null && viewer.id === item.user.id;
  // Pinning is a donator feature, so the toggle is offered only where it can succeed; see `lib/donator`.
  const showPin = canTogglePin(viewer, item, self);
  const { pin } = useActivityPost(viewer?.id);
  const when = relTimeFromSeconds(item.createdAt, i18n.language, t("notif.now"));
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);

  return (
    <article className={cn(cardClass("flat"), "flex gap-3 p-3")}>
      {item.kind === "list" && item.media?.coverImage?.large && (
        <Link
          to={`/media/${item.media.id}`}
          className="w-11 shrink-0 overflow-hidden rounded-inner"
          title={displayTitle(item.media.title)}
        >
          {/* Veiled like every other cover, and never revealed here: the title it links to has its own reveal. */}
          <img
            src={item.media.coverImage.large}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("aspect-2/3 w-full object-cover", shouldBlur(item.media, level, blurAdult) && "veil")}
          />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/user/${encodeURIComponent(item.user.name)}`} className="min-w-0">
            <UserLockup
              name={item.user.name}
              src={item.user.avatar?.medium}
              size="sm"
              nameClassName="text-xs font-medium text-ink-300"
              sub={<span className="block text-2xs text-ink-600">{when}</span>}
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {/* Your own activity gets the toggle if you may pin; anyone's pinned one gets the passive marker. */}
            {showPin ? (
              <IconButton
                size="xs"
                onClick={() => pin.mutate({ id: item.id, pinned: !item.isPinned })}
                disabled={pin.isPending}
                aria-pressed={item.isPinned}
                aria-label={item.isPinned ? t("social.unpin") : t("social.pin")}
                title={item.isPinned ? t("social.unpin") : t("social.pin")}
                className={cn("-m-1.5", item.isPinned && "text-accent-400 hover:text-accent-400")}
              >
                <Pin className={cn("size-3.5", item.isPinned && "fill-current")} />
              </IconButton>
            ) : (
              item.isPinned && (
                <span title={t("social.pinned")} className="text-accent-400">
                  <Pin className="size-3.5 fill-current" />
                </span>
              )
            )}
            <IconButton
              size="xs"
              onClick={() => void openUrl(item.siteUrl)}
              title={t("social.openOnAniList")}
              aria-label={t("social.openOnAniList")}
              className="-m-1.5"
            >
              <ExternalLink className="size-3.5" />
            </IconButton>
          </div>
        </div>

        <div className="mt-2 text-sm text-ink-300">
          {item.kind === "list" ? (
            <ListSentence item={item} />
          ) : (
            // Text activities are bio markdown, so the same renderer: no innerHTML and no remote images.
            <Markdown source={item.text} siteUrl={item.siteUrl} />
          )}
        </div>

        <div className="mt-2 flex items-center gap-1">
          <LikeButton
            id={item.id}
            type="ACTIVITY"
            likeCount={item.likeCount}
            isLiked={item.isLiked}
          />
          <button
            type="button"
            onClick={() => setRepliesOpen((v) => !v)}
            aria-expanded={repliesOpen}
            aria-controls={repliesId}
            aria-label={
              item.replyCount === 1
                ? t("social.repliesCountOne")
                : t("social.repliesCountMany", { count: item.replyCount })
            }
            className={reactionClass(repliesOpen)}
          >
            <MessageSquare aria-hidden className="size-3.5" />
            <span className="tabular-nums">{item.replyCount}</span>
          </button>
        </div>

        {/* One request per expansion, never eagerly, or every row pays for replies nobody opened. */}
        <DisclosurePanel open={repliesOpen} id={repliesId}>
          <ActivityReplies activityId={item.id} />
        </DisclosurePanel>
      </div>
    </article>
  );
}
