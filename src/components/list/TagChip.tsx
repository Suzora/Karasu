import { Chip, type ChipSize } from "@/components/ui/chip";
import { colourOf, type TagColour } from "@/lib/tagColours";
import { cn } from "@/lib/utils";
import { useTagColours } from "@/stores/tagColours";

/** Whole class names per colour, since a class cut at a template is one the stylesheet never emits. */
const DOT: Record<TagColour, string> = {
  rose: "bg-tag-rose",
  amber: "bg-tag-amber",
  lime: "bg-tag-lime",
  teal: "bg-tag-teal",
  sky: "bg-tag-sky",
  violet: "bg-tag-violet",
  pink: "bg-tag-pink",
  slate: "bg-tag-slate",
};
const EDGE: Record<TagColour, string> = {
  rose: "border-tag-rose/60",
  amber: "border-tag-amber/60",
  lime: "border-tag-lime/60",
  teal: "border-tag-teal/60",
  sky: "border-tag-sky/60",
  violet: "border-tag-violet/60",
  pink: "border-tag-pink/60",
  slate: "border-tag-slate/60",
};

/** The dot of one colour, for the picker's swatches as for the chip. */
export function TagDot({ colour, className }: { colour: TagColour; className?: string }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[colour], className)} />;
}

/** One tag: in its colour on a neutral chip once it has one, as the accent outline it always was until then. */
export function TagChip({ tag, size = "xs" }: { tag: string; size?: ChipSize }) {
  const colour = useTagColours((s) => colourOf(s.colours, tag));
  if (!colour) {
    return (
      <Chip tone="accent" size={size}>
        {tag}
      </Chip>
    );
  }
  return (
    <Chip tone="neutral" size={size} className={cn("text-ink-100", EDGE[colour])}>
      <TagDot colour={colour} />
      {tag}
    </Chip>
  );
}

/** A tag's own dot where it has a colour, and nothing where it has none, for controls that draw the tag's name. */
export function TagColourDot({ tag }: { tag: string }) {
  const colour = useTagColours((s) => colourOf(s.colours, tag));
  return colour ? <TagDot colour={colour} /> : null;
}
