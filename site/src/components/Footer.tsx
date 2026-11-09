import KarasuMark from "@/components/KarasuMark";
import { LINKS } from "@/site.config";
import { Eyebrow } from "@/components/Section";
import { useI18n } from "@/i18n/context";
import { LANGUAGES, langPath } from "@/i18n/languages";
import type { Messages } from "@/i18n/en";
import { cn } from "@/lib/cn";

const columns = (f: Messages["footer"]) => [
  {
    title: f.project,
    links: [
      { label: f.github, href: LINKS.repo },
      { label: f.download, href: LINKS.latest },
      { label: f.changelog, href: LINKS.changelog },
      { label: f.nightly, href: LINKS.nightly },
    ],
  },
  {
    title: f.help,
    links: [
      { label: f.docs, href: LINKS.readme },
      { label: f.issue, href: LINKS.bugReport },
      { label: f.feature, href: LINKS.featureRequest },
      { label: f.discord, href: LINKS.discord },
    ],
  },
  {
    title: f.elsewhere,
    links: [
      { label: f.anilist, href: LINKS.anilist },
      { label: f.security, href: LINKS.security },
      { label: f.contributing, href: LINKS.contributing },
      { label: f.license, href: LINKS.license },
    ],
  },
];

/** Every language by its own name, as plain links so the switch works without JavaScript. */
function Languages() {
  const { t, lang } = useI18n();
  return (
    <nav aria-labelledby="lang-title" className="mt-12 border-t border-hair pt-6">
      <Eyebrow tone="muted">
        <span id="lang-title">{t.footer.language}</span>
      </Eyebrow>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LANGUAGES.map((l) => (
          <li key={l.code}>
            <a
              href={`${import.meta.env.BASE_URL}${langPath(l.code)}`}
              hrefLang={l.code}
              lang={l.code}
              aria-current={l.code === lang ? "page" : undefined}
              className={cn(
                "rounded-inner text-sm transition-surface hover:text-ink-100 focus-visible:outline-2 focus-visible:outline-accent-500",
                l.code === lang ? "text-ink-100" : "text-ink-500",
              )}
            >
              {l.name}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-600">{t.footer.aiNote}</p>
    </nav>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-hair">
      <div className="container-site px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5 rounded-control focus-visible:outline-2 focus-visible:outline-accent-500">
              <KarasuMark className="size-7" />
              <span className="font-brand text-xs font-semibold tracking-wordmark text-ink-300">KARASU</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">{t.footer.tagline}</p>
            <p className="mt-4 text-2xs uppercase tracking-eyebrow text-ink-600">{t.footer.badge}</p>
          </div>
          {columns(t.footer).map((col) => (
            <div key={col.title}>
              <Eyebrow tone="muted">{col.title}</Eyebrow>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="rounded-inner text-sm text-ink-300 transition-surface hover:text-ink-100 focus-visible:outline-2 focus-visible:outline-accent-500"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Languages />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hair pt-6 text-xs text-ink-600">
          <span>{t.footer.copyright}</span>
          <span>{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
