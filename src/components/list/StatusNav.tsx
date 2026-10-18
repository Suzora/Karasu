import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STATUS_ORDER, type MediaListStatus, type MediaType } from "@/api/types";
import { Popover } from "@/components/ui/popover";
import { statusColorVar } from "@/lib/statusColors";
import { cn } from "@/lib/utils";

interface Props {
  type: MediaType;
  value: MediaListStatus;
  counts: Record<MediaListStatus, number>;
  onChange: (status: MediaListStatus) => void;
  /** The account's custom lists by their raw names, each a filter on the current status. */
  lists: string[];
  list: string;
  onList: (name: string) => void;
}

/** Up and Down walk the column and wrap, Home and End jump to its ends; only a press switches the status. */
function moveFocus(e: KeyboardEvent<HTMLButtonElement>) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tabs = [...(e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  const i = tabs.indexOf(e.currentTarget);
  if (i < 0) return;
  const last = tabs.length - 1;
  const next =
    e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
    : e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
    : e.key === "Home" ? 0
    : e.key === "End" ? last
    : null;
  if (next === null) return;
  e.preventDefault();
  tabs[next].focus();
}

/** The statuses as a column of pills with colour and count, and the custom lists under them as filters. */
export function StatusNav({ type, value, counts, onChange, lists, list, onList, onPicked }: Props & { onPicked?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <div role="tablist" aria-orientation="vertical" aria-label={t("list.statusTabs")} className="space-y-0.5">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={s === value}
            tabIndex={s === value ? 0 : -1}
            onKeyDown={moveFocus}
            onClick={() => {
              onChange(s);
              onPicked?.();
            }}
            className={cn(
              "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11",
              s === value ? "nav-pill" : "text-ink-300 hover:bg-surface-850 hover:text-ink-100",
            )}
          >
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: statusColorVar(s) }} />
            <span className="min-w-0 flex-1 truncate">{t(`status.${type}.${s}`)}</span>
            <span className="text-xs tabular-nums opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>
      {lists.length > 0 && (
        <>
          <div className="mx-3 my-3 h-px bg-surface-850" />
          <p className="px-4 pb-1 label-text text-ink-500">{t("list.customList")}</p>
          {lists.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === list}
              onClick={() => {
                onList(n === list ? "" : n);
                onPicked?.();
              }}
              className={cn(
                "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11",
                n === list ? "nav-pill" : "text-ink-300 hover:bg-surface-850 hover:text-ink-100",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{n}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

/** The column folded into a field naming the current status and its count; a sheet on the phone, a dropdown elsewhere. */
export function StatusPicker({ variant = "sheet", ...props }: Props & { variant?: "sheet" | "dropdown" }) {
  const { t } = useTranslation();
  const label = t(`status.${props.type}.${props.value}`);
  return (
    <Popover
      label={t("list.statusTabs")}
      variant={variant}
      className="w-full"
      renderTrigger={(p) => (
        <button
          type="button"
          {...p}
          aria-label={t("list.statusPick", { status: label })}
          // The dropdown sits in a toolbar beside a segmented switch, so it takes a control's height rather than a field's.
          className={cn(
            "flex w-full items-center gap-3 bg-surface-900 text-left surface-outline transition-surface hover:bg-surface-850",
            variant === "dropdown" ? "h-8.5 rounded-control px-3" : "rounded-panel px-4 py-3",
          )}
        >
          <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: statusColorVar(props.value) }} />
          <span className={cn(variant === "dropdown" ? "text-sm" : "text-base", "text-ink-100")}>{label}</span>
          <span className="text-sm tabular-nums text-ink-500">{props.counts[props.value]}</span>
          {props.list && <span className="min-w-0 truncate text-sm text-ink-500">· {props.list}</span>}
          <span className="flex-1" />
          <ChevronDown aria-hidden className="size-4 text-ink-500" />
        </button>
      )}
    >
      {(api) => <StatusNav {...props} onPicked={api.close} />}
    </Popover>
  );
}
