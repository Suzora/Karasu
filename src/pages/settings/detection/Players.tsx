import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as api from "@/api/anilist";
import { usePlatform } from "@/stores/platform";
import { backendErrorText } from "@/lib/backendError";
import { commands, unwrap } from "@/api/tauri";
import type { CustomPlayer, PlayerCandidate } from "@/api/bindings";
import { cardClass } from "@/components/ui/card";

/** Players Karasu does not know, added from their own open window; Windows only, where window titles are read. */
export function PlayersSection() {
  const { t } = useTranslation();
  const platform = usePlatform((s) => s.info);
  const [players, setPlayers] = useState<CustomPlayer[]>([]);
  const [windows, setWindows] = useState<PlayerCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const windowsOs = platform?.os === "windows";

  useEffect(() => {
    if (!api.isTauri || !windowsOs) return;
    commands.listCustomPlayers().then(setPlayers).catch(() => {});
  }, [windowsOs]);

  if (!windowsOs) return null;

  const look = () => commands.listPlayerWindows().then(setWindows).catch(() => setWindows([]));
  const toggle = () => (windows === null ? look() : setWindows(null));
  const change = async (write: Promise<CustomPlayer[]>) => {
    setError(null);
    try {
      setPlayers(await write);
      if (windows !== null) await look();
    } catch (e) {
      setError(backendErrorText(e, t));
    }
  };

  return (
    <Card>
      <CardTitle>{t("settings.players")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.playersHint")}</p>
      {players.length > 0 && (
        <ul className={cn(cardClass("sunken"), "mt-3 space-y-1 p-1.5")}>
          {players.map((player) => (
            <li
              key={player.process}
              className="flex items-center gap-3 rounded-control bg-surface-900 surface-outline py-1.5 pl-3 pr-1"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-ink-100">{player.process}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-600">
                  {player.suffix ? t("settings.playersEnding", { ending: player.suffix.replace(/^\s*[-–—]\s*/, "") }) : t("settings.playersNoEnding")}
                </span>
              </span>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => change(unwrap(commands.removeCustomPlayer(player.process)))}
                aria-label={`${t("settings.playersRemove")}: ${player.process}`}
                title={t("settings.playersRemove")}
              >
                <X className="size-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Button variant="secondary" onClick={toggle} aria-expanded={windows !== null}>
          {t("settings.playersPick")}
        </Button>
      </div>
      {windows !== null && (
        <div className={cn(cardClass("sunken"), "mt-3 p-3")}>
          <p className="text-xs text-ink-500">{windows.length > 0 ? t("settings.playersWindows") : t("settings.playersNoWindows")}</p>
          {windows.length > 0 && (
            <ul className="mt-2 space-y-1">
              {windows.map((w) => (
                <li
                  key={w.process}
                  className="flex items-center gap-3 rounded-control bg-surface-900 surface-outline py-1.5 pl-3 pr-1.5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-ink-100">{w.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-600">{w.process}</span>
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => change(unwrap(commands.addCustomPlayer(w.process, w.suffix)))}>
                    {t("settings.playersKeep")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
