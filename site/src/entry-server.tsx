import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { NotFound } from "./NotFound";
import { headFor } from "./head";
import { CATALOGS } from "./i18n/catalogs";
import { I18nProvider } from "./i18n/context";
import { LANGUAGES, langPath, type Lang } from "./i18n/languages";

export { LANGUAGES, langPath };

/**
 * What `scripts/prerender.mjs` calls, once per page and language. Nothing here
 * may touch `window`, `document`, `matchMedia` or the clock: the markup this
 * returns is what a crawler, a reader with JavaScript off and a reduced-motion
 * user all get, and it has to hydrate without a mismatch. `messages` is the
 * catalog the page carries inline, so the client hydrates with the same words.
 */
export function render(path: string, lang: Lang = "en"): { html: string; head: string; messages: string } {
  const notFound = path !== "/";
  const t = CATALOGS[lang];
  const html = renderToString(
    <StrictMode>
      <I18nProvider lang={lang} t={t}>
        {notFound ? <NotFound /> : <App />}
      </I18nProvider>
    </StrictMode>,
  );
  return {
    html,
    head: headFor(notFound ? "404" : "home", lang, t),
    messages: JSON.stringify(t).replace(/</g, "\\u003c"),
  };
}
