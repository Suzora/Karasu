import { displayTitle, type MediaTitle } from "@/api/types";
import { listActivityVerb, parseProgress, type ActivityVerb, type ProgressRange } from "@/lib/activity";
import { renderPlain } from "@/lib/anilistMarkdown";
import { isBlocked, type ContentFilterLevel } from "@/lib/contentFilter";
import type { TitleLanguage } from "@/lib/titleLanguage";

/** AniList's notification union flattened for the bell; ActivityMessageNotification is private mail and stays excluded. */

export type SiteNotifKind =
  | "AIRING"
  | "FOLLOWING"
  | "ACTIVITY_MENTION"
  | "ACTIVITY_REPLY"
  | "ACTIVITY_REPLY_SUBSCRIBED"
  | "ACTIVITY_LIKE"
  | "ACTIVITY_REPLY_LIKE"
  | "THREAD_COMMENT_MENTION"
  | "THREAD_COMMENT_REPLY"
  | "THREAD_SUBSCRIBED"
  | "THREAD_COMMENT_LIKE"
  | "THREAD_LIKE"
  | "RELATED_MEDIA_ADDITION"
  | "MEDIA_DATA_CHANGE"
  | "MEDIA_MERGE"
  | "MEDIA_DELETION"
  | "MEDIA_SUBMISSION_UPDATE"
  | "STAFF_SUBMISSION_UPDATE"
  | "CHARACTER_SUBMISSION_UPDATE";

/** `__typename` → kind. Being a map, an unlisted typename simply misses. */
const KIND_BY_TYPENAME: Record<string, SiteNotifKind> = {
  AiringNotification: "AIRING",
  FollowingNotification: "FOLLOWING",
  ActivityMentionNotification: "ACTIVITY_MENTION",
  ActivityReplyNotification: "ACTIVITY_REPLY",
  ActivityReplySubscribedNotification: "ACTIVITY_REPLY_SUBSCRIBED",
  ActivityLikeNotification: "ACTIVITY_LIKE",
  ActivityReplyLikeNotification: "ACTIVITY_REPLY_LIKE",
  ThreadCommentMentionNotification: "THREAD_COMMENT_MENTION",
  ThreadCommentReplyNotification: "THREAD_COMMENT_REPLY",
  ThreadCommentSubscribedNotification: "THREAD_SUBSCRIBED",
  ThreadCommentLikeNotification: "THREAD_COMMENT_LIKE",
  ThreadLikeNotification: "THREAD_LIKE",
  RelatedMediaAdditionNotification: "RELATED_MEDIA_ADDITION",
  MediaDataChangeNotification: "MEDIA_DATA_CHANGE",
  MediaMergeNotification: "MEDIA_MERGE",
  MediaDeletionNotification: "MEDIA_DELETION",
  MediaSubmissionUpdateNotification: "MEDIA_SUBMISSION_UPDATE",
  StaffSubmissionUpdateNotification: "STAFF_SUBMISSION_UPDATE",
  CharacterSubmissionUpdateNotification: "CHARACTER_SUBMISSION_UPDATE",
};

/** The loose shape a union member arrives in, everything nullable, since an unexpected shape is a normal outcome here. */
export interface RawSiteNotification {
  __typename?: string;
  id?: number | null;
  createdAt?: number | null;
  activityId?: number | null;
  commentId?: number | null;
  episode?: number | null;
  reason?: string | null;
  status?: string | null;
  deletedMediaTitle?: string | null;
  deletedMediaTitles?: (string | null)[] | string | null;
  submittedTitle?: string | null;
  user?: { id?: number | null; name?: string | null } | null;
  media?: {
    id?: number | null;
    title?: { romaji?: string | null; english?: string | null; native?: string | null } | null;
    /** Keep these in the query; without them the bell is the one surface that can still name a hidden title. */
    isAdult?: boolean | null;
    genres?: string[] | null;
  } | null;
  thread?: { id?: number | null; title?: string | null } | null;
  staff?: { id?: number | null; name?: { full?: string | null } | null } | null;
  character?: { id?: number | null; name?: { full?: string | null } | null } | null;
  /** A forum notification's comment, its text only. */
  comment?: { id?: number | null; comment?: string | null } | null;
}

/** One activity of the subjects request, fetched by a row's `activityId`; private mail is not in its type_in. */
export interface RawNotifActivity {
  __typename?: string;
  id?: number | null;
  status?: string | null;
  progress?: string | null;
  text?: string | null;
  user?: { id?: number | null; name?: string | null } | null;
  media?: (RawSiteNotification["media"] & { coverImage?: { medium?: string | null } | null }) | null;
}

/** What an activity or forum row is about; for a reply AniList sends the activity replied to, never the reply. */
export type NotifSubject =
  | {
      kind: "list";
      ownerId: number | null;
      ownerName: string | null;
      verb: ActivityVerb | null;
      progress: ProgressRange | null;
      /** Spelled at fetch; `visibleSubject` re-spells it from `media.title` in the language chosen since. */
      title: string;
      media: { id: number | null; title: MediaTitle; isAdult: boolean | null; genres: string[] | null };
      /** AniList's smallest cover; the bell veils it by the blur setting, and the filter hides the whole subject. */
      cover: string | null;
    }
  | { kind: "text"; ownerId: number | null; ownerName: string | null; text: string }
  | { kind: "comment"; text: string };

export interface SiteNotifRow {
  id: number;
  kind: SiteNotifKind;
  /** Unix seconds, as AniList sends it. */
  createdAt: number;
  /** The row's lead line: a user, a title, a thread — whoever the news is about. */
  title: string;
  /** The media's whole title when it is the lead line, so the bell can re-spell it in the current title language. */
  mediaTitle?: MediaTitle | null;
  /** The actor, for verbs where the lead line is something else (thread rows). */
  actorName: string | null;
  episode: number | null;
  /** Free text worth showing as data: a deletion reason, a merge's old titles. */
  detail: string | null;
  /** Route to open on click, or null when the subject no longer exists. */
  target: string | null;
  /** Grouping identity for `notifGroups`; keep the ids, since reverse-parsing the route re-derives what the API said. */
  userId: number | null;
  mediaId: number | null;
  activityId: number | null;
  /** The subject's content-filter fields, carried for the bell's `isBlocked` rather than decided here. */
  media: { isAdult?: boolean | null; genres?: string[] | null } | null;
  /** The activity or comment the row is about, or null where there is none to name. */
  subject: NotifSubject | null;
}

const ACTIVITY_KINDS: ReadonlySet<SiteNotifKind> = new Set([
  "ACTIVITY_MENTION",
  "ACTIVITY_REPLY",
  "ACTIVITY_REPLY_SUBSCRIBED",
  "ACTIVITY_LIKE",
  "ACTIVITY_REPLY_LIKE",
]);

const COMMENT_KINDS: ReadonlySet<SiteNotifKind> = new Set([
  "THREAD_COMMENT_MENTION",
  "THREAD_COMMENT_REPLY",
  "THREAD_SUBSCRIBED",
  "THREAD_COMMENT_LIKE",
]);

/** Text worth quoting: a post of nothing but images or embeds leaves no words, and no line beats empty quotes. */
const quotable = (text: string | null | undefined): string | null => {
  const trimmed = text?.trim();
  return trimmed && renderPlain(trimmed) ? trimmed : null;
};

/** The subject by the fetched activity's own typename only, so private mail, a deleted post or an odd shape names nothing. */
function subjectOf(raw: RawSiteNotification, kind: SiteNotifKind, activity: RawNotifActivity | undefined): NotifSubject | null {
  if (COMMENT_KINDS.has(kind)) {
    const text = quotable(raw.comment?.comment);
    return text ? { kind: "comment", text } : null;
  }
  if (!ACTIVITY_KINDS.has(kind)) return null;
  const owner = { ownerId: activity?.user?.id ?? null, ownerName: activity?.user?.name ?? null };
  if (activity?.__typename === "ListActivity") {
    const t = activity.media?.title;
    if (!t) return null;
    const title: MediaTitle = { english: t.english ?? null, romaji: t.romaji ?? null, native: t.native ?? null };
    return {
      kind: "list",
      ...owner,
      verb: listActivityVerb(activity.status),
      progress: parseProgress(activity.progress),
      title: displayTitle(title),
      media: {
        id: activity.media?.id ?? null,
        title,
        isAdult: activity.media?.isAdult ?? null,
        genres: activity.media?.genres ?? null,
      },
      cover: activity.media?.coverImage?.medium ?? null,
    };
  }
  if (activity?.__typename === "TextActivity") {
    const text = quotable(activity.text);
    return text ? { kind: "text", ...owner, text } : null;
  }
  return null;
}

/** The subject as the bell may show it: a filtered title hides this line, never the row; the viewer is not named. */
export function visibleSubject(
  subject: NotifSubject | null,
  level: ContentFilterLevel,
  viewerId: number | null,
  lang: TitleLanguage,
): NotifSubject | null {
  if (!subject || subject.kind === "comment") return subject;
  const ownerName = viewerId != null && subject.ownerId === viewerId ? null : subject.ownerName;
  if (subject.kind === "text") return { ...subject, ownerName };
  if (isBlocked(subject.media, level)) return null;
  return { ...subject, ownerName, title: displayTitle(subject.media.title, lang) };
}

/** The activity ids a page's subjects request asks for: activity rows only, each once, within one `id_in`. */
export function subjectActivityIds(raws: readonly (RawSiteNotification | null)[]): number[] {
  const ids = new Set<number>();
  for (const raw of raws) {
    const kind = raw?.__typename ? KIND_BY_TYPENAME[raw.__typename] : undefined;
    if (kind && ACTIVITY_KINDS.has(kind) && typeof raw?.activityId === "number") ids.add(raw.activityId);
  }
  return [...ids].slice(0, 50);
}

/** The subjects answer keyed by id; AniList may order it as it likes and leaves out what is gone. */
export function activitiesById(list: readonly (RawNotifActivity | null)[]): Map<number, RawNotifActivity> {
  const byId = new Map<number, RawNotifActivity>();
  for (const activity of list) if (typeof activity?.id === "number") byId.set(activity.id, activity);
  return byId;
}

const NO_ACTIVITIES: ReadonlyMap<number, RawNotifActivity> = new Map();

/** One notification, or null for anything the bell does not render; `activities` is the page's subjects answer. */
export function normalizeSiteNotification(
  raw: RawSiteNotification | null,
  activities: ReadonlyMap<number, RawNotifActivity> = NO_ACTIVITIES,
): SiteNotifRow | null {
  const kind = raw?.__typename ? KIND_BY_TYPENAME[raw.__typename] : undefined;
  if (!raw || kind === undefined || raw.id == null) return null;

  const userName = raw.user?.name ?? null;
  const mediaTitles: MediaTitle | null = raw.media?.title
    ? {
        english: raw.media.title.english ?? null,
        romaji: raw.media.title.romaji ?? null,
        native: raw.media.title.native ?? null,
      }
    : null;
  const mediaTitle = mediaTitles ? displayTitle(mediaTitles) : null;
  const threadTitle = raw.thread?.title ?? null;
  const personName = raw.staff?.name?.full ?? raw.character?.name?.full ?? null;
  const merged = Array.isArray(raw.deletedMediaTitles)
    ? raw.deletedMediaTitles.filter((t): t is string => typeof t === "string" && t.length > 0)
    : typeof raw.deletedMediaTitles === "string"
      ? [raw.deletedMediaTitles]
      : [];

  // The lead line: a thread row leads with the thread, a media row with the title, a person row with the person.
  const title =
    threadTitle ??
    mediaTitle ??
    userName ??
    personName ??
    raw.deletedMediaTitle ??
    raw.submittedTitle ??
    "—";

  // Where a click goes: the activity or thread before the actor, whose name is its own link; null for a deletion.
  const target =
    raw.activityId != null
      ? `/activity/${raw.activityId}`
      : raw.thread?.id != null
        ? raw.commentId != null
          ? `/thread/${raw.thread.id}?comment=${raw.commentId}`
          : `/thread/${raw.thread.id}`
        : raw.media?.id != null
          ? `/media/${raw.media.id}`
          : raw.staff?.id != null
            ? `/staff/${raw.staff.id}`
            : raw.character?.id != null
              ? `/character/${raw.character.id}`
              : userName
                ? `/user/${encodeURIComponent(userName)}`
                : null;

  return {
    id: raw.id,
    kind,
    createdAt: raw.createdAt ?? 0,
    title,
    mediaTitle: threadTitle === null ? mediaTitles : null,
    actorName: userName,
    episode: raw.episode ?? null,
    detail: merged.length > 0 ? merged.join(", ") : (raw.reason ?? raw.status ?? null),
    target,
    userId: raw.user?.id ?? null,
    mediaId: raw.media?.id ?? null,
    media: raw.media
      ? { isAdult: raw.media.isAdult ?? null, genres: raw.media.genres ?? null }
      : null,
    activityId: raw.activityId ?? null,
    subject: subjectOf(raw, kind, raw.activityId != null ? activities.get(raw.activityId) : undefined),
  };
}
