import type { ClientFacts } from "@/api/bindings";

/** What the report needs from the WebView, read off a snapshot so the shaping is testable without a window. */
export interface ClientSnapshot {
  userAgent: string;
  hash: string;
  width: number;
  height: number;
  pixelRatio: number;
  phone: boolean;
  theme: string | undefined;
  contrast: string | undefined;
  reducedMotion: boolean;
  language: string;
  online: boolean;
}

/** The facts as the report reads them; the route stays raw here because Rust redacts it beside the data folder. */
export function clientFacts(s: ClientSnapshot): ClientFacts {
  return {
    userAgent: s.userAgent,
    route: s.hash.replace(/^#/, "") || "/",
    viewport: `${Math.round(s.width)}×${Math.round(s.height)} @${Number(s.pixelRatio.toFixed(2))}x`,
    shell: s.phone ? "phone" : "desktop",
    theme: s.theme ?? "unknown",
    contrast: s.contrast === "more" ? "high" : "standard",
    reducedMotion: s.reducedMotion,
    language: s.language,
    online: s.online,
  };
}
