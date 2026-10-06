import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { bulkSaveEntries, fetchMediaList, saveListEntry } from "@/api/anilist";
import { listOptions, updateListOptions, type ListTypeShape, type UserProfile } from "@/api/social";
import type { ListResult, MediaType } from "@/api/types";
import type { ListOp } from "@/lib/customListOps";
import {
  ListRunError,
  runListOp,
  type ListRunFailure,
  type ListRunResult,
  type OrphanChoice,
} from "@/lib/customListRun";
import { retargetPresets } from "@/lib/presets";
import { useAuth } from "@/stores/auth";
import { showToast } from "@/stores/toast";

/** One key per list type, so every mount sees a run in flight and a second one waits for the first. */
export const customListAdminKey = (type: MediaType) => ["customListAdmin", type] as const;

function doneText(op: ListOp, t: TFunction): string {
  switch (op.kind) {
    case "create":
      return t("settings.customListCreated", { name: op.name });
    case "rename":
      return t("settings.customListRenamed", { name: op.to });
    case "delete":
      return t("settings.customListDeleted", { name: op.name });
  }
}

function failureText(f: ListRunFailure | null, t: TFunction): string {
  switch (f?.code) {
    case "invalid":
      if (f.problem === "duplicate") return t("settings.customListDuplicate");
      if (f.problem === "reserved") return t("settings.customListReserved");
      return t("settings.customListEmpty");
    case "stale":
      return t("settings.customListStale");
    case "queued":
      return t("settings.customListQueued");
    case "offline":
      return t("settings.customListOffline");
    case "mismatch":
      return t("settings.customListMismatch");
    default:
      return t("settings.customListFailed");
  }
}

/** Creates, renames or deletes one custom list per call, then verifies every entry's membership and repairs drift. */
export function useCustomListAdmin(type: MediaType) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const viewer = useAuth((s) => s.viewer);

  const showLists = (options: ListTypeShape) => {
    if (!viewer) return;
    qc.setQueryData<UserProfile>(["social", "user", viewer.name], (old) => {
      if (!old?.mediaListOptions) return old;
      const lists = {
        customLists: options.customLists,
        sectionOrder: options.sectionOrder,
        splitCompletedSectionByFormat: options.splitCompletedSectionByFormat,
      };
      const key = type === "ANIME" ? "animeList" : "mangaList";
      return { ...old, mediaListOptions: { ...old.mediaListOptions, [key]: lists } };
    });
  };
  const showList = (list: ListResult) => {
    if (viewer) qc.setQueryData(["mediaList", type, viewer.id], list);
  };

  return useMutation<ListRunResult, Error, { op: ListOp; orphans?: OrphanChoice }>({
    mutationKey: customListAdminKey(type),
    scope: { id: `customListAdmin:${type}` },
    mutationFn: ({ op, orphans }) => {
      if (!viewer) return Promise.reject(new Error("signed out"));
      const id = viewer.id;
      return runListOp(
        type,
        op,
        {
          readOptions: () => listOptions(id),
          writeOptions: (write) => updateListOptions(type, write),
          fetchList: (force) => fetchMediaList(id, type, { force }),
          save: (input) => saveListEntry(input),
          unhide: (entries) => bulkSaveEntries(entries, { hiddenFromStatusLists: false }),
        },
        orphans,
      );
    },
    onSuccess: (res, { op }) => {
      showLists(res.options);
      // An unchecked run holds only the copy from before the write, so the list is read again rather than shown.
      if (res.verified && res.list) showList(res.list);
      else void qc.invalidateQueries({ queryKey: ["mediaList", type] });
      if (op.kind === "rename") retargetPresets(type, op.from, op.to);
      if (op.kind === "delete") retargetPresets(type, op.name, null);

      const details = [
        !res.verified && t("settings.customListUnverified"),
        res.repaired > 0 && t("settings.customListRepaired", { count: res.repaired }),
        res.queued > 0 && t("settings.customListRepairQueued", { count: res.queued }),
        res.unrepaired > 0 && t("settings.customListUnrepaired", { count: res.unrepaired }),
        res.sideEffects.length > 0 && t("settings.customListSideEffect"),
      ].filter((d): d is string => typeof d === "string");
      const warn = !res.verified || res.unrepaired > 0 || res.sideEffects.length > 0;
      showToast({
        kind: warn ? "error" : res.queued > 0 ? "info" : "success",
        text: doneText(op, t),
        detail: details.length ? details.join(" ") : undefined,
      });
    },
    onError: (e, { orphans }) => {
      const failure = e instanceof ListRunError ? e.failure : null;
      // An unhide lands before the write it prepares, so a failed write still leaves those entries changed.
      if (orphans?.unhide) void qc.invalidateQueries({ queryKey: ["mediaList", type] });
      // The run read the account afresh before it stopped; drawing that read costs nothing and ends the stale screen.
      if ((failure?.code === "stale" || failure?.code === "mismatch") && failure.options) showLists(failure.options);
      if (failure?.code === "stale" && failure.list) showList(failure.list);
      const unhidden = e instanceof ListRunError ? e.unhidden : 0;
      showToast({
        kind: "error",
        text: failureText(failure, t),
        detail: unhidden > 0 ? t("settings.customListUnhiddenOnly", { count: unhidden }) : undefined,
      });
    },
  });
}
