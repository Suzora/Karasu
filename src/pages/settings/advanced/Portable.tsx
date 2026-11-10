import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { usePlatform } from "@/stores/platform";
import { commands, unwrap } from "@/api/tauri";

interface DatabaseInfo {
  path: string;
  bytes: number;
  modifiedMs: number;
}

interface PortableStatus {
  portable: boolean;
  dir: string;
  /** A database in the folder this switch would move away from using. */
  other: DatabaseInfo | null;
}

export function PortableSection() {
  const { t } = useTranslation();
  const platform = usePlatform((s) => s.info);
  const [status, setStatus] = useState<PortableStatus | null>(null);
  const [restart, setRestart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isTauri) return;
    commands.getPortableStatus().then(setStatus);
  }, []);

  // A Flatpak's app folder is read-only, so there is nowhere beside the binary to keep the data.
  if (!status || platform?.flatpak) return null;

  /** Enabling beside an existing database needs `replace`: true takes ours along, false adopts it, unset is refused. */
  const toggle = async (replace?: boolean) => {
    setError(null);
    try {
      // Neither call returns on success: the backend relaunches, as `Db` is opened once and never reopened.
      if (status.portable) await unwrap(commands.disablePortable());
      else await unwrap(commands.enablePortable(replace ?? null));
      setRestart(true);
    } catch (e) {
      setError(backendErrorText(e, t));
    }
    // Either way, re-read where the data actually lives rather than assuming the switch failed cleanly.
    await commands.getPortableStatus().then(setStatus);
  };

  const other = status.other;
  const otherWhen = other
    ? new Date(other.modifiedMs).toLocaleDateString()
    : "";

  return (
    <Card>
      <CardTitle>{t("settings.portable")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.portableHint")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-300">
          {status.portable ? t("settings.portableOn") : t("settings.portableOff")}
        </span>
        {/* With a database already waiting, only the user knows which of the two copies to set aside. */}
        {!status.portable && other ? (
          <>
            <Button variant="secondary" onClick={() => toggle(false)}>
              {t("settings.portableKeepExisting")}
            </Button>
            <Button variant="secondary" onClick={() => toggle(true)}>
              {t("settings.portableReplaceExisting")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => toggle()}>
            {status.portable
              ? t("settings.portableDisable")
              : t("settings.portableEnable")}
          </Button>
        )}
      </div>
      <p className="mt-2 break-all text-xs text-ink-600">
        {t("settings.portableLocation")}: {status.dir}
      </p>
      {other && (
        <p className="mt-2 break-all text-xs text-gold">
          {status.portable
            ? t("settings.portableOtherOnDisable", {
                path: other.path,
                date: otherWhen,
              })
            : t("settings.portableOtherOnEnable", {
                path: other.path,
                date: otherWhen,
              })}
        </p>
      )}
      {platform?.appImage && (
        <p className="mt-1 text-xs text-ink-600">
          {t("settings.portableAppImage")}
        </p>
      )}
      {restart && (
        <p className="mt-2 text-sm text-gold">{t("settings.portableRestart")}</p>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
