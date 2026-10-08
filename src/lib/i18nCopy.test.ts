import { describe, expect, it } from "vitest";
import { de } from "@/i18n/de";
import { en } from "@/i18n/en";

/** Every string in a translation tree, with its dotted key. */
function strings(tree: unknown, prefix = ""): [string, string][] {
  if (typeof tree === "string") return [[prefix, tree]];
  if (!tree || typeof tree !== "object") return [];
  return Object.entries(tree).flatMap(([k, v]) => strings(v, prefix ? `${prefix}.${k}` : k));
}

const keysWhere = (tree: unknown, test: (v: string) => boolean) =>
  strings(tree)
    .filter(([, v]) => test(v))
    .map(([k]) => k);

/** The glossary at the top of de.ts, held: one word per thing, so a new key cannot bring the second one back. */
describe("German copy", () => {
  it("sets an ellipsis apart from its word, as German typesetting does", () => {
    expect(keysWhere(de, (v) => /[\p{L}\p{N})]…/u.test(v))).toEqual([]);
  });

  it("says Konto, Protokoll, Aufteilung, Wrapped and Ep., never the second word", () => {
    const second = [/\bAccount\b/, /Watching-Liste/, /\bSynchronisation\b/, /\bLog(ging)?\b/, /\bSplits?\b/, /\bFo\./, /Jahresrückblick/];
    expect(keysWhere(de, (v) => second.some((r) => r.test(v)))).toEqual([]);
  });

  it("uses Folge only as the verb, which lives with the social strings", () => {
    expect(keysWhere(de, (v) => /\bFolge/.test(v)).filter((k) => !k.startsWith("social."))).toEqual([]);
  });

  it("never writes a count's noun as a bracketed plural", () => {
    expect(keysWhere(de, (v) => /\w\((e?n|s)\)/.test(v))).toEqual([]);
  });
});

describe("English copy", () => {
  it("writes an ellipsis straight after its word", () => {
    expect(keysWhere(en, (v) => /[\p{L}\p{N})] …/u.test(v))).toEqual([]);
  });

  it("never writes a count's noun as a bracketed plural", () => {
    expect(keysWhere(en, (v) => /\w\(e?s\)/.test(v))).toEqual([]);
  });
});
