import { describe, expect, it } from "vitest";
import { Sunburst, ToneLegend } from "./Charts";
import { inkOn } from "./tones";
import { html, texts } from "@/test/markup";

/** Static markup needs no DOM, so the filename stays without `.dom`; the tests ask only what the output holds. */

describe("Sunburst", () => {
  const data = [
    {
      label: "Completed",
      value: 376,
      children: [
        { label: "TV", value: 300 },
        { label: "MOVIE", value: 76 },
      ],
    },
    { label: "Planning", value: 98, children: [{ label: "TV", value: 98 }] },
  ];

  it("writes the totals into the rings that are wide enough", () => {
    const out = texts(html(<Sunburst data={data} />));
    expect(out).toContain("474"); // the centre total
    expect(out).toContain("376");
    expect(out).toContain("300");
  });

  /** An invisible value is still in the markup, so the ink class is the only evidence. */
  it("writes each ring's count in an ink that its own fill can carry", () => {
    const markup = html(
      <Sunburst
        data={["Completed", "Current", "Paused", "Dropped", "Planning"].map(
          (label, i) => ({ label, value: 100 - i }),
        )}
      />,
    );
    const inks = [...markup.matchAll(/<text[^>]*class="([^"]*)"/g)].map((m) => m[1]);
    const onAccent = inks.filter((c) => c.includes("fill-accent-ink"));
    expect(onAccent).toHaveLength(2); // TONES[0] and TONES[1], and no more
  });

  /** A status wedge is painted in the status's colour, and its count in the ink the caller resolved for that colour. */
  it("paints a coloured group in its own colour and writes its count in the ink it brings", () => {
    const markup = html(
      <Sunburst
        data={[
          { label: "Completed", value: 60, color: "var(--color-status-completed)", ink: "fill-on-cover" },
          { label: "Planning", value: 40, color: "var(--color-status-planning)", ink: "fill-on-cover-edge" },
        ]}
      />,
    );
    expect(markup).toContain('fill="var(--color-status-completed)"');
    expect(markup).toContain('fill="var(--color-status-planning)"');
    const inks = [...markup.matchAll(/<text[^>]*class="([^"]*)"/g)].map((m) => m[1]);
    expect(inks.some((c) => c.startsWith("fill-on-cover "))).toBe(true);
    expect(inks.some((c) => c.startsWith("fill-on-cover-edge "))).toBe(true);
    expect(inks.some((c) => c.includes("fill-accent-ink"))).toBe(false);
  });

  it("leaves a sliver unlabelled rather than overprinting it", () => {
    const out = texts(
      html(
        <Sunburst
          data={[
            { label: "Nearly all", value: 1000 },
            { label: "A sliver", value: 1 },
          ]}
        />,
      ),
    );
    expect(out).toContain("1000");
    // 1 of 1001 is a third of a degree; there is nowhere to put the number.
    expect(out.filter((t) => t === "1")).toHaveLength(0);
  });
});

describe("inkOn", () => {
  /** The two inks stay fixed while the theme flips, so a pale status fill reads dark ink and a deep one light. */
  it("picks whichever fixed ink reads better on the fill", () => {
    expect(inkOn("#f0f2f5")).toBe("fill-on-cover");
    expect(inkOn("#12141a")).toBe("fill-on-cover-edge");
  });
});

describe("ToneLegend", () => {
  /** The key must match the marks it explains, so a coloured item keeps its colour and the rest take the ramp. */
  it("paints an item in its own colour, else the shared ramp", () => {
    const markup = html(
      <ToneLegend
        locale="en"
        items={[
          { label: "Completed", value: 3, color: "var(--color-status-completed)" },
          { label: "Other", value: 1 },
        ]}
      />,
    );
    expect(markup).toContain("background:var(--color-status-completed)");
    expect(markup).toContain("background:var(--color-accent-400)");
  });
});
