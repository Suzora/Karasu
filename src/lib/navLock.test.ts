import { describe, expect, it } from "vitest";
import { navLock } from "./navLock";

/** What a place needs that the profile in use lacks; the sidebar greys it out and the More sheet says why. */
describe("navLock", () => {
  it("locks the AniList-only places for anything but an AniList account", () => {
    for (const to of ["/social", "/wrapped"]) {
      expect(navLock(to, "none")).toBe("anilist");
      expect(navLock(to, "local")).toBe("anilist");
      expect(navLock(to, "anilist")).toBeNull();
    }
  });

  /** Statistics draw from a local profile too, so they want a profile of either kind, not an account. */
  it("locks the statistics only while there is no profile at all", () => {
    expect(navLock("/stats", "none")).toBe("profile");
    expect(navLock("/stats", "local")).toBeNull();
    expect(navLock("/stats", "anilist")).toBeNull();
  });

  it("never locks a place that works without an account", () => {
    for (const to of ["/", "/list", "/search", "/seasonal", "/calendar", "/forum", "/library"]) {
      expect(navLock(to, "none")).toBeNull();
    }
  });
});
