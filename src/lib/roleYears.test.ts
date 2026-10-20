import { describe, expect, it } from "vitest";
import { rolesByYear } from "./roleYears";

const role = (id: number, year: number | null, node = true) => ({ id, node: node ? { startDate: year === null ? null : { year } } : null });

describe("rolesByYear", () => {
  it("groups by the title's start year, newest first, with the undated ahead of every year", () => {
    const years = rolesByYear([[role(1, null), role(2, 2026), role(3, 2026), role(4, 2024)]]);
    expect(years.map((y) => y.year)).toEqual([null, 2026, 2024]);
    expect(years[1].roles.map((r) => r.id)).toEqual([2, 3]);
  });

  it("sorts the years itself, so a page that arrives out of order still reads newest first", () => {
    const years = rolesByYear([[role(1, 2020), role(2, 2025)], [role(3, 2023), role(4, 2025)]]);
    expect(years.map((y) => y.year)).toEqual([2025, 2023, 2020]);
    expect(years[0].roles.map((r) => r.id)).toEqual([2, 4]);
  });

  it("drops an edge a later page repeats and one whose title is gone", () => {
    const years = rolesByYear([[role(1, 2025), role(2, 2025)], [role(2, 2025), role(3, 2025, false), role(4, 2024)]]);
    expect(years.flatMap((y) => y.roles.map((r) => r.id))).toEqual([1, 2, 4]);
  });

  it("is empty for no pages and for empty ones", () => {
    expect(rolesByYear([])).toEqual([]);
    expect(rolesByYear([[], []])).toEqual([]);
  });
});
