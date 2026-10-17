import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { StatusNav, StatusPicker } from "./StatusNav";

const counts = { CURRENT: 16, REPEATING: 0, COMPLETED: 4, PAUSED: 4, DROPPED: 4, PLANNING: 4 };

/** The lists' statuses as a column on the desktop and a picker field on the phone, with the custom lists under them. */
describe("StatusNav", () => {
  it("lists every status as a tab with its count, the current one selected", () => {
    renderWithProviders(<StatusNav type="ANIME" value="CURRENT" counts={counts} onChange={() => {}} lists={[]} list="" onList={() => {}} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(6);
    expect(screen.getByRole("tab", { name: /status\.ANIME\.CURRENT/ })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tab", { name: /status\.ANIME\.COMPLETED/ })).getByText("4")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("changes the status on a click", () => {
    const onChange = vi.fn();
    renderWithProviders(<StatusNav type="ANIME" value="CURRENT" counts={counts} onChange={onChange} lists={[]} list="" onList={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: /status\.ANIME\.PAUSED/ }));
    expect(onChange).toHaveBeenCalledWith("PAUSED");
  });

  it("moves focus with the arrow keys, wrapping at the ends, without switching the status", () => {
    const onChange = vi.fn();
    renderWithProviders(<StatusNav type="ANIME" value="CURRENT" counts={counts} onChange={onChange} lists={[]} list="" onList={() => {}} />);
    const current = screen.getByRole("tab", { name: /status\.ANIME\.CURRENT/ });
    current.focus();
    fireEvent.keyDown(current, { key: "ArrowDown" });
    expect(screen.getByRole("tab", { name: /status\.ANIME\.REPEATING/ })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(screen.getByRole("tab", { name: /status\.ANIME\.PLANNING/ })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(current).toHaveFocus();
    fireEvent.keyDown(current, { key: "ArrowUp" });
    expect(screen.getByRole("tab", { name: /status\.ANIME\.PLANNING/ })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toggles a custom list as a filter under the statuses", () => {
    const onList = vi.fn();
    const { rerender } = renderWithProviders(<StatusNav type="ANIME" value="CURRENT" counts={counts} onChange={() => {}} lists={["Favs"]} list="" onList={onList} />);
    fireEvent.click(screen.getByRole("button", { name: "Favs" }));
    expect(onList).toHaveBeenCalledWith("Favs");
    rerender(<StatusNav type="ANIME" value="CURRENT" counts={counts} onChange={() => {}} lists={["Favs"]} list="Favs" onList={onList} />);
    expect(screen.getByRole("button", { name: "Favs" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Favs" }));
    expect(onList).toHaveBeenLastCalledWith("");
  });
});

describe("StatusPicker", () => {
  it("names the current status and opens the statuses in a sheet", () => {
    const onChange = vi.fn();
    renderWithProviders(<StatusPicker type="ANIME" value="CURRENT" counts={counts} onChange={onChange} lists={[]} list="" onList={() => {}} />);
    const trigger = screen.getByRole("button", { name: /list\.statusPick/ });
    expect(trigger).toHaveTextContent("status.ANIME.CURRENT");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("tab", { name: /status\.ANIME\.PLANNING/ }));
    expect(onChange).toHaveBeenCalledWith("PLANNING");
  });
});
