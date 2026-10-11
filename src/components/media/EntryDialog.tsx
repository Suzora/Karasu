import { useEffect, useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import {
  displayTitle,
  maxProgress,
  type FuzzyDate,
  type MediaListStatus,
  type MediaTitle,
  type MediaType,
} from "@/api/types";
import { fuzzyDate } from "@/lib/format";
import { useAdvancedCategories, useAuth } from "@/stores/auth";
import { AdvancedScoreFields } from "@/components/media/AdvancedScoreFields";
import { ProgressStepper, StatusTiles } from "@/components/media/QuickEditor";
import TagEditor from "@/components/media/TagEditor";
import ConfirmDialog from "@/components/overlays/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Modal } from "@/components/ui/modal";
import { PresenceIf } from "@/components/ui/presence";
import { ScoreBars } from "@/components/ui/score-bars";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { loadDefaultAddStatus } from "@/lib/defaultAddStatus";
import { openingFields, type FillMemo } from "@/lib/completion";
import {
  advancedPatch,
  datePatch,
  flagPatch,
  listsPatch,
  statusPatch,
  type EntryPatch,
} from "@/lib/entryPatch";
import { parseNotes, serializeNotes } from "@/lib/tags";

export interface EditableMedia {
  id: number;
  type: MediaType;
  title: MediaTitle;
  episodes: number | null;
  chapters?: number | null;
  volumes?: number | null;
}

export interface EditableEntry {
  status: MediaListStatus;
  progress: number;
  progressVolumes?: number;
  score: number;
  repeat: number;
  notes: string | null;
  private?: boolean;
  hiddenFromStatusLists?: boolean | null;
  customLists?: Record<string, boolean> | null;
  advancedScores?: Record<string, number> | null;
  startedAt?: FuzzyDate | null;
  completedAt?: FuzzyDate | null;
}

type Tab = "notes" | "dates" | "lists";

/** A fuzzy date behind a native date input; a partial value shows as a caption and survives until picked or cleared. */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FuzzyDate | null;
  onChange: (d: FuzzyDate | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const full =
    value?.year && value.month && value.day
      ? `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`
      : "";
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-xs text-ink-500">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          type="date"
          value={full}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return onChange(null);
            const [year, month, day] = v.split("-").map(Number);
            if (year && month && day) onChange({ year, month, day });
          }}
          className="min-w-0 flex-1"
        />
        {value?.year != null && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            {t("entry.clearDate")}
          </Button>
        )}
      </div>
      {value?.year != null && !full && (
        <span className="mt-1 block text-xs text-ink-600">
          {t("entry.partialDate", { date: fuzzyDate(value, i18n.language) })}
        </span>
      )}
    </div>
  );
}

/** The one entry editor every list, card, rail and menu opens; each control saves as it is touched. */
export default function EntryDialog({
  leaving,
  media,
  entry,
  onWrite,
  onAdd,
  onDelete,
  onClose,
  tagSuggestions = [],
  customListNames,
}: {
  /** On its way out — supplied by `Presence`. */
  leaving?: boolean;
  media: EditableMedia;
  /** Null for a title not on the list, which first offers only the status to add it with. */
  entry: EditableEntry | null;
  onWrite: (patch: EntryPatch) => void;
  /** The first add; the dialog then stays open as the editor of the entry it made. */
  onAdd?: (status: MediaListStatus) => void;
  onDelete?: () => void;
  onClose: () => void;
  tagSuggestions?: string[];
  /** The account's custom-list names for this media type; without them the tab is not offered. */
  customListNames?: string[];
}) {
  const { t } = useTranslation();
  const phone = usePhoneShell();
  const anilist = useAuth((s) => s.mode) === "anilist";
  const notesId = useId();
  const tagsId = useId();
  const flagHintId = useId();
  const manga = media.type === "MANGA";
  const title = displayTitle(media.title);

  // The entry this dialog edits: the caller's, or the one a first add made before the caller's list has it.
  const [added, setAdded] = useState<EditableEntry | null>(null);
  const live = entry ?? added;
  const [status, setStatus] = useState(live?.status ?? null);
  const [progress, setProgress] = useState(live?.progress ?? 0);
  const [volumes, setVolumes] = useState(live?.progressVolumes ?? 0);
  const [score, setScore] = useState(live?.score ?? 0);
  const [memo, setMemo] = useState<FillMemo | null>(null);
  const [repeat, setRepeat] = useState(live?.repeat ?? 0);
  const parsed = parseNotes(live?.notes);
  const [notes, setNotes] = useState(parsed.notes);
  const [tags, setTags] = useState(parsed.tags);
  const [priv, setPriv] = useState(live?.private ?? false);
  const [hidden, setHidden] = useState(live?.hiddenFromStatusLists ?? false);
  const [started, setStarted] = useState<FuzzyDate | null>(live?.startedAt ?? null);
  const [completed, setCompleted] = useState<FuzzyDate | null>(live?.completedAt ?? null);
  const [members, setMembers] = useState(
    () => new Set(Object.entries(live?.customLists ?? {}).filter(([, on]) => on).map(([n]) => n)),
  );
  const categories = useAdvancedCategories(media.type);
  const [advanced, setAdvanced] = useState<Record<string, number>>(() => ({ ...live?.advancedScores }));
  const [tab, setTab] = useState<Tab>("notes");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A change made outside while the dialog is open, an Undo above all, is what the controls show next.
  useEffect(() => {
    if (!entry) return;
    setStatus(entry.status);
    setProgress(entry.progress);
    setVolumes(entry.progressVolumes ?? 0);
    setScore(entry.score);
    setRepeat(entry.repeat);
  }, [entry, entry?.status, entry?.progress, entry?.progressVolumes, entry?.score, entry?.repeat]);

  const lists = anilist ? (customListNames ?? []) : [];
  // Only when the entry carries the scores: one queried without them would save zeros over real ones.
  const showAdvanced = anilist && categories.length > 0 && (live === null || live.advancedScores != null);

  const pick = (next: MediaListStatus) => {
    if (!live || status === null) {
      const opening = openingFields(null, next, media, media.type);
      setAdded({ status: next, progress: opening.fields.progress, progressVolumes: opening.fields.volumes, score: 0, repeat: 0, notes: null });
      setStatus(next);
      setProgress(opening.fields.progress);
      setVolumes(opening.fields.volumes);
      setMemo(opening.memo);
      onAdd?.(next);
      return;
    }
    if (next === status) return;
    const out = statusPatch({ status, progress, volumes }, memo, next, media, media.type);
    setStatus(out.fields.status);
    setProgress(out.fields.progress);
    setVolumes(out.fields.volumes);
    setMemo(out.memo);
    onWrite(out.patch);
  };

  const writeNotes = (nextNotes: string, nextTags: string[]) => {
    const serialized = serializeNotes(nextNotes, nextTags);
    if (serialized === (live?.notes ?? "")) return;
    onWrite({ notes: serialized });
  };

  const tiles = (
    <div role="group" aria-label={live ? t("common.status") : t("detail.addAs")}>
      {!live && <p className="mb-2 text-sm text-ink-500">{t("detail.addAs")}</p>}
      <StatusTiles
        type={media.type}
        current={live ? status : null}
        preset={live ? null : loadDefaultAddStatus()}
        onPick={pick}
        compact={!phone}
      />
    </div>
  );

  const quick = live && (
    <div className="space-y-4">
      <ProgressStepper
        compact={!phone}
        label={manga ? t("common.chapters") : t("common.progress")}
        value={progress}
        total={maxProgress(media)}
        onCommit={(n) => {
          setProgress(n);
          onWrite({ progress: n });
        }}
      />
      {manga && (
        <ProgressStepper
          compact={!phone}
          label={t("common.volumes")}
          value={volumes}
          total={media.volumes ?? null}
          onCommit={(n) => {
            setVolumes(n);
            onWrite({ progressVolumes: n });
          }}
        />
      )}
      <div>
        <span className="mb-1 block text-xs text-ink-500">{t("common.score")}</span>
        <ScoreBars
          value={score}
          onChange={(n) => {
            setScore(n);
            onWrite({ score: n });
          }}
        />
      </div>
      {showAdvanced && (
        <AdvancedScoreFields
          categories={categories}
          values={advanced}
          onChange={(next) => {
            setAdvanced(next);
            const patch = advancedPatch(categories, next);
            if (patch) onWrite(patch);
          }}
        />
      )}
    </div>
  );

  const notesTab = (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-500">{manga ? t("entry.rereads") : t("entry.rewatches")}</span>
        <NumberInput
          value={repeat}
          onChange={setRepeat}
          onBlur={() => repeat !== (live?.repeat ?? 0) && onWrite({ repeat })}
          className="w-16"
          aria-label={manga ? t("entry.rereads") : t("entry.rewatches")}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setRepeat(repeat + 1);
            onWrite({ repeat: repeat + 1 });
          }}
        >
          {t("entry.addRepeat")}
        </Button>
      </div>
      {/* A `div`, not a `label`: a label would forward stray clicks to the first chip's remove button. */}
      <div>
        <span id={tagsId} className="mb-1 block text-xs text-ink-500">
          {t("tags.label")}
        </span>
        <TagEditor
          tags={tags}
          onChange={(next) => {
            setTags(next);
            writeNotes(notes, next);
          }}
          suggestions={tagSuggestions}
          labelledBy={tagsId}
        />
      </div>
      <div>
        <label htmlFor={notesId} className="mb-1 block text-xs text-ink-500">
          {t("entry.notes")}
        </label>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => writeNotes(notes, tags)}
          rows={3}
          placeholder={t("entry.notesPlaceholder")}
        />
      </div>
    </div>
  );

  const flag = (label: string, checked: boolean, onChange: (v: boolean) => void, described = false) => (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-300">{label}</span>
      <Switch checked={checked} onChange={onChange} aria-label={label} aria-describedby={described ? flagHintId : undefined} />
    </div>
  );

  const datesTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <DateField
          label={t("entry.startDate")}
          value={started}
          onChange={(d) => {
            setStarted(d);
            onWrite(datePatch("startedAt", d));
          }}
        />
        <DateField
          label={t("entry.finishDate")}
          value={completed}
          onChange={(d) => {
            setCompleted(d);
            onWrite(datePatch("completedAt", d));
          }}
        />
      </div>
      {flag(anilist ? t("entry.private") : t("entry.privateLocal"), priv, (v) => {
        setPriv(v);
        const patch = flagPatch(anilist, "private", v);
        if (patch) onWrite(patch);
      }, !anilist)}
      {anilist &&
        flag(t("entry.hidden"), hidden, (v) => {
          setHidden(v);
          const patch = flagPatch(anilist, "hiddenFromStatusLists", v);
          if (patch) onWrite(patch);
        }, true)}
      {/* Said on the page, since a hover title reaches neither a keyboard nor a finger; one flag has a reason at a time. */}
      <p id={flagHintId} className="text-xs text-ink-600">
        {anilist ? t("entry.hiddenHint") : t("entry.privateLocalHint")}
      </p>
    </div>
  );

  const listsTab = (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {lists.map((name) => (
        <label key={name} className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={members.has(name)}
            onChange={(e) => {
              const next = new Set(members);
              if (e.target.checked) next.add(name);
              else next.delete(name);
              setMembers(next);
              onWrite(listsPatch(lists, next));
            }}
            className="size-3.5 accent-accent-500"
          />
          {name}
        </label>
      ))}
    </div>
  );

  const tabs = live && (
    <div>
      <Segmented<Tab>
        aria-label={t("entry.more")}
        value={tab}
        onChange={setTab}
        segments={[
          { value: "notes", label: t("entry.tabNotes") },
          { value: "dates", label: t("entry.tabDates") },
          ...(lists.length > 0 ? [{ value: "lists" as const, label: t("entry.customLists") }] : []),
        ]}
      />
      <div className="mt-3">{tab === "notes" ? notesTab : tab === "dates" ? datesTab : listsTab}</div>
    </div>
  );

  const foot: ReactNode = live && (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      {onDelete ? (
        <Button variant="dangerGhost" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-3.5" /> {t("common.remove")}
        </Button>
      ) : (
        <span />
      )}
      <span className="text-xs text-ink-600">{t("entry.savedHint")}</span>
    </div>
  );

  const body = phone ? (
    <div className="space-y-4">
      {tiles}
      {quick}
      {tabs}
      {foot}
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        {tiles}
        {quick}
      </div>
      {tabs && <div className="border-l border-hair pl-6">{tabs}</div>}
    </div>
  );

  return (
    <>
      {phone ? (
        <Sheet open={!leaving} onClose={onClose} label={title} tall>
          <p className="mb-3 text-base font-semibold text-ink-100">{title}</p>
          {body}
        </Sheet>
      ) : (
        <Modal title={title} onClose={onClose} leaving={leaving} size={live ? "2xl" : "md"} footer={foot || undefined}>
          {body}
        </Modal>
      )}
      {/* Beside the editor, not in it, so its dim covers the screen while the editor leaves and Escape closes it alone. */}
      <PresenceIf when={confirmDelete}>
        {(confirmLeaving) => (
          <ConfirmDialog
            leaving={confirmLeaving}
            title={t("confirm.removeOne")}
            names={[title]}
            note={t("confirm.removeNote")}
            confirmLabel={t("common.remove")}
            onConfirm={() => onDelete?.()}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </PresenceIf>
    </>
  );
}
