import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { SPOILER_LABEL_END, SPOILER_MARK } from "@/lib/anilistMarkdown";

/** Plain text with each spoiler drawn as the feed's spoiler chip, inert, since a quote sits inside its row's press. */
export function SpoilerMarks({ text }: { text: string }) {
  const { t } = useTranslation();
  const parts = text.split(SPOILER_MARK);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => {
        // Each mark carries its label, often empty, up to `SPOILER_LABEL_END`; a label replaces the word on the chip.
        const end = i > 0 ? part.indexOf(SPOILER_LABEL_END) : -1;
        const label = end > 0 ? part.slice(0, end) : null;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <span className="rounded-inner bg-surface-700 px-1.5 text-xs text-ink-500">
                {label ?? t("social.mdSpoiler")}
              </span>
            )}
            {end >= 0 ? part.slice(end + 1) : part}
          </Fragment>
        );
      })}
    </>
  );
}
