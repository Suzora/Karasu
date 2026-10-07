import { describe, expect, it } from "vitest";
import {
  activitiesById,
  normalizeSiteNotification,
  subjectActivityIds,
  visibleSubject,
  type NotifSubject,
  type RawNotifActivity,
  type RawSiteNotification,
} from "./siteNotifications";

describe("normalizeSiteNotification", () => {
  it("flattens an airing notification to the media and its episode", () => {
    const row = normalizeSiteNotification({
      __typename: "AiringNotification",
      id: 1,
      createdAt: 1700000000,
      episode: 12,
      media: {
        id: 42,
        title: { romaji: "Sousou no Frieren", english: "Frieren", native: null },
        isAdult: false,
        genres: ["Adventure"],
      },
    });
    expect(row).toEqual({
      id: 1,
      kind: "AIRING",
      createdAt: 1700000000,
      title: "Frieren",
      // Kept whole so the bell can re-spell the lead line when the title language changes.
      mediaTitle: { romaji: "Sousou no Frieren", english: "Frieren", native: null },
      actorName: null,
      episode: 12,
      detail: null,
      target: "/media/42",
      userId: null,
      mediaId: 42,
      activityId: null,
      // Carried so the bell can apply the content filter: an aired-episode line names a title as a cover shows one.
      media: { isAdult: false, genres: ["Adventure"] },
      subject: null,
    });
  });

  it("targets the activity itself when the row carries one", () => {
    const row = normalizeSiteNotification({
      __typename: "ActivityLikeNotification",
      id: 3,
      createdAt: 5,
      activityId: 4242,
      user: { id: 7, name: "Alice" },
    });
    expect(row?.kind).toBe("ACTIVITY_LIKE");
    expect(row?.title).toBe("Alice");
    // The press goes to the news; the bell renders the name as the profile's own link off `actorName`/`userId`.
    expect(row?.target).toBe("/activity/4242");
    expect(row?.activityId).toBe(4242);
    expect(row?.userId).toBe(7);
  });

  it("leads a follow with the follower and targets their profile", () => {
    const row = normalizeSiteNotification({
      __typename: "FollowingNotification",
      id: 2,
      createdAt: 5,
      user: { id: 7, name: "Kyusetzu" },
    });
    expect(row?.kind).toBe("FOLLOWING");
    expect(row?.title).toBe("Kyusetzu");
    expect(row?.target).toBe("/user/Kyusetzu");
  });

  it("leads a thread row with the thread, keeps the actor, and the thread wins the click", () => {
    const row = normalizeSiteNotification({
      __typename: "ThreadCommentReplyNotification",
      id: 3,
      createdAt: 5,
      user: { id: 7, name: "someone" },
      thread: { id: 99, title: "Weekly chapter talk" },
    });
    expect(row?.kind).toBe("THREAD_COMMENT_REPLY");
    expect(row?.title).toBe("Weekly chapter talk");
    expect(row?.actorName).toBe("someone");
    // Both a thread and a user are present; the thread is the news.
    expect(row?.target).toBe("/thread/99");
  });

  it("lands a thread reply on the comment itself when the id is carried", () => {
    const row = normalizeSiteNotification({
      __typename: "ThreadCommentReplyNotification",
      id: 4,
      createdAt: 5,
      commentId: 555,
      user: { id: 7, name: "someone" },
      thread: { id: 99, title: "Weekly chapter talk" },
    });
    expect(row?.target).toBe("/thread/99?comment=555");
  });

  it("a thread like stays thread-level — it has no comment to land on", () => {
    const row = normalizeSiteNotification({
      __typename: "ThreadLikeNotification",
      id: 5,
      createdAt: 5,
      user: { id: 7, name: "someone" },
      thread: { id: 99, title: "Weekly chapter talk" },
    });
    expect(row?.target).toBe("/thread/99");
  });

  it("normalises private mail to null — ActivityMessageNotification is never rendered", () => {
    expect(
      normalizeSiteNotification({
        __typename: "ActivityMessageNotification",
        id: 4,
        createdAt: 5,
        user: { id: 7, name: "someone" },
      }),
    ).toBeNull();
  });

  it("normalises the unforeseen to null rather than guessing", () => {
    expect(normalizeSiteNotification(null)).toBeNull();
    expect(normalizeSiteNotification({})).toBeNull();
    expect(
      normalizeSiteNotification({ __typename: "SomeFutureNotification", id: 9, createdAt: 1 }),
    ).toBeNull();
    // A recognised shape without an id cannot be a React key or a read marker.
    expect(
      normalizeSiteNotification({ __typename: "AiringNotification", createdAt: 1 }),
    ).toBeNull();
  });

  it("a deletion keeps the dead title as the lead and goes nowhere", () => {
    const row = normalizeSiteNotification({
      __typename: "MediaDeletionNotification",
      id: 5,
      createdAt: 5,
      deletedMediaTitle: "Some Cancelled OVA",
      reason: "Duplicate of another entry",
    });
    expect(row?.title).toBe("Some Cancelled OVA");
    expect(row?.detail).toBe("Duplicate of another entry");
    expect(row?.target).toBeNull();
  });

  it("a merge joins the absorbed titles into the detail line, however they arrive", () => {
    const asList: RawSiteNotification = {
      __typename: "MediaMergeNotification",
      id: 6,
      createdAt: 5,
      deletedMediaTitles: ["Old Name", null, "Older Name", ""],
      media: { id: 10, title: { romaji: "Kept Name", english: null, native: null } },
    };
    expect(normalizeSiteNotification(asList)?.detail).toBe("Old Name, Older Name");
    // The schema says [String]; a defensive path for a bare string costs one line.
    expect(
      normalizeSiteNotification({ ...asList, deletedMediaTitles: "Old Name" })?.detail,
    ).toBe("Old Name");
  });

  it("submission updates target the staff or character page they concern", () => {
    expect(
      normalizeSiteNotification({
        __typename: "StaffSubmissionUpdateNotification",
        id: 7,
        createdAt: 5,
        status: "Accepted",
        staff: { id: 55, name: { full: "Kana Ichinose" } },
      }),
    ).toMatchObject({ title: "Kana Ichinose", detail: "Accepted", target: "/staff/55" });
    expect(
      normalizeSiteNotification({
        __typename: "CharacterSubmissionUpdateNotification",
        id: 8,
        createdAt: 5,
        character: { id: 66, name: { full: "Ichigo" } },
      }),
    ).toMatchObject({ title: "Ichigo", target: "/character/66" });
  });

  // The caller drops a row about a hidden title, so it needs the fields to judge with.
  it("carries the filter fields for a title it is about", () => {
    const row = normalizeSiteNotification({
      __typename: "AiringNotification",
      id: 9,
      createdAt: 1,
      episode: 3,
      media: { id: 7, title: { romaji: "X", english: null, native: null }, isAdult: true, genres: ["Hentai"] },
    });
    expect(row?.media).toEqual({ isAdult: true, genres: ["Hentai"] });
  });

  it("has no media to judge for a row that is not about a title", () => {
    const row = normalizeSiteNotification({
      __typename: "ThreadLikeNotification",
      id: 10,
      createdAt: 1,
      user: { id: 2, name: "Bob" },
      thread: { id: 5, title: "A thread" },
    });
    expect(row?.media).toBeNull();
  });
});

const FRIEREN = {
  id: 42,
  title: { romaji: "Sousou no Frieren", english: "Frieren", native: "葬送のフリーレン" },
  isAdult: false,
  genres: ["Adventure"],
};

/** A like on activity 300, as the notification query sends it: the id alone. */
const LIKE: RawSiteNotification = {
  __typename: "ActivityLikeNotification",
  id: 20,
  createdAt: 5,
  activityId: 300,
  user: { id: 7, name: "Mikan" },
};

/** The like normalized with `activity` as the subjects answer for its id, or with nothing answered for it. */
const liked = (activity: RawNotifActivity | null) =>
  normalizeSiteNotification(LIKE, new Map(activity ? [[300, activity]] : []));

const listActivity = (status: string, progress: string | null, owner = { id: 1, name: "Kyusetzu" }, id = 300) => ({
  __typename: "ListActivity",
  id,
  status,
  progress,
  user: owner,
  media: FRIEREN,
});

describe("a notification's subject", () => {
  it("names a list activity by its verb, its progress and its title", () => {
    expect(liked(listActivity("watched episode", "7"))?.subject).toEqual({
      kind: "list",
      ownerId: 1,
      ownerName: "Kyusetzu",
      verb: "watchedEpisode",
      progress: { from: 7 },
      title: "Frieren",
      media: {
        id: 42,
        title: { english: "Frieren", romaji: "Sousou no Frieren", native: "葬送のフリーレン" },
        isAdult: false,
        genres: ["Adventure"],
      },
      cover: null,
    });
  });

  it("carries the smallest cover with a list subject, and none where AniList sent none", () => {
    const cover = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx42.jpg";
    const withCover = { ...listActivity("completed", null), media: { ...FRIEREN, coverImage: { medium: cover } } };
    expect(liked(withCover)?.subject).toMatchObject({ kind: "list", cover });
    expect(liked(listActivity("completed", null))?.subject).toMatchObject({ cover: null });
  });

  /** An image or a video becomes a chip, which a quote leaves out, so a post of nothing else would quote nothing. */
  it("names nothing for a post that is only images or videos", () => {
    const text = "img220(https://i.imgur.com/a.png)\nyoutube(https://youtu.be/x)";
    const post = { __typename: "TextActivity", id: 302, text, user: { id: 5, name: "Hoshi" } };
    expect(liked(post)?.subject).toBeNull();
  });

  /** AniList writes these in English only; an unknown one becomes no verb, and the line then shows the title alone. */
  it("keeps a status it does not know as no verb rather than AniList's own words", () => {
    const subject = liked(listActivity("binged", null))?.subject;
    expect(subject).toMatchObject({ kind: "list", verb: null, progress: null, title: "Frieren" });
  });

  it("quotes a text activity and a forum comment, trimmed, and names nothing for an empty one", () => {
    const text = { __typename: "TextActivity", id: 301, text: "  Finally done. ~!It ends well!~ ", user: { id: 5, name: "Hoshi" } };
    expect(liked(text)?.subject).toEqual({
      kind: "text",
      ownerId: 5,
      ownerName: "Hoshi",
      text: "Finally done. ~!It ends well!~",
    });
    expect(liked({ ...text, text: "   " })?.subject).toBeNull();
    const comment = (body: string | null): RawSiteNotification => ({
      __typename: "ThreadCommentReplyNotification",
      id: 21,
      createdAt: 5,
      commentId: 555,
      user: { id: 7, name: "someone" },
      thread: { id: 99, title: "Weekly chapter talk" },
      comment: { id: 555, comment: body },
    });
    expect(normalizeSiteNotification(comment(" Agreed. "))?.subject).toEqual({ kind: "comment", text: "Agreed." });
    expect(normalizeSiteNotification(comment(null))?.subject).toBeNull();
  });

  /** The subjects query leaves MESSAGE out of its type_in; should private mail reach the map anyway, it still names nothing. */
  it("names nothing for private mail, even when text arrives with it", () => {
    const row = liked({ __typename: "MessageActivity", id: 300, text: "secret", user: { id: 3, name: "x" } });
    expect(row?.subject).toBeNull();
    expect(row?.target).toBe("/activity/300");
  });

  /** Deleted, private or a failed request: the answer then lacks the id, and the row must read as if none was asked. */
  it("leaves the row exactly as it was when the answer lacks its activity", () => {
    const gone = liked(null);
    expect(gone).toEqual(normalizeSiteNotification(LIKE));
    expect(gone).toEqual(normalizeSiteNotification(LIKE, activitiesById([listActivity("completed", null, undefined, 301)])));
    expect(gone?.subject).toBeNull();
  });

  /** AniList answers a nested list activity with null media and user, so a subject is never read off the row itself. */
  it("ignores an activity nested on the notification, where AniList leaves its media and user null", () => {
    const nested = { ...LIKE, activity: { __typename: "ListActivity", id: 300, status: "completed", progress: null, user: null, media: null } };
    expect(normalizeSiteNotification(nested as RawSiteNotification)?.subject).toBeNull();
    const post = { ...LIKE, activity: { __typename: "TextActivity", id: 300, text: "Finally done.", user: null } };
    expect(normalizeSiteNotification(post as RawSiteNotification)?.subject).toBeNull();
    expect(normalizeSiteNotification(post as RawSiteNotification, activitiesById([listActivity("completed", null, undefined, 301)]))?.subject).toBeNull();
    const joined = normalizeSiteNotification(nested as RawSiteNotification, activitiesById([listActivity("completed", null)]));
    expect(joined?.subject).toMatchObject({ kind: "list", title: "Frieren", ownerName: "Kyusetzu" });
  });

  /** The row filter, the lead line and the airing group key read the row's own media, which the subject must not become. */
  it("never moves the lead line, the target or the row's filter fields onto the subject's title", () => {
    const row = liked(listActivity("completed", null));
    expect(row).toMatchObject({ title: "Mikan", mediaTitle: null, mediaId: null, media: null, target: "/activity/300" });
  });

  it("gives a thread like no subject, since it carries no comment of its own", () => {
    const row = normalizeSiteNotification({
      __typename: "ThreadLikeNotification",
      id: 22,
      createdAt: 5,
      user: { id: 2, name: "Bob" },
      thread: { id: 5, title: "A thread" },
      comment: { id: 1, comment: "not ours to show" },
    });
    expect(row?.subject).toBeNull();
  });
});

describe("the subjects request's ids and answer", () => {
  const row = (__typename: string, activityId: number | null): RawSiteNotification => ({ __typename, id: 1, createdAt: 1, activityId });

  it("asks for each activity row's id once, and for nothing else", () => {
    const ids = subjectActivityIds([
      row("ActivityLikeNotification", 300),
      row("ActivityLikeNotification", 300),
      row("ActivityReplyNotification", 301),
      row("ActivityReplyLikeNotification", 302),
      row("ActivityMentionNotification", 303),
      row("ActivityReplySubscribedNotification", 304),
      row("ActivityLikeNotification", null),
      row("AiringNotification", 305),
      row("ThreadCommentReplyNotification", 306),
      null,
    ]);
    expect(ids).toEqual([300, 301, 302, 303, 304]);
  });

  /** Private mail's own notification is outside the bell's types, so its activity id is never even sent. */
  it("never asks for the activity of private mail or of a kind it does not know", () => {
    expect(subjectActivityIds([row("ActivityMessageNotification", 9), row("SomethingNewNotification", 10)])).toEqual([]);
  });

  it("stays within one id_in", () => {
    const many = Array.from({ length: 60 }, (_, i) => row("ActivityLikeNotification", 1000 + i));
    expect(subjectActivityIds(many)).toHaveLength(50);
  });

  it("keys the answer by id, whatever its order, and skips what has none", () => {
    const byId = activitiesById([listActivity("completed", null, undefined, 302), null, { __typename: "TextActivity" }, listActivity("dropped", null)]);
    expect([...byId.keys()]).toEqual([302, 300]);
    expect(byId.get(300)?.status).toBe("dropped");
  });
});

describe("visibleSubject", () => {
  const list = liked(listActivity("completed", null, { id: 5, name: "Hoshi" }))!
    .subject as Extract<NotifSubject, { kind: "list" }>;
  const withMedia = (over: Partial<typeof list.media>) => ({ ...list, media: { ...list.media, ...over } });

  it("hides the subject of a title the filter hides, at the filter's own levels", () => {
    expect(visibleSubject(withMedia({ isAdult: true }), "moderate", 1, "english")).toBeNull();
    expect(visibleSubject(withMedia({ isAdult: true }), "off", 1, "english")).not.toBeNull();
    expect(visibleSubject(withMedia({ genres: ["Ecchi"] }), "strict", 1, "english")).toBeNull();
    expect(visibleSubject(withMedia({ genres: ["Ecchi"] }), "moderate", 1, "english")).not.toBeNull();
  });

  it("drops the owner's name when the activity is the viewer's own", () => {
    expect(visibleSubject(list, "off", 5, "english")).toMatchObject({ ownerName: null });
    expect(visibleSubject(list, "off", 1, "english")).toMatchObject({ ownerName: "Hoshi" });
    const text: NotifSubject = { kind: "text", ownerId: 5, ownerName: "Hoshi", text: "hi" };
    expect(visibleSubject(text, "strict", 5, "english")).toEqual({ ...text, ownerName: null });
  });

  it("spells the title in the language chosen since the row was fetched", () => {
    expect(visibleSubject(list, "off", 1, "native")).toMatchObject({ title: "葬送のフリーレン" });
    expect(visibleSubject(list, "off", 1, "romaji")).toMatchObject({ title: "Sousou no Frieren" });
  });

  it("passes a comment and an absent subject through", () => {
    const comment: NotifSubject = { kind: "comment", text: "Agreed." };
    expect(visibleSubject(comment, "strict", 1, "english")).toBe(comment);
    expect(visibleSubject(null, "strict", 1, "english")).toBeNull();
  });
});
