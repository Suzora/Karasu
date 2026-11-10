import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { isAndroid, usePlatform } from "@/stores/platform";
import { Row, Toggle } from "../shared";
import { Select } from "@/components/ui/select";

/** Whether Karasu looks for a new version, and which kind it accepts. */
export function UpdatesSection() {
  const { t } = useTranslation();
  const platform = usePlatform((s) => s.info);
  const [auto, setAuto] = useState<boolean | null>(null);
  // Null until the stored value lands, or a stable-channel install flashes the wrong answer for a frame.
  const [channel, setChannel] = useState<api.UpdateChannel | null>(null);
  const android = isAndroid(platform);
  const [metered, setMetered] = useState<boolean | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    api.getUpdateCheckAuto().then(setAuto);
    api.getUpdateChannel().then(setChannel);
    api.getApkDownloadMetered().then(setMetered);
  }, []);

  // A store build has no check to switch on and no channel to pick; About says where its updates come from.
  if (platform?.storeUpdates) return null;

  return (
    <Card>
      <CardTitle>{t("settings.updates")}</CardTitle>
      <div className="mt-3 space-y-3">
        {auto !== null && (
          <Toggle
            checked={auto}
            onChange={(enabled) => {
              setAuto(enabled);
              api.setUpdateCheckAuto(enabled);
            }}
            label={t("settings.updateAuto")}
            hint={t("settings.updateAutoHint")}
          />
        )}

        {channel !== null && (
          <Row
            label={t("settings.updateChannel")}
            hint={t("settings.updateChannelHint")}
          >
            <Select
              value={channel}
              onChange={(e) => {
                const next = e.target.value as api.UpdateChannel;
                setChannel(next);
                api.setUpdateChannel(next);
              }}
            >
              <option value="stable">{t("settings.updateChannelStable")}</option>
              <option value="prerelease">
                {t("settings.updateChannelPrerelease")}
              </option>
            </Select>
          </Row>
        )}

        {/* Android only: the APK is 23 MB and the nightly channel rebuilds daily, so mobile data is opt-in. */}
        {android && metered !== null && (
          <Toggle
            checked={metered}
            onChange={(enabled) => {
              setMetered(enabled);
              api.setApkDownloadMetered(enabled);
            }}
            label={t("settings.apkMetered")}
            hint={t("settings.apkMeteredHint")}
          />
        )}
      </div>
    </Card>
  );
}
