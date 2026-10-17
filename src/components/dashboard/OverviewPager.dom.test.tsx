import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OverviewPager } from "./OverviewPager";

const pages = [
  { label: "Overview", node: <p>first page</p> },
  { label: "Stats", node: <p>second page</p> },
];

/** The phone Overview's two pages: swiped sideways, the next one peeking in, dots that say where you are. */
describe("OverviewPager", () => {
  it("draws both pages and one dot per page, the first marked current", () => {
    render(<OverviewPager pages={pages} />);
    expect(screen.getByText("first page")).toBeInTheDocument();
    expect(screen.getByText("second page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Stats" })).not.toHaveAttribute("aria-current");
  });

  it("scrolls to a page when its dot is tapped", () => {
    render(<OverviewPager pages={pages} />);
    const track = document.querySelector<HTMLElement>("[data-pager]")!;
    const first = track.firstElementChild as HTMLElement;
    Object.defineProperty(first, "offsetWidth", { value: 330 });
    track.scrollTo = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Stats" }));
    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 330 }));
  });

  it("marks the page the track has scrolled to", () => {
    render(<OverviewPager pages={pages} />);
    const track = document.querySelector<HTMLElement>("[data-pager]")!;
    Object.defineProperty(track.firstElementChild as HTMLElement, "offsetWidth", { value: 330 });
    track.scrollLeft = 320;
    fireEvent.scroll(track);
    expect(screen.getByRole("button", { name: "Stats" })).toHaveAttribute("aria-current", "true");
  });

  it("lets the next page peek in rather than filling the width", () => {
    render(<OverviewPager pages={pages} />);
    const first = document.querySelector<HTMLElement>("[data-pager]")!.firstElementChild!;
    expect(first.className).toContain("w-pager-page");
  });

  it("caps the page not showing at the screen's height, so a short page leaves no long empty scroll", () => {
    render(<OverviewPager pages={pages} />);
    const [first, second] = [...document.querySelector<HTMLElement>("[data-pager]")!.children];
    expect(first).not.toHaveClass("max-h-screen");
    expect(second).toHaveClass("max-h-screen", "overflow-hidden");
  });
});
