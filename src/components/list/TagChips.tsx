import { tagsOf } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { TagChip } from "./TagChip";

/** One line of tags under a grid card, empty but still there when the entry has none, so every card in a row ends level. */
export function TagRow({ notes }: { notes: string | null }) {
  return (
    <div data-tag-row className="mt-1.5 flex h-4.5 gap-1 overflow-hidden">
      {tagsOf(notes).map((tag) => (
        <TagChip key={tag} tag={tag} className="min-w-0 shrink" />
      ))}
    </div>
  );
}

/** Read-only tag chips derived from an entry's notes (capped for layout). */
export function TagChips({
  notes,
  max = 3,
  className,
}: {
  notes: string | null;
  max?: number;
  className?: string;
}) {
  const tags = tagsOf(notes);
  // Still occupies its column when empty; a row whose neighbours shift left is harder to scan than a gap.
  if (tags.length === 0) return className ? <div className={className} /> : null;
  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", className)}>
      {tags.slice(0, max).map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {tags.length > max && (
        <span className="text-2xs text-ink-600">+{tags.length - max}</span>
      )}
    </div>
  );
}
