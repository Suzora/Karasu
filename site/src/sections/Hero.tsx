import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/Section";
import release from "@/generated/release.json";
import { LINKS } from "@/site.config";
import { fmt, useI18n } from "@/i18n/context";

/** The pitch and the three downloads, with every caveat a first install meets said beside the button. */
export function Hero() {
  const { t } = useI18n();
  return (
    <section id="top" aria-labelledby="hero-title" className="hero relative">
      <div className="container-site flex flex-col items-start px-5 pb-14 pt-14 md:items-center md:pt-20 md:text-center lg:pb-16 lg:pt-24">
        <Eyebrow>{t.hero.eyebrow}</Eyebrow>
        <h1 id="hero-title" className="mt-4 max-w-4xl font-brand text-display font-bold text-ink-100">
          {t.hero.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lede text-ink-300">
          {t.hero.lede}
        </p>
        <div className="mt-8 flex flex-wrap gap-3 md:justify-center">
          <ButtonLink href={release.assets.windows} size="lg">
            {t.hero.windows}
          </ButtonLink>
          <ButtonLink href={release.assets.linux} variant="outline" size="lg">
            {t.hero.linux}
          </ButtonLink>
          <ButtonLink href={release.assets.androidArm64} variant="outline" size="lg">
            {t.hero.android}
          </ButtonLink>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-500">
          {fmt(t.hero.note, { version: release.version })} ·{" "}
          <a href={release.assets.sums} className="text-accent-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500">
            {t.hero.checksums}
          </a>{" "}
          ·{" "}
          <a href={LINKS.releases} className="text-accent-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500">
            {t.hero.everyDownload}
          </a>
        </p>
      </div>
    </section>
  );
}
