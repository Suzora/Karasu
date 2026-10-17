import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { changelogPlugin } from "../changelog-read.mjs";
import { addEntries, findSection, UNRELEASED } from "../changelog-section.mjs";

/** Unreleased lines in the house style, in place of the real ones, so the dialog's shots never depend on the day's commits. */
const SAMPLE = [
  { group: "Added", text: "Lists can be sorted by the date you last changed an entry." },
  { group: "Added", text: "The command palette finds a setting by any word of its description." },
  { group: "Changed", text: "Notifications about the same title arrive as one row instead of several." },
  { group: "Changed", text: "The entry dialog keeps its Save button in reach on a phone while the keyboard is open." },
  { group: "Fixed", text: "A rewatch no longer resets the progress of an entry you had already completed." },
  { group: "Fixed", text: "The detection window keeps its width after a restart." },
];

/** The file with its Unreleased section emptied, or opened above the first release while a cut has removed it. */
function emptyUnreleased(md: string): string {
  const blank = `${UNRELEASED}\n\n<!-- generated-through: 0000000 -->\n\n`;
  const at = findSection(md);
  if (at) return md.slice(0, at.start) + blank + md.slice(at.end);
  const first = md.search(/^## /m);
  return md.slice(0, first) + blank + md.slice(first);
}

// Rooted at the repository so Tailwind scans the app exactly as the real build does.
export default defineConfig({
  root: path.resolve(__dirname, "../.."),
  plugins: [
    react(),
    tailwindcss(),
    changelogPlugin({ file: path.resolve(__dirname, "../../CHANGELOG.md"), edit: (md) => addEntries(emptyUnreleased(md), SAMPLE, "0000000") }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "../../src") } },
  server: { port: Number(process.env.SCREENS_PORT ?? 5198), strictPort: true },
});
