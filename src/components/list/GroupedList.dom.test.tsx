import { describe, expect, it } from "vitest";
import { useRef } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { GroupedList } from "./GroupedList";
import { renderWithProviders } from "@/test/render";
import { entry } from "@/test/fixtures";

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const groups = [
    { key: "a", entries: [entry({ id: 1, mediaId: 1 })] },
    { key: "b", entries: [entry({ id: 2, mediaId: 2 })] },
  ];
  return (
    <div ref={ref}>
      <GroupedList
        groups={groups}
        label={(k) => `group ${k}`}
        scrollRef={ref}
        gridClassName="grid"
        rowGap={0}
        estimateRowHeight={40}
        renderItem={(e) => <div key={e.id}>{e.id}</div>}
      />
    </div>
  );
}

describe("GroupedList's jump bar", () => {
  it("is one Tab stop that the arrows, Home and End walk", () => {
    renderWithProviders(<Probe />);
    const bar = screen.getByRole("navigation", { name: "list.groupJump" });
    const buttons = Array.from(bar.querySelectorAll("button"));
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: "ArrowRight" });
    expect(buttons[1]).toHaveFocus();
    fireEvent.keyDown(buttons[1], { key: "End" });
    expect(buttons[2]).toHaveFocus();
    fireEvent.keyDown(buttons[2], { key: "ArrowRight" });
    expect(buttons[2]).toHaveFocus();
    fireEvent.keyDown(buttons[2], { key: "Home" });
    expect(buttons[0]).toHaveFocus();
  });
});
