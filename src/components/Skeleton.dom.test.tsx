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

  it("takes the page's banner height on either shell", () => {
    const { container, unmount } = render(<DetailSkeleton />);
    expect(part(container, detailFrame(false).hero)).not.toBeNull();
    unmount();
    shell.phone = true;
    const phone = render(<DetailSkeleton />);
    expect(part(phone.container, detailFrame(true).hero)).not.toBeNull();
  });

  it("puts the cover inside the banner on the phone, as the page does", () => {
    shell.phone = true;
    const { container } = render(<DetailSkeleton />);
    const frame = detailFrame(true);
    expect(part(container, frame.hero)).toContainElement(part(container, frame.cover) as HTMLElement);
    expect(part(container, frame.body)).not.toBeNull();
  });

  it("stands the cover at the top of the side column on the desktop", () => {
    const { container } = render(<DetailSkeleton />);
    const frame = detailFrame(false);
    const aside = part(container, frame.aside);
    expect(aside?.firstElementChild).toBe(part(container, frame.cover));
    expect(aside?.parentElement).toBe(part(container, frame.body));
  });
});
