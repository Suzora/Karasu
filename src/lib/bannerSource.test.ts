import { describe, expect, it } from "vitest";
import { bannerSource, type BannerCandidate } from "./bannerSource";

const lender = (id: number, banner: string | null, extra: { isAdult?: boolean; genres?: string[] } = {}) => ({
  id,
  bannerImage: banner,
  isAdult: false,
  genres: ["Drama"],
  ...extra,
});

type Edges = NonNullable<BannerCandidate["relations"]>["edges"];

const title = (edges: Edges, extra: Partial<BannerCandidate> = {}): BannerCandidate => ({
  bannerImage: null,
  coverImage: { color: "#E4A128" },
  isAdult: false,
  genres: ["Drama", "Mystery"],
  relations: { edges },
  ...extra,
});

describe("bannerSource", () => {
  it("draws a title's own banner whatever its relatives have", () => {
    const own = title([{ relationType: "PREQUEL", node: lender(2, "prequel.jpg") }], { bannerImage: "own.jpg" });
    expect(bannerSource(own, "strict")).toEqual({ kind: "own", src: "own.jpg" });
  });

  /** Kusuriya 3 in its first weeks: no banner yet, the second season's to borrow. */
  it("borrows a prequel's banner while the title has none", () => {
    const sequel = title([{ relationType: "PREQUEL", node: lender(176301, "prequel.jpg") }]);
    expect(bannerSource(sequel, "strict")).toEqual({ kind: "related", src: "prequel.jpg", mediaId: 176301 });
  });

  it("prefers the nearer relation whatever order AniList lists them in", () => {
    const edges = [
      { relationType: "ADAPTATION", node: lender(3, "manga.jpg") },
      { relationType: "SEQUEL", node: lender(4, "sequel.jpg") },
      { relationType: "PREQUEL", node: lender(5, "prequel.jpg") },
    ];
    expect(bannerSource(title(edges), "strict")).toMatchObject({ src: "prequel.jpg" });
    expect(bannerSource(title(edges.slice(0, 2)), "strict")).toMatchObject({ src: "sequel.jpg" });
    expect(bannerSource(title(edges.slice(0, 1)), "strict")).toMatchObject({ src: "manga.jpg" });
  });

  it("takes the first of two equally near relatives", () => {
    const edges = [
      { relationType: "SIDE_STORY", node: lender(6, "first.jpg") },
      { relationType: "SIDE_STORY", node: lender(7, "second.jpg") },
    ];
    expect(bannerSource(title(edges), "strict")).toMatchObject({ mediaId: 6 });
  });

  it("never borrows from a relation that only shares characters or nothing named", () => {
    const edges = [
      { relationType: "CHARACTER", node: lender(8, "crossover.jpg") },
      { relationType: "OTHER", node: lender(9, "other.jpg") },
    ];
    expect(bannerSource(title(edges), "strict").kind).toBe("wash");
  });

  it("skips a relative without a banner of its own", () => {
    const edges = [
      { relationType: "PREQUEL", node: lender(10, null) },
      { relationType: "PREQUEL", node: lender(11, "") },
      { relationType: "SEQUEL", node: lender(12, "sequel.jpg") },
    ];
    expect(bannerSource(title(edges), "strict")).toMatchObject({ mediaId: 12 });
  });

  /** The content filter holds for borrowed art as it does for the title itself. */
  it("never borrows from a relative the filter hides or explicit art for a title that is not", () => {
    const ecchi = [{ relationType: "PREQUEL", node: lender(13, "ecchi.jpg", { genres: ["Ecchi"] }) }];
    expect(bannerSource(title(ecchi), "strict").kind).toBe("wash");
    expect(bannerSource(title(ecchi), "moderate").kind).toBe("related");
    const explicit = [{ relationType: "PREQUEL", node: lender(14, "explicit.jpg", { isAdult: true }) }];
    expect(bannerSource(title(explicit), "off").kind).toBe("wash");
    expect(bannerSource(title(explicit, { isAdult: true }), "off").kind).toBe("related");
  });

  it("survives missing relations, edges and nodes", () => {
    expect(bannerSource(title([null, { relationType: "PREQUEL", node: null }, { node: lender(15, "x.jpg") }]), "strict").kind).toBe("wash");
    expect(bannerSource({ bannerImage: null, coverImage: {}, relations: null }, "strict")).toEqual({ kind: "wash", tint: null });
    expect(bannerSource({ coverImage: { color: null } }, "strict")).toEqual({ kind: "wash", tint: null });
  });

  it("washes in the cover's colour, and only a plain hex one reaches a style", () => {
    expect(bannerSource(title([]), "strict")).toEqual({ kind: "wash", tint: "#e4a128" });
    for (const color of ["#fff", "red", "url(x)", "#e4a128; color: red", ""]) {
      expect(bannerSource(title([], { coverImage: { color } }), "strict")).toEqual({ kind: "wash", tint: null });
    }
  });
});
