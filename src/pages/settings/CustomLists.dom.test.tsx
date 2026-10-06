import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AniListMediaListOptions, ListOptionsAnswer } from "@/api/social";
import type { ListResult } from "@/api/types";
import { entry, listResult, media } from "@/test/fixtures";
import { renderWithProviders, signIn, signOut } from "@/test/render";

const fetchList = vi.fn<(userId: number, type: string, opts?: { force?: boolean }) => Promise<ListResult>>();
const bulk = vi.fn<(entries: { id: number; mediaId: number }[], patch: object) => Promise<number>>();
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  fetchMediaList: (userId: number, type: string, opts?: { force?: boolean }) => fetchList(userId, type, opts),
  bulkSaveEntries: (entries: { id: number; mediaId: number }[], patch: object) => bulk(entries, patch),
}));

const read = vi.fn<() => Promise<ListOptionsAnswer>>();
const write = vi.fn<(type: string, w: { customLists: string[] }) => Promise<ListOptionsAnswer>>();
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  listOptions: () => read(),
  updateListOptions: (type: string, w: { customLists: string[] }) => write(type, w),
}));

import { CustomListManager } from "./CustomLists";

const SECTIONS = ["Watching", "Completed", "Planning"];

const answer = (customLists: string[]): ListOptionsAnswer => ({
  animeList: {
    customLists,
    sectionOrder: SECTIONS,
    splitCompletedSectionByFormat: false,
    advancedScoring: [],
    advancedScoringEnabled: false,
  },
  mangaList: null,
});

const options = (customLists: string[]): AniListMediaListOptions => ({
  scoreFormat: "POINT_10",
  rowOrder: "score",
  animeList: { customLists, sectionOrder: SECTIONS, splitCompletedSectionByFormat: false },
  mangaList: { customLists: [], sectionOrder: [], splitCompletedSectionByFormat: false },
});

const rows = () =>
  listResult([
    entry({ id: 1, media: media({ id: 101 }), customLists: { Ghibli: true, Rewatch: false } }),
    entry({ id: 2, media: media({ id: 102 }), customLists: { Ghibli: true, Rewatch: true } }),
    entry({ id: 3, media: media({ id: 103 }), customLists: { Ghibli: true, Rewatch: false }, hiddenFromStatusLists: true }),
    entry({ id: 4, media: media({ id: 104 }), customLists: { Ghibli: false, Rewatch: true }, hiddenFromStatusLists: true }),
  ]);

afterEach(() => {
  signOut();
  vi.clearAllMocks();
});

function mount(lists = ["Ghibli", "Rewatch"]) {
  signIn();
  fetchList.mockResolvedValue(rows());
  read.mockResolvedValue(answer(lists));
  return renderWithProviders(<CustomListManager options={options(lists)} />);
}

describe("CustomListManager", () => {
  it("lists each custom list with its member count", async () => {
    mount();
    const ghibli = (await screen.findByText("Ghibli")).closest("li")!;
    expect(await within(ghibli).findByText("3")).toBeInTheDocument();
    expect(within(screen.getByText("Rewatch").closest("li")!).getByText("2")).toBeInTheDocument();
  });

  it("refuses a name the account already has before anything is sent", async () => {
    mount();
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByRole("textbox", { name: "settings.customListNew" }), "ghibli");
    expect(screen.getByText("settings.customListDuplicate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /settings\.customListAdd/ })).toBeDisabled();
    expect(read).not.toHaveBeenCalled();
  });

  it("creates a list by appending it, one write", async () => {
    mount();
    write.mockResolvedValue(answer(["Ghibli", "Rewatch", "Seasonals"]));
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByRole("textbox", { name: "settings.customListNew" }), "Seasonals{Enter}");
    await waitFor(() => expect(write).toHaveBeenCalledWith("ANIME", expect.objectContaining({ customLists: ["Ghibli", "Rewatch", "Seasonals"] })));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("renames in place and leaves the field on Escape without a write", async () => {
    mount();
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole("button", { name: "settings.customListRename: Rewatch" }));
    const field = screen.getByRole("textbox", { name: "settings.customListRename" });
    expect(field).toHaveValue("Rewatch");
    await user.type(field, "{Escape}");
    expect(screen.queryByRole("textbox", { name: "settings.customListRename" })).toBeNull();
    expect(write).not.toHaveBeenCalled();

    write.mockResolvedValue(answer(["Ghibli", "Rewatches"]));
    await user.click(screen.getByRole("button", { name: "settings.customListRename: Rewatch" }));
    await user.type(screen.getByRole("textbox", { name: "settings.customListRename" }), "es{Enter}");
    await waitFor(() => expect(write).toHaveBeenCalledWith("ANIME", expect.objectContaining({ customLists: ["Ghibli", "Rewatches"] })));
  });

  it("offers to put stranded hidden entries back before a delete, and does it first", async () => {
    mount();
    write.mockResolvedValue(answer(["Rewatch"]));
    bulk.mockResolvedValue(1);
    const user = userEvent.setup({ delay: null });
    await screen.findByText("3");
    await user.click(screen.getByRole("button", { name: "settings.customListDelete: Ghibli" }));
    const dialog = await screen.findByRole("alertdialog");
    const unhide = within(dialog).getByRole("checkbox");
    expect(unhide).toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: "settings.customListDelete" }));
    await waitFor(() => expect(write).toHaveBeenCalledWith("ANIME", expect.objectContaining({ customLists: ["Rewatch"] })));
    expect(bulk).toHaveBeenCalledWith([expect.objectContaining({ id: 3, mediaId: 103 })], { hiddenFromStatusLists: false });
    expect(bulk.mock.invocationCallOrder[0]).toBeLessThan(write.mock.invocationCallOrder[0]);
  });

  it("moves focus into the rename field and back to the row's pencil when it closes", async () => {
    mount();
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole("button", { name: "settings.customListRename: Rewatch" }));
    expect(screen.getByRole("textbox", { name: "settings.customListRename" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "settings.customListRename: Rewatch" })).toHaveFocus();
  });

  it("keeps every control disabled through a remount while a run is still going, so a second op cannot start", async () => {
    const { rerender } = mount();
    write.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByRole("textbox", { name: "settings.customListNew" }), "Seasonals{Enter}");
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    rerender(<CustomListManager key="again" options={options(["Ghibli", "Rewatch"])} />);
    expect(screen.getByRole("button", { name: "settings.customListRename: Ghibli" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "settings.customListDelete: Ghibli" })).toBeDisabled();
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("asks again with the box ticked for the next list, whatever was unticked for the last", async () => {
    mount();
    const user = userEvent.setup({ delay: null });
    await screen.findByText("3");
    await user.click(screen.getByRole("button", { name: "settings.customListDelete: Ghibli" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("checkbox"));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "common.cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: "settings.customListDelete: Rewatch" }));
    expect(within(await screen.findByRole("alertdialog")).getByRole("checkbox")).toBeChecked();
  });

  it("cannot open a delete before the list it would describe has loaded", async () => {
    signIn();
    fetchList.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<CustomListManager options={options(["Ghibli"])} />);
    expect(screen.getByRole("button", { name: "settings.customListDelete: Ghibli" })).toBeDisabled();
  });

  it("keeps a typed name when the write fails, so it need not be typed again", async () => {
    mount();
    read.mockRejectedValue(new Error("HTTP 502"));
    const user = userEvent.setup({ delay: null });
    const field = screen.getByRole("textbox", { name: "settings.customListNew" });
    await user.type(field, "Seasonals{Enter}");
    await waitFor(() => expect(read).toHaveBeenCalled());
    await act(async () => {});
    expect(field).toHaveValue("Seasonals");
  });
});

