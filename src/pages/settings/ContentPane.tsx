import { useTranslation } from "react-i18next";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useContentFilter } from "@/stores/contentFilter";
import { CONTENT_FILTER_LEVELS, type ContentFilterLevel } from "@/lib/contentFilter";
import { Segmented } from "@/components/ui/segmented";
import { landingClass, Toggle } from "./shared";
import { backendErrorText } from "@/lib/backendError";
/** Three levels in one control, not a switch: hiding adult and hiding suggestive are different asks. */
export function ContentSection() {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const ready = useContentFilter((s) => s.ready);
  const setLevel = useContentFilter((s) => s.setLevel);
  const error = useContentFilter((s) => s.error);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const setBlurAdult = useContentFilter((s) => s.setBlurAdult);

  return (
    <Card>
      <CardTitle>{t("settings.content")}</CardTitle>
      {ready && (
        <div data-setting="contentFilter" className={cn("mt-4 space-y-3", landingClass)}>
          <Segmented
            aria-label={t("settings.contentFilter")}
            segments={CONTENT_FILTER_LEVELS.map((l) => ({ value: l, label: levelLabel(l, t) }))}
            value={level}
            onChange={setLevel}
          />
          {/* The chosen level's meaning under the control, so the choice and its effect are read together. */}
          <p className="text-xs text-ink-500">{levelHint(level, t)}</p>
          <p className="text-xs text-ink-600">{t("settings.contentNote")}</p>
          {/* Apart from the levels on purpose: they decide what is shown at all, this how it arrives (`shouldBlur`). */}
          <div className="border-t border-hair pt-3">
            <Toggle
              checked={blurAdult}
              onChange={(v) => void setBlurAdult(v)}
              label={t("settings.blurAdult")}
              hint={t("settings.blurAdultHint")}
            />
          </div>
          {/* A failed save puts the level back, so without this the control would snap back unexplained. */}
          {error && (
            <p className="text-xs text-danger">
              {t("settings.contentSaveFailed", { message: backendErrorText(error, t) })}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** A literal key per level, so the key test sees each one. */
function levelLabel(level: ContentFilterLevel, t: (key: string) => string): string {
  switch (level) {
    case "off":
      return t("settings.contentLevel_off");
    case "moderate":
      return t("settings.contentLevel_moderate");
    case "strict":
      return t("settings.contentLevel_strict");
  }
}

function levelHint(level: ContentFilterLevel, t: (key: string) => string): string {
  switch (level) {
    case "off":
      return t("settings.contentHint_off");
    case "moderate":
      return t("settings.contentHint_moderate");
    case "strict":
      return t("settings.contentHint_strict");
  }
}
