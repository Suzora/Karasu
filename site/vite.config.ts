import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readChanges } from "./scripts/changes.mjs";

const CHANGELOG = path.resolve(import.meta.dirname, "../CHANGELOG.md");

/** `virtual:changes`: the newest changelog lines, read at build time so the page's card never needs a hand edit. */
function changes(): Plugin {
  const id = "virtual:changes";
  return {
    name: "karasu-changes",
    resolveId: (source) => (source === id ? "\0" + id : undefined),
    load(resolved) {
      if (resolved !== "\0" + id) return undefined;
      this.addWatchFile(CHANGELOG);
      return `export default ${JSON.stringify(readChanges(readFileSync(CHANGELOG, "utf8"), { added: 2, changed: 2, fixed: 2 }))};`;
    },
  };
}

// The site is a GitHub Pages *project* page, served under the repository's
// name — every asset URL and internal link has to carry the prefix, and the
// dev server mirrors it so a missing prefix is a bug you see locally.
export const BASE = "/Karasu/";

export default defineConfig(() => ({
  base: BASE,
  plugins: [react(), tailwindcss(), changes()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  build: {
    target: "es2022",
    modulePreload: { polyfill: false },
    // The mark stays a cacheable file rather than a data: URI in the HTML.
    assetsInlineLimit: 0,
  },
  server: {
    // 1420 is the app's Vite port; the two dev servers must coexist.
    port: 4321,
    strictPort: true,
  },
  preview: { port: 4322, strictPort: true },
}));
