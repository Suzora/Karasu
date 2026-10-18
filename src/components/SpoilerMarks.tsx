import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { SPOILER_MARK } from "@/lib/anilistMarkdown";

/** Plain text with each spoiler drawn as the feed's spoiler chip, inert, since a quote sits inside its row's press. */
export function SpoilerMarks({ text }: { text: string }) {
  const { t } = useTranslation();
  const parts = text.split(SPOILER_MARK);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="rounded-inner bg-surface-700 px-1.5 text-xs text-ink-500">{t("social.mdSpoiler")}</span>}
          {part}
        </Fragment>
      ))}
    </>
  );
}
