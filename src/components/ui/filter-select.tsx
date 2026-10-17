import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

/** A labelled dropdown readable unopened; keep the real `<select>` stretched over it for the native keyboard and a11y. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
  row = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  /** Shown as the value when nothing is selected. */
  placeholder?: string;
  className?: string;
  /** A full-width row for a column: the label at the start, the value at the end, no frame. */
  row?: boolean;
}) {
  const current = options.find((o) => o.value === value);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-surface",
        row
          ? "h-10 w-full rounded-full px-4 hover:bg-surface-850 focus-within:outline-2 focus-within:outline-accent-500"
          : "h-8.5 rounded-control border border-hair bg-surface-900 px-2.5 focus-within:border-accent-500 hover:bg-surface-850",
        row && value && "bg-accent-500/10",
        className,
      )}
    >
      <span className={row ? "min-w-0 flex-1 truncate text-sm text-ink-300" : "label-text text-ink-500"}>
        {label}
      </span>
      <span className={cn("max-w-32 truncate text-xs", row && !value ? "text-ink-600" : "text-ink-300")}>
        {current?.label ?? placeholder}
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-ink-600" />
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
