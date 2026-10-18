import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { OverviewPager } from "./OverviewPager";

const pages = [
  { label: "Overview", slot: "overview", node: <p>first page</p> },
  { label: "Stats", slot: "mine", node: <p>second page</p> },
];

const draw = () => render(<OverviewPager pages={pages} />, { wrapper: MemoryRouter });
const trackOf = () => document.querySelector<HTMLElement>("[data-pager]")!;
const sized = (track: HTMLElement, width: number) => Object.defineProperty(track, "clientWidth", { value: width });

/** The phone Overview's two pages: each the phone's width, each scrolling on its own, dots that say where you are. */
describe("OverviewPager", () => {
  it("draws both pages and one dot per page, the first marked current", () => {
    draw();
    expect(screen.getByText("first page")).toBeInTheDocument();
    expect(screen.getByText("second page")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Stats" })).not.toHaveAttribute("aria-current");
  });

  it("scrolls one phone width over when a dot is tapped", () => {
    draw();
    const track = trackOf();
    sized(track, 405);
    track.scrollTo = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Stats" }));
    expect(track.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 405 }));
  });

  it("marks the page the track has scrolled to", () => {
    draw();
    const track = trackOf();
    sized(track, 405);
    track.scrollLeft = 390;
    fireEvent.scroll(track);
    expect(screen.getByRole("button", { name: "Stats" })).toHaveAttribute("aria-current", "true");
  });

  /** A page wider or narrower than the phone shows a strip of its neighbour, which read as a page that did not fit. */
  it("gives each page the phone's whole width and nothing between them", () => {
    draw();
    const track = trackOf();
    expect(track).not.toHaveClass("gap-8");
    for (const page of track.children) expect(page).toHaveClass("w-full", "shrink-0");
  });

  /** Each page keeps its own place, so reading the activity never moves the lists and back. */
  it("lets each page scroll on its own, the full height of the screen", () => {
    draw();
    const track = trackOf();
    expect(track).toHaveClass("h-full", "overflow-y-hidden");
    for (const page of track.children) expect(page).toHaveClass("h-full", "overflow-y-auto", "overflow-x-hidden");
  });
});
