import type { ActivityVerb } from "@/lib/activity";

type Translate = (k: string, o?: { n?: string }) => string;

/** A verb's sentence, translated whole; keep the literal switch, `i18nKeys.test.ts` sees only literal `t("…")`. */
export function sentenceFor(verb: ActivityVerb, t: Translate, n?: string): string {
  switch (verb) {
    case "watchedEpisode":
      return t("social.sentWatchedEpisode", { n });
    case "rewatchedEpisode":
      return t("social.sentRewatchedEpisode", { n });
    case "readChapter":
      return t("social.sentReadChapter", { n });
    case "rereadChapter":
      return t("social.sentRereadChapter", { n });
    case "completed":
      return t("social.sentCompleted");
    case "plansToWatch":
      return t("social.sentPlansToWatch");
    case "plansToRead":
      return t("social.sentPlansToRead");
    case "dropped":
      return t("social.sentDropped");
    case "paused":
      return t("social.sentPaused");
  }
}

/** The same verb with nobody in front of it, for the viewer's own activity; the same literal switch as `sentenceFor`. */
export function captionFor(verb: ActivityVerb, t: Translate, n?: string): string {
  switch (verb) {
    case "watchedEpisode":
      return t("notif.capWatchedEpisode", { n });
    case "rewatchedEpisode":
      return t("notif.capRewatchedEpisode", { n });
    case "readChapter":
      return t("notif.capReadChapter", { n });
    case "rereadChapter":
      return t("notif.capRereadChapter", { n });
    case "completed":
      return t("notif.capCompleted");
    case "plansToWatch":
      return t("notif.capPlansToWatch");
    case "plansToRead":
      return t("notif.capPlansToRead");
    case "dropped":
      return t("notif.capDropped");
    case "paused":
      return t("notif.capPaused");
  }
}
