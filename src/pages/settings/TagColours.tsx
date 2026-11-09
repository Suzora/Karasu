import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardTitle } from "@/components/ui/card";
import { TagChip, TagDot } from "@/components/list/TagChip";
import { useCachedList } from "@/hooks/useCachedEntry";
import { colourOf, TAG_COLOURS, type TagColour } from "@/lib/tagColours";
import { tagCounts } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { useTagColours } from "@/stores/tagColours";

/** Literal keys, so `i18nKeys.test.ts` sees every colour's name. */
function colourName(colour: TagColour, t: (k: string) => string): string {
  switch (colour) {
    case "rose":
      return t("settings.tagColourRose");
    case "amber":
      return t("settings.tagColourAmber");
    case "lime":
      return t("settings.tagColourLime");
    case "teal":
      return t("settings.tagColourTeal");
    case "sky":
      return t("settings.tagColourSky");
    case "violet":
      return t("settings.tagColourViolet");
    case "pink":
      return t("settings.tagColourPink");
    case "slate":
      return t("settings.tagColourSlate");
  }
}

/** Every tag on both lists with its count and a colour to pick, kept per device. */
export function TagColoursCard() {
  const { t } = useTranslation();
  const userId = useAuth((s) => s.viewer?.id);
  const anime = useCachedList(userId, "ANIME");
  const manga = useCachedList(userId, "MANGA");
  const colours = useTagColours((s) => s.colours);
  const setColour = useTagColours((s) => s.setColour);
  const tags = useMemo(
    () =>
      tagCounts(
        [anime, manga].flatMap((l) => l?.lists.filter((g) => !g.isCustomList).flatMap((g) => g.entries) ?? []).map((e) => e.notes),
      ),
    [anime, manga],
  );

  return (
    <Card>
      <CardTitle>{t("settings.groupTags")}</CardTitle>
      <p className="mt-1 text-xs text-ink-600">{t("settings.tagsHint")}</p>
      {tags.length === 0 ? (
        <p className="mt-3 text-sm text-ink-500">{t("settings.tagsEmpty")}</p>
      ) : (
        <ul className="mt-3">
          {tags.map(({ tag, count }) => {
            const current = colourOf(colours, tag);
            return (
              <li key={tag} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-surface-800 py-2.5 not-first:border-t">
                <span className="flex min-w-0 items-center gap-2">
                  <TagChip tag={tag} size="sm" />
                  <span className="text-xs text-ink-600">{count === 1 ? t("settings.tagCountOne") : t("settings.tagCount", { count })}</span>
                </span>
                <span role="radiogroup" aria-label={t("settings.tagColourFor", { tag })} className="flex items-center gap-1.5">
                  {TAG_COLOURS.map((colour) => (
                    <button
                      key={colour}
                      type="button"
                      role="radio"
                      aria-checked={current === colour}
                      aria-label={colourName(colour, t)}
                      title={colourName(colour, t)}
                      onClick={() => setColour(tag, colour)}
                      className={cn(
                        "relative grid size-6 place-items-center rounded-full transition-surface coarse:hit-area hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-accent-500",
                        current === colour && "ring-2 ring-ink-300",
                      )}
                    >
                      <TagDot colour={colour} className="size-3.5" />
                    </button>
                  ))}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={current === null}
                    onClick={() => setColour(tag, null)}
                    className={cn(
                      "relative ml-1 rounded-inner px-1.5 py-0.5 text-xs transition-surface coarse:hit-area focus-visible:outline-2 focus-visible:outline-accent-500",
                      current === null ? "text-ink-100" : "text-ink-600 hover:text-ink-300",
                    )}
                  >
                    {t("settings.tagColourNone")}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
