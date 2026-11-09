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
  it("cannot move the first member up or the last one down", () => {
    setup();
    const ups = screen.getAllByRole("button", { name: /stack\.moveUp/ });
    const downs = screen.getAllByRole("button", { name: /stack\.moveDown/ });
    expect(ups[0]).toBeDisabled();
    expect(downs[1]).toBeDisabled();
  });

  it("moves, takes out and dissolves by the member's media id", () => {
    const calls = setup();
    fireEvent.click(screen.getAllByRole("button", { name: /stack\.moveDown/ })[0]);
    expect(calls.move).toHaveBeenCalledWith(1, 1);
    fireEvent.click(screen.getAllByRole("button", { name: /stack\.take/ })[1]);
    expect(calls.take).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "stack.dissolve" }));
    expect(calls.dissolve).toHaveBeenCalled();
  });
});
