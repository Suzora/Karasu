import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { FormatNav, FormatPicker, SeasonField, YearStepper } from "./SeasonNav";

const filters = { format: "", unlisted: false, byScore: false };
const counts = { TV: 5, MOVIE: 2, ONA: 1 };

/** The season page's column: the year with arrows, the four seasons, the formats with their counts and two switches. */
describe("SeasonNav", () => {
  it("steps the year with its arrows and shows it as the page's visible heading", () => {
    const onStep = vi.fn();
    renderWithProviders(<YearStepper year={2026} onStep={onStep} />);
    expect(screen.getByText("2026")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "seasonal.prevYear" }));
    fireEvent.click(screen.getByRole("button", { name: "seasonal.nextYear" }));
    expect(onStep.mock.calls).toEqual([[-1], [1]]);
  });

  it("offers the four seasons as one choice with the current one checked", () => {
    const onPick = vi.fn();
    renderWithProviders(<SeasonField season="FALL" onPick={onPick} />);
    expect(screen.getByRole("radiogroup", { name: "seasonal.seasons" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "season.FALL" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "season.SPRING" }));
    expect(onPick).toHaveBeenCalledWith("SPRING");
  });

  it("lists every format with its count, all formats first, and filters on a press", () => {
    const onChange = vi.fn();
    renderWithProviders(<FormatNav counts={counts} total={8} filters={filters} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /seasonal\.allFormats/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /format\.MOVIE/ }));
    expect(onChange).toHaveBeenCalledWith({ format: "MOVIE" });
    fireEvent.click(screen.getByRole("button", { name: "seasonal.unlisted" }));
    expect(onChange).toHaveBeenCalledWith({ unlisted: true });
    fireEvent.click(screen.getByRole("button", { name: "seasonal.byScore" }));
    expect(onChange).toHaveBeenCalledWith({ byScore: true });
  });

  it("names the chosen format on the phone's field", () => {
    renderWithProviders(<FormatPicker counts={counts} total={8} filters={{ ...filters, format: "TV" }} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /seasonal\.formatPick/ })).toBeInTheDocument();
  });
});
