import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./languages";
import type { Messages, ShotId } from "./en";
import type { Shot } from "@/content/screenshots";

const I18n = createContext<{ lang: Lang; t: Messages } | null>(null);

/** Hands the page's language and catalog to every component below it. */
export function I18nProvider({ lang, t, children }: { lang: Lang; t: Messages; children: ReactNode }) {
  return <I18n.Provider value={{ lang, t }}>{children}</I18n.Provider>;
}

export function useI18n() {
  const v = useContext(I18n);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}

/** Fills `{name}` placeholders in a catalog string. */
export const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** A screenshot's caption and alt text in the page's language; the picture itself is the same in every language. */
export const shotText = (t: Messages, shot: Shot) =>
  (t.shots as Partial<Record<string, { alt: string; caption: string }>>)[shot.id as ShotId] ?? shot;

export function useShotText(shot: Shot) {
  return shotText(useI18n().t, shot);
}
