import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/app/App";
import { useTheme } from "@/stores/theme";
import { useTitleLanguage } from "@/stores/titleLanguage";
import { useToast } from "@/stores/toast";
import i18n from "i18next";
import { en, initLanguage, setLanguageSetting } from "@/i18n";
import { pseudoTree } from "./pseudo";

const lang = new URLSearchParams(location.search).get("lang") ?? "de";
// The toast store, so a screen can show a receipt without performing the write behind it.
(window as unknown as { __toast: typeof useToast }).__toast = useToast;

useTheme.getState().init();
useTitleLanguage.getState().init();

await initLanguage();
await setLanguageSetting(lang === "en" || lang === "qps" ? "en" : "de");
// The pseudo-locale is built from English on the spot, so it can never ship and never goes stale.
if (lang === "qps") {
  i18n.addResourceBundle("qps", "translation", pseudoTree(en));
  await i18n.changeLanguage("qps");
}

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false, refetchOnWindowFocus: false } } });

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={qc}>
    <HashRouter>
      <App />
    </HashRouter>
  </QueryClientProvider>,
);
