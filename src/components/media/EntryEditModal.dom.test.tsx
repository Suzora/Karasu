import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import EntryEditModal, { type EditableMedia } from "./EntryEditModal";
import { checkA11y } from "@/test/a11y";

const media: EditableMedia = {
  id: 42,
  type: "ANIME",
  title: { romaji: "Sparks of Tomorrow", english: null, native: null },
  episodes: 13,
};

beforeEach(() => signIn());
afterEach(() => {
  cleanup();
  signOut();
});

describe("EntryEditModal counts", () => {
  /** An emptied count must still save as a number, never as a missing progress. */
  it("saves an emptied progress as 0", async () => {
    const user = userEvent.setup({ delay: null });
    const onSave = vi.fn();
    renderWithProviders(
      <EntryEditModal
        media={media}
        entry={{ status: "CURRENT", progress: 11, score: 0, repeat: 0, notes: null }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    const progress = screen.getByRole("spinbutton", { name: 'list.progressMax:{"max":13}' });
    await user.clear(progress);
    expect(progress).toHaveValue(null);
    await user.click(screen.getByRole("button", { name: "common.save" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ progress: 0, repeat: 0 }));
  });

  it("takes a count typed after Watching without a leading 0", async () => {
    const user = userEvent.setup({ delay: null });
    const onSave = vi.fn();
    renderWithProviders(
      <EntryEditModal media={media} entry={null} onClose={vi.fn()} onSave={onSave} />,
    );
    await user.click(screen.getByRole("button", { name: "status.ANIME.CURRENT" }));
    const progress = screen.getByRole("spinbutton", { name: 'list.progressMax:{"max":13}' });
    await user.type(progress, "4");
    expect(progress).toHaveValue(4);
    await user.click(screen.getByRole("button", { name: "common.add" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ status: "CURRENT", progress: 4 }));
  });

  /** A removal asks through the confirm every other removal uses, and nothing is removed until it is answered. */
  it("removes only through the shared confirm, which passes axe over the editor", async () => {
    const user = userEvent.setup({ delay: null });
    const onDelete = vi.fn();
    const { baseElement } = renderWithProviders(
      <EntryEditModal
        media={media}
        entry={{ status: "CURRENT", progress: 3, score: 0, repeat: 0, notes: null }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: "common.remove" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(onDelete).not.toHaveBeenCalled();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
    await user.click(within(confirm).getByRole("button", { name: "common.remove" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
