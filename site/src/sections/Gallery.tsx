import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { Screenshot } from "@/components/Screenshot";
import { Eyebrow } from "@/components/Section";
import { Pill } from "@/components/ui/pill";
import { SHOTS, type Shot } from "@/content/screenshots";
import { cn } from "@/lib/cn";

const pick = (ids: string[]) => ids.map((id) => SHOTS.find((s) => s.id === id)!);

const DESKTOP = pick(["overview", "now-playing", "seasonal", "calendar", "stats-overview", "franchise"]);
const PHONE = pick(["phone-overview", "phone-list", "phone-detail", "phone-search"]);

/** A thumbnail that opens the lightbox, with its caption under it. */
function Thumb({ shot, onOpen, className }: { shot: Shot; onOpen: () => void; className?: string }) {
  return (
    <figure className={className}>
      <Screenshot shot={shot} onClick={onOpen} sizes="24rem" />
      <figcaption className="mt-2 text-xs leading-snug text-ink-500">{shot.caption}</figcaption>
    </figure>
  );
}

/** A chosen handful of real captures, desktop or Android by a toggle; a click opens the lightbox with the rest of that kind. */
export function Gallery() {
  const [kind, setKind] = useState<"desktop" | "phone">("desktop");
  const [open, setOpen] = useState<number | null>(null);
  const shots = kind === "desktop" ? DESKTOP : PHONE;
  return (
    <section id="screenshots" aria-labelledby="screenshots-title" className="scroll-mt-16 px-5 pt-16 lg:pt-20">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Screenshots</Eyebrow>
            <h2 id="screenshots-title" className="mt-3 font-brand text-h3 font-bold text-ink-100">
              The app, as it is
            </h2>
          </div>
          <div className="flex gap-2" role="group" aria-label="Which screenshots">
            <Pill active={kind === "desktop"} onClick={() => setKind("desktop")}>
              Desktop
            </Pill>
            <Pill active={kind === "phone"} onClick={() => setKind("phone")}>
              Android
            </Pill>
          </div>
        </div>
        <ul className={cn("mt-8 grid gap-5", kind === "desktop" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
          {shots.map((s, i) => (
            <li key={s.id}>
              <Thumb shot={s} onOpen={() => setOpen(i)} />
            </li>
          ))}
        </ul>
      </div>
      <Lightbox shots={shots} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}
