import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { OverviewPager } from "./OverviewPager";

const pages = [
  { label: "Overview", node: <p>first page</p> },
  { label: "Stats", node: <p>second page</p> },
];

/** The phone Overview's two pages: swiped sideways, each as wide as the phone, dots that say where you are. */
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
    Object.defineProperty(track.children[1], "offsetLeft", { value: 405 });
    track.scrollTo = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Stats" }));
    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 405 }));
  });

  it("marks the page the track has scrolled to", () => {
    render(<OverviewPager pages={pages} />);
    const track = document.querySelector<HTMLElement>("[data-pager]")!;
    Object.defineProperty(track.children[1], "offsetLeft", { value: 405 });
    track.scrollLeft = 390;
    fireEvent.scroll(track);
    expect(screen.getByRole("button", { name: "Stats" })).toHaveAttribute("aria-current", "true");
  });

  /** A page that peeked the next one in read as an Overview that did not fit the phone. */
  it("gives each page the phone's whole width, with the next one out of sight", () => {
    render(<OverviewPager pages={pages} />);
    const track = document.querySelector<HTMLElement>("[data-pager]")!;
    for (const page of track.children) expect(page).toHaveClass("w-full");
    expect(track).toHaveClass("gap-8");
  });

  it("caps the page not showing at the screen's height, so a short page leaves no long empty scroll", () => {
    render(<OverviewPager pages={pages} />);
    const [first, second] = [...document.querySelector<HTMLElement>("[data-pager]")!.children];
    expect(first).not.toHaveClass("max-h-screen");
    expect(second).toHaveClass("max-h-screen", "overflow-hidden");
  });
});
