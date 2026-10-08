import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Selection checkbox shared by the grid and list rows. */
export function SelectBox({
  checked,
  onToggle,
  label,
  className,
}: {
  checked: boolean;
  onToggle: () => void;
  /** Whose box this is, so a reader hears which title a press selects rather than a row of identical "Select"s. */
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      // The row selects on its own click as the larger target; without this the two cancel out and nothing changes.
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-inner border transition-surface",
        // Near-opaque unchecked: it sits on arbitrary cover art, where a translucent box has no contrast floor.
        checked
          ? "border-accent-500 bg-accent-500 text-accent-ink"
          : "border-on-cover-edge/35 bg-on-cover/70 text-transparent hover:border-accent-500",
        className,
      )}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
    >
      <Check className="size-3.5" strokeWidth={3} />
    </button>
  );
}
