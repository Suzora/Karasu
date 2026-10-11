import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, signIn, signOut, useLocalProfile } from "@/test/render";
import EntryDialog, { type EditableEntry, type EditableMedia } from "./EntryDialog";
import { checkA11y } from "@/test/a11y";

const media: EditableMedia = {
  id: 42,
  type: "ANIME",
  title: { romaji: "Sparks of Tomorrow", english: null, native: null },
  episodes: 13,
};

const watching: EditableEntry = { status: "CURRENT", progress: 3, score: 0, repeat: 0, notes: null };

const open = (over: Partial<Parameters<typeof EntryDialog>[0]> = {}) => {
  const onWrite = vi.fn();
  const props = { media, entry: watching, onWrite, onClose: vi.fn(), ...over };
  const view = renderWithProviders(<EntryDialog {...props} />);
  return { ...view, onWrite: props.onWrite as ReturnType<typeof vi.fn> };
};

const user = () => userEvent.setup({ delay: null });

beforeEach(() => signIn());
afterEach(() => {
  cleanup();
  signOut();
});

/** Every control saves as it is touched, so each test reads the one write a press or a leave makes. */
describe("EntryDialog", () => {
  it("is one dialog named for the title, with no Save button to forget", () => {
    open();
    expect(screen.getByRole("dialog", { name: "Sparks of Tomorrow" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "common.save" })).toBeNull();
  });

  it("writes a status press at once, with the totals completing implies", async () => {
    const { onWrite } = open();
    await user().click(screen.getByRole("button", { name: "status.ANIME.COMPLETED" }));
    expect(onWrite).toHaveBeenCalledWith({ status: "COMPLETED", progress: 13 });
  });

  it("writes each step of the progress", async () => {
    const { onWrite } = open();
    await user().click(screen.getByRole("button", { name: "detail.progressMore" }));
    expect(onWrite).toHaveBeenLastCalledWith({ progress: 4 });
  });

  it("writes a score from the flat bar", async () => {
    const { onWrite } = open();
    await user().click(screen.getByRole("button", { name: "7" }));
    expect(onWrite).toHaveBeenLastCalledWith({ score: 7 });
  });

  /** A note typed a letter at a time is written once, when the field is left, not on every key. */
  it("writes the notes once the field is left", async () => {
    const u = user();
    const { onWrite } = open();
    await u.type(screen.getByRole("textbox", { name: "entry.notes" }), "great op");
    expect(onWrite).not.toHaveBeenCalled();
    await u.tab();
    expect(onWrite).toHaveBeenCalledWith({ notes: "great op" });
  });

  it("writes a date and the privacy flag from the dates tab", async () => {
    const u = user();
    const { onWrite } = open();
    await u.click(screen.getByRole("radio", { name: "entry.tabDates" }));
    await u.click(screen.getByRole("switch", { name: "entry.private" }));
    expect(onWrite).toHaveBeenLastCalledWith({ private: true });
    await u.type(screen.getByLabelText("entry.startDate"), "2026-03-01");
    expect(onWrite).toHaveBeenLastCalledWith({ startedAt: { year: 2026, month: 3, day: 1 } });
  });

  /** Hidden and custom lists are AniList's alone, so a local profile is never offered them. */
  it("offers the hidden flag and the lists tab to an AniList account only", async () => {
    signOut();
    useLocalProfile();
    open({ customListNames: ["Ghibli"] });
    await user().click(screen.getByRole("radio", { name: "entry.tabDates" }));
    expect(screen.queryByRole("switch", { name: "entry.hidden" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "entry.customLists" })).toBeNull();
  });

  /** The write replaces the whole membership, so a toggle sends every list the entry stays on. */
  it("sends the whole membership when one list is toggled", async () => {
    const u = user();
    const { onWrite } = open({
      entry: { ...watching, customLists: { Ghibli: true, Airing: false } },
      customListNames: ["Ghibli", "Airing"],
    });
    await u.click(screen.getByRole("radio", { name: "entry.customLists" }));
    await u.click(screen.getByRole("checkbox", { name: "Airing" }));
    expect(onWrite).toHaveBeenLastCalledWith({ customLists: ["Ghibli", "Airing"] });
  });

  /** A title off the list offers only how to add it, and once added the dialog stays open as the editor. */
  it("adds a title with the pressed status, then edits it in place", async () => {
    const u = user();
    const onAdd = vi.fn();
    const { onWrite } = open({ entry: null, onAdd });
    expect(screen.queryByRole("button", { name: "detail.progressMore" })).toBeNull();
    await u.click(screen.getByRole("button", { name: "status.ANIME.CURRENT" }));
    expect(onAdd).toHaveBeenCalledWith("CURRENT");
    await u.click(await screen.findByRole("button", { name: "detail.progressMore" }));
    expect(onWrite).toHaveBeenLastCalledWith({ progress: 1 });
  });

  it("follows a change made outside, such as an Undo", () => {
    const { rerender } = open();
    expect(screen.getByRole("spinbutton", { name: "common.progress" })).toHaveValue(3);
    rerender(<EntryDialog media={media} entry={{ ...watching, progress: 2 }} onWrite={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("spinbutton", { name: "common.progress" })).toHaveValue(2);
  });

  /** A removal asks through the confirm every other removal uses, and nothing is removed until it is answered. */
  it("removes only through the shared confirm, which passes axe over the editor", async () => {
    const u = user();
    const onDelete = vi.fn();
    const { baseElement } = open({ onDelete });
    await u.click(screen.getByRole("button", { name: "common.remove" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(onDelete).not.toHaveBeenCalled();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
    await u.click(within(confirm).getByRole("button", { name: "common.remove" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
