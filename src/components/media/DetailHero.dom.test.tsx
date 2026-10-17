import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailHero } from "./DetailHero";
import { ProgressBand } from "./ProgressBand";

const hero = (phone: boolean) => (
  <DetailHero
    phone={phone}
    banner={<div data-testid="banner" />}
    cover={<img alt="cover" />}
    title={<h1>Title</h1>}
    subtitle={<p>Native</p>}
    meta={<p>TV · 2026</p>}
  />
);

/** The detail head: on the phone cover, titles and facts bundled in a tall banner; on the desktop the titles alone. */
describe("DetailHero", () => {
  it("bundles cover, titles and facts inside the banner on the phone", () => {
    render(hero(true));
    const box = screen.getByTestId("banner").parentElement!;
    expect(box).toContainElement(screen.getByAltText("cover"));
    expect(box).toContainElement(screen.getByRole("heading", { name: "Title" }));
    expect(box).toContainElement(screen.getByText("TV · 2026"));
  });

  it("leaves the cover out of the desktop banner, which the side column shows", () => {
    render(hero(false));
    expect(screen.queryByAltText("cover")).toBeNull();
    expect(screen.getByTestId("banner").parentElement).toContainElement(screen.getByRole("heading", { name: "Title" }));
  });
});

describe("ProgressBand", () => {
  it("counts a twelve-episode title in ticks with what is left", () => {
    const { container } = render(<ProgressBand status={<span>status</span>} progress={4} total={12} unit="episodes" />);
    expect(container.querySelectorAll("[data-tick]")).toHaveLength(12);
    expect(container.querySelectorAll('[data-tick="done"]')).toHaveLength(4);
    expect(screen.getByText("detail.remaining:{\"n\":8}")).toBeInTheDocument();
  });

  it("draws a bar for a long title and nothing for an entry not on the list", () => {
    const { container, rerender } = render(<ProgressBand status={<span>status</span>} progress={20} total={300} unit="chapters" />);
    expect(container.querySelector("[data-bar]")).not.toBeNull();
    rerender(<ProgressBand status={<span>status</span>} progress={null} total={300} unit="chapters" />);
    expect(container.querySelector("[data-bar]")).toBeNull();
    expect(screen.getByText("status")).toBeInTheDocument();
  });
});
