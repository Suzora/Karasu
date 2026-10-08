import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

/** react-scan must load before react-dom, so the dev server injects it as the first module script when asked. */
const reactScan = (): PluginOption => ({
  name: "karasu-react-scan",
  transformIndexHtml: () => [{ tag: "script", attrs: { type: "module", src: "/src/app/scan.ts" }, injectTo: "head-prepend" }],
});

// https://vite.dev/config/
export default defineConfig(async ({ command, mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // @ts-expect-error process is a nodejs global
    ...(command === "serve" && process.env.KARASU_SCAN ? [reactScan()] : []),
    // `npm run build:analyze`: a treemap of what each chunk is made of, under dist-stats/, opened by hand.
    ...(mode === "analyze" ? [visualizer({ filename: "dist-stats/index.html", gzipSize: true, template: "treemap" })] : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },

  build: {
    // Linux's webkit2gtk lags behind Windows's evergreen WebView2, so that build targets an older engine.
    // @ts-expect-error process is a nodejs global
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari15",
  },

  /** Node by default; only a `.dom.` in the filename boots jsdom, because needing a DOM is a decision, not an inference. */
  test: {
    // Threads, not forks: nothing here needs a process of its own, and a worker thread starts in a fraction of the time.
    pool: "threads",
    // Failures as annotations on the PR's diff; elsewhere unset, so an agent's own run gets Vitest's failures-only reporter.
    ...(process.env.GITHUB_ACTIONS ? { reporters: ["default", "github-actions"] } : {}),
    // Reported in the summary, so a test that starts leaning on timers or the network shows up before it hurts.
    slowTestThreshold: 300,
    // Transformed modules kept between local runs; CI starts cold every time, where filling the cache only costs.
    fsModuleCache: !process.env.CI,
    // `npm run test:coverage`: four lines on the terminal, the per-file map under coverage/ for a browser.
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/lib/htmlEntities.data.ts", "src/i18n/**"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/**/*.dom.test.tsx"],
          environment: "node",
          // Pure modules with no DOM to reset between files; sharing one module graph cuts the project to a quarter.
          isolate: false,
          setupFiles: ["./src/test/entities.setup.ts"],
          // Vitest blanks every stylesheet, `?raw` included; the token tests read this one as text.
          css: { include: [/src\/app\/index\.css/] },
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["src/**/*.dom.test.tsx"],
          environment: "jsdom",
          // One jsdom per worker with a fresh context per file, so a file no longer pays jsdom's own boot.
          pool: "vmThreads",
          setupFiles: ["./vitest.setup.ts"],
          // A cold CI runner can spend the default timeout just rendering a jsdom test; this still fails a real hang.
          testTimeout: 20_000,
        },
      },
    ],
  },

  // Tauri dev options: never clear the screen, or Vite obscures the rust errors.
  clearScreen: false,
  // tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
