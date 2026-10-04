import type { CSSProperties } from "react";
import { BannerImage } from "@/components/media/BannerImage";
import type { BannerSource } from "@/lib/bannerSource";
import { cn } from "@/lib/utils";

/** A title's wide art as `bannerSource` chose it: a banner shown whole, its own or a relative's, else its cover's colour. */
export function MediaBanner({
  source,
  veiled = false,
  anchor,
}: {
  source: BannerSource;
  /** The adult blur, which a borrowed banner takes exactly as the title's own would. */
  veiled?: boolean;
  anchor?: "center" | "top";
}) {
  if (source.kind !== "wash") return <BannerImage src={source.src} veiled={veiled} anchor={anchor} />;
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 cover-wash", !source.tint && "tint-accent")}
      style={source.tint ? ({ "--tint": source.tint } as CSSProperties) : undefined}
    />
  );
}
