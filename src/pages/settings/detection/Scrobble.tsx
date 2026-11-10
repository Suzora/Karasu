import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { getScrobbleSettings, getMediaDetection, setScrobbleSettings, setMediaDetection, type ScrobbleSettings } from "@/stores/nowPlaying";
import { isAndroid, isLinux, usePlatform } from "@/stores/platform";
import { useAuth } from "@/stores/auth";
import { ExternalNote, Row, Toggle } from "../shared";
import { anilistCoversAiring } from "@/lib/airingCoverage";
import { backendErrorText } from "@/lib/backendError";
import { useAiringMutes } from "@/stores/airingMutes";
import { AiringMutesList } from "./AiringMutes";

export function ScrobbleSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ScrobbleSettings | null>(null);
  const [airing, setAiring] = useState<boolean | null>(null);
  const [stale, setStale] = useState<api.StaleSettings | null>(null);
  const [sequel, setSequel] = useState<boolean | null>(null);
  const [mediaOn, setMediaOn] = useState<boolean | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // The text typed into the two number fields until it is committed; null shows the saved value.
  const [delayDraft, setDelayDraft] = useState<string | null>(null);
  const [monthsDraft, setMonthsDraft] = useState<string | null>(null);
  const platform = usePlatform((s) => s.info);
  const viewer = useAuth((s) => s.viewer);

  useEffect(() => {
    if (!api.isTauri) return;
    getScrobbleSettings().then(setSettings);
    api.getAiringNotify().then(setAiring);
    api.getStaleSettings().then(setStale);
    api.getSequelNotify().then(setSequel);
    getMediaDetection().then(setMediaOn);
  }, []);

  if (!settings) return null;

  /** Paint, persist, and roll the control back if persisting failed, so the switch cannot lie about the key. */
  const persist = (save: Promise<unknown>, revert: () => void) => {
    setSaveError(null);
    save.catch((e) => {
      revert();
      setSaveError(backendErrorText(e, t));
    });
  };

  const update = (patch: Partial<ScrobbleSettings>) => {
    const previous = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    persist(setScrobbleSettings(next), () => setSettings(previous));
  };

  const updateAiring = (v: boolean) => {
    setAiring(v);
    // Mirrored into the mutes store, whose actions offer a mute only while the switch is on.
    useAiringMutes.setState({ notify: v });
    persist(api.setAiringNotify(v), () => {
      setAiring(!v);
      useAiringMutes.setState({ notify: !v });
    });
  };

  const updateSequel = (v: boolean) => {
    setSequel(v);
    persist(api.setSequelNotify(v), () => setSequel(!v));
  };

  const updateStale = (patch: Partial<api.StaleSettings>) => {
    if (!stale) return;
    const previous = stale;
    const next = { ...stale, ...patch };
    setStale(next);
    persist(api.setStaleSettings(next.enabled, next.months), () =>
      setStale(previous),
    );
  };

  // Saved on leaving the field or on Enter, so a value can be retyped without each digit being saved on its way.
  const commitDelay = () => {
    const draft = delayDraft;
    setDelayDraft(null);
    const n = Math.round(Number(draft));
    if (draft === null || draft.trim() === "" || !Number.isFinite(n)) return;
    const next = Math.max(0, Math.min(120, n));
    if (next !== settings.delayMin) update({ delayMin: next });
  };
  const commitMonths = () => {
    const draft = monthsDraft;
    setMonthsDraft(null);
    const n = Math.round(Number(draft));
    if (!stale || draft === null || draft.trim() === "" || !Number.isFinite(n)) return;
    const next = Math.max(1, Math.min(24, n));
    if (next !== stale.months) updateStale({ months: next });
  };

  return (
    <Card>
      <CardTitle>{t("settings.tracking")}</CardTitle>
      {/* Without an account detection only shows what is playing; say so, or the feature looks broken. */}
      {!viewer && (
        <p className="mt-2 text-sm text-gold">{t("settings.trackingNeedsAccount")}</p>
      )}
      {saveError && (
        <p className="mt-2 text-sm text-danger">
          {t("settings.trackingSaveFailed", { message: saveError })}
        </p>
      )}
      <div className="mt-3 space-y-3">
        <Toggle
          checked={settings.enabled}
          onChange={(v) => update({ enabled: v })}
          label={t("settings.trackingEnable")}
          hint={t("settings.trackingEnableHint")}
        />
        <Toggle
          checked={settings.confirm}
          onChange={(v) => update({ confirm: v })}
          label={t("settings.trackingConfirm")}
          hint={t("settings.trackingConfirmHint")}
        />
        <Toggle
          checked={settings.gapAuto}
          onChange={(v) => update({ gapAuto: v })}
          label={t("settings.trackingGapAuto")}
          hint={t("settings.trackingGapAutoHint")}
        />
        {/* The one desktop-only row here: a phone has no SMTC, so the row hides itself rather than greying the card. */}
        {mediaOn !== null && !isAndroid(platform) && (
          <Toggle
            checked={mediaOn}
            onChange={(v) => {
              setMediaOn(v);
              persist(setMediaDetection(v), () => setMediaOn(!v));
            }}
            label={t("settings.mediaSessions")}
            hint={
              // On Linux this pass is the only thing that sees a local player, so the hint must say so.
              isLinux(platform)
                ? t("settings.mediaSessionsLinuxOnly")
                : t("settings.mediaSessionsHint")
            }
          />
        )}
        <Row label={t("settings.threshold")} hint={t("settings.thresholdHint")}>
          <Input
            type="number"
            min={0}
            max={120}
            value={delayDraft ?? String(settings.delayMin)}
            onChange={(e) => setDelayDraft(e.target.value)}
            onBlur={commitDelay}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDelay();
              }
            }}
            className="w-20"
          />
        </Row>
        {airing !== null && (
          <>
            <Toggle
              checked={airing}
              onChange={updateAiring}
              label={t("settings.airingNotify")}
              hint={t("settings.airingNotifyHint")}
              setting="airingNotify"
            />
            {/* Same cached viewer the watcher reads, so a stale blob is visibly wrong here rather than silently wrong. */}
            {airing && anilistCoversAiring(viewer) && (
              <ExternalNote>{t("settings.airingNotifyAniList")}</ExternalNote>
            )}
            {airing && <AiringMutesList />}
          </>
        )}
        {sequel !== null && (
          <Toggle
            checked={sequel}
            onChange={updateSequel}
            label={t("settings.sequelNotify")}
            hint={t("settings.sequelNotifyHint")}
          />
        )}
        {stale && (
          <>
            <Toggle
              checked={stale.enabled}
              onChange={(v) => updateStale({ enabled: v })}
              label={t("settings.staleNotify")}
              hint={t("settings.staleNotifyHint")}
            />
            {stale.enabled && (
              <Row
                label={t("settings.staleMonths")}
                hint={t("settings.staleMonthsHint")}
              >
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={monthsDraft ?? String(stale.months)}
                  onChange={(e) => setMonthsDraft(e.target.value)}
                  onBlur={commitMonths}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitMonths();
                    }
                  }}
                  className="w-20"
                />
              </Row>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
