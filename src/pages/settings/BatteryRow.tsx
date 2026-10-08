import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ExternalAnchor } from "@/components/RichText";
import { isTauri } from "@/api/anilist";
import { getJellyfinBackground, requestBatteryExemption, type JellyfinBackground } from "@/stores/nowPlaying";
import { Row } from "./shared";
import { backendErrorText } from "@/lib/backendError";

/** Lists each manufacturer's own background rules, which the exemption Karasu can ask for does not lift. */
const DONT_KILL_MY_APP_URL = "https://dontkillmyapp.com/";

/** The Android background state both cards read; `supported` is false off Android, so a card leaves its rows out. */
export function useBackgroundState() {
  const [state, setState] = useState<JellyfinBackground | null>(null);

  useEffect(() => {
    if (!isTauri) return;
    const load = () => {
      getJellyfinBackground()
        .then(setState)
        .catch(() => {});
    };
    load();
    // The exemption dialog answers nothing; the state is re-read when the window comes back from it.
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  return [state, setState] as const;
}

/** Whether Android exempts Karasu from battery optimisation, the button that asks, and where vendor rules are listed. */
export function BatteryRow({ exempt }: { exempt: boolean | null }) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    setError(null);
    try {
      await requestBatteryExemption();
    } catch (e) {
      setError(t("settings.batteryFailed", { message: backendErrorText(e, t) }));
    }
  };

  // An anchor, not a button: inside the row's `<label>` a button would become the control a click on the text presses.
  const vendors = (
    <span className="block text-xs text-ink-600">
      {t("settings.batteryVendors")} <ExternalAnchor href={DONT_KILL_MY_APP_URL}>dontkillmyapp.com</ExternalAnchor>
    </span>
  );

  return (
    <div>
      <Row label={t("settings.battery")} hint={t("settings.batteryHint")} note={vendors}>
        {exempt ? (
          <span className="shrink-0 text-sm text-success">{t("settings.batteryAllowed")}</span>
        ) : (
          <Button variant="secondary" size="sm" className="shrink-0" onClick={ask}>
            {t("settings.batteryAllow")}
          </Button>
        )}
      </Row>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
