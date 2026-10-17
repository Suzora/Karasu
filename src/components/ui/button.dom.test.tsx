import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonClass } from "./button";

/** The text button the 2026-10-17 foundation takes from Material: a pill in the accent's text shade, no underline. */
describe("Button text variant", () => {
  it("is a pill in the accent's text shade with a state layer under the pointer", () => {
    render(<Button variant="text">Show all</Button>);
    expect(screen.getByRole("button", { name: "Show all" })).toHaveClass("rounded-full", "text-accent-400", "hover:bg-accent-400/10");
  });

  it("spells the same classes for a link", () => {
    expect(buttonClass("text").split(" ")).toEqual(expect.arrayContaining(["rounded-full", "text-accent-400"]));
  });
});
