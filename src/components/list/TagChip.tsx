import type { CSSProperties } from "react";
import { Chip, type ChipSize } from "@/components/ui/chip";
import { colourOf, isCustom, readableDot, type TagColour, type TagColourValue } from "@/lib/tagColours";
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

/** Both themes' readable fills of a picked colour, for the `tag-custom-*` utilities to choose from. */
function customVars(hex: string): CSSProperties {
  return { "--tag-dark": readableDot(hex, "dark"), "--tag-light": readableDot(hex, "light") } as CSSProperties;
}

/** The dot of one colour, palette or picked, for the picker's swatches as for the chip. */
export function TagDot({ colour, className }: { colour: TagColourValue; className?: string }) {
  if (isCustom(colour)) {
    return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full tag-custom-dot", className)} style={customVars(colour)} />;
  }
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[colour as TagColour], className)} />;
}

/** One tag: filled with its colour once it has one, as the accent outline it always was until then. */
export function TagChip({ tag, size = "xs", className }: { tag: string; size?: ChipSize; className?: string }) {
  const colour = useTagColours((s) => colourOf(s.colours, tag));
  if (!colour) {
    return (
      <Chip tone="accent" size={size} className={className}>
        {tag}
      </Chip>
    );
  }
  const custom = isCustom(colour);
  return (
    <Chip
      tone="tag"
      size={size}
      className={cn(custom && "tag-custom-tint", className)}
      style={custom ? customVars(colour) : ({ "--tag": `var(--color-tag-${colour})` } as CSSProperties)}
    >
      {tag}
    </Chip>
  );
}

/** A tag's own dot where it has a colour, and nothing where it has none, for controls that draw the tag's name. */
export function TagColourDot({ tag }: { tag: string }) {
  const colour = useTagColours((s) => colourOf(s.colours, tag));
  return colour ? <TagDot colour={colour} /> : null;
}
