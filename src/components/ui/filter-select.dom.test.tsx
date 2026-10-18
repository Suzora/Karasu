import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterSelect } from "./filter-select";

const options = [
  { value: "SEARCH_MATCH", label: "Relevance" },
  { value: "SCORE_DESC", label: "Score" },
];

/** A column row is tinted only while it narrows something, never for a choice that always holds a value. */
describe("FilterSelect row", () => {
  it("leaves a neutral value untinted and tints any other", () => {
    const { rerender } = render(<FilterSelect row label="Sort" value="SEARCH_MATCH" neutral="SEARCH_MATCH" onChange={() => {}} options={options} />);
    const shell = screen.getByRole("combobox", { name: "Sort" }).parentElement;
    expect(shell).not.toHaveClass("bg-accent-500/10");
    rerender(<FilterSelect row label="Sort" value="SCORE_DESC" neutral="SEARCH_MATCH" onChange={() => {}} options={options} />);
    expect(shell).toHaveClass("bg-accent-500/10");
  });
});
