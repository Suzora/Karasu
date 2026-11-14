import { LINKS, META, SITE_URL, SUZORA_URL } from "./site.config";
import release from "./generated/release.json";
import type { Messages } from "./i18n/en";
import { LANGUAGES, OG_LOCALE, langPath, type Lang } from "./i18n/languages";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * The `<head>` for a pre-rendered page, as a string `prerender.mjs` splices
 * in. A string rather than React so the server bundle does not need a head
 * manager; a home page names every language version of itself.
 */
export function headFor(page: "home" | "404", lang: Lang, t: Messages): string {
  const title = page === "404" ? t.meta.notFoundTitle : t.meta.title;
  const description = t.meta.description;
  const url = page === "404" ? `${SITE_URL}404.html` : `${SITE_URL}${langPath(lang)}`;
  const image = `${SITE_URL}og.png`;
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<meta name="color-scheme" content="dark">`,
    `<meta name="theme-color" content="${META.themeColor}">`,
    `<link rel="canonical" href="${url}">`,
    `<link rel="icon" href="${SITE_URL}favicon.svg" type="image/svg+xml">`,
    `<link rel="icon" href="${SITE_URL}favicon-32.png" type="image/png" sizes="32x32">`,
    `<link rel="apple-touch-icon" href="${SITE_URL}apple-touch-icon.png">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Karasu">`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${image}">`,
  ];
  if (page === "home") {
    for (const l of LANGUAGES) {
      lines.push(`<link rel="alternate" hreflang="${l.code}" href="${SITE_URL}${langPath(l.code)}">`);
    }
    lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}">`);
    for (const l of LANGUAGES) {
      if (l.code !== lang) lines.push(`<meta property="og:locale:alternate" content="${OG_LOCALE[l.code]}">`);
    }
  }
  if (page === "404") {
    lines.push(`<meta name="robots" content="noindex">`);
  } else {
    const pageUrl = `${SITE_URL}${langPath(lang)}`;
    const suzora = {
      "@type": "Organization",
      "@id": `${SITE_URL}#suzora`,
      name: "Suzora",
      url: SUZORA_URL,
      logo: `${SITE_URL}suzora.png`,
      sameAs: [SUZORA_URL],
    };
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        suzora,
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: "Karasu",
          url: SITE_URL,
          inLanguage: LANGUAGES.map((l) => l.code),
          publisher: { "@id": suzora["@id"] },
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}#app`,
          name: "Karasu",
          alternateName: "カラス",
          description,
          inLanguage: lang,
          url: pageUrl,
          applicationCategory: "EntertainmentApplication",
          applicationSubCategory: "Anime and manga tracker for AniList",
          operatingSystem: "Windows, Linux, Android",
          softwareVersion: release.version,
          downloadUrl: LINKS.latest,
          license: LINKS.license,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: { "@type": "Person", name: "Kyusetzu" },
          publisher: { "@id": suzora["@id"] },
          codeRepository: LINKS.repo,
          sameAs: [LINKS.repo],
          image,
        },
        {
          "@type": "FAQPage",
          "@id": `${pageUrl}#faq`,
          inLanguage: lang,
          mainEntity: Object.values(t.faq.items).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
    );
  }
  return lines.join("\n    ");
}
