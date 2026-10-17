import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { BarChart3, Star, Tags } from "lucide-react";
import { renderWithProviders } from "@/test/render";
import { SectionNav, SectionPicker } from "./SectionNav";

const items = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "ratings", label: "Ratings", icon: Star },
  { value: "tags", label: "Tags", icon: Tags },
];

/** The statistics' sections as a vertical tablist in the column, and as a field opening it on the phone. */
describe("SectionNav", () => {
  it("lists the sections as tabs with the current one selected, and switches on a press", () => {
    const onChange = vi.fn();
    renderWithProviders(<SectionNav label="Sections" items={items} value="overview" onChange={onChange} />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Ratings" }));
    expect(onChange).toHaveBeenCalledWith("ratings");
  });

  it("walks the tabs with the arrow keys and wraps without switching", () => {
    const onChange = vi.fn();
    renderWithProviders(<SectionNav label="Sections" items={items} value="overview" onChange={onChange} />);
    const first = screen.getByRole("tab", { name: "Overview" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowUp" });
    expect(screen.getByRole("tab", { name: "Tags" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(first).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a section's count beside its name when it has one", () => {
    renderWithProviders(<SectionNav label="Sections" items={[...items.slice(0, 2), { ...items[2], count: 12 }]} value="overview" onChange={() => {}} />);
    expect(screen.getByRole("tab", { name: /Tags/ })).toHaveTextContent("12");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveTextContent(/^Overview$/);
  });

  it("names the current section on the phone's field", () => {
    renderWithProviders(<SectionPicker label="Sections" items={items} value="ratings" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Sections: Ratings/ })).toBeInTheDocument();
  });
});
