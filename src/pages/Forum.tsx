import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bookmark, ChevronDown, Hash, MessageSquare, PenSquare, Search } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Popover } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { forumThreads, THREAD_CATEGORIES } from "@/api/social";
import { SearchField } from "@/components/ui/search-field";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { PageTitle } from "@/components/shell/PageColumn";
import { useScrollMemory } from "@/hooks/useScrollMemory";
import { useSettledWrite } from "@/hooks/useUrlState";
import { PresenceIf } from "@/components/ui/presence";
import { ThreadList } from "@/components/social/ThreadList";
import { NewThreadModal } from "@/components/overlays/NewThreadModal";
import { useAuth } from "@/stores/auth";

/** Lenses rather than tabs, because AniList models the three as different arguments to one field. */
type Lens = "browse" | "search" | "subscribed";

const LENSES: Lens[] = ["browse", "search", "subscribed"];
/** One glyph per lens, so the column is scannable without reading. */
const LENS_ICON: Record<Lens, typeof Hash> = { browse: MessageSquare, search: Search, subscribed: Bookmark };

function isLens(v: string | null): v is Lens {
  return LENSES.includes((v ?? "") as Lens);
}

/** The forum index: paging is a button, only the active lens is mounted, and nothing fetches on a keystroke. */
export default function Forum() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const mode = useAuth((s) => s.mode);
  const phone = usePhoneShell();

  const lens: Lens = isLens(params.get("lens")) ? (params.get("lens") as Lens) : "browse";
  const categoryId = Number(params.get("cat")) || undefined;

  const [input, setInput] = useState(params.get("q") ?? "");
  const [term, setTerm] = useState(params.get("q") ?? "");
  const [composing, setComposing] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const view = `${lens}:${categoryId ?? "all"}:${lens === "search" ? term : ""}`;
  useScrollMemory(scroller, "forum");
  // The scroller outlives a lens, so a new one is brought to its top by hand.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0;
  }, [view]);

  const latest = useRef({ params, setParams });
  latest.current = { params, setParams };
  const schedule = useSettledWrite();

  // Debounced like the media search, and the settled term is written to `?q=` so it survives Back.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = input.trim();
      setTerm(next);
      // A replace mints a new history key and ends a running Back restore, so only a real change writes.
      if ((latest.current.params.get("q") ?? "") === next) return;
      schedule(() =>
        latest.current.setParams(
          (prev) => {
            const p = new URLSearchParams(prev);
            if (next) p.set("q", next);
            else p.delete("q");
            return p;
          },
          { replace: true },
        ),
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [input, schedule]);

  const setLens = (next: Lens) => {
    const p = new URLSearchParams(params);
    if (next === "browse") p.delete("lens");
    else p.set("lens", next);
    // A category filter means nothing to a search or a subscription list.
    if (next !== "browse") p.delete("cat");
    setParams(p, { replace: true });
  };

  const setCategory = (id: number | undefined) => {
    const p = new URLSearchParams(params);
    if (id === undefined) p.delete("cat");
    else p.set("cat", String(id));
    setParams(p, { replace: true });
  };

  const lensName = (l: Lens) => (l === "browse" ? t("forum.lensBrowse") : l === "search" ? t("forum.lensSearch") : t("forum.lensSubscribed"));
  const categoryName = categoryId ? (THREAD_CATEGORIES.find((c) => c.id === categoryId)?.name ?? "") : t("forum.categoryAll");
  const row = (on: boolean, label: string, Icon: typeof Hash, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "press flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-surface coarse:min-h-11",
        on ? "nav-pill" : "text-ink-300 hover:bg-surface-850 hover:text-ink-100",
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
  const column = (after?: () => void) => (
    <div className="space-y-0.5">
      {LENSES.map((l) => row(lens === l, lensName(l), LENS_ICON[l], () => { setLens(l); after?.(); }))}
      {/* A category filter means nothing to a search or a subscription list, so the list stands under browse alone. */}
      {lens === "browse" && (
        <>
          <p className="px-4 pb-1 pt-3 label-text text-ink-500">{t("forum.category")}</p>
          {row(categoryId === undefined, t("forum.categoryAll"), Hash, () => { setCategory(undefined); after?.(); })}
          {THREAD_CATEGORIES.map((c) => row(categoryId === c.id, c.name, Hash, () => { setCategory(c.id); after?.(); }))}
        </>
      )}
    </div>
  );
  const newThread = mode === "anilist" && (
    // Nothing to post *as* without an account, matching the composer.
    <IconButton variant="ghost" size="sm" round onClick={() => setComposing(true)} aria-label={t("forum.newThread")} title={t("forum.newThread")}>
      <PenSquare className="size-4" />
    </IconButton>
  );
  const search = lens === "search" && (
    <SearchField
      size="lg"
      autoFocus
      value={input}
      onChange={setInput}
      label={t("forum.searchPlaceholder")}
      clearLabel={t("common.clear")}
      placeholder={t("forum.searchPlaceholder")}
      className="mb-4 max-w-136 rounded-full px-5"
    />
  );

  return (
    <div className={cn("flex h-full", phone && "flex-col")}>
      {phone ? (
        <div className="space-y-4 px-4 pt-4">
          <PageTitle title={t("forum.title")} jp="掲示板" action={newThread} />
          <Popover
            label={t("forum.category")}
            variant="sheet"
            className="w-full"
            renderTrigger={(p) => (
              <button
                type="button"
                {...p}
                aria-label={t("forum.viewPick", { view: lens === "browse" ? `${lensName(lens)} · ${categoryName}` : lensName(lens) })}
                className="flex w-full items-center gap-3 rounded-panel bg-surface-900 px-4 py-3 text-left surface-outline transition-surface hover:bg-surface-850"
              >
                <span className="truncate text-base text-ink-100">{lens === "browse" ? `${lensName(lens)} · ${categoryName}` : lensName(lens)}</span>
                <span className="flex-1" />
                <ChevronDown aria-hidden className="size-4 text-ink-500" />
              </button>
            )}
          >
            {(api) => column(api.close)}
          </Popover>
        </div>
      ) : (
        <aside className="w-60 shrink-0 space-y-1 overflow-y-auto pb-8 pl-5 pr-3 pt-6">
          <PageTitle title={t("forum.title")} jp="掲示板" action={newThread} className="mb-3" />
          {column()}
        </aside>
      )}

      {/* Never keyed, since the scroll memory listens on this element for the page's whole life. */}
      <div ref={scroller} className={cn("min-h-0 flex-1 overflow-y-auto pb-12 float-clear", phone ? "px-4 pt-4" : "pl-2 pr-8 pt-6")}>
        {search}
        {/* Keyed so the previous lens unmounts: an unmounted infinite query has no observer to join a refetch. */}
        <div key={view} className="animate-settle">
          {lens === "search" && term.length < 2 ? (
            <p className="text-sm text-ink-600">{t("forum.searchPrompt")}</p>
          ) : lens === "subscribed" && mode !== "anilist" ? (
            <p className="text-sm text-ink-600">{t("forum.subscribedNeedsAccount")}</p>
          ) : (
            <ThreadList
              queryKey={["social", "forum", lens, categoryId ?? null, lens === "search" ? term : null]}
              fetchPage={(page) =>
                forumThreads(
                  lens === "search"
                    ? { search: term }
                    : lens === "subscribed"
                      ? { subscribed: true }
                      : { categoryId },
                  page,
                )
              }
              emptyTitle={
                lens === "search"
                  ? t("forum.noSearchResults")
                  : lens === "subscribed"
                    ? t("forum.noSubscriptions")
                    : t("forum.noThreads")
              }
              emptyHint={lens === "subscribed" ? t("forum.noSubscriptionsHint") : undefined}
              // A search goes stale sooner than a category listing, but neither justifies a short window.
              staleTime={lens === "search" ? 5 * 60 * 1000 : 10 * 60 * 1000}
            />
          )}
        </div>
      </div>

      {/* Through `PresenceIf` so the dialog can animate out; a bare conditional only ever has an entrance. */}
      <PresenceIf when={composing}>
        {(leaving) => <NewThreadModal onClose={() => setComposing(false)} leaving={leaving} />}
      </PresenceIf>
    </div>
  );
}
