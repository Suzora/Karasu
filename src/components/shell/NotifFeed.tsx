import { Fragment, useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Bell as BellIcon,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Film,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import type { AppNotification } from "@/api/anilist";
import { EmptyState, TickMarks } from "@/components/EmptyState";
import { Shimmer } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuGroupLabel } from "@/components/ui/menu-row";
import type { Leave, Notifications } from "@/hooks/useNotifications";
import { sectionByDay, type GroupLabel, type NotifGroup, type UnifiedNotif } from "@/lib/notifGroups";
import { relTime } from "@/lib/relTime";
import type { SiteNotifKind, SiteNotifRow } from "@/lib/siteNotifications";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, typeof BellIcon> = {
  airing: CalendarClock,
  stale: Clock,
  sequel: Film,
};

/** Each kind of notice gets its own tint, because an episode, a stale entry and a sequel are not the same news. */
const KIND_TINT: Record<string, string> = {
  airing: "bg-accent-500/14 text-accent-400",
  stale: "bg-surface-800 text-ink-500",
  sequel: "bg-success/14 text-success",
};
const DEFAULT_TINT = "bg-surface-800 text-ink-500";

/** The site rows reuse the same vocabulary, grouped by what the news is rather than by API type. */
const SITE_ICON: Record<SiteNotifKind, typeof BellIcon> = {
  AIRING: CalendarClock,
  FOLLOWING: UserPlus,
  ACTIVITY_MENTION: MessageCircle,
  ACTIVITY_REPLY: MessageCircle,
  ACTIVITY_REPLY_SUBSCRIBED: MessageCircle,
  ACTIVITY_LIKE: Heart,
  ACTIVITY_REPLY_LIKE: Heart,
  THREAD_COMMENT_MENTION: MessageCircle,
  THREAD_COMMENT_REPLY: MessageCircle,
  THREAD_SUBSCRIBED: MessageCircle,
  THREAD_COMMENT_LIKE: Heart,
  THREAD_LIKE: Heart,
  RELATED_MEDIA_ADDITION: Film,
  MEDIA_DATA_CHANGE: Film,
  MEDIA_MERGE: Film,
  MEDIA_DELETION: Film,
  MEDIA_SUBMISSION_UPDATE: Film,
  STAFF_SUBMISSION_UPDATE: Film,
  CHARACTER_SUBMISSION_UPDATE: Film,
};

const SITE_TINT: Record<SiteNotifKind, string> = {
  AIRING: "bg-accent-500/14 text-accent-400",
  FOLLOWING: "bg-success/14 text-success",
  ACTIVITY_MENTION: "bg-surface-800 text-ink-500",
  ACTIVITY_REPLY: "bg-surface-800 text-ink-500",
  ACTIVITY_REPLY_SUBSCRIBED: "bg-surface-800 text-ink-500",
  ACTIVITY_LIKE: "bg-danger/14 text-danger",
  ACTIVITY_REPLY_LIKE: "bg-danger/14 text-danger",
  THREAD_COMMENT_MENTION: "bg-surface-800 text-ink-500",
  THREAD_COMMENT_REPLY: "bg-surface-800 text-ink-500",
  THREAD_SUBSCRIBED: "bg-surface-800 text-ink-500",
  THREAD_COMMENT_LIKE: "bg-danger/14 text-danger",
  THREAD_LIKE: "bg-danger/14 text-danger",
  RELATED_MEDIA_ADDITION: "bg-gold/14 text-gold",
  MEDIA_DATA_CHANGE: "bg-gold/14 text-gold",
  MEDIA_MERGE: "bg-gold/14 text-gold",
  MEDIA_DELETION: "bg-gold/14 text-gold",
  MEDIA_SUBMISSION_UPDATE: "bg-gold/14 text-gold",
  STAFF_SUBMISSION_UPDATE: "bg-gold/14 text-gold",
  CHARACTER_SUBMISSION_UPDATE: "bg-gold/14 text-gold",
};

/** Literal `t()` per case so `i18nKeys.test.ts` sees every key; AniList's English-only `context` is never rendered. */
function siteVerb(row: SiteNotifRow, t: (k: string, o?: Record<string, unknown>) => string): string {
  const name = row.actorName ?? "—";
  switch (row.kind) {
    case "AIRING":
      return t("notif.siteAiring", { n: row.episode ?? 0 });
    case "FOLLOWING":
      return t("notif.siteFollowing");
    case "ACTIVITY_MENTION":
      return t("notif.siteActivityMention");
    case "ACTIVITY_REPLY":
      return t("notif.siteActivityReply");
    case "ACTIVITY_REPLY_SUBSCRIBED":
      return t("notif.siteActivityReplySubscribed");
    case "ACTIVITY_LIKE":
      return t("notif.siteActivityLike");
    case "ACTIVITY_REPLY_LIKE":
      return t("notif.siteActivityReplyLike");
    case "THREAD_COMMENT_MENTION":
      return t("notif.siteThreadMention", { name });
    case "THREAD_COMMENT_REPLY":
      return t("notif.siteThreadReply", { name });
    case "THREAD_SUBSCRIBED":
      return t("notif.siteThreadSubscribed", { name });
    case "THREAD_COMMENT_LIKE":
      return t("notif.siteThreadCommentLike", { name });
    case "THREAD_LIKE":
      return t("notif.siteThreadLike", { name });
    case "RELATED_MEDIA_ADDITION":
      return t("notif.siteRelatedAdded");
    case "MEDIA_DATA_CHANGE":
      return t("notif.siteDataChange");
    case "MEDIA_MERGE":
      return t("notif.siteMerge");
    case "MEDIA_DELETION":
      return t("notif.siteDeleted");
    case "MEDIA_SUBMISSION_UPDATE":
      return t("notif.siteSubmissionMedia");
    case "STAFF_SUBMISSION_UPDATE":
      return t("notif.siteSubmissionStaff");
    case "CHARACTER_SUBMISSION_UPDATE":
      return t("notif.siteSubmissionCharacter");
  }
}

/** The grouped row's verb — the same literal-`t()` shape as `siteVerb`. */
function groupVerb(label: GroupLabel, t: (k: string, o?: Record<string, unknown>) => string): string {
  switch (label.kind) {
    case "likes":
      return t("notif.groupLikes", { n: label.n });
    case "replyLikes":
      return t("notif.groupReplyLikes", { n: label.n });
    case "replies":
      return t("notif.groupReplies", { n: label.n });
    case "airing":
      return t("notif.groupAiring", { n: label.n });
  }
}

const rowClass = (unread: boolean) =>
  cn(
    "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-surface hover:bg-surface-850 focus-inset",
    unread && "bg-surface-850/60",
  );

const tileClass = "mt-0.5 grid size-6 shrink-0 place-items-center rounded-inner";

/** A row that presses as a whole yet holds the actor's link: an empty button stretched over it, the link raised above. */
function LinkedRow({
  unread,
  labelledBy,
  expanded,
  onPress,
  children,
}: {
  unread: boolean;
  /** The ids of the lines the row reads as, since the button itself is empty. */
  labelledBy: string;
  expanded?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    // `isolate`, so the two layers stack inside the row and never over a header the list scrolls under.
    <div className={cn(rowClass(unread), "relative isolate")}>
      <button
        type="button"
        aria-labelledby={labelledBy}
        aria-expanded={expanded}
        onClick={onPress}
        className="absolute inset-0 z-5 cursor-pointer focus-inset"
      />
      {children}
    </div>
  );
}

/** The bell's rows, shared by the dropdown, the phone's sheet and the page; `leave` is how the surface steps aside. */
export function NotifFeed({
  n,
  leave,
  limit,
  byDay = false,
  more = false,
  emptyTitle,
}: {
  n: Notifications;
  leave: Leave;
  /** Only the newest few, for the dropdown's glance. */
  limit?: number;
  /** Today and earlier under their own labels. */
  byDay?: boolean;
  /** Offer AniList's next page at the foot. */
  more?: boolean;
  /** The empty line when a filter, not the stream, left nothing. */
  emptyTitle?: string;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rowTime = (atMs: number) => relTime(atMs, i18n.language, t("notif.now"));
  const groups = limit === undefined ? n.groups : n.groups.slice(0, limit);
  // Per feed, so the same row in the glance and on the page beneath it never shares an id.
  const uid = useId();

  // The actor's own page, for rows whose press goes to the activity; the name is then the profile's only door.
  const profileOf = (row: SiteNotifRow): string | null =>
    row.activityId != null && row.actorName ? `/user/${encodeURIComponent(row.actorName)}` : null;

  const profileLink = (to: string, text: string, id: string) => (
    <Link
      id={id}
      to={to}
      // Navigates itself, so the view-transition hook leaves it alone rather than pushing the profile a second time.
      data-own-navigation
      // Through `leave`, so the surface's back entry has unwound before the profile's is pushed.
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        leave(() => {
          if (to !== pathname) navigate(to);
        });
      }}
      // Above the row's stretched button, so the name stays its own press.
      className="relative z-10 truncate text-ui font-medium text-ink-100 hover:underline"
    >
      {text}
    </Link>
  );

  const renderLocal = (item: AppNotification) => {
    const Icon = KIND_ICON[item.kind] ?? BellIcon;
    return (
      <button type="button" onClick={() => void n.openLocal(item, leave)} className={rowClass(!item.read)}>
        <span className={cn(tileClass, KIND_TINT[item.kind] ?? DEFAULT_TINT)}>
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-ui font-medium text-ink-100">{item.title}</span>
            {!item.read && <Badge />}
          </span>
          <span className="mt-0.5 block text-xs text-ink-500">{item.body}</span>
          <span className="mt-0.5 block text-2xs text-ink-600">{rowTime(item.createdMs)}</span>
        </span>
        {/* Two rows that look identical must not behave differently: a row with nowhere to go omits the chevron. */}
        {item.mediaId != null && <ChevronRight aria-hidden className="mt-1 size-3.5 shrink-0 text-ink-600" />}
      </button>
    );
  };

  const renderSite = (row: SiteNotifRow, unread: boolean) => {
    const Icon = SITE_ICON[row.kind];
    const profile = profileOf(row);
    const id = `${uid}-s${row.id}`;
    // Lines the stretched button already speaks are hidden from a reader, so the row is not read twice.
    const spoken = profile ? true : undefined;
    const body = (
      <>
        <span className={cn(tileClass, SITE_TINT[row.kind])}>
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {profile ? (
              profileLink(profile, row.title, `${id}-lead`)
            ) : (
              <span className="truncate text-ui font-medium text-ink-100">{row.title}</span>
            )}
            {unread && <Badge />}
          </span>
          <span id={`${id}-verb`} aria-hidden={spoken} className="mt-0.5 block text-xs text-ink-500">
            {siteVerb(row, t)}
          </span>
          {row.detail && (
            <span id={`${id}-detail`} aria-hidden={spoken} className="mt-0.5 block truncate text-2xs text-ink-600">
              {row.detail}
            </span>
          )}
          <span id={`${id}-time`} aria-hidden={spoken} className="mt-0.5 block text-2xs text-ink-600">
            {rowTime(row.createdAt * 1000)}
          </span>
        </span>
      </>
    );
    // A button cannot hold a link, so a row with the actor's name puts the two side by side instead.
    if (profile) {
      const lines = [`${id}-lead`, `${id}-verb`, row.detail ? `${id}-detail` : null, `${id}-time`];
      return (
        <LinkedRow unread={unread} labelledBy={lines.filter(Boolean).join(" ")} onPress={() => n.openSite(row, leave)}>
          {body}
        </LinkedRow>
      );
    }
    return (
      <button
        type="button"
        onClick={() => n.openSite(row, leave)}
        disabled={!row.target}
        className={cn(rowClass(unread), "disabled:hover:bg-transparent")}
      >
        {body}
      </button>
    );
  };

  const renderItem = (item: UnifiedNotif) =>
    item.local ? renderLocal(item.local) : item.site ? renderSite(item.site, item.unread) : null;

  const renderGroup = (g: NotifGroup) => {
    const label = g.label!;
    const open = n.expanded.has(g.key);
    const lead = label.kind === "airing" ? label.title : label.name;
    // An actor group's press unfolds it, so the name carries the profile, beside the row's press rather than inside.
    const actor = label.kind !== "airing" ? g.items[0]?.site?.actorName : null;
    const id = `${uid}-g${g.key}`;
    const spoken = actor ? true : undefined;
    const Icon = label.kind === "airing" ? CalendarClock : label.kind === "replies" ? MessageCircle : Heart;
    const tint =
      label.kind === "airing"
        ? "bg-accent-500/14 text-accent-400"
        : label.kind === "replies"
          ? "bg-surface-800 text-ink-500"
          : "bg-danger/14 text-danger";
    const expanded = label.kind === "airing" ? undefined : open;
    const content = (
      <>
        <span className={cn(tileClass, tint)}>
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {actor ? (
              profileLink(`/user/${encodeURIComponent(actor)}`, lead, `${id}-lead`)
            ) : (
              <span className="truncate text-ui font-medium text-ink-100">{lead}</span>
            )}
            <Badge tone="neutral" count={label.n} />
            {g.unread && <Badge />}
          </span>
          <span id={`${id}-verb`} aria-hidden={spoken} className="mt-0.5 block text-xs text-ink-500">
            {groupVerb(label, t)}
          </span>
          <span id={`${id}-time`} aria-hidden={spoken} className="mt-0.5 block text-2xs text-ink-600">
            {rowTime(g.atMs)}
          </span>
        </span>
        {label.kind === "airing" ? (
          <ChevronRight aria-hidden className="mt-1 size-3.5 shrink-0 text-ink-600" />
        ) : (
          <ChevronDown
            aria-hidden
            className={cn("mt-1 size-3.5 shrink-0 text-ink-600 transition-transform", open && "rotate-180")}
          />
        )}
      </>
    );
    return (
      <li key={g.key}>
        {actor ? (
          <LinkedRow
            unread={g.unread}
            labelledBy={`${id}-lead ${id}-verb ${id}-time`}
            expanded={expanded}
            onPress={() => n.openGroup(g, leave)}
          >
            {content}
          </LinkedRow>
        ) : (
          <button
            type="button"
            onClick={() => n.openGroup(g, leave)}
            aria-expanded={expanded}
            className={rowClass(g.unread)}
          >
            {content}
          </button>
        )}
        {open && (
          <ul className="ml-5.5 border-l border-hair pl-2">
            {g.items.map((m) => (
              <li key={m.key}>{renderItem(m)}</li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const list = (gs: NotifGroup[]) => (
    <ul>{gs.map((g) => (g.label ? renderGroup(g) : <li key={g.key}>{renderItem(g.items[0])}</li>))}</ul>
  );

  const dayLabel = (day: "today" | "earlier") => (day === "today" ? t("notif.today") : t("notif.earlier"));

  return (
    <>
      {n.loadError && (
        <p className="px-3 py-4 text-center text-sm text-danger">{t("common.error", { message: n.loadError })}</p>
      )}
      {n.showsSite && n.site.error != null && (
        <p className="px-3 py-4 text-xs text-danger">{t("common.error", { message: String(n.site.error) })}</p>
      )}
      {n.showsSite && n.site.isLoading && groups.length === 0 && (
        <div className="space-y-2 p-3">
          <Shimmer className="h-10 w-full rounded-control" />
          <Shimmer className="h-10 w-full rounded-control" />
        </div>
      )}
      {!n.loadError && !(n.showsSite && n.site.isLoading) && groups.length === 0 && (
        <EmptyState visual={<TickMarks />} title={emptyTitle ?? t("notif.empty")} className="py-6" />
      )}
      {groups.length > 0 &&
        (byDay
          ? sectionByDay(groups, Date.now()).map((s) => (
              <Fragment key={s.day}>
                <MenuGroupLabel className="px-3 pt-2.5">{dayLabel(s.day)}</MenuGroupLabel>
                {list(s.groups)}
              </Fragment>
            ))
          : list(groups))}
      {more && n.showsSite && n.site.hasNextPage && (
        <div className="border-t border-hair p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => n.site.fetchNextPage()}
            disabled={n.site.isFetchingNextPage}
            className="w-full"
          >
            {t("social.loadMorePlain")}
          </Button>
        </div>
      )}
    </>
  );
}
