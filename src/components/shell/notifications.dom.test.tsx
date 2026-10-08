import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import type { AppNotification } from "@/api/anilist";
import type { SiteNotifPage } from "@/api/social";
import type { NotifSubject, SiteNotifRow } from "@/lib/siteNotifications";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders, signIn, signOut, useLocalProfile } from "@/test/render";
import { checkA11y } from "@/test/a11y";

const data = vi.hoisted(() => ({
  local: [] as AppNotification[],
  site: [] as SiteNotifRow[],
  // A second AniList page, offered behind "Load more" when set.
  more: [] as SiteNotifRow[],
  count: 0,
}));

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  getNotifications: vi.fn(async () => data.local),
  markNotificationRead: vi.fn(async () => {}),
  markAllNotificationsRead: vi.fn(async () => {}),
}));

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  siteNotifCount: vi.fn(async () => data.count),
  siteNotifications: vi.fn(
    async (page: number): Promise<SiteNotifPage> => ({
      pageInfo: { total: 0, currentPage: page, lastPage: 2, hasNextPage: page === 1 && data.more.length > 0 },
      rows: page === 1 ? data.site : data.more,
    }),
  ),
}));

import Bell from "./Bell";
import BottomBar from "./BottomBar";
import NotifSheet from "./NotifSheet";
import Notifications from "@/pages/Notifications";
import { siteNotifications } from "@/api/social";

const HOUR = 60 * 60 * 1000;

const local = (id: number, agoMs: number): AppNotification => ({
  id,
  kind: "stale",
  title: `Local ${id}`,
  body: "Untouched for a while",
  createdMs: Date.now() - agoMs,
  mediaId: 100 + id,
  read: false,
});

const follow = (id: number, name: string): SiteNotifRow => ({
  id,
  kind: "FOLLOWING",
  createdAt: Math.floor(Date.now() / 1000) - 60,
  title: name,
  actorName: name,
  episode: null,
  detail: null,
  target: `/user/${name}`,
  userId: id,
  mediaId: null,
  activityId: null,
  media: null,
  subject: null,
});

/** A like on one of the viewer's activities: the row opens the activity, and the actor's name is its own link. */
const like = (id: number, name: string, userId: number, activityId: number, agoSec: number): SiteNotifRow => ({
  id,
  kind: "ACTIVITY_LIKE",
  createdAt: Math.floor(Date.now() / 1000) - agoSec,
  title: name,
  actorName: name,
  episode: null,
  detail: null,
  target: `/activity/${activityId}`,
  userId,
  mediaId: null,
  activityId,
  media: null,
  subject: null,
});

const FRIEREN = { english: "Frieren", romaji: "Sousou no Frieren", native: "葬送のフリーレン" };

/** A list activity as the subject of a row, the viewer's own unless an owner is named. */
const listed = (ownerId: number, ownerName: string, over: Partial<Extract<NotifSubject, { kind: "list" }>> = {}): NotifSubject => ({
  kind: "list",
  ownerId,
  ownerName,
  verb: "watchedEpisode",
  progress: { from: 1, to: 3 },
  title: "Frieren",
  media: { id: 42, title: FRIEREN, isAdult: false, genres: [] },
  cover: "https://example.test/frieren.jpg",
  ...over,
});

/** Moves the clock past the feed's staleTime, so only a guard, and not freshness, can keep a surface from refetching. */
function aMinuteLater(): void {
  const real = Date.now;
  vi.spyOn(Date, "now").mockImplementation(() => real.call(Date) + 61_000);
}

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>;
}

afterEach(() => {
  data.local = [];
  data.site = [];
  data.more = [];
  data.count = 0;
  useContentFilter.setState({ level: "strict", blurAdult: true, ready: false, error: null });
  vi.mocked(siteNotifications).mockClear();
  vi.restoreAllMocks();
  signOut();
});

/** The bell by its name, which carries the unread count when there is one. */
const BELL = /^notif\.title/;

/** The bell in its three places: the titlebar's glance, the phone's tall sheet and the page they lead to. */
describe("notifications", () => {
  it("glances at the newest three in the titlebar and leads to the page for the rest", async () => {
    const user = userEvent.setup({ delay: null });
    useLocalProfile();
    data.local = [1, 2, 3, 4, 5].map((id) => local(id, id * HOUR));
    const { baseElement } = renderWithProviders(
      <>
        <Bell />
        <Where />
      </>,
    );
    await user.click(screen.getByRole("button", { name: BELL }));
    const panel = await screen.findByRole("dialog", { name: "notif.title" });
    await waitFor(() => expect(within(panel).getAllByText(/^Local \d$/)).toHaveLength(3));
    expect(within(panel).getByText("Local 1")).toBeInTheDocument();
    expect(within(panel).queryByText("Local 4")).toBeNull();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
    await user.click(within(panel).getByRole("button", { name: "notif.all" }));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/notifications"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "notif.title" })).toBeNull());
  });

  it("opens the phone's own tall sheet from More, which steps aside for it", async () => {
    const user = userEvent.setup({ delay: null });
    useLocalProfile();
    data.local = [local(1, 60_000), local(2, 72 * HOUR)];
    const { baseElement } = renderWithProviders(<BottomBar />);
    await user.click(screen.getByRole("button", { name: /nav\.more/ }));
    const more = await screen.findByRole("dialog", { name: "nav.more" });
    await user.click(within(more).getByRole("button", { name: BELL }));
    const sheet = await screen.findByRole("dialog", { name: "notif.title" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "nav.more" })).toBeNull());
    // Today above earlier, each under its own label.
    await waitFor(() => expect(within(sheet).getByText("Local 1")).toBeInTheDocument());
    expect(within(sheet).getByText("notif.today")).toBeInTheDocument();
    expect(within(sheet).getByText("notif.earlier")).toBeInTheDocument();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
  });

  it("filters the page by source, and offers no filter where there is only one", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.local = [local(1, HOUR)];
    data.site = [follow(7, "Hoshi")];
    const { unmount, baseElement } = renderWithProviders(<Notifications />);
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    expect(await screen.findByText("Local 1")).toBeInTheDocument();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
    await user.click(screen.getByRole("radio", { name: "Karasu" }));
    expect(screen.queryByText("Hoshi")).toBeNull();
    expect(screen.getByText("Local 1")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "AniList" }));
    expect(screen.getByText("Hoshi")).toBeInTheDocument();
    expect(screen.queryByText("Local 1")).toBeNull();
    unmount();

    useLocalProfile();
    renderWithProviders(<Notifications />);
    expect(await screen.findByText("Local 1")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("leaves the page's loaded pages alone when the titlebar glance opens and closes over it", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.site = [follow(7, "Hoshi")];
    data.more = [follow(8, "Mikan")];
    renderWithProviders(
      <>
        <Bell />
        <Notifications />
      </>,
    );
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    expect(await screen.findByText("Mikan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: BELL }));
    await screen.findByRole("dialog", { name: "notif.title" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "notif.title" })).toBeNull());
    // Both pages still drawn, and nothing re-requested: one fetch per page, however many surfaces looked.
    expect(screen.getByText("Mikan")).toBeInTheDocument();
    expect(vi.mocked(siteNotifications)).toHaveBeenCalledTimes(2);
  });

  it("carries AniList's unread marks from the glance onto the page it leads to", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.count = 1;
    data.site = [follow(7, "Hoshi")];
    renderWithProviders(
      <>
        <Bell />
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={null} />
        </Routes>
      </>,
    );
    // The badge's count has to be known before the glance's first page spends it.
    await waitFor(() => expect(screen.getByRole("button", { name: BELL })).toHaveTextContent("1"));
    // The count is in the name too, since the badge is drawn for the eye alone.
    expect(screen.getByRole("button", { name: 'notif.titleUnread:{"n":1}' })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: BELL }));
    const panel = await screen.findByRole("dialog", { name: "notif.title" });
    const unreadClass = "bg-surface-850/60";
    expect((await within(panel).findByText("Hoshi")).closest("button")).toHaveClass(unreadClass);
    await user.click(within(panel).getByRole("button", { name: "notif.all" }));
    const page = await screen.findByRole("heading", { level: 1, name: "notif.title" });
    const row = within(page.closest("div.mx-auto") as HTMLElement).getByText("Hoshi").closest("button");
    expect(row).toHaveClass(unreadClass);
  });

  it("opens the glance and the phone sheet over a page a minute old without re-requesting its pages", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.site = [follow(7, "Hoshi")];
    data.more = [follow(8, "Mikan")];
    const shell = (sheetOpen: boolean) => (
      <>
        <Bell />
        <NotifSheet open={sheetOpen} onClose={() => {}} />
        <Notifications />
      </>
    );
    const { rerender } = renderWithProviders(shell(false));
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    expect(await screen.findByText("Mikan")).toBeInTheDocument();
    aMinuteLater();
    await user.click(screen.getByRole("button", { name: BELL }));
    await screen.findByRole("dialog", { name: "notif.title" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "notif.title" })).toBeNull());
    rerender(shell(true));
    const sheet = await screen.findByRole("dialog", { name: "notif.title" });
    expect(within(sheet).getByText("Mikan")).toBeInTheDocument();
    expect(vi.mocked(siteNotifications)).toHaveBeenCalledTimes(2);
  });

  it("still fetches afresh when the glance opens a minute later over nothing else", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.site = [follow(7, "Hoshi")];
    renderWithProviders(<Bell />);
    await user.click(screen.getByRole("button", { name: BELL }));
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "notif.title" })).toBeNull());
    aMinuteLater();
    await user.click(screen.getByRole("button", { name: BELL }));
    await waitFor(() => expect(vi.mocked(siteNotifications)).toHaveBeenCalledTimes(2));
  });

  it("keeps the page's AniList unread marks when the glance opens over it a minute later", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.count = 1;
    data.site = [follow(7, "Hoshi")];
    renderWithProviders(
      <>
        <Bell />
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={null} />
        </Routes>
      </>,
    );
    await waitFor(() => expect(screen.getByRole("button", { name: BELL })).toHaveTextContent("1"));
    await user.click(screen.getByRole("button", { name: BELL }));
    const panel = await screen.findByRole("dialog", { name: "notif.title" });
    await within(panel).findByText("Hoshi");
    await user.click(within(panel).getByRole("button", { name: "notif.all" }));
    const page = await screen.findByRole("heading", { level: 1, name: "notif.title" });
    const pageRow = () => within(page.closest("div.mx-auto") as HTMLElement).getByText("Hoshi").closest("button");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "notif.title" })).toBeNull());
    aMinuteLater();
    await user.click(screen.getByRole("button", { name: BELL }));
    await screen.findByRole("dialog", { name: "notif.title" });
    expect(pageRow()).toHaveClass("bg-surface-850/60");
    expect(vi.mocked(siteNotifications)).toHaveBeenCalledTimes(1);
  });

  /** The row and the name are two controls side by side; a link inside a button is invisible to some screen readers. */
  it("keeps an activity row and an actor group pressable without hiding the actor's link inside them", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.site = [like(901, "Mikan", 11, 5001, 600), like(902, "Mikan", 11, 5002, 1500), like(903, "Hoshi", 12, 5003, 3000)];
    const { baseElement } = renderWithProviders(
      <>
        <Notifications />
        <Where />
      </>,
    );
    const row = await screen.findByRole("button", { name: /^Hoshi notif\.siteActivityLike/ });
    const group = screen.getByRole("button", { name: /^Mikan notif\.groupLikes/ });
    expect(await checkA11y(baseElement)).toHaveNoViolations();

    expect(group).toHaveAttribute("aria-expanded", "false");
    await user.click(group);
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(await checkA11y(baseElement)).toHaveNoViolations();

    // The row first, then its name, in tab order.
    row.focus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Hoshi" })).toHaveFocus();

    await user.click(screen.getByRole("link", { name: "Hoshi" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/user/Hoshi");
    row.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("where")).toHaveTextContent("/activity/5003");
  });

  /** The subject sits inside the row's press, so the row's name carries it and the block holds no control of its own. */
  it("names what each activity and comment row is about, as far as the content filter and the blur allow", async () => {
    const user = userEvent.setup({ delay: null });
    const viewer = signIn();
    useContentFilter.setState({ level: "off", blurAdult: true, ready: true, error: null });
    const explicit = "https://example.test/explicit.jpg";
    data.site = [
      { ...like(901, "Mikan", 11, 5001, 600), subject: listed(viewer.id, viewer.name) },
      {
        ...like(906, "Hoshi", 12, 5002, 1200),
        kind: "ACTIVITY_REPLY_SUBSCRIBED",
        subject: listed(11, "Mikan", { progress: { from: 7 } }),
      },
      {
        ...like(907, "Tsubame", 13, 5003, 1800),
        kind: "ACTIVITY_REPLY",
        subject: { kind: "text", ownerId: viewer.id, ownerName: viewer.name, text: "Done at last. ~!It ends well!~" },
      },
      {
        ...like(908, "Aki", 14, 5004, 2400),
        subject: listed(viewer.id, viewer.name, {
          verb: "completed",
          progress: null,
          title: "Night Moth",
          media: { id: 77, title: { english: "Night Moth", romaji: null, native: null }, isAdult: true, genres: [] },
          cover: explicit,
        }),
      },
      { ...like(910, "Ren", 15, 5005, 3000), subject: listed(viewer.id, viewer.name) },
      {
        ...like(911, "Ren", 15, 5006, 3600),
        subject: { kind: "text", ownerId: viewer.id, ownerName: viewer.name, text: "A **long** day." },
      },
      {
        ...follow(905, "Weekly chapter talk"),
        kind: "THREAD_COMMENT_REPLY",
        actorName: "Sora",
        target: "/thread/99?comment=555",
        userId: 16,
        subject: { kind: "comment", text: "Agreed, and img(https://example.test/a.png) the art too." },
      },
    ];
    const { baseElement } = renderWithProviders(
      <>
        <Notifications />
        <Where />
      </>,
    );

    // The viewer's own activity as a caption, someone else's with its owner in front, each with its cover.
    const own = await screen.findByRole("button", { name: /^Mikan notif\.siteActivityLike notif\.capWatchedEpisode.*Frieren/ });
    expect(screen.getByRole("button", { name: /^Hoshi notif\.siteActivityReplySubscribed Mikan social\.sentWatchedEpisode/ })).toBeInTheDocument();
    expect(baseElement.querySelectorAll('img[src="https://example.test/frieren.jpg"]').length).toBeGreaterThan(0);
    // A spoiler is named, never shown; a forum comment is quoted without its image.
    expect(screen.getByText(/^notif\.quoted:.*Done at last\. \[social\.mdSpoiler\]/)).toBeInTheDocument();
    expect(screen.queryByText(/It ends well/)).toBeNull();
    expect(screen.getByText(/^notif\.quoted:.*Agreed, and the art too\./)).toBeInTheDocument();
    // A group names its subjects on one line.
    expect(screen.getByRole("button", { name: /^Ren notif\.groupLikes.*Frieren · notif\.quoted:.*A long day\./ })).toBeInTheDocument();
    // Explicit art arrives veiled while the blur is on, and the press stays the row's.
    expect(baseElement.querySelector(`img[src="${explicit}"]`)).toHaveClass("blur-xs");
    expect(baseElement.querySelector('img[src="https://example.test/frieren.jpg"]')).not.toHaveClass("blur-xs");
    expect(await checkA11y(baseElement)).toHaveNoViolations();

    // A filtered title takes its subject away and leaves the row.
    act(() => useContentFilter.setState({ level: "moderate" }));
    await waitFor(() => expect(baseElement.querySelector(`img[src="${explicit}"]`)).toBeNull());
    expect(screen.getByRole("button", { name: /^Aki notif\.siteActivityLike/ })).toBeInTheDocument();
    expect(screen.queryByText("Night Moth")).toBeNull();

    own.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("where")).toHaveTextContent("/activity/5001");
  });

  /** A failed AniList half is a failure to ask, never "all read", and its Retry asks for page 1 once. */
  it("says AniList failed rather than that everything is read, and asks again on Retry alone", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    vi.mocked(siteNotifications).mockRejectedValueOnce("anilist.rateLimited");
    renderWithProviders(<Notifications />);
    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText('common.error:{"message":"common.rateLimited"}')).toBeInTheDocument();
    expect(screen.queryByText("notif.empty")).toBeNull();
    expect(siteNotifications).toHaveBeenCalledTimes(1);
    data.site = [follow(7, "Hoshi")];
    await user.click(within(alert).getByRole("button", { name: "common.retry" }));
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(siteNotifications).toHaveBeenCalledTimes(2);
    expect(vi.mocked(siteNotifications).mock.calls[1][0]).toBe(1);
  });

  /** A later page that failed keeps the loaded rows, says why beside Load more, and that button is what asks again. */
  it("keeps the loaded rows when a later page fails, and asks for that page again from Load more", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.site = [follow(7, "Hoshi")];
    data.more = [follow(8, "Mikan")];
    renderWithProviders(<Notifications />);
    expect(await screen.findByText("Hoshi")).toBeInTheDocument();
    vi.mocked(siteNotifications).mockRejectedValueOnce("anilist.rateLimited");
    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    expect(await screen.findByRole("alert")).toHaveTextContent('common.error:{"message":"common.rateLimited"}');
    expect(screen.getByText("Hoshi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "common.retry" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    expect(await screen.findByText("Mikan")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(vi.mocked(siteNotifications).mock.calls.map((c) => c[0])).toEqual([1, 2, 2]);
  });

  /** The glance's feed loads lazily, so a failure that lands before it renders must still reach it. */
  it("shows the AniList failure in the bell's glance beside the local rows", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.local = [local(1, HOUR)];
    vi.mocked(siteNotifications).mockRejectedValueOnce("anilist.rateLimited");
    renderWithProviders(<Bell />);
    await user.click(screen.getByRole("button", { name: BELL }));
    const panel = await screen.findByRole("dialog", { name: "notif.title" });
    expect(await within(panel).findByRole("alert")).toHaveTextContent('common.error:{"message":"common.rateLimited"}');
    expect(within(panel).getByText("Local 1")).toBeInTheDocument();
    expect(siteNotifications).toHaveBeenCalledTimes(1);
  });

  it("offers no AniList paging while the filter shows only Karasu's own", async () => {
    const user = userEvent.setup({ delay: null });
    signIn();
    data.local = [local(1, HOUR)];
    data.site = [follow(7, "Hoshi")];
    data.more = [follow(8, "Mikan")];
    renderWithProviders(<Notifications />);
    expect(await screen.findByRole("button", { name: "social.loadMorePlain" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "Karasu" }));
    expect(screen.queryByRole("button", { name: "social.loadMorePlain" })).toBeNull();
  });
});
