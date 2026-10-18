import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColumnLabel, ColumnPage, PageTitle, PickerField } from "./PageColumn";

/** The one title shape and column geometry every column page shares. */
describe("PageColumn", () => {
  it("draws the title over its Japanese line, with the page's action on that line", () => {
    render(<PageTitle title="Kalender" jp="カレンダー" action={<button type="button">Export</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Kalender" })).toBeInTheDocument();
    const jp = screen.getByText("カレンダー");
    expect(jp).toHaveAttribute("lang", "ja");
    expect(jp.parentElement).toContainElement(screen.getByRole("button", { name: "Export" }));
  });

  it("gives the content its own scroller unless the page scrolls both", () => {
    const { rerender, container } = render(<ColumnPage column={<p>col</p>}>body</ColumnPage>);
    expect(screen.getByText("body")).toHaveClass("overflow-y-auto");
    expect(container.querySelector("aside")).toHaveClass("w-60", "overflow-y-auto");
    rerender(<ColumnPage scroll="page" column={<p>col</p>}>body</ColumnPage>);
    expect(screen.getByText("body")).not.toHaveClass("overflow-y-auto");
    expect(container.querySelector("aside")).toHaveClass("w-60", "self-start");
  });

  it("parts a column's groups by space above each label, except the first", () => {
    render(
      <>
        <ColumnLabel first>Feed</ColumnLabel>
        <ColumnLabel>Kind</ColumnLabel>
      </>,
    );
    expect(screen.getByText("Feed")).not.toHaveClass("pt-5");
    expect(screen.getByText("Kind")).toHaveClass("pt-5");
  });

  it("names the field by what is chosen and marks a further filter with a dot", () => {
    const trigger = { ref: { current: null }, onClick: () => {}, "aria-expanded": false, "aria-haspopup": "dialog" as const };
    const { container } = render(<PickerField trigger={trigger} label="Formats: Movie" value="Movie" meta={13} marked />);
    expect(screen.getByRole("button", { name: "Formats: Movie" })).toHaveTextContent("Movie13");
    expect(container.querySelector(".bg-accent-400")).toBeInTheDocument();
  });
});
