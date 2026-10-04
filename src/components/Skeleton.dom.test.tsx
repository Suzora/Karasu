import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { DetailSkeleton, Shimmer } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { detailFrame } from "@/components/media/detailFrame";

/** The setup's `matchMedia` always answers desktop, so the shell shape is a flag the tests flip. */
const shell = vi.hoisted(() => ({ phone: false }));
vi.mock("@/hooks/usePhoneShell", () => ({ usePhoneShell: () => shell.phone }));

/** A skeleton cell whose wait the stylesheet owns, and an empty state whose glyph sits on the icon scale. */
describe("Shimmer", () => {
  it("offsets its sweep through a custom property, so the inline style cannot also move the wait", () => {
    const { container } = render(<Shimmer index={3} />);
    const cell = container.firstElementChild as HTMLElement;
    expect(cell.style.getPropertyValue("--shimmer-offset")).toMatch(/ms$/);
    expect(cell.style.animationDelay).toBe("");
  });
});

describe("EmptyState", () => {
  it("draws a plain glyph at the empty-state size, hidden from the reader, above the title", () => {
    const { container } = render(<EmptyState icon={Search} title="Nothing matches" />);
    const glyph = container.querySelector("svg");
    expect(glyph).toHaveClass("size-8");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Nothing matches")).toBeInTheDocument();
  });
});

/** jsdom lays nothing out, so the frame's own class lists stand in for where the page will put each part. */
describe("DetailSkeleton", () => {
  afterEach(() => {
    shell.phone = false;
  });

  /** The first element carrying every class of one of the frame's lists. */
  const part = (root: Element, classes: string) =>
    [...root.querySelectorAll("*")].find((el) => classes.split(" ").every((c) => el.classList.contains(c))) ?? null;

  it("takes the page's header height, which follows the width, inside a query container of its own", () => {
    const { container } = render(<DetailSkeleton />);
    const header = container.querySelector(".\\@container")?.firstElementChild as HTMLElement;
    const page = document.createElement("div");
    Object.assign(page.style, detailFrame(false).header);
    expect(header.style.height).toContain("100cqw");
    expect(header.style.height).toBe(page.style.height);
  });

  it("floats the cover on the phone and stands the facts and the action row under it, as the page does", () => {
    shell.phone = true;
    const { container } = render(<DetailSkeleton />);
    const frame = detailFrame(true);
    expect(part(container, frame.row)?.firstElementChild).toBe(part(container, frame.cover));
    const facts = part(container, frame.facts);
    expect(facts?.parentElement).toBe(part(container, frame.heading));
    expect(facts?.lastElementChild?.children).toHaveLength(3);
  });

  it("keeps the cover beside the heading on the desktop, with nothing standing under it", () => {
    const { container } = render(<DetailSkeleton />);
    const frame = detailFrame(false);
    expect(part(container, frame.row)?.firstElementChild).toBe(part(container, frame.cover));
    expect(part(container, frame.cover)).not.toHaveClass("float-left");
    expect(part(container, detailFrame(true).facts)).toBeNull();
  });
});
