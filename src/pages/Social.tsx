import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Activity, BookOpen, ChevronDown, Clapperboard, Globe, MessageSquare, User, Users } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { ColumnPage, ColumnRule, PageTitle } from "@/components/shell/PageColumn";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { useUrlState } from "@/hooks/useUrlState";
import { feeds, feedVariables, kindsFor, parseFeedView, writeFeedView, type Feed, type FeedKind } from "@/lib/feedView";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import { ActivityComposer } from "@/components/social/ActivityComposer";
import { EmptyState, PerchRule } from "@/components/EmptyState";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "@/stores/auth";

/** The following feed as a stable sidebar page; the viewer comes from the store, so opening it costs one request. */
export default function Social() {
  const { t } = useTranslation();
  const loading = useAuth((s) => s.loading);
  const mode = useAuth((s) => s.mode);
  const viewer = useAuth((s) => s.viewer);

  if (loading) return null;

  if (mode !== "anilist" || !viewer) {
    return (
      <div className="px-8 pt-7">
        <h1 className="sr-only">{t("nav.social")}</h1>
        <EmptyState
          visual={<PerchRule />}
          title={t("social.needsAccount")}
          hint={t("social.needsAccountHint")}
          actions={
            <Link to="/settings?pane=account" className={buttonClass("secondary", "sm")}>
              {t("social.goToSettings")}
            </Link>
          }
        />
      </div>
    );
  }

  return <Feeds viewerId={viewer.id} viewerName={viewer.name} />;
}

const FEED_ICON: Record<Feed, typeof Users> = { following: Users, everyone: Globe, mine: User };
const KIND_ICON: Record<FeedKind, typeof Users> = { all: Activity, text: MessageSquare, anime: Clapperboard, manga: BookOpen };
const feedKey = { following: "social.feedFollowing", everyone: "social.feedEveryone", mine: "social.feedMine" } as const;
const kindKey = { all: "social.kindAll", text: "social.kindText", anime: "social.kindAnime", manga: "social.kindManga" } as const;

/** The feeds beside their column; the view lives in the URL, and each pick asks AniList once for it. */
function Feeds({ viewerId, viewerName }: { viewerId: number; viewerName: string }) {
  const { t } = useTranslation();
  const phone = usePhoneShell();
  const [view, setView] = useUrlState(parseFeedView, writeFeedView);
  // A feed that cannot show the current kind falls back to everything rather than to a view AniList answers empty.
  const pickFeed = (feed: Feed) => setView((v) => ({ feed, kind: kindsFor(feed).includes(v.kind) ? v.kind : "all" }));
  const pickKind = (kind: FeedKind) => setView((v) => ({ ...v, kind }));
  const row = (on: boolean, label: string, Icon: typeof Users, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11",
        on ? "nav-pill" : "text-ink-300 hover:bg-surface-850 hover:text-ink-100",
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
  const column = (after?: () => void) => (
    <div className="space-y-0.5">
      <p className="px-4 pb-1 label-text text-ink-500">{t("social.feedHeading")}</p>
      {feeds.map((f) => row(view.feed === f, t(feedKey[f]), FEED_ICON[f], () => { pickFeed(f); after?.(); }))}
      <p className="px-4 pb-1 pt-3 label-text text-ink-500">{t("social.kindHeading")}</p>
      {kindsFor(view.feed).map((k) => row(view.kind === k, t(kindKey[k]), KIND_ICON[k], () => { pickKind(k); after?.(); }))}
    </div>
  );
  const plain = view.feed === "following" && view.kind === "all";
  const feed = (
    <ActivityFeed
      key={`${view.feed}-${view.kind}`}
      queryKey={["social", "feed", viewerId, view.feed, view.kind]}
      source={feedVariables(view, viewerId)}
      emptyTitle={plain ? t("social.feedEmpty") : t("social.feedEmptyFiltered")}
      emptyHint={plain ? t("social.feedEmptyHint") : undefined}
    />
  );
  const profile = (
    <Link to={`/user/${encodeURIComponent(viewerName)}`} className="press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm text-ink-300 transition-surface hover:bg-surface-850 hover:text-ink-100">
      <User aria-hidden className="size-4 shrink-0 opacity-70" />
      {t("social.myProfile")}
    </Link>
  );

  if (phone) {
    return (
      <div className="space-y-4 px-4 pb-24 pt-4">
        <PageTitle title={t("nav.social")} jp="みんな" />
        <Popover
          label={t("social.feedHeading")}
          variant="sheet"
          className="w-full"
          renderTrigger={(p) => (
            <button
              type="button"
              {...p}
              aria-label={t("social.feedPick", { feed: t(feedKey[view.feed]), kind: t(kindKey[view.kind]) })}
              className="flex w-full items-center gap-3 rounded-panel bg-surface-900 px-4 py-3 text-left surface-outline transition-surface hover:bg-surface-850"
            >
              <span className="truncate text-base text-ink-100">{`${t(feedKey[view.feed])} · ${t(kindKey[view.kind])}`}</span>
              <span className="flex-1" />
              <ChevronDown aria-hidden className="size-4 text-ink-500" />
            </button>
          )}
        >
          {(api) => column(api.close)}
        </Popover>
        <ActivityComposer />
        {feed}
      </div>
    );
  }

  return (
    <ColumnPage
      scroll="page"
      contentClassName="max-w-3xl space-y-4"
      column={
        <>
          <PageTitle title={t("nav.social")} jp="みんな" className="mb-3" />
          {column()}
          <ColumnRule />
          {profile}
        </>
      }
    >
      <ActivityComposer />
      {feed}
    </ColumnPage>
  );
}
