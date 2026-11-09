import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import StackSheet from "./StackSheet";
import { renderWithProviders } from "@/test/render";
import { entry, media } from "@/test/fixtures";

const members = [
  entry({ mediaId: 1, media: media({ id: 1, title: { romaji: "One", english: "One", native: null } }) }),
  entry({ mediaId: 2, media: media({ id: 2, title: { romaji: "Two", english: "Two", native: null } }) }),
];

function setup() {
  const calls = { move: vi.fn(), take: vi.fn(), dissolve: vi.fn() };
  renderWithProviders(
    <StackSheet
      members={members}
      unit="episodes"
      onPlusOne={vi.fn()}
      onMove={calls.move}
      onTake={calls.take}
      onDissolve={calls.dissolve}
      onClose={vi.fn()}
    />,
  );
  return calls;
}

describe("StackSheet", () => {
  it("walks the rows with the arrows and carries a row with Alt", () => {
    const calls = setup();
    const handles = screen.getAllByRole("button", { name: /stack\.handle/ });
    handles[0].focus();
    fireEvent.keyDown(handles[0], { key: "ArrowDown" });
    expect(screen.getAllByRole("button", { name: /stack\.handle/ })[1]).toHaveFocus();
    expect(calls.move).not.toHaveBeenCalled();
    fireEvent.keyDown(handles[1], { key: "ArrowUp", altKey: true });
    expect(calls.move).toHaveBeenCalledWith(2, -1);
  });

  it("does not carry the first row up or the last one down", () => {
    const calls = setup();
    const handles = screen.getAllByRole("button", { name: /stack\.handle/ });
    fireEvent.keyDown(handles[0], { key: "ArrowUp", altKey: true });
    fireEvent.keyDown(handles[1], { key: "ArrowDown", altKey: true });
    expect(calls.move).not.toHaveBeenCalled();
  });

  it("takes out and dissolves by the member's media id", () => {
    const calls = setup();
    fireEvent.click(screen.getAllByRole("button", { name: /stack\.take/ })[1]);
    expect(calls.take).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "stack.dissolve" }));
    expect(calls.dissolve).toHaveBeenCalled();
  });
});
