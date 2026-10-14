import { useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/modal";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { ExternalAnchor, RichText } from "@/components/RichText";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { fuzzyDate } from "@/lib/format";
import {
  browseView,
  firstLines,
  lineCount,
  type ChangeSection,
  type Changelog,
  type GroupKind,
  type Pending,
} from "@/lib/whatsNew";

/** As tall as its text and never more than this much of the screen, on the phone and the desktop alike. */
const HEIGHT = "max-h-[80vh]";

/** Everything older than the bundled releases, and the record the dialog is cut from. */
export const CHANGELOG_URL = "https://github.com/Suzora/Karasu/blob/main/CHANGELOG.md";

/** A literal key per group, so the key check sees every one of them. */
function groupLabel(kind: GroupKind, t: TFunction): string {
  switch (kind) {
    case "added":
      return t("whatsNew.added");
    case "changed":
      return t("whatsNew.changed");
    case "fixed":
      return t("whatsNew.fixed");
    case "removed":
      return t("whatsNew.removed");
    case "security":
      return t("whatsNew.security");
  }
}

/** A section's date as the reader's language writes it; the file spells it `YYYY-MM-DD`. */
function sectionDate(date: string | null, locale: string): string {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  return fuzzyDate({ year, month, day }, locale);
}

/** A release's name in a heading or a fold: its version and its date. */
function releaseName(section: ChangeSection, locale: string): string {
  const date = sectionDate(section.date, locale);
  return date ? `${section.version} · ${date}` : (section.version ?? "");
}

/** One section's intro and groups, the changelog's own English marked as such. */
function SectionBody({ section }: { section: ChangeSection }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {section.intro.map((paragraph, i) => (
        <p key={i} lang="en" className="text-sm leading-relaxed text-ink-300">
          <RichText nodes={paragraph} />
        </p>
      ))}
      {section.groups.map((group) => (
        <section key={group.kind}>
          <h3 className="text-2xs uppercase tracking-eyebrow text-ink-600">{groupLabel(group.kind, t)}</h3>
          <ul lang="en" className="mt-1.5 ml-4 list-disc space-y-1 text-sm text-ink-300">
            {group.lines.map((line) => (
              <li key={line.id}>
                <RichText nodes={line.text} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** A section shown short: its first lines, then a button for the whole of it, intro included. */
function Compact({ section }: { section: ChangeSection }) {
  const { t } = useTranslation();
  const [whole, setWhole] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const first = firstLines(section);
  // The button goes with the click, so focus moves to what it revealed rather than dropping to the page.
  useEffect(() => {
    if (whole) region.current?.focus();
  }, [whole]);
  return (
    <div ref={region} tabIndex={whole ? -1 : undefined} className="space-y-4">
      <SectionBody section={whole || !first ? section : first} />
      {!whole && first && (
        <Button variant="outline" size="sm" onClick={() => setWhole(true)}>
          {t("whatsNew.showAll", { count: lineCount(section) })}
        </Button>
      )}
    </div>
  );
}

/** What the dialog shows, which is the same shape after an update and from About. */
interface View {
  title: string;
  date: string;
  primary: ChangeSection[];
  folds: { name: string; section: ChangeSection }[];
  older: boolean;
}

/** After an update: the curated release or the new Unreleased lines, with a crossed release folded under them. */
function updateView(pending: Pending, t: TFunction, locale: string): View {
  const newest = pending.sections[0];
  return {
    title: newest?.version ? t("whatsNew.titleVersion", { version: newest.version }) : t("whatsNew.titleNightly"),
    date: pending.sections.length === 1 ? sectionDate(newest.date, locale) : "",
    primary: pending.unreleased ? [...pending.sections, pending.unreleased] : pending.sections,
    folds: pending.crossed.map((section) => ({ name: t("whatsNew.crossed", { version: section.version }), section })),
    older: pending.older,
  };
}

/** From About: this build's own part as an update would show it, the other bundled releases folded under it. */
function aboutView(log: Changelog, t: TFunction, locale: string): View {
  const { primary, folds } = browseView(log);
  const nightly = primary?.version === null;
  return {
    title: nightly
      ? t("whatsNew.titleSince", { version: log.releases[0]?.version ?? "" })
      : t("whatsNew.titleVersion", { version: primary?.version ?? "" }),
    date: primary && !nightly ? sectionDate(primary.date, locale) : "",
    primary: primary ? [primary] : [],
    folds: folds.map((section) => ({ name: releaseName(section, locale), section })),
    older: log.newestCut !== null,
  };
}

/** The view's body: each part compact, folded or not, the folds as plain rows, and a note when more lies beyond. */
function Body({ view, log }: { view: View; log: Changelog }) {
  const { t, i18n } = useTranslation();
  const several = view.primary.length > 1;
  return (
    <div data-whats-new className="space-y-5">
      {view.primary.map((section) => (
        <div key={section.version ?? "unreleased"} className="space-y-3">
          {several && (
            <h2 className="text-sm font-semibold text-ink-100">
              {section.version
                ? releaseName(section, i18n.language)
                : t("whatsNew.titleSince", { version: log.releases[0]?.version ?? "" })}
            </h2>
          )}
          <Compact section={section} />
        </div>
      ))}
      {view.folds.map(({ name, section }) => (
        <Disclosure
          key={section.version}
          summary={name}
          defaultOpen={view.primary.length === 0}
          className="relative coarse:hit-area text-sm font-medium text-ink-100"
          panelClassName="pt-3"
        >
          <Compact section={section} />
        </Disclosure>
      ))}
      {view.older && <p className="text-xs text-ink-600">{t("whatsNew.older")}</p>}
    </div>
  );
}

/** What changed, the same view after an update and from About; the lines are CHANGELOG.md's own English. */
export default function WhatsNewDialog({
  log,
  pending,
  leaving = false,
  onClose,
}: {
  log: Changelog;
  /** Set after an update: the part this start has not shown before. Absent, About's view of this build. */
  pending?: Pending;
  leaving?: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const phone = usePhoneShell();
  const view = pending ? updateView(pending, t, i18n.language) : aboutView(log, t, i18n.language);
  const english = !i18n.language.startsWith("en") && <p className="text-xs text-ink-600">{t("whatsNew.inEnglish")}</p>;
  const footer = (
    <>
      <ExternalAnchor href={CHANGELOG_URL} className="relative coarse:hit-area mr-auto text-sm">
        {t("whatsNew.fullChangelog")}
      </ExternalAnchor>
      <Button onClick={onClose}>{t("common.done")}</Button>
    </>
  );

  return phone ? (
    <Sheet open={!leaving} onClose={onClose} label={view.title} className={HEIGHT}>
      <p className="text-base font-semibold text-ink-100">{view.title}</p>
      {view.date && <p className="mt-0.5 text-xs text-ink-600">{view.date}</p>}
      <div className="mt-4">
        <Body view={view} log={log} />
      </div>
      {english && <div className="mt-5">{english}</div>}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-hair pt-3">{footer}</div>
    </Sheet>
  ) : (
    <Modal
      title={view.title}
      description={view.date || undefined}
      onClose={onClose}
      leaving={leaving}
      size="lg"
      className={HEIGHT}
      footer={footer}
    >
      <Body view={view} log={log} />
      {english && <div className="mt-5">{english}</div>}
    </Modal>
  );
}
