/** What changed since the last start: CHANGELOG.md as data, and which part of it a start should show. */

import type { WhatsNewSeen } from "@/api/bindings";
import type { MdInline } from "./anilistMarkdown";

/** A `### ` group of a changelog section; any other heading fails the build. */
export type GroupKind = "added" | "changed" | "fixed" | "removed" | "security";

/** One bullet: its id is a hash of its plain text, so the same wording is the same line in every build. */
export interface ChangeLine {
  id: string;
  text: MdInline[];
}

export interface ChangeGroup {
  kind: GroupKind;
  lines: ChangeLine[];
}

/** A `## ` section: Unreleased has no version and no date. */
export interface ChangeSection {
  version: string | null;
  date: string | null;
  intro: MdInline[][];
  groups: ChangeGroup[];
}

/** What a build bundles: its Unreleased section, the newest releases, and the newest release it left out. */
export interface Changelog {
  unreleased: ChangeSection;
  releases: ChangeSection[];
  newestCut: string | null;
}

/** The stored mark, as `get_whats_new` answers it: `lines` null means none were recorded yet. */
export type Seen = WhatsNewSeen;

/** What a start shows: curated sections, crossed releases as notes, unseen Unreleased lines, and whether more lies beyond. */
export interface Pending {
  sections: ChangeSection[];
  crossed: ChangeSection[];
  unreleased: ChangeSection | null;
  older: boolean;
}

const U32_MAX = 4294967295;

/** A version's numeric parts, read as `version_parts` in `commands/update.rs` reads them: `+` splits like `.`. */
export function versionParts(v: string): number[] {
  return v.split(/[.+]/).map((p) => {
    if (!/^\+?[0-9]+$/.test(p)) return 0;
    const n = Number(p);
    return n <= U32_MAX ? n : 0;
  });
}

/** Orders two versions as `version_gt` does: 1 exactly when it says `a` is newer, a missing part counting as 0. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const [pa, pb] = [versionParts(a), versionParts(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/** The release a build belongs to: its first three parts, without the commit number. */
export function coreOf(v: string): string {
  const parts = versionParts(v);
  return [0, 1, 2].map((i) => parts[i] ?? 0).join(".");
}

/** Whether a build is a release this changelog knows, bundled or the newest one left out. */
export function isRelease(log: Changelog, v: string): boolean {
  const core = coreOf(v);
  const known = log.releases.map((r) => r.version).concat(log.newestCut);
  return known.some((r) => r !== null && compareVersions(r, core) === 0);
}

/** The start gate's fast path: this build was seen and its lines recorded, so nothing needs loading. */
export function upToDate(seen: Seen): boolean {
  return seen.version === seen.current && seen.lines !== null;
}

/** Whether this start may write the mark: never over a newer build's, so a downgrade leaves it for the way back. */
export function shouldRecord(seen: Seen): boolean {
  return seen.version === null || compareVersions(seen.current, seen.version) >= 0;
}

/** The line ids a start records as seen: every Unreleased line of this build. */
export function linesToRecord(log: Changelog): string[] {
  return log.unreleased.groups.flatMap((g) => g.lines.map((l) => l.id));
}

/** What About opens on: this build's own part, its Unreleased lines or else its release, and the rest folded under it. */
export function browseView(log: Changelog): { primary: ChangeSection | null; folds: ChangeSection[] } {
  if (linesToRecord(log).length > 0) return { primary: log.unreleased, folds: log.releases };
  const [primary = null, ...folds] = log.releases;
  return { primary, folds };
}

/** Every line a section holds, across its groups. */
export function lineCount(section: ChangeSection): number {
  return section.groups.reduce((n, g) => n + g.lines.length, 0);
}

/** The compact view's first `keep` lines, without the intro; null when the section is short enough to show whole. */
export function firstLines(section: ChangeSection, keep = 5, whole = 6): ChangeSection | null {
  if (lineCount(section) <= whole) return null;
  let left = keep;
  const groups: ChangeGroup[] = [];
  for (const g of section.groups) {
    if (left <= 0) break;
    groups.push({ ...g, lines: g.lines.slice(0, left) });
    left -= g.lines.length;
  }
  return { ...section, intro: [], groups };
}

/** The Unreleased lines not seen yet, without the groups they leave empty; null when none remains. */
function unseenLines(section: ChangeSection, seen: Set<string>): ChangeSection | null {
  const groups = section.groups
    .map((g) => ({ ...g, lines: g.lines.filter((l) => !seen.has(l.id)) }))
    .filter((g) => g.lines.length > 0);
  return groups.length > 0 ? { ...section, groups } : null;
}

/** What this start shows since the stored mark, or null when there is nothing to show. */
export function pendingChanges(log: Changelog, seen: Seen): Pending | null {
  const { current, version } = seen;
  if (version !== null && compareVersions(current, version) < 0) return null;
  if (version === current) return null;
  const unreleased = unseenLines(log.unreleased, new Set(seen.lines ?? []));
  let sections: ChangeSection[] = [];
  let crossed: ChangeSection[] = [];
  let older = false;
  if (version === null) {
    const own = (v: string | null) => v !== null && compareVersions(v, coreOf(current)) === 0;
    if (isRelease(log, current)) sections = log.releases.filter((r) => own(r.version));
  } else {
    const [from, to] = [coreOf(version), coreOf(current)];
    const between = (v: string) => compareVersions(v, from) > 0 && compareVersions(v, to) <= 0;
    const inRange = log.releases.filter((r) => r.version !== null && between(r.version));
    older = log.newestCut !== null && between(log.newestCut);
    // A release build reads as a Nightly only to a Nightly user whose mark is a Nightly the build knows to be one.
    const nightly = !isRelease(log, current) || (seen.channel === "prerelease" && !older && !isRelease(log, version));
    if (nightly) crossed = inRange;
    else sections = inRange;
  }
  if (sections.length === 0 && crossed.length === 0 && unreleased === null) return null;
  return { sections, crossed, unreleased, older };
}
