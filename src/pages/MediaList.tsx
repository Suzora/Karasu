import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckSquare, CloudOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useContentFilter } from "@/stores/contentFilter";
import { shouldBlur } from "@/lib/contentFilter";
import { FilteredNotice } from "@/components/FilteredNotice";
import { fetchMediaList, flushQueue } from "@/api/anilist";
import {
  displayTitle,
  STATUS_ORDER,
  type MediaListEntry,
  type MediaListStatus,
  type MediaType,
} from "@/api/types";
import { useListMutations } from "@/hooks/useListMutations";
import EntryDialog from "@/components/media/LazyEntryDialog";
import { CoverGridSkeleton } from "@/components/Skeleton";
import ConfirmDialog from "@/components/overlays/ConfirmDialog";
import { groupEntries, type EntryGroup, type GroupBy } from "@/lib/listGroups";
import { GroupedList } from "@/components/list/GroupedList";
import { TagColourDot } from "@/components/list/TagChip";
import StackSheet from "@/components/overlays/StackSheet";
import StackRename from "@/components/overlays/StackRename";
import { useListPage } from "@/stores/listPage";
import { collapseStacks, dissolveStack, makeStack, moveMember, removeMember, renameStack, type ShownStack } from "@/lib/stacks";
import { useStacks, useTypeStacks } from "@/stores/stacks";
import RandomPickModal from "@/components/overlays/RandomPickModal";
import PresetModal from "@/components/overlays/PresetModal";
import { formatLabel, ORIGINS, originLabel } from "@/lib/format";
import { Button, buttonClass } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { StatusNav, StatusPicker } from "@/components/list/StatusNav";
import { PageTitle } from "@/components/shell/PageColumn";
import { CoverOutline, EmptyState, ErrorState, StruckQuery } from "@/components/EmptyState";
import { ListMoreMenu, ListToolbar } from "@/components/list/ListToolbar";
import { Presence, PresenceIf } from "@/components/ui/presence";
import { VirtualGrid } from "@/components/list/VirtualGrid";
import { GridCard } from "@/components/list/GridCard";
import { ListRow, type RowPatch } from "@/components/list/ListRow";
import type { BulkPatch } from "@/api/anilist";
import { ListHeader } from "@/components/list/ListHeader";
import { ROW_HEIGHT_PX, TEXT_ROW_HEIGHT_PX } from "@/components/list/columns";
import { PHONE_ROW_PX, PhoneRow } from "@/components/list/PhoneRow";
import { useRowTier } from "@/hooks/useRowTier";
import { loadViewMode, saveViewMode, type ViewMode } from "@/lib/viewMode";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { BulkBar } from "@/components/list/BulkBar";
import { COMPLETION_CONFIRM_REQUESTS, splitBulkPatch } from "@/lib/completion";
import { adjacentTab } from "@/lib/navSwipe";
import { useTabSwipe } from "@/hooks/useTabSwipe";
import { CLEAR_FILTERS } from "@/lib/listFilters";
import { isAndroid, usePlatform } from "@/stores/platform";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { backendErrorText } from "@/lib/backendError";
import { showToast } from "@/stores/toast";
import { useListEntries } from "./mediaList/useListEntries";
import { useListKeys } from "./mediaList/useListKeys";
import { useListPresets } from "./mediaList/useListPresets";
import { useListView } from "./mediaList/useListView";

export default function MediaList({ type }: { type: MediaType }) {
  const { t } = useTranslation();
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  const loading = useAuth((s) => s.loading);

  if (loading) return null;

  if (!viewer && mode !== "local") {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="text-center">
          <p className="text-ink-500">{t("list.connectPrompt")}</p>
          <Link to="/settings?pane=account" className={cn(buttonClass(), "mt-4")}>
            {t("list.toSettings")}
          </Link>
        </div>
      </div>
    );
  }

  // Local mode has no AniList user id; 0 is a stable local-list key.
  return <ListView userId={viewer?.id ?? 0} type={type} />;
}

function ListView({ userId, type }: { userId: number; type: MediaType }) {
  const { t } = useTranslation();
  const { view, filter, setFilter, setView, editDraft, commitDraft, flushQuery } = useListView(type);
  const {
    tab,
    sort,
    dir,
    tag: tagFilter,
    format: formatFilter,
    country: countryFilter,
    list: listFilter,
  } = view;
  // Remembered per media type, since the screen remounts on every navigation; all three exist on the phone too.
  const [layout, setLayout] = useState<ViewMode>(() => loadViewMode(type));
  /** The table's fixed tracks overflow a phone, so the two row views draw `PhoneRow` there instead. */
  const phone = usePhoneShell();
  // Platform, not width: a narrowed desktop window still has the keyboard the search hint names.
  const android = isAndroid(usePlatform((s) => s.info));
  const searchRef = useRef<HTMLInputElement>(null);
  const changeLayout = useCallback(
    (mode: ViewMode) => {
      setLayout(mode);
      saveViewMode(type, mode);
    },
    [type],
  );
  const [editing, setEditing] = useState<MediaListEntry | null>(null);
  const [showRandom, setShowRandom] = useState(false);
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focus, setFocus] = useState<number | null>(null);
  const [columns, setColumns] = useState(1);
  const [removing, setRemoving] = useState<MediaListEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Which list columns fit, measured off the scroll container: a fixed grid track overflows instead of shrinking.
  const tier = useRowTier(scrollRef, type === "MANGA", layout !== "text");
  const navigate = useNavigate();
  const profileMode = useAuth((s) => s.mode);
  // The request count of a bulk completion waiting on a yes; null while nothing is asking.
  const [confirmComplete, setConfirmComplete] = useState<number | null>(null);

  // Clear the selection whenever the pool it refers to changes.
  useEffect(() => setSelected(new Set()), [tab]);

  // A tab is another list, so it opens at its top; arriving is no change, so Back keeps the place it remembered.
  const shownTab = useRef(tab);
  useEffect(() => {
    if (shownTab.current === tab) return;
    shownTab.current = tab;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  const toggleSelect = useCallback((mediaId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) next.delete(mediaId);
      else next.add(mediaId);
      return next;
    });
  }, []);

  const { presets, applyPreset, addPreset, deletePreset } = useListPresets(type, view, filter, setFilter, setView);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["mediaList", type, userId],
    queryFn: () => fetchMediaList(userId, type),
  });
  const { save, bulkSave, remove, bulkRemove } = useListMutations(userId, type);

  // The phone's sideways swipe walks the tabs in their row order and stops at both ends, never wrapping round.
  const canStepTab = useCallback((step: 1 | -1) => adjacentTab(STATUS_ORDER, tab, step) !== null, [tab]);
  const stepTab = useCallback(
    (step: 1 | -1) => {
      const next = adjacentTab(STATUS_ORDER, tab, step);
      if (next) setView({ tab: next });
    },
    [tab, setView],
  );
  useTabSwipe({
    surface: rootRef,
    content: scrollRef,
    // Off while selecting, since a tab change clears the selection, and until the list has mounted to swipe.
    enabled: phone && !selectMode && !isLoading && !error,
    canStep: canStepTab,
    onStep: stepTab,
  });

  const level = useContentFilter((s) => s.level);
  // Read here, not in the memoized rows: a store subscription there would re-render every card on any store move.
  const blurAdult = useContentFilter((s) => s.blurAdult);

  const { byStatus, hiddenAdult, hiddenSuggestive, allTags, listNames, searchKeys, deferredFilter, entries } =
    useListEntries(data, view, filter, level);

  // A chosen tag that no longer exists anywhere drops out alone, so it cannot keep the list empty.
  useEffect(() => {
    if (!tagFilter) return;
    const known = new Set(allTags.map((x) => x.toLowerCase()));
    const kept = tagFilter.split(",").filter((x) => known.has(x.trim().toLowerCase()));
    if (kept.length !== tagFilter.split(",").length) setView({ tag: kept.join(",") });
  }, [allTags, tagFilter, setView]);

  // Same for a custom list deleted on anilist.co since the URL was minted.
  useEffect(() => {
    if (data && listFilter && !listNames.includes(listFilter)) setView({ list: "" });
  }, [data, listNames, listFilter, setView]);

  // Hooks stay above the early returns; mutate is the stable reference, the mutation object it hangs off is not.
  const { mutate: saveMutate } = save;

  const quickSave = useCallback(
    (
      entry: MediaListEntry,
      patch: RowPatch,
    ) => saveMutate({ mediaId: entry.mediaId, ...patch }),
    [saveMutate],
  );

  const complete = useCallback(
    (entry: MediaListEntry) => quickSave(entry, { status: "COMPLETED" }),
    [quickSave],
  );

  const plusOne = useCallback(
    (entry: MediaListEntry) =>
      quickSave(entry, { progress: entry.progress + 1 }),
    [quickSave],
  );

  const startEdit = useCallback((entry: MediaListEntry) => setEditing(entry), []);

  // Above the early returns, or the keydown handler bound on the error commit closes over an uninitialized const.
  const exitSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  // Stacks are drawn in the grid only, where a cover can carry the others behind it; rows list every entry.
  const stacks = useTypeStacks(type);
  const updateStacks = useStacks((s) => s.update);
  const [openStack, setOpenStack] = useState<string | null>(null);
  const { items: shown, stackOf } = useMemo(
    () => (layout === "grid" ? collapseStacks(entries, stacks) : { items: entries, stackOf: new Map() }),
    [layout, entries, stacks],
  );
  // Every member's stack, since the card shows the stack's front member while the list places it by its first one.
  const memberStack = useMemo(() => {
    const map = new Map<number, ShownStack<MediaListEntry>>();
    for (const shown of stackOf.values()) for (const m of shown.members) map.set(m.mediaId, shown);
    return map;
  }, [stackOf]);
  const [renaming, setRenaming] = useState<string | null>(null);
  // The shell's context menu reaches the grouping and the stacks through this handle while the list is open.
  const setGroupView = useCallback((group: GroupBy) => setView({ group }), [setView]);
  useEffect(() => {
    useListPage.getState().setPage({
      group: view.group,
      setGroup: setGroupView,
      stackAt: (mediaId) => memberStack.get(mediaId)?.stack.id ?? null,
      renameStack: setRenaming,
    });
  }, [view.group, setGroupView, memberStack]);
  useEffect(() => () => useListPage.getState().setPage(null), []);

  // Sections by tag or custom list; an entry sits in each it names, and those naming none gather last.
  const groups = useMemo<EntryGroup<MediaListEntry>[] | null>(() => {
    if (view.group === "tag") {
      return groupEntries(shown, (e) => searchKeys.get(e.id)?.tags ?? [], allTags.map((x) => x.toLowerCase()));
    }
    if (view.group === "list") {
      return groupEntries(shown, (e) => listNames.filter((n) => e.customLists?.[n] === true), listNames);
    }
    return null;
  }, [view.group, shown, searchKeys, allTags, listNames]);
  const tagNames = useMemo(() => new Map(allTags.map((x) => [x.toLowerCase(), x])), [allTags]);
  const groupLabel = useCallback(
    (key: string) =>
      key === ""
        ? t(view.group === "tag" ? "list.groupUntagged" : "list.groupUnlisted")
        : view.group === "tag"
          ? (tagNames.get(key) ?? key)
          : key,
    [t, view.group, tagNames],
  );
  const groupDot = useCallback(
    (key: string) => (view.group === "tag" && key !== "" ? <TagColourDot tag={key} /> : null),
    [view.group],
  );
  // What the sections draw, in their order; the keys walk this rather than the flat list while grouped.
  const [drawn, setDrawnState] = useState<{ entries: MediaListEntry[]; sizes: number[] } | null>(null);
  const setDrawn = useCallback((d: MediaListEntry[], sizes: number[]) => setDrawnState({ entries: d, sizes }), []);
  const nav = groups && drawn ? drawn.entries : shown;

  // A chosen stack brings all its members, so stacking a stack with another title grows it rather than splitting it.
  const stackSelection = () => {
    const ids = [...selected].flatMap((id) => memberStack.get(id)?.members.map((m) => m.mediaId) ?? [id]);
    updateStacks(type, (s) => makeStack(s, ids, crypto.randomUUID()));
    exitSelect();
  };

  const selectedEntries = useMemo(
    () => entries.filter((e) => selected.has(e.mediaId)),
    [entries, selected],
  );

  const { mutate: removeMutate } = remove;

  useListKeys({
    scrollRef,
    searchRef,
    busy: Boolean(editing || removing || showRandom || showPresetSave || openStack || renaming),
    nav,
    sizes: groups && drawn ? drawn.sizes : null,
    columns,
    focus,
    setFocus,
    selectMode,
    setSelectMode,
    setSelected,
    toggleSelect,
    exitSelect,
    memberStack,
    openStack: setOpenStack,
    plusOne,
    complete,
    startEdit,
    startRemove: setRemoving,
  });

  // A filter or tab change re-pools the entries, so an old index would name a different title.
  useEffect(
    () => setFocus(null),
    [tab, deferredFilter, tagFilter, formatFilter, countryFilter, listFilter, sort, dir, view.group],
  );
  useEffect(() => {
    if (!groups) setDrawnState(null);
  }, [groups]);

  const unit = type === "ANIME" ? t("common.episodes") : t("common.chapters");

  const renderCard = (entry: MediaListEntry, i: number) => {
    const stacked = stackOf.get(entry.mediaId);
    const front = stacked?.members[0] ?? entry;
    return (
    <GridCard
      key={entry.id}
      stack={
        stacked && {
          members: stacked.members,
          name: stacked.stack.name ?? null,
          onOpen: () => setOpenStack(stacked.stack.id),
        }
      }
      entry={front}
      focused={i === focus}
      unit={unit}
      blurred={shouldBlur(front.media, level, blurAdult)}
      onPlusOne={plusOne}
      onComplete={complete}
      onEdit={startEdit}
      selectMode={selectMode}
      selected={selected.has(front.mediaId)}
      onToggleSelect={toggleSelect}
    />
    );
  };
  const renderPhoneRow = (entry: MediaListEntry, i: number) => (
    <PhoneRow
      key={entry.id}
      entry={entry}
      variant={layout === "text" ? "text" : "thumbs"}
      unit={unit}
      focused={i === focus}
      blurred={shouldBlur(entry.media, level, blurAdult)}
      onPlusOne={plusOne}
      onEdit={startEdit}
      selectMode={selectMode}
      selected={selected.has(entry.mediaId)}
      onToggleSelect={toggleSelect}
    />
  );
  const renderTableRow = (entry: MediaListEntry, i: number) => (
    <ListRow
      key={entry.id}
      entry={entry}
      tier={tier}
      variant={layout === "text" ? "text" : "thumbs"}
      focused={i === focus}
      blurred={shouldBlur(entry.media, level, blurAdult)}
      onQuickSave={quickSave}
      onComplete={complete}
      onEdit={startEdit}
      selectMode={selectMode}
      selected={selected.has(entry.mediaId)}
      onToggleSelect={toggleSelect}
    />
  );
  const groupProps = {
    groups: groups ?? [],
    label: groupLabel,
    dot: groupDot,
    scrollRef,
    focusIndex: focus,
    onColumns: setColumns,
    onDrawn: setDrawn,
  };


  if (isLoading) {
    // The grid, not a sentence: a line of text where a wall of covers is about to appear moves everything twice.
    return (
      <div className="px-8 py-6">
        <CoverGridSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
        title={(reason) => t("list.loadError", { message: reason })}
        className="p-8"
      />
    );
  }

  // One mutation for the whole selection, not one per entry (useListMutations.bulkSave).
  const bulkPatch = (patch: BulkPatch) =>
    bulkSave.mutate({ entries: selectedEntries, patch });
  const bulkStatus = (status: MediaListStatus) => {
    // Local mode writes SQLite, so only an AniList completion has a request count worth asking about.
    const requests =
      status === "COMPLETED" && profileMode === "anilist"
        ? splitBulkPatch(selectedEntries, { status }, type).length
        : 1;
    if (requests > COMPLETION_CONFIRM_REQUESTS) setConfirmComplete(requests);
    else bulkPatch({ status });
  };
  const bulkScore = (score: number) => bulkPatch({ score });
  const bulkProgress = (progress: number) => bulkPatch({ progress });
  const bulkRepeat = (repeat: number) => bulkPatch({ repeat });
  const bulkPrivate = (hidden: boolean) => bulkPatch({ private: hidden });
  // One sequential mutation, not a concurrent request per entry, and there is no batch delete to use instead.
  const bulkDelete = () => {
    bulkRemove.mutate(selectedEntries);
    setSelected(new Set());
  };
  const actions = (
    <div className="flex items-center gap-1.5">
      {/* Labelled, not a bare icon: this one changes the whole interaction model, so it is worth the width. */}
      <Button
        variant={selectMode ? "secondary" : "outline"}
        size="control"
        onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
      >
        <CheckSquare className="size-4" />
        {t("bulk.select")}
      </Button>
      {/* The phone syncs by pulling the list down, so its corner holds what its toolbar has no room for. */}
      {phone ? (
        <ListMoreMenu
          type={type}
          presets={presets}
          onApplyPreset={applyPreset}
          onManagePresets={() => setShowPresetSave(true)}
          onRandom={() => setShowRandom(true)}
          layout={layout}
          onLayout={changeLayout}
          group={view.group}
          onGroup={setGroupView}
        />
      ) : (
        <IconButton
          variant="ghost"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label={t("common.reload")}
        >
          <Spinner spinning={isRefetching} className="size-4" />
        </IconButton>
      )}
    </div>
  );
  const statusProps = {
    type,
    value: tab,
    counts: Object.fromEntries(STATUS_ORDER.map((st) => [st, byStatus.get(st)?.length ?? 0])) as Record<MediaListStatus, number>,
    onChange: (v: MediaListStatus) => setView({ tab: v }),
    lists: listNames,
    list: listFilter,
    onList: (name: string) => setView({ list: name }),
  };
  return (
    // Clipped sideways, so the list following a swipe never gives the page a horizontal scroll.
    <div ref={rootRef} className="flex h-full flex-col overflow-x-clip">
      {(data?.fromCache || (data?.pending ?? 0) > 0) && (
        <div className="flex items-center gap-3 border-b border-hair bg-gold/10 px-8 py-2 text-xs text-gold">
          <CloudOff className="size-3.5" />
          {data?.fromCache
            ? t("list.offline")
            : t("sync.queuedChanges", { count: data?.pending ?? 0 })}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-gold"
            onClick={async () => {
              await flushQueue().catch((e: unknown) =>
                showToast({ kind: "error", text: t("sync.queueFailed"), detail: backendErrorText(e, t) }),
              );
              refetch();
            }}
          >
            <RefreshCw className="size-3.5" /> {t("list.syncNow")}
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {!phone && (
          <aside className="w-60 shrink-0 space-y-1 overflow-y-auto pb-8 pl-5 pr-3 pt-6">
            <PageTitle className="mb-3" title={type === "ANIME" ? t("list.animeTitle") : t("list.mangaTitle")} jp={type === "ANIME" ? t("list.animeNative") : t("list.mangaNative")} />
            <StatusNav {...statusProps} />
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={cn("space-y-3 pb-3 pt-6", phone ? "px-8" : "pl-2 pr-8")}>
            {phone && (
              <PageTitle
                title={type === "ANIME" ? t("list.animeTitle") : t("list.mangaTitle")}
                jp={type === "ANIME" ? t("list.animeNative") : t("list.mangaNative")}
                action={actions}
              />
            )}
            {phone && <StatusPicker {...statusProps} />}
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <ListToolbar
                  type={type}
                  view={view}
                  query={filter}
                  onQuery={setFilter}
                  searchRef={searchRef}
                  shown={entries.length}
                  total={byStatus.get(tab)?.length ?? 0}
                  listNames={listNames}
                  tags={allTags}
                  presets={presets}
                  onApplyPreset={applyPreset}
                  onManagePresets={() => setShowPresetSave(true)}
                  onManageLists={
                    profileMode === "anilist" ? () => navigate("/settings?pane=account&setting=customLists") : undefined
                  }
                  onRandom={() => setShowRandom(true)}
                  layout={layout}
                  onLayout={changeLayout}
                  onDraft={editDraft}
                  onChange={setView}
                  onPanelOpen={flushQuery}
                  onPanelClosed={commitDraft}
                  phone={phone}
                  touch={android}
                />
              </div>
              {!phone && actions}
            </div>
          </div>
          <div
            ref={scrollRef}
            // A stack's layers reach above its cover, so the first row needs that much room under the scroller's edge.
            className={cn("min-h-0 flex-1 overflow-y-auto pb-12 float-clear", stackOf.size > 0 ? "pt-4" : "pt-1", phone ? "px-8" : "pl-2 pr-8")}
          >
            {/* Above the grid, since VirtualGrid takes entries only; the whole-list count, so it does not jump per tab. */}
            <FilteredNotice adult={hiddenAdult} suggestive={hiddenSuggestive} className="mb-2" />
            {entries.length === 0 ? (
              // Two different nothings: an empty tab is a fact about the list, a search that matched none is about the query.
              (byStatus.get(tab)?.length ?? 0) === 0 ? (
                <EmptyState
                  visual={<CoverOutline />}
                  title={t("list.emptyTab", {
                    status: t(`status.${type}.${tab}`),
                  })}
                  hint={t("list.emptyTabHint")}
                />
              ) : (
                <EmptyState
                  visual={
                    <StruckQuery
                      query={
                        filter.trim() ||
                        tagFilter ||
                        formatLabel(formatFilter, t) ||
                        (countryFilter && originLabel(countryFilter as (typeof ORIGINS)[number], t)) ||
                        listFilter
                      }
                    />
                  }
                  title={t("list.noMatch", {
                    status: t(`status.${type}.${tab}`),
                  })}
                  actions={
                    <Button
                      variant="outline"
                      size="control"
                      onClick={() => {
                        setFilter("");
                        setView({ ...CLEAR_FILTERS, q: "" });
                      }}
                    >
                      {t("list.clearFilter")}
                    </Button>
                  }
                />
              )
            ) : layout === "grid" ? (
              groups ? (
                <GroupedList
                  key={`grouped-grid-${phone}-${view.group}-${tab}`}
                  {...groupProps}
                  gridClassName="media-grid gap-x-4"
                  rowGap={24}
                  estimateRowHeight={300}
                  renderItem={renderCard}
                />
              ) : (
                <VirtualGrid
                  // Keyed on the view and the shell, so no row height measured for one layout is reused by another.
                  key={`grid-${phone}`}
                  items={shown}
                  scrollRef={scrollRef}
                  gridClassName="media-grid gap-x-4"
                  rowGap={24}
                  estimateRowHeight={300}
                  focusIndex={focus}
                  onColumns={setColumns}
                  renderItem={renderCard}
                />
              )
            ) : phone ? (
              groups ? (
                <GroupedList
                  key={`grouped-phone-${layout}-${view.group}-${tab}`}
                  {...groupProps}
                  gridClassName="grid grid-cols-1"
                  rowGap={0}
                  estimateRowHeight={layout === "text" ? PHONE_ROW_PX.text : PHONE_ROW_PX.thumbs}
                  renderItem={renderPhoneRow}
                  frameClassName="overflow-hidden rounded-panel border border-hair"
                />
              ) : (
                <div className="overflow-hidden rounded-panel border border-hair">
                  <VirtualGrid
                    key={`phone-${layout}`}
                    items={entries}
                    scrollRef={scrollRef}
                    // One bounded track: an `auto` one grows to a nowrap title and pushes the buttons out of the row.
                    gridClassName="grid grid-cols-1"
                    rowGap={0}
                    estimateRowHeight={layout === "text" ? PHONE_ROW_PX.text : PHONE_ROW_PX.thumbs}
                    focusIndex={focus}
                    onColumns={setColumns}
                    renderItem={renderPhoneRow}
                  />
                </div>
              )
            ) : groups ? (
              <GroupedList
                key={`grouped-table-${layout}-${view.group}-${tab}`}
                {...groupProps}
                gridClassName="grid"
                rowGap={0}
                estimateRowHeight={layout === "text" ? TEXT_ROW_HEIGHT_PX : ROW_HEIGHT_PX}
                renderItem={renderTableRow}
                frameClassName="overflow-hidden rounded-panel border border-hair"
                frameHead={<ListHeader tier={tier} selectMode={selectMode} mediaType={type} cover={layout !== "text"} />}
              />
            ) : (
              <div className="overflow-hidden rounded-panel border border-hair">
                <ListHeader tier={tier} selectMode={selectMode} mediaType={type} cover={layout !== "text"} />
                {/* Keep one entry per row: two side by side made useColumnCount report 2, so the down arrow moved by two. */}
                <VirtualGrid
                  key={`table-${layout}`}
                  items={entries}
                  scrollRef={scrollRef}
                  gridClassName="grid"
                  rowGap={0}
                  estimateRowHeight={layout === "text" ? TEXT_ROW_HEIGHT_PX : ROW_HEIGHT_PX}
                  focusIndex={focus}
                  onColumns={setColumns}
                  renderItem={renderTableRow}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Presence, so the bar sinks away still showing the selection it had rather than a count of nought. */}
      <Presence value={selectMode ? selectedEntries : null}>
        {(chosen, leaving) => (
          <BulkBar
            leaving={leaving}
            type={type}
            count={chosen.length}
            onStatus={bulkStatus}
            onScore={bulkScore}
            onProgress={bulkProgress}
            onRepeat={bulkRepeat}
            onPrivate={bulkPrivate}
            onDelete={bulkDelete}
            onClear={exitSelect}
            onStack={layout === "grid" ? stackSelection : undefined}
            names={chosen.map((e) => displayTitle(e.media.title))}
          />
        )}
      </Presence>

      <Presence value={openStack ? (stacks.find((s) => s.id === openStack) ?? null) : null}>
        {(stack, leaving) => {
          // The tab's own copy, so a +1 in the sheet shows at once; a member that left the tab leaves the sheet.
          const pool = new Map((byStatus.get(tab) ?? []).map((e) => [e.mediaId, e]));
          const members = stack.members.map((id) => pool.get(id)).filter((e): e is MediaListEntry => e !== undefined);
          return (
            <StackSheet
              leaving={leaving}
              name={stack.name ?? null}
              onRename={() => setRenaming(stack.id)}
              members={members}
              unit={unit}
              onPlusOne={plusOne}
              onMove={(id, by) => updateStacks(type, (s) => moveMember(s, stack.id, id, by))}
              onTake={(id) => updateStacks(type, (s) => removeMember(s, stack.id, id))}
              onDissolve={() => {
                updateStacks(type, (s) => dissolveStack(s, stack.id));
                setOpenStack(null);
              }}
              onClose={() => setOpenStack(null)}
            />
          );
        }}
      </Presence>

      <Presence value={renaming ? (stacks.find((s) => s.id === renaming) ?? null) : null}>
        {(stack, leaving) => {
          const front = (byStatus.get(tab) ?? []).find((e) => e.mediaId === stack.members[0]);
          return (
            <StackRename
              leaving={leaving}
              name={stack.name ?? ""}
              fallback={front ? displayTitle(front.media.title) : ""}
              onSave={(name) => updateStacks(type, (s) => renameStack(s, stack.id, name))}
              onClose={() => setRenaming(null)}
            />
          );
        }}
      </Presence>

      {/* Presence rather than a bare conditional: the dialog keeps its entry while it animates away. */}
      <Presence value={editing}>
        {(opened, leaving) => {
          // The list's current copy, so an Undo or a write landing while the dialog is open shows in it.
          const entry = byStatus.get(opened.status)?.find((e) => e.id === opened.id)
            ?? [...byStatus.values()].flat().find((e) => e.id === opened.id)
            ?? opened;
          return (
            <EntryDialog
              leaving={leaving}
              media={{ ...entry.media, type }}
              entry={entry}
              tagSuggestions={allTags}
              customListNames={listNames}
              onClose={() => setEditing(null)}
              onWrite={(patch) => save.mutate({ mediaId: entry.mediaId, ...patch })}
              onDelete={() => {
                remove.mutate(entry.id);
                setEditing(null);
              }}
            />
          );
        }}
      </Presence>

      <Presence value={removing}>
        {(entry, leaving) => (
          <ConfirmDialog
            leaving={leaving}
            title={t("confirm.removeOne")}
            names={[displayTitle(entry.media.title)]}
            note={t("confirm.removeNote")}
            confirmLabel={t("common.remove")}
            onConfirm={() => {
              removeMutate(entry.id);
              setRemoving(null);
            }}
            onCancel={() => setRemoving(null)}
          />
        )}
      </Presence>

      <Presence value={confirmComplete}>
        {(requests, leaving) => (
          <ConfirmDialog
            leaving={leaving}
            title={t("bulk.completeTitle", { count: selectedEntries.length })}
            names={selectedEntries.slice(0, 3).map((e) => displayTitle(e.media.title))}
            extra={Math.max(0, selectedEntries.length - 3)}
            note={t("bulk.completeRequests", { n: requests })}
            confirmLabel={t("bulk.completeConfirm")}
            onConfirm={() => {
              bulkPatch({ status: "COMPLETED" });
              setConfirmComplete(null);
            }}
            onCancel={() => setConfirmComplete(null)}
          />
        )}
      </Presence>

      <PresenceIf when={showRandom}>
        {(leaving) => (
          <RandomPickModal
            leaving={leaving}
            pool={byStatus.get("PLANNING") ?? []}
            onClose={() => setShowRandom(false)}
          />
        )}
      </PresenceIf>

      <PresenceIf when={showPresetSave}>
        {(leaving) => (
          <PresetModal
            leaving={leaving}
            presets={presets}
            onSave={addPreset}
            onDelete={deletePreset}
            onClose={() => setShowPresetSave(false)}
          />
        )}
      </PresenceIf>
    </div>
  );
}
