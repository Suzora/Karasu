import { describe, expect, it } from "vitest";

/** The deep-link plugin rewrites the Android manifest at every build, so what it would write is held here. */

const MANIFEST = Object.values(
  import.meta.glob("/src-tauri/gen/android/app/src/main/AndroidManifest.xml", { query: "?raw", import: "default", eager: true }),
)[0] as string;

const BLOCK = "<!-- DEEP LINK PLUGIN. AUTO-GENERATED. DO NOT REMOVE. -->";

/** tauri-utils' `insert_into_xml`: drops the old block and writes the new one before every closing tag it finds. */
function insertIntoXml(xml: string, contents: string): string {
  const out: string[] = [];
  let inBlock = false;
  for (const line of xml.split("\n")) {
    if (line.includes(BLOCK)) {
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) continue;
    const index = line.indexOf("</activity>");
    if (index >= 0) {
      const indent = " ".repeat(index + 4);
      out.push(`${indent}${BLOCK}`, ...contents.split("\n").map((l) => `${indent}${l}`), `${indent}${BLOCK}`);
    }
    out.push(line);
  }
  return out.join("\n");
}

/** The activity element a line index falls in, by its `android:name`. */
function activityAt(xml: string, offset: number): string | undefined {
  const open = xml.lastIndexOf("<activity", offset);
  return /android:name="([^"]+)"/.exec(xml.slice(open))?.[1];
}

describe("the Android manifest's deep links", () => {
  it("are claimed by the main activity alone, so a link opens Karasu without a chooser", () => {
    const blocks = [...MANIFEST.matchAll(new RegExp(BLOCK.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].map((m) => m.index);
    expect(blocks).toHaveLength(2);
    expect(blocks.map((at) => activityAt(MANIFEST, at))).toEqual([".MainActivity", ".MainActivity"]);
  });

  it("stay there when the plugin rewrites the manifest at the next build", () => {
    const start = MANIFEST.indexOf(BLOCK);
    const end = MANIFEST.indexOf(BLOCK, start + BLOCK.length);
    const lines = MANIFEST.slice(start, end).split("\n").slice(1, -1);
    const contents = lines.map((l) => l.replace(/^ {12}/, "")).join("\n");
    const rebuilt = insertIntoXml(MANIFEST, contents);
    const count = rebuilt.split(BLOCK).length - 1;
    expect(count).toBe(2);
  });
});
