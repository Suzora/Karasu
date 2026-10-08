import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { captionFor, sentenceFor } from "@/components/social/activitySentence";
import { formatProgress, PROGRESS_VERBS, splitSentence } from "@/lib/activity";
import { renderPlain } from "@/lib/anilistMarkdown";
import { shouldBlur } from "@/lib/contentFilter";
import type { NotifSubject } from "@/lib/siteNotifications";
import { isNativeLine } from "@/lib/titleLanguage";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";

type Translate = ReturnType<typeof useTranslation>["t"];
type ListSubject = Extract<NotifSubject, { kind: "list" }>;

/** A post's words on one line, its spoilers named rather than shown. */
const plain = (text: string, t: Translate, max = 200) => renderPlain(text, max, `[${t("social.mdSpoiler")}]`);

/** A title in its slot, in Kosugi Maru when it is the native spelling. */
function Title({ subject }: { subject: ListSubject }) {
  return (
    <span className={cn(isNativeLine(subject.media.title, subject.title) && "font-brand-jp")}>{subject.title}</span>
  );
}

/** A list subject's cover, veiled by the blur setting; never revealed here, since the row itself is the press. */
function SubjectCover({ subject, small = false }: { subject: ListSubject; small?: boolean }) {
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  if (!subject.cover) return null;
  return (
    <span className={cn("shrink-0 overflow-hidden rounded-inner bg-surface-800", small ? "h-7 w-5" : "h-9 w-6")}>
      <img
        src={subject.cover}
        alt=""
        loading="lazy"
        decoding="async"
        // The scale keeps the blur from leaving a see-through rim inside the clip.
        className={cn("size-full object-cover", shouldBlur(subject.media, level, blurAdult) && "veil-thumb")}
      />
    </span>
  );
}

/** The subject as words: a caption with its title in its slot, or a quote. */
function SubjectText({ subject }: { subject: NotifSubject }) {
  const { t } = useTranslation();
  switch (subject.kind) {
    case "list": {
      const { verb, progress, ownerName } = subject;
      // Without a known verb, or the progress it needs, the title alone beats AniList's English words.
      if (verb === null || (PROGRESS_VERBS.has(verb) && progress === null)) return <Title subject={subject} />;
      const n = progress ? formatProgress(progress) : undefined;
      const sentence = ownerName ? `${ownerName} ${sentenceFor(verb, t, n)}` : captionFor(verb, t, n);
      const { before, after } = splitSentence(sentence);
      return (
        <>
          {before}
          <Title subject={subject} />
          {after}
        </>
      );
    }
    case "text":
      return subject.ownerName
        ? t("notif.quotedBy", { name: subject.ownerName, text: plain(subject.text, t) })
        : t("notif.quoted", { text: plain(subject.text, t) });
    case "comment":
      return t("notif.quoted", { text: plain(subject.text, t) });
  }
}

/** A group member in a few words: the title, or the start of the quote. */
function SubjectShort({ subject }: { subject: NotifSubject }) {
  const { t } = useTranslation();
  return subject.kind === "list" ? <Title subject={subject} /> : t("notif.quoted", { text: plain(subject.text, t, 80) });
}

const blockClass = "mt-1.5 flex min-w-0 gap-2 border-l-2 border-hair py-0.5 pl-2 text-xs";

/** What an activity or forum row is about, as a quote block under its verb; spans only, since it sits in the row's press. */
export function SubjectLine({ subject, id, hidden }: { subject: NotifSubject; id: string; hidden?: boolean }) {
  return (
    <span id={id} aria-hidden={hidden} className={cn(blockClass, "items-start")}>
      {subject.kind === "list" && <SubjectCover subject={subject} />}
      <span className="line-clamp-2 min-w-0 text-ink-300 wrap-anywhere">
        <SubjectText subject={subject} />
      </span>
    </span>
  );
}

/** A group's subjects on one line, newest first, with what the verb counts beyond them. */
export function SubjectsLine({
  subjects,
  more,
  id,
  hidden,
}: {
  subjects: NotifSubject[];
  more: number;
  id: string;
  hidden?: boolean;
}) {
  const { t } = useTranslation();
  if (subjects.length === 0) return null;
  // One cover per title, so two posts about the same show do not draw it twice.
  const covered = subjects.filter(
    (s, i): s is ListSubject =>
      s.kind === "list" && s.cover != null && subjects.findIndex((o) => o.kind === "list" && o.cover === s.cover) === i,
  );
  return (
    <span id={id} aria-hidden={hidden} className={cn(blockClass, "items-center")}>
      {covered.map((s) => (
        <SubjectCover key={s.cover} subject={s} small />
      ))}
      <span className="min-w-0 truncate text-ink-300">
        {subjects.map((s, i) => (
          <Fragment key={i}>
            {i > 0 && " · "}
            <SubjectShort subject={s} />
          </Fragment>
        ))}
      </span>
      {more > 0 && <span className="shrink-0 text-ink-500">{t("notif.subjectsMore", { n: more })}</span>}
    </span>
  );
}
