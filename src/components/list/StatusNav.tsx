import { moveTabFocus } from "@/components/ui/tab-focus";
import { useTranslation } from "react-i18next";
import { STATUS_ORDER, type MediaListStatus, type MediaType } from "@/api/types";
import { Popover } from "@/components/ui/popover";
import { statusColorVar } from "@/lib/statusColors";
import { ColumnLabel, PickerField, columnRow } from "@/components/shell/PageColumn";

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
            onKeyDown={moveTabFocus}
            onClick={() => {
              onChange(s);
              onPicked?.();
            }}
            className={columnRow(s === value)}
          >
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: statusColorVar(s) }} />
            <span className="min-w-0 flex-1 truncate">{t(`status.${type}.${s}`)}</span>
            <span className="text-xs tabular-nums opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>
      {lists.length > 0 && (
        <>
          <ColumnLabel>{t("list.customList")}</ColumnLabel>
          {lists.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === list}
              onClick={() => {
                onList(n === list ? "" : n);
                onPicked?.();
              }}
              className={columnRow(n === list)}
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
        <PickerField
          trigger={p}
          size={variant === "dropdown" ? "control" : "field"}
          label={t("list.statusPick", { status: label })}
          lead={<span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: statusColorVar(props.value) }} />}
          value={label}
          meta={`${props.counts[props.value]}${props.list ? ` · ${props.list}` : ""}`}
        />
      )}
    >
      {(api) => <StatusNav {...props} onPicked={api.close} />}
    </Popover>
  );
}
