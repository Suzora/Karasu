import { ButtonLink } from "@/components/ui/button";
import { LINKS } from "@/site.config";
import { useI18n } from "@/i18n/context";

/** The page's goal: try it, then say how it went, in the places the project actually reads. */
export function Join() {
  const { t } = useI18n();
  return (
    <section id="join" aria-labelledby="join-title" className="scroll-mt-16 px-5 pt-16 lg:pt-20">
      <div className="container-site">
        <div className="panel-wash panel-top flex flex-col gap-6 rounded-panel border border-hair bg-surface-900 p-6 md:p-8 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h2 id="join-title" className="font-brand text-h3 font-bold text-ink-100">
              {t.join.title}
            </h2>
            <p className="mt-2 max-w-xl text-body leading-relaxed text-ink-300">
              {t.join.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={LINKS.discord} variant="outline">
              {t.join.discord}
            </ButtonLink>
            <ButtonLink href={LINKS.bugReport} variant="outline">
              {t.join.bug}
            </ButtonLink>
            <ButtonLink href={LINKS.repo} variant="outline">
              {t.join.source}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
