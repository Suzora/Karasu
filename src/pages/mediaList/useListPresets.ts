import { useState } from "react";
import type { MediaListStatus, MediaType } from "@/api/types";
import type { ListView, SortKey } from "@/lib/listFilters";
import { loadPresets, savePresets, type Preset } from "@/lib/presets";
import type { SetView } from "./useListView";

/** The saved views of one list: applying one writes the whole view, saving one captures it as it stands. */
export function useListPresets(
  type: MediaType,
  view: ListView,
  filter: string,
  setFilter: (text: string) => void,
  setView: SetView,
) {
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets(type));

  const applyPreset = (name: string) => {
    const p = presets.find((x) => x.name === name);
    if (!p) return;
    setFilter(p.filter);
    // `?? ""` on the newer fields: presets saved before they existed must clear the filters they never captured.
    setView({
      tab: p.tab as MediaListStatus,
      q: p.filter,
      sort: p.sort as SortKey,
      dir: p.dir === "asc" || p.dir === "desc" ? p.dir : "",
      tag: p.tagFilter ?? "",
      format: p.format ?? "",
      country: p.country ?? "",
      list: p.list ?? "",
      group: p.group === "tag" || p.group === "list" ? p.group : "",
    });
  };

  const addPreset = (name: string) => {
    const next = [
      ...presets.filter((p) => p.name !== name),
      {
        name,
        tab: view.tab,
        filter,
        sort: view.sort,
        // The raw param, so a preset saved on the default direction keeps following the key's default.
        dir: view.rawDir,
        tagFilter: view.tag,
        format: view.format,
        country: view.country,
        list: view.list,
        group: view.group,
      },
    ];
    setPresets(next);
    savePresets(type, next);
  };

  const deletePreset = (name: string) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    savePresets(type, next);
  };

  return { presets, applyPreset, addPreset, deletePreset };
}
