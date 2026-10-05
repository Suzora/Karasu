import { displayTitle, type MediaTitle } from "@/api/types";
import { isNativeLine, secondLine } from "@/lib/titleLanguage";
import { cn } from "@/lib/utils";

/** A title and its other spelling stacked; whichever line is the native one takes the Japanese face. */
export function TitleLockup({
  title,
  clamp = 1,
  tone = "primary",
  dense = false,
  className,
}: {
  title: MediaTitle;
  /** Lines the main title may occupy before it is clipped. */
  clamp?: 1 | 2;
  /** `muted` steps back a shade for captions under cover art, where the artwork already carries the identity. */
  tone?: "primary" | "muted";
  /** Sizes both lines from the density setting; the dense screens opt in, the list rows keep their fixed tracks. */
  dense?: boolean;
  className?: string;
}) {
  const main = displayTitle(title);
  const second = secondLine(title, main);

  return (
    <div className={cn("min-w-0", className)}>
      <p
        className={cn(
          dense ? "dense-text-lg font-medium" : "text-ui font-medium",
          isNativeLine(title, main) && "font-brand-jp",
          tone === "muted"
            ? "text-ink-300 group-hover:text-ink-100"
            : "text-ink-100",
          clamp === 2 ? "line-clamp-2" : "truncate",
        )}
      >
        {main}
      </p>
      {second && (
        <p className={cn("truncate text-ink-600", second.native && "font-brand-jp", dense ? "dense-text" : "text-2xs")}>
          {second.text}
        </p>
      )}
    </div>
  );
}
