// The types of `changelog-read.mjs` for the Vite configs and its test; the app's tsconfig reads no JavaScript.
import type { Plugin } from "vite";
import type { MdInline } from "../src/lib/anilistMarkdown";
import type { Changelog } from "../src/lib/whatsNew";

export function plainText(nodes: MdInline[]): string;
export function lineId(plain: string): string;
export function readChangelog(markdown: string, options?: { releases?: number }): Changelog;
export function changelogPlugin(options: { file: string; releases?: number; edit?: (md: string) => string }): Plugin;
