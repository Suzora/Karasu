import { describe, expect, it } from "vitest";
import { DotPlot } from "./DotPlot";
import { html } from "@/test/markup";

/** Static markup needs no DOM, so the filename stays without `.dom`; the tests ask only what the output holds. */

describe("DotPlot", () => {
  const rows = [
    { label: "Hidden Gem", mine: 9.5, other: 6.2 },
    { label: "Overrated", mine: 4, other: 8.6 },
  ];

  it("writes each row's pair as text, not only as geometry", () => {
    const markup = html(
      <DotPlot locale="en" title="t" rows={rows} legendMine="mine" legendOther="crowd" />,
    );
    expect(markup).toContain("Hidden Gem");
    expect(markup).toContain("6.2");
    expect(markup).toContain("9.5");
    expect(markup).toContain("mine");
    expect(markup).toContain("crowd");
  });

  it("keeps both dots on the theme's palette", () => {
    const markup = html(
      <DotPlot locale="en" title="t" rows={rows} legendMine="m" legendOther="c" />,
    );
    expect(markup).toContain("var(--color-accent-400)");
    expect(markup).toContain("var(--color-graph-none)");
    expect(markup).not.toMatch(/(?:fill|stroke)="#|background:#/);
  });

  /** A circle in the stretched viewBox renders as an ellipse, so the dots are round spans placed by percent. */
  it("draws the dots as round spans at their share of the axis, not as SVG circles", () => {
    const markup = html(
      <DotPlot locale="en" title="t" rows={[rows[0]]} legendMine="m" legendOther="c" max={10} />,
    );
    expect(markup).not.toContain("<circle");
    const dots = [...markup.matchAll(/<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*style="left:([\d.]+)%/g)];
    expect(dots.map((m) => Number(m[1]).toFixed(2))).toEqual(["61.28", "92.30"]);
    expect(markup).toContain('vector-effect="non-scaling-stroke"');
  });

  it("renders nothing for an empty list", () => {
    expect(html(<DotPlot locale="en" title="t" rows={[]} legendMine="m" legendOther="c" />)).toBe("");
  });
});
