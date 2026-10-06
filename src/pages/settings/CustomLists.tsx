import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useIsMutating, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchMediaList, isTauri } from "@/api/anilist";
import type { AniListMediaListOptions } from "@/api/social";
import type { MediaType } from "@/api/types";
import ConfirmDialog from "@/components/overlays/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { customListAdminKey, useCustomListAdmin } from "@/hooks/useCustomListAdmin";
import { usePresentValue } from "@/hooks/usePresence";
import {
  cleanName,
  hiddenOrphans,
  memberCount,
  snapshot,
  validateName,
  type ListShape,
  type Member,
  type NameProblem,
} from "@/lib/customListOps";
import type { OrphanChoice } from "@/lib/customListRun";
import { useAuth } from "@/stores/auth";

/** Literal `t()` calls, so `i18nKeys.test.ts` sees every key. */
function problemText(problem: NameProblem, t: (k: string) => string): string {
  switch (problem) {
    case "empty":
      return t("settings.customListEmpty");
    case "duplicate":
      return t("settings.customListDuplicate");
    case "reserved":
      return t("settings.customListReserved");
  }
}

const shapeFor = (options: AniListMediaListOptions, type: MediaType): ListShape => {
  const list = type === "ANIME" ? options.animeList : options.mangaList;
  return { customLists: list?.customLists ?? [], sectionOrder: list?.sectionOrder ?? [] };
};

/** Every entry's membership from the subscribed own list, for the counts and the delete's orphans; null while it loads. */
function useMembers(type: MediaType): Map<number, Member> | null {
  const viewer = useAuth((s) => s.viewer);
  const { data } = useQuery({
    queryKey: ["mediaList", type, viewer?.id],
    queryFn: () => fetchMediaList(viewer!.id, type),
    enabled: isTauri && !!viewer,
    staleTime: Infinity,
  });
  return useMemo(() => (data ? snapshot(data.lists) : null), [data]);
}

/** The custom lists of one account, changed one at a time; Anime and Manga keep separate sets on AniList. */
export function CustomListManager({ options }: { options: AniListMediaListOptions }) {
  const { t } = useTranslation();
  const [type, setType] = useState<MediaType>("ANIME");
  const shape = shapeFor(options, type);

  return (
    <div className="mt-3 space-y-3">
      <Segmented
        aria-label={t("settings.alCustomLists")}
        segments={[
          { value: "ANIME", label: t("common.anime") },
          { value: "MANGA", label: t("common.manga") },
        ]}
        value={type}
        onChange={setType}
      />
      <ListRows key={type} type={type} shape={shape} />
    </div>
  );
}

/** Where focus goes once a row's editor closes: the row under its new name, else the row it was opened on. */
interface FocusTarget {
  name: string;
  fallback: string;
}

/** Rows with the member count, inline rename and delete, and the field that adds one at the end. */
function ListRows({ type, shape }: { type: MediaType; shape: ListShape }) {
  const { t } = useTranslation();
  const admin = useCustomListAdmin(type);
  // Every mount reads the same key, so a remount mid-run cannot offer a second op while the first one repairs.
  const busy = useIsMutating({ mutationKey: customListAdminKey(type) }) > 0;
  const members = useMembers(type);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [focusTo, setFocusTo] = useState<FocusTarget | null>(null);
  const pencils = useRef(new Map<string, HTMLButtonElement>());

  // The editor took the pencil's place, so focus goes back to a row once the run has let the buttons go again.
  useEffect(() => {
    if (!focusTo || busy) return;
    (pencils.current.get(focusTo.name) ?? pencils.current.get(focusTo.fallback))?.focus();
    setFocusTo(null);
  }, [focusTo, busy, shape.customLists]);

  return (
    <>
      {shape.customLists.length > 0 ? (
        <ul className="space-y-1.5">
          {shape.customLists.map((name) =>
            editing === name ? (
              <li key={name}>
                <NameForm
                  shape={shape}
                  self={name}
                  initial={name}
                  busy={busy}
                  autoFocus
                  label={t("settings.customListRename")}
                  onCancel={() => {
                    setEditing(null);
                    setFocusTo({ name, fallback: name });
                  }}
                  onSubmit={(to) => {
                    setEditing(null);
                    setFocusTo({ name: to, fallback: name });
                    if (to !== name) admin.mutate({ op: { kind: "rename", from: name, to } });
                  }}
                />
              </li>
            ) : (
              <li key={name} className="flex items-center gap-2 rounded-control bg-surface-900 py-1 pl-3 pr-1">
                <span className="min-w-0 flex-1 truncate text-xs text-ink-100">{name}</span>
                {members && (
                  <span
                    className="text-2xs tabular-nums text-ink-600"
                    title={t("settings.customListMembers", { count: memberCount(members, name) })}
                  >
                    {memberCount(members, name)}
                  </span>
                )}
                <IconButton
                  ref={(el) => {
                    if (el) pencils.current.set(name, el);
                    else pencils.current.delete(name);
                  }}
                  size="sm"
                  disabled={busy}
                  onClick={() => setEditing(name)}
                  aria-label={`${t("settings.customListRename")}: ${name}`}
                  title={t("settings.customListRename")}
                >
                  <Pencil className="size-3.5" />
                </IconButton>
                <IconButton
                  size="sm"
                  // The dialog names what the delete strands, which it cannot do before the list has loaded.
                  disabled={busy || !members}
                  onClick={() => setDeleting(name)}
                  aria-label={`${t("settings.customListDelete")}: ${name}`}
                  title={t("settings.customListDelete")}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-2xs text-ink-600">{t("settings.alCustomListsNone")}</p>
      )}
      <NameForm
        shape={shape}
        initial=""
        busy={busy}
        label={t("settings.customListNew")}
        submitLabel={t("settings.customListAdd")}
        onSubmit={(name, reset) => admin.mutate({ op: { kind: "create", name } }, { onSuccess: reset })}
      />
      <DeleteConfirm
        name={deleting}
        members={members}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={(name, orphans) => {
          setDeleting(null);
          admin.mutate({ op: { kind: "delete", name }, orphans });
        }}
      />
    </>
  );
}

/** A name field validated as it is typed, against the same rules the write checks again. */
function NameForm({
  shape,
  self,
  initial,
  busy,
  autoFocus = false,
  label,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  shape: ListShape;
  self?: string;
  initial: string;
  busy: boolean;
  /** For the rename, which replaces the pencil that was just pressed; the add field never takes focus on load. */
  autoFocus?: boolean;
  label: string;
  /** A text button for adding; a rename gets the icon pair instead. */
  submitLabel?: string;
  /** `reset` empties the field, for the caller to run once the write has landed. */
  onSubmit: (name: string, reset: () => void) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const errorId = useId();
  const [draft, setDraft] = useState(initial);
  const name = cleanName(draft);
  const problem = name === self ? null : validateName(name, shape, self);
  const shown = draft.length > 0 ? problem : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (problem || busy) return;
    onSubmit(name, () => setDraft(initial));
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          autoFocus={autoFocus}
          onFocus={autoFocus ? (e) => e.currentTarget.select() : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={label}
          aria-label={label}
          aria-invalid={shown ? true : undefined}
          aria-describedby={shown ? errorId : undefined}
          className="h-8.5 min-w-0 flex-1"
        />
        {submitLabel ? (
          <Button type="submit" variant="outline" size="control" disabled={busy || !!problem}>
            <Plus aria-hidden className="size-3.5" />
            {submitLabel}
          </Button>
        ) : (
          <>
            <IconButton type="submit" disabled={busy || !!problem} aria-label={label} title={label}>
              <Check className="size-4" />
            </IconButton>
            <IconButton onClick={onCancel} aria-label={t("common.cancel")} title={t("common.cancel")}>
              <X className="size-4" />
            </IconButton>
          </>
        )}
      </div>
      {shown && (
        <p id={errorId} className="mt-1 text-2xs text-danger">
          {problemText(shown, t)}
        </p>
      )}
    </form>
  );
}

/** Names what a delete does to the entries, and offers to put back on the status lists those it would strand. */
function DeleteConfirm({
  name,
  members,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string | null;
  members: Map<number, Member> | null;
  busy: boolean;
  onConfirm: (name: string, orphans: OrphanChoice) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  // The choice belongs to one list's dialog; the next list's opens with the safe default again.
  const [choice, setChoice] = useState<{ name: string; unhide: boolean } | null>(null);
  const shown = usePresentValue(name);
  if (!shown.value || !members) return null;
  const target = shown.value;
  const unhide = choice?.name === target ? choice.unhide : true;
  const count = memberCount(members, target);
  const offered = hiddenOrphans(members, target).map((o) => o.id);
  return (
    <ConfirmDialog
      leaving={shown.leaving}
      title={t("settings.customListDeleteTitle", { name: target })}
      note={t("settings.customListDeleteNote", { count })}
      confirmLabel={t("settings.customListDelete")}
      onCancel={onCancel}
      onConfirm={() => {
        // A second press during the exit, or while a run is still repairing, would start a second op on the same lists.
        if (shown.leaving || busy) return;
        onConfirm(target, { offered, unhide: offered.length > 0 && unhide });
      }}
    >
      {offered.length > 0 && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-ink-300">
          <input
            type="checkbox"
            checked={unhide}
            onChange={(e) => setChoice({ name: target, unhide: e.target.checked })}
            className="mt-0.5 size-3.5 accent-accent-500"
          />
          {t("settings.customListUnhide", { count: offered.length })}
        </label>
      )}
    </ConfirmDialog>
  );
}
