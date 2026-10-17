import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, cardClass } from "./card";

/** The three panels a page is built from, so a row, a block and a well look the same wherever they appear. */
describe("Card", () => {
  it("is raised by default: a tonal surface outlined only in high contrast, with room to breathe", () => {
    render(<Card>Body</Card>);
    const body = screen.getByText("Body");
    expect(body).toHaveClass("rounded-panel", "bg-surface-900", "surface-outline", "p-5");
    expect(body).not.toHaveClass("panel-wash", "panel-top", "border");
  });

  it("draws a flat block without the wash and a sunken well a step darker, each with its own padding", () => {
    render(
      <>
        <Card variant="flat">Flat</Card>
        <Card variant="sunken">Well</Card>
      </>,
    );
    const flat = screen.getByText("Flat");
    expect(flat).toHaveClass("rounded-panel", "bg-surface-900", "surface-outline", "p-4");
    expect(flat).not.toHaveClass("border");
    expect(screen.getByText("Well")).toHaveClass("rounded-control", "bg-surface-950", "p-3");
  });

  it("lets the caller's padding win and marks an interactive card on hover", () => {
    render(
      <Card variant="flat" interactive className="p-3">
        Row
      </Card>,
    );
    const row = screen.getByText("Row");
    expect(row).toHaveClass("p-3", "hover:bg-surface-850");
    expect(row).not.toHaveClass("p-4");
  });

  it("spells the same classes for a card that has to be a link or a form", () => {
    expect(cardClass("flat", { interactive: true }).split(" ")).toEqual(
      expect.arrayContaining(["rounded-panel", "bg-surface-900", "surface-outline", "transition-surface", "hover:bg-surface-850"]),
    );
    expect(cardClass().split(" ")).not.toContain("panel-top");
  });
});
