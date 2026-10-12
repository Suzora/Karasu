import { ButtonLink } from "@/components/ui/button";
import { LINKS } from "@/site.config";

/** The page's goal: try it, then say how it went, in the places the project actually reads. */
export function Join() {
  return (
    <section id="join" aria-labelledby="join-title" className="scroll-mt-16 px-5 pt-16 lg:pt-20">
      <div className="container-site">
        <div className="panel-wash panel-top flex flex-col gap-6 rounded-panel border border-hair bg-surface-900 p-6 md:p-8 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h2 id="join-title" className="font-brand text-h3 font-bold text-ink-100">
              Try it, then tell us how it went
            </h2>
            <p className="mt-2 max-w-xl text-body leading-relaxed text-ink-300">
              Karasu is built by one maintainer with whoever joins in. A bug report, an idea or a note that
              something works on your machine helps, on Linux and Android above all.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={LINKS.discord} variant="outline">
              Join the Discord
            </ButtonLink>
            <ButtonLink href={LINKS.bugReport} variant="outline">
              Report a bug
            </ButtonLink>
            <ButtonLink href={LINKS.repo} variant="outline">
              Source on GitHub
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
