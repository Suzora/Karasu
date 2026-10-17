import type { ReactNode } from "react";
import { Loader } from "@/components/ui/loader";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CloudOff, CloudUpload, Hourglass, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { displayTitle, type ListResult, type QueuedEdit, type SyncStatus } from "@/api/types";
import { cn } from "@/lib/utils";
import { durationShort, relTimeFromSeconds } from "@/lib/relTime";
import { isQueueField, queuedMediaId, type QueueField } from "@/lib/syncQueue";
import { budgetMeter, headlineTone, syncHeadline, upcomingRows, type Headline, type UpcomingRow } from "@/lib/syncView";
import { sourceLabel } from "@/lib/syncSources";
import { Popover, type PopoverApi } from "@/components/ui/popover";
import { Disclosure } from "@/components/ui/disclosure";
import { ErrorState } from "@/components/EmptyState";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useManualSync } from "@/hooks/useManualSync";
import { Spinner } from "@/components/ui/spinner";

type T = (k: string, o?: Record<string, unknown>) => string;

/** Enough to say what moved the budget lately; the whole ring is under Details. */
const RECENT_SHOWN = 4;

/** A literal `t()` per field, so `i18nKeys.test.ts` sees every key; the names are AniList's mutation arguments. */
export function fieldLabel(field: QueueField, t: (k: string) => string): string {
  switch (field) {
    case "status":
      return t("syncPanel.fieldStatus");
    case "progress":
      return t("syncPanel.fieldProgress");
    case "progressVolumes":
      return t("syncPanel.fieldVolumes");
    case "scoreRaw":
      return t("syncPanel.fieldScore");
    case "advancedScores":
      return t("syncPanel.fieldAdvanced");
    case "repeat":
      return t("syncPanel.fieldRepeat");
    case "notes":
      return t("syncPanel.fieldNotes");
    case "private":
      return t("syncPanel.fieldPrivate");
    case "hiddenFromStatusLists":
      return t("syncPanel.fieldHidden");
    case "customLists":
      return t("syncPanel.fieldCustomLists");
    case "startedAt":
      return t("syncPanel.fieldStarted");
    case "completedAt":
      return t("syncPanel.fieldCompleted");
  }
}

/** Same rule as `fieldLabel`: a literal `t()` per kind, never an assembled key. */
function headlineText(h: Headline, t: T): string {
  switch (h.kind) {
    case "offline":
      return t("syncPanel.hlOffline");
    case "limited":
      return t("syncPanel.hlLimited");
    case "unreachable":
      return t("syncPanel.hlUnreachable");
    case "sending":
      return t("syncPanel.hlSending", { count: h.count });
    case "pacing":
      return t("syncPanel.hlPacing");
    case "asking":
      return h.more > 0
        ? t("syncPanel.hlAskingMore", { source: sourceLabel(h.source, t) ?? h.source, more: h.more })
        : t("syncPanel.hlAsking", { source: sourceLabel(h.source, t) ?? h.source });
    case "queued":
      return t("syncPanel.hlQueued", { count: h.count });
    case "synced":
      return t("syncPanel.hlSynced");
  }
}

function listLabel(mediaType: string, t: T): string {
  switch (mediaType) {
    case "MANGA":
      return t("syncPanel.listMANGA");
    default:
      return t("syncPanel.listANIME");
  }
}

/** What the sync is doing, on demand; nothing in it may cost an AniList request, since that budget is shared. */
export default function SyncPanel({
  label,
  children,
  className,
}: {
  /** Accessible name for the trigger. */
  label: string;
  /** What the trigger renders — the caller owns its content and layout. */
  children: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Popover
      label={t("syncPanel.title")}
      variant="dropdown"
      side="top"
      align="start"
      width={380}
      panelClassName="p-0"
      className={cn("flex", className)}
      renderTrigger={(trigger) => (
        <button
          type="button"
          {...trigger}
          aria-label={label}
          className="w-full rounded-control text-left transition-surface hover:bg-surface-850"
        >
          {children}
        </button>
      )}
    >
      {(api) => <SyncPanelBody api={api} />}
    </Popover>
  );
}

/** The opening sentence, the budget bar under it, and what the bar means. */
function HeadlineBlock({ data }: { data: SyncStatus }) {
  const { t, i18n } = useTranslation();
  const h = syncHeadline(data);
  const tone = headlineTone(h);
  const meter = budgetMeter(data.rate);
  const wait = data.rate.throttledForMs;
  const icon =
    tone === "calm" ? <CircleCheck aria-hidden className="size-4 text-success" />
    : tone === "off" ? <CloudOff aria-hidden className="size-4 text-ink-500" />
    : h.kind === "limited" ? <Hourglass aria-hidden className="size-4 text-danger" />
    : h.kind === "unreachable" ? <CloudOff aria-hidden className="size-4 text-danger" />
    : h.kind === "queued" ? <CloudUpload aria-hidden className="size-4 text-accent-400" />
    : <Spinner className="size-4 text-accent-400" />;
  const measured = data.rate.observedAgoMs;

  return (
    <div className="border-b border-hair px-3 pb-3 pt-3">
      <p className="flex items-center gap-2 text-ui font-medium text-ink-100" role="status">
        {icon}
        <span className="min-w-0 flex-1">{headlineText(h, t)}</span>
        {wait != null && (
          <span className={cn("shrink-0 tabular-nums text-xs", h.kind === "limited" ? "text-danger" : "text-accent-400")}>
            {durationShort(wait, i18n.language)}
          </span>
        )}
      </p>
      {meter.mode !== "unknown" && (
        <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-800">
          <div
            className={cn(
              "h-full rounded-full",
              meter.mode === "wait" ? (h.kind === "limited" ? "bg-danger" : "bg-accent-500") : "bg-accent-500",
            )}
            style={{ width: `${Math.round(meter.fill * 100)}%` }}
          />
        </div>
      )}
      <p className="mt-1.5 flex items-baseline justify-between gap-3 text-2xs">
        <span className="tabular-nums text-ink-300">
          {/* The wait itself is in the headline, so this line keeps to the budget even while the bar counts down. */}
          {data.rate.remaining != null && data.rate.limit != null
            ? t("syncPanel.budgetLeft", { left: data.rate.remaining, limit: data.rate.limit })
            : t("syncPanel.budgetUnknown")}
        </span>
        {/* The reading's age, or an hours-old figure renders as live: the number only moves when a request lands. */}
        {measured != null && (
          <span className="shrink-0 tabular-nums text-ink-600">
            {t("syncPanel.budgetMeasured", {
              t: measured < 2_000 ? t("syncPanel.measuredNow") : t("syncPanel.budgetMeasuredAgo", { t: durationShort(measured, i18n.language) }),
            })}
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-ink-600">{t("syncPanel.budgetHint")}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="px-3 pb-1 pt-2.5 label-text text-ink-500">{children}</h3>;
}

/** A small timeline row: a mark, a label, and a value on the right. */
function LineRow({ mark, label, value, valueClass }: { mark: ReactNode; label: ReactNode; value: ReactNode; valueClass?: string }) {
  return (
    <li className="flex items-baseline gap-2 px-3 py-1 text-xs">
      <span className="flex w-3.5 shrink-0 justify-center self-center">{mark}</span>
      <span className="min-w-0 flex-1 truncate text-ink-300">{label}</span>
      <span className={cn("shrink-0 tabular-nums text-ink-500", valueClass)}>{value}</span>
    </li>
  );
}

const dot = (cls: string) => <span aria-hidden className={cn("size-1.5 rounded-full", cls)} />;

function NowRows({ data, queueRow }: { data: SyncStatus; queueRow: (e: QueuedEdit) => ReactNode }) {
  const { t, i18n } = useTranslation();
  if (data.inFlight.length === 0 && data.queued.length === 0)
    return <p className="px-3 pb-2 text-xs text-ink-600">{t("syncPanel.nowEmpty")}</p>;
  return (
    <>
      {data.inFlight.length > 0 && (
        <ul>
          {data.inFlight.map((f, i) => (
            <LineRow
              key={`${f.source}-${i}`}
              mark={f.waiting ? <Hourglass aria-hidden className="size-3.5 text-accent-400" /> : <Spinner className="size-3.5 text-accent-400" />}
              label={sourceLabel(f.source, t) ?? f.source}
              value={f.waiting ? t("syncPanel.nowWaiting") : durationShort(f.startedAgoMs, i18n.language)}
              valueClass="text-accent-400"
            />
          ))}
        </ul>
      )}
      {data.queued.length > 0 && <ul className="max-h-40 overflow-y-auto">{data.queued.map(queueRow)}</ul>}
    </>
  );
}

function upcomingValue(r: UpcomingRow, t: T, lang: string): string {
  if (r.running) return t("syncPanel.nextRunning");
  if (r.off) return t("syncPanel.nextOff");
  if (r.kind === "list") return (r.dueInMs ?? 0) > 0 ? t("syncPanel.listFresh", { t: durationShort(r.dueInMs ?? 0, lang) }) : t("syncPanel.listStale");
  return t("syncPanel.nextIn", { t: durationShort(r.dueInMs ?? 0, lang) });
}

function NextRows({ data }: { data: SyncStatus }) {
  const { t, i18n } = useTranslation();
  const rows = upcomingRows(data);
  if (rows.length === 0) return <p className="px-3 pb-2 text-xs text-ink-600">{t("syncPanel.nextEmpty")}</p>;
  return (
    <ul className="pb-1">
      {rows.map((r) => (
        <LineRow
          key={`${r.kind}-${r.name}`}
          mark={r.running ? <Spinner className="size-3.5 text-accent-400" /> : dot(r.off ? "bg-surface-600" : "bg-ink-600")}
          label={<span className={cn(r.off && "text-ink-600")}>{r.kind === "list" ? listLabel(r.name, t) : (sourceLabel(r.name, t) ?? r.name)}</span>}
          value={upcomingValue(r, t, i18n.language)}
          valueClass={r.running ? "text-accent-400" : r.off ? "text-ink-600" : undefined}
        />
      ))}
    </ul>
  );
}

function outcomeMark(outcome: string, t: T) {
  if (outcome === "ok") return dot("bg-success");
  if (outcome === "throttled")
    return (
      <span className="text-danger">
        <Hourglass aria-hidden className="size-3.5" />
        <span className="sr-only">{t("syncPanel.outcomeLimited")}</span>
      </span>
    );
  return (
    <span className="text-danger">
      <TriangleAlert aria-hidden className="size-3.5" />
      <span className="sr-only">{t("syncPanel.outcomeFailed")}</span>
    </span>
  );
}

/** The newest requests, oldest first, so the list reads downward into the "now" rule. */
function RecentRows({ data, limit }: { data: SyncStatus; limit: number }) {
  const { t, i18n } = useTranslation();
  if (data.recent.length === 0) return <p className="px-3 pb-2 text-xs text-ink-600">{t("syncPanel.recentEmpty")}</p>;
  const ordered = data.recent.slice(0, limit).reverse();
  return (
    <ul className="pb-1">
      {ordered.map((r) => (
        <LineRow
          key={r.seq}
          mark={outcomeMark(r.outcome, t)}
          label={
            <>
              {sourceLabel(r.source, t) ?? r.source}
              {r.outcome !== "ok" && (
                <span className="text-danger"> · {r.outcome === "throttled" ? t("syncPanel.outcomeLimited") : t("syncPanel.outcomeFailed")}</span>
              )}
            </>
          }
          value={r.startedAgoMs < 2_000 ? t("syncPanel.measuredNow") : t("syncPanel.recentAgo", { t: durationShort(r.startedAgoMs, i18n.language) })}
        />
      ))}
    </ul>
  );
}

/** The raw figures a bug report needs, folded away so they are not the first thing anyone reads. */
function DetailsBlock({ data }: { data: SyncStatus }) {
  const { t } = useTranslation();
  return (
    <div className="border-t border-hair px-3 py-2">
      <Disclosure summary={<span className="label-text text-ink-500">{t("syncPanel.secDetails")}</span>}>
        <ul className="max-h-36 overflow-y-auto pt-1">
          {data.recent.map((r) => (
            <li key={r.seq} className="flex items-baseline gap-2 py-0.5 text-xs">
              <span className="min-w-0 flex-1 truncate text-ink-300">
                {r.source} · {r.operation}
              </span>
              {r.pacedMs > 0 && <span className="shrink-0 tabular-nums text-accent-400">{t("syncPanel.paced", { ms: r.pacedMs })}</span>}
              <span className="shrink-0 tabular-nums text-ink-500">{t("syncPanel.tookMs", { ms: r.durationMs })}</span>
              <span className="w-6 shrink-0 text-right tabular-nums text-ink-600">{r.remainingAfter ?? "—"}</span>
            </li>
          ))}
        </ul>
        <h4 className="pb-0.5 pt-2 text-xs text-ink-600">{t("syncPanel.secBySource")}</h4>
        <ul className="max-h-28 overflow-y-auto">
          {[...data.traffic.sources]
            .sort((a, b) => b.total - a.total)
            .map((s) => (
              <li key={s.source} className="flex items-baseline gap-2 py-0.5 text-2xs">
                <span className="min-w-0 flex-1 truncate text-ink-300">{sourceLabel(s.source, t) ?? s.source}</span>
                <span className="shrink-0 tabular-nums text-ink-500">{s.total}</span>
              </li>
            ))}
          {data.traffic.throttled > 0 && (
            <li className="pt-1 text-xs text-danger">{t("syncPanel.throttled429", { n: data.traffic.throttled })}</li>
          )}
        </ul>
      </Disclosure>
    </div>
  );
}

/** The panel's contents, mounted with the panel, so the status is read only while someone is looking at it. */
function SyncPanelBody({ api }: { api: PopoverApi }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const status = useSyncStatus(true);
  const manual = useManualSync();

  // Titles come from the cached lists only, never a request; an unfetched list's row simply goes unlabelled.
  const entries = qc
    .getQueriesData<ListResult>({ queryKey: ["mediaList"] })
    .flatMap(([, data]) => data?.lists.flatMap((g) => g.entries) ?? []);

  const data = status.data;

  const openEdit = (edit: QueuedEdit) => {
    const mediaId = queuedMediaId(edit, entries);
    if (mediaId == null) return;
    // After the panel's back entry has unwound, so Back from the title returns to the page and not to a dead step.
    api.closeThen(() => navigate(`/media/${mediaId}`));
  };

  const row = (edit: QueuedEdit) => {
    const mediaId = queuedMediaId(edit, entries);
    const entry = entries.find((e) => e.mediaId === mediaId);
    const title = entry ? displayTitle(entry.media.title) : null;
    const fields = edit.fields
      .filter(isQueueField)
      .map((f) => fieldLabel(f, t))
      .join(", ");

    return (
      <li key={edit.id}>
        <button
          type="button"
          onClick={() => openEdit(edit)}
          disabled={mediaId == null}
          className="flex w-full items-start gap-2.5 px-3 py-1.5 text-left transition-surface hover:bg-surface-850 disabled:hover:bg-transparent"
        >
          <span
            className={cn(
              "mt-0.5 grid size-6 shrink-0 place-items-center rounded-inner",
              edit.kind === "delete" ? "bg-danger/14 text-danger" : "bg-accent-500/14 text-accent-400",
            )}
          >
            {edit.kind === "delete" ? <Trash2 className="size-3.5" /> : <CloudUpload className="size-3.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ui font-medium text-ink-100">
              {/* An unparsed payload is still a row, because the count here has to agree with the pending badge. */}
              {title ??
                (edit.subject == null ? t("syncPanel.rowUnparsed") : t("syncPanel.rowUntitled", { id: edit.subject }))}
            </span>
            <span className="mt-0.5 block truncate text-xs text-ink-500">
              {edit.kind === "delete" ? t("syncPanel.rowDelete") : fields || t("syncPanel.rowSave")}
            </span>
          </span>
          <span className="mt-0.5 shrink-0 text-xs text-ink-600">
            {relTimeFromSeconds(edit.queuedAt, i18n.language, t("notif.now"))}
          </span>
        </button>
      </li>
    );
  };

  // One time axis: what happened above the "now" rule, what is running on it, what is planned below.
  const body = (d: SyncStatus) => (
    <>
      <SectionLabel>{t("syncPanel.secRecent")}</SectionLabel>
      <RecentRows data={d} limit={RECENT_SHOWN} />
      <div className="mx-3 my-1 flex items-center gap-2">
        <span aria-hidden className="h-px flex-1 bg-accent-500/50" />
        <h3 className="label-text text-accent-400">{t("syncPanel.secNow")}</h3>
        <span aria-hidden className="h-px flex-1 bg-accent-500/50" />
      </div>
      <NowRows data={d} queueRow={row} />
      <SectionLabel>{t("syncPanel.secNext")}</SectionLabel>
      <NextRows data={d} />
    </>
  );

  return (
    <>
      {/* A failed status read is a state to render, not a reason to show the reassuring empty one. */}
      {status.error != null ? (
        <ErrorState inline error={status.error} onRetry={() => status.refetch()} className="px-3 py-4 text-xs" />
      ) : !data ? (
        <Loader size="sm" label={t("syncPanel.loading")} className="px-3 py-4" />
      ) : (
        <>
          <HeadlineBlock data={data} />
          {body(data)}
          <DetailsBlock data={data} />
          {manual.available && (
            <div className="border-t border-hair p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void manual.sync()}
                disabled={manual.syncing || data.draining}
                className="w-full"
              >
                {t("sync.button")}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
