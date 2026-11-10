import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import * as api from "@/api/anilist";
import { discoverJellyfinServers, getJellyfinSettings, jellyfinSignIn, jellyfinSignOut, setJellyfinBackground, setJellyfinSettings, testJellyfin, type DiscoveredServer, type JellyfinSession, type JellyfinSettings, type JellyfinTest } from "@/stores/nowPlaying";
import { Toggle } from "../shared";
import { BatteryRow, useBackgroundState } from "../BatteryRow";
import { backendErrorText } from "@/lib/backendError";
import { Spinner } from "@/components/ui/spinner";
import { Chip } from "@/components/ui/chip";
import { cardClass } from "@/components/ui/card";

/** Optional Jellyfin connection; signing in as a user, never an API key, is what scopes /Sessions to the account. */
export function JellyfinSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<JellyfinSettings | null>(null);
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [device, setDevice] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [sessions, setSessions] = useState<JellyfinTest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [finding, setFinding] = useState(false);
  const [found, setFound] = useState<DiscoveredServer[] | null>(null);
  const fieldId = useId();

  useEffect(() => {
    if (!api.isTauri) return;
    getJellyfinSettings().then((s) => {
      setSettings(s);
      setUrl(s.url);
      setDevice(s.device);
      setExternalUrl(s.externalUrl);
    });
  }, []);

  if (!settings) return null;

  // Every action starts from a clean slate, so an old message never sits beside the outcome of a newer one.
  const clearErrors = () => {
    setError(null);
    setSaveError(null);
  };

  const find = async () => {
    setFinding(true);
    clearErrors();
    setFound(null);
    try {
      setFound(await discoverJellyfinServers());
    } catch (e) {
      setError(t("settings.jellyfinFindFailed", { message: backendErrorText(e, t) }));
    } finally {
      setFinding(false);
    }
  };

  const signIn = async () => {
    setSigningIn(true);
    clearErrors();
    setSessions(null);
    try {
      const next = await jellyfinSignIn(url, username, password);
      // Drop the password the moment it has been exchanged for a token.
      setPassword("");
      setUsername("");
      setSettings(next);
    } catch (e) {
      setError(backendErrorText(e, t));
      setSigningIn(false);
      return;
    }
    // The sign-in held, so a failure storing the two fields below it is theirs and is reported under them.
    try {
      await setJellyfinSettings(url, device, externalUrl);
      setSettings(await getJellyfinSettings());
    } catch (e) {
      setSaveError(backendErrorText(e, t));
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    clearErrors();
    setSessions(null);
    try {
      setSettings(await jellyfinSignOut());
    } catch (e) {
      setError(backendErrorText(e, t));
    }
  };

  const save = async () => {
    clearErrors();
    setSessions(null);
    try {
      await setJellyfinSettings(url, device, externalUrl);
      setSettings(await getJellyfinSettings());
    } catch (e) {
      setSaveError(backendErrorText(e, t));
    }
  };

  const test = async () => {
    setBusy(true);
    clearErrors();
    setSessions(null);
    try {
      setSessions(await testJellyfin());
    } catch (e) {
      setError(backendErrorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  const externalCurrent = settings.externalUrl !== "" && settings.externalUrl === externalUrl.trim();

  return (
    <Card>
      <CardTitle>{t("settings.jellyfin")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.jellyfinHint")}</p>

      {/* The connection leads: the sign-in while there is none, then one status line with the two things it can do. */}
      <div className={cn(cardClass("sunken"), "mt-4 p-3")}>
        {settings.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
                {t("settings.jellyfinConnectedTo", { server: settings.serverName || settings.url })}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-500">
                {t("settings.jellyfinSignedIn", { name: settings.userName || "?" })}
                {settings.serverName && ` · ${settings.url}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={test} disabled={busy}>
                <Spinner spinning={busy} className="size-3.5" /> {t("settings.jellyfinTest")}
              </Button>
              <Button size="sm" variant="secondary" onClick={signOut}>
                {t("settings.jellyfinSignOut")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Jellyfin's own discovery: the servers on this network, one click each, so no address is typed. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Button variant="secondary" size="sm" onClick={find} disabled={finding}>
                {finding ? <Spinner className="size-4" /> : <Search className="size-4" />}{" "}
                {finding ? t("settings.jellyfinFinding") : t("settings.jellyfinFind")}
              </Button>
              <span className="text-xs text-ink-600">{t("settings.jellyfinFindHint")}</span>
            </div>
            {found &&
              (found.length === 0 ? (
                <p className="text-sm text-ink-500">{t("settings.jellyfinFoundNone")}</p>
              ) : (
                <div className="space-y-1.5">
                  {found.map((s) => (
                    <button
                      key={s.address}
                      type="button"
                      onClick={() => {
                        setUrl(s.address);
                        setFound(null);
                      }}
                      className="flex w-full flex-wrap items-center justify-between gap-x-3 rounded-control border border-hair bg-surface-900 px-3 py-2 text-left text-sm transition-surface hover:border-surface-600"
                    >
                      <span className="font-medium text-ink-300">{s.name || s.address}</span>
                      <span className="text-xs text-ink-500">
                        {s.address}
                        {s.version ? ` · v${s.version}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            <Field label={t("settings.jellyfinUrl")} htmlFor={`${fieldId}-url`}>
              <Input
                id={`${fieldId}-url`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("settings.jellyfinUrlPlaceholder")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("settings.jellyfinUsername")} htmlFor={`${fieldId}-user`}>
                <Input
                  id={`${fieldId}-user`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label={t("settings.jellyfinPassword")} htmlFor={`${fieldId}-password`}>
                <Input
                  id={`${fieldId}-password`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !signingIn) void signIn();
                  }}
                />
              </Field>
            </div>
            <Button onClick={signIn} disabled={signingIn || url.trim() === ""}>
              {signingIn ? t("settings.jellyfinSigningIn") : t("settings.jellyfinSignIn")}
            </Button>
            <p className="text-xs text-ink-600">{t("settings.jellyfinAccountHelp")}</p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
      {sessions && (
        <SessionList
          sessions={sessions.sessions}
          via={sessions.base === "external" ? sessions.url : null}
        />
      )}

      <div className="mt-4 space-y-4">
        {/* Placeholder only, never this machine's name as the value: that pins the filter to this PC. */}
        <Field
          label={t("settings.jellyfinDevice")}
          htmlFor={`${fieldId}-device`}
          hint={<span className="text-xs">{t("settings.jellyfinDeviceHelp")}</span>}
        >
          <Input
            id={`${fieldId}-device`}
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder={t("settings.jellyfinDeviceAny")}
          />
        </Field>
        {/* The fallback address, editable while signed in; the status and the plain-http warning are the backend's word. */}
        <Field
          label={t("settings.jellyfinExternalUrl")}
          htmlFor={`${fieldId}-external`}
          hint={
            <span className="block space-y-1 text-xs">
              <span className="block">{t("settings.jellyfinExternalHint")}</span>
              {externalCurrent && (
                <span className={cn("block", settings.externalVerified ? "text-success" : "text-ink-500")}>
                  {settings.externalVerified
                    ? t("settings.jellyfinExternalVerified")
                    : t("settings.jellyfinExternalUnverified")}
                </span>
              )}
              {settings.externalPlainHttp && externalCurrent && (
                <span className="block text-gold">{t("settings.jellyfinExternalPlainHttp")}</span>
              )}
            </span>
          }
        >
          <Input
            id={`${fieldId}-external`}
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder={t("settings.jellyfinExternalPlaceholder")}
          />
        </Field>
        {/* Signing in stores both fields itself, so saving them separately only matters once there is a connection. */}
        {settings.connected && (
          <Button variant="secondary" onClick={save}>
            {t("common.save")}
          </Button>
        )}
        {saveError && <p className="text-sm text-danger">{saveError}</p>}
      </div>
      {settings.connected && <JellyfinBackgroundRows />}
    </Card>
  );
}

/** Android only: the tracking service and battery exemption, both opt-in, offered only when the backend says so. */
function JellyfinBackgroundRows() {
  const { t } = useTranslation();
  const [state, setState] = useBackgroundState();
  const [error, setError] = useState<string | null>(null);

  if (!state?.supported) return null;

  const toggle = (v: boolean) => {
    const previous = state;
    setState({ ...state, enabled: v });
    setError(null);
    setJellyfinBackground(v).catch((e) => {
      setState(previous);
      setError(backendErrorText(e, t));
    });
  };

  return (
    <div className="mt-3 space-y-3 border-t border-hair pt-3">
      <Toggle
        checked={state.enabled}
        onChange={toggle}
        label={t("settings.jellyfinBackground")}
        hint={t("settings.jellyfinBackgroundHint")}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <BatteryRow exempt={state.batteryExempt} />
    </div>
  );
}

/** The Test-connection result: what the server sees, and what we accept. */
function SessionList({
  sessions,
  via,
}: {
  sessions: JellyfinSession[];
  /** The external address when that is what answered, which means the first was out of reach just now. */
  via: string | null;
}) {
  const { t } = useTranslation();
  const viaLine = via && (
    <p className="text-xs text-ink-500">{t("settings.jellyfinViaExternal", { url: via })}</p>
  );

  if (sessions.length === 0) {
    return (
      <div className="mt-3 space-y-1">
        {viaLine}
        <p className="text-sm text-ink-500">{t("settings.jellyfinNoSessions")}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      {viaLine}
      {sessions.map((s, i) => (
        <div
          key={`${s.device}-${s.user}-${i}`}
          className={cn(
            "rounded-control border px-3 py-2 text-sm",
            s.matched
              ? "border-success/40 bg-success/10"
              : "border-hair bg-surface-900",
          )}
        >
          <p className="flex flex-wrap items-center gap-x-2">
            <span className="font-medium text-ink-300">
              {s.user || t("settings.jellyfinUnknownUser")}
            </span>
            <span className="text-ink-600">·</span>
            <span className="text-ink-500">
              {s.device || t("settings.jellyfinUnknownDevice")}
            </span>
            {s.client && (
              <span className="text-xs text-ink-600">({s.client})</span>
            )}
            {/* The other Karasus on this account and their age, the numbers the write-order rule judges by. */}
            {s.karasu === "desktop" && (
              <Chip tone="accent">{t("settings.jellyfinKarasuDesktop")}</Chip>
            )}
            {s.karasu === "mobile" && (
              <Chip tone="accent">{t("settings.jellyfinKarasuMobile")}</Chip>
            )}
            {s.matched && (
              <Chip tone="success">{t("settings.jellyfinMatched")}</Chip>
            )}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {s.playing ?? t("settings.jellyfinIdle")}
            {s.activeAgoSec !== null && (
              <span className="text-ink-600">
                {" "}
                · {t("settings.jellyfinActiveAgo", { s: s.activeAgoSec })}
              </span>
            )}
          </p>
        </div>
      ))}
      {!sessions.some((s) => s.matched) && (
        <p className="pt-1 text-xs text-gold">
          {t("settings.jellyfinNoMatch")}
        </p>
      )}
    </div>
  );
}
