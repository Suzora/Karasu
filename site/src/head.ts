import { LINKS, META, SITE_URL } from "./site.config";
import release from "./generated/release.json";
import type { Messages } from "./i18n/en";
import { LANGUAGES, langPath, type Lang } from "./i18n/languages";

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
  }
  if (page === "404") {
    lines.push(`<meta name="robots" content="noindex">`);
  } else {
    const ld = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Karasu",
      description,
      inLanguage: lang,
      url: SITE_URL,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows, Linux, Android",
      softwareVersion: release.version,
      downloadUrl: LINKS.latest,
      license: LINKS.license,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      author: { "@type": "Person", name: "Kyu" },
      image,
    };
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
    );
  }
  return lines.join("\n    ");
}
