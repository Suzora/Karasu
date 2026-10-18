import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { PickerField, columnRow } from "@/components/shell/PageColumn";

export interface SectionItem<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** A count beside the name, where the section has an honest one. */
  count?: number;
}

interface Props<T extends string> {
  /** The tablist's accessible name, and the field's prefix on the phone. */
  label: string;
  items: SectionItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Up and Down walk the column and wrap, Home and End jump to its ends; only a press switches the section. */
function moveFocus(e: KeyboardEvent<HTMLButtonElement>) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tabs = [...(e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  const i = tabs.indexOf(e.currentTarget);
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

/** A page's sections as a column of pills with their icons; `onPicked` closes the phone's sheet. */
export function SectionNav<T extends string>({ label, items, value, onChange, onPicked }: Props<T> & { onPicked?: () => void }) {
  return (
    <div role="tablist" aria-orientation="vertical" aria-label={label} className="space-y-0.5">
      {items.map(({ value: v, label: name, icon: Icon, count }) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={v === value}
          tabIndex={v === value ? 0 : -1}
          onKeyDown={moveFocus}
          onClick={() => {
            onChange(v);
            onPicked?.();
          }}
          className={columnRow(v === value)}
        >
          <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {count != null && <span className="text-xs tabular-nums opacity-70">{count}</span>}
        </button>
      ))}
    </div>
  );
}

/** The phone's form of the column: a field naming the current section, opening the column in a sheet. */
export function SectionPicker<T extends string>(props: Props<T>) {
  const current = props.items.find((i) => i.value === props.value) ?? props.items[0];
  return (
    <Popover
      label={props.label}
      variant="sheet"
      className="w-full"
      renderTrigger={(p) => <PickerField trigger={p} label={`${props.label}: ${current.label}`} icon={current.icon} value={current.label} />}
    >
      {(api) => <SectionNav {...props} onPicked={api.close} />}
    </Popover>
  );
}
