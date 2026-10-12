import changes from "virtual:changes";
import { Screenshot } from "@/components/Screenshot";
import { SHOTS } from "@/content/screenshots";
import { LINKS } from "@/site.config";

const KIND = { added: "Added", changed: "Changed", fixed: "Fixed" } as const;

const shot = SHOTS.find((s) => s.id === "anime-grid")!;

/** The app as it looks, beside the newest lines of its changelog, so a visitor sees both the thing and that it moves. */
export function Showcase() {
  const nightly = changes.version === null;
  return (
    <section id="changes" aria-labelledby="changes-title" className="scroll-mt-16 px-5">
      <div className="container-site grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Screenshot shot={shot} priority sizes="(min-width: 1024px) 66vw, 100vw" />
        {/* On the desktop the screenshot alone sets the row's height, and the card fills it. */}
        <div className="relative lg:self-stretch">
        <div className="panel-wash panel-top flex flex-col rounded-panel border border-hair bg-surface-900 p-5 lg:absolute lg:inset-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="changes-title" className="font-brand text-body font-semibold text-ink-100">
              What changed
            </h2>
            <a
              href={nightly ? LINKS.nightly : LINKS.latest}
              className="rounded-control border tint-fill tint-accent px-2 py-0.5 text-xs text-ink-100 focus-visible:outline-2 focus-visible:outline-accent-500"
            >
              {nightly ? "In the Nightly" : `Version ${changes.version}`}
            </a>
          </div>
          {nightly && changes.since && (
            <p className="mt-1 text-xs text-ink-500">Since {changes.since}, not yet in a Stable release</p>
          )}
          <ul className="mt-3 min-h-0 flex-1 overflow-hidden lg:mask-b-from-80%">
            {changes.items.map((item) => (
              <li key={item.text} className="border-t border-hair py-3 first:border-t-0 max-lg:nth-[n+4]:hidden">
                <span className="text-xs font-semibold uppercase tracking-eyebrow text-accent-400">{KIND[item.kind]}</span>
                <p className="mt-1 text-sm leading-relaxed text-ink-300">{item.text}</p>
              </li>
            ))}
          </ul>
          <a
            href={LINKS.changelog}
            className="mt-3 inline-block self-start rounded-inner text-sm text-accent-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            The whole changelog
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
