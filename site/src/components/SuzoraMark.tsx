// Copied from src/components/SuzoraMark.tsx; the site keeps its own copy on purpose, as CLAUDE.md's website rules say.
import markSvg from "@/assets/suzora-mark.svg?raw";
import { cn } from "@/lib/cn";

/** Suzora's mark, drawn inline so its nest takes the theme's `brand-nest` colour while the sun and bird keep theirs. */
export default function SuzoraMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 text-brand-nest [&>svg]:size-full", className)}
      // The file is our own asset, read at build time; nothing from outside reaches this markup.
      dangerouslySetInnerHTML={{ __html: markSvg }}
    />
  );
}
