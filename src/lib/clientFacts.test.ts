import { describe, expect, it } from "vitest";
import { clientFacts, type ClientSnapshot } from "./clientFacts";

const base: ClientSnapshot = {
  userAgent: "UA",
  hash: "#/user/Kyusetzu?tab=followers",
  width: 1232.4,
  height: 800,
  pixelRatio: 1.25,
  phone: false,
  theme: "dark",
  contrast: undefined,
  reducedMotion: false,
  language: "de",
  online: true,
};

describe("clientFacts", () => {
  it("reads the route off the hash router and the window as a person would write it", () => {
    const f = clientFacts(base);
    expect(f.route).toBe("/user/Kyusetzu?tab=followers");
    expect(f.viewport).toBe("1232×800 @1.25x");
    expect(f.shell).toBe("desktop");
    expect(f.contrast).toBe("standard");
  });

  it("names the phone shell, the high-contrast palette and an empty hash", () => {
    const f = clientFacts({ ...base, hash: "", phone: true, contrast: "more", theme: undefined });
    expect(f.route).toBe("/");
    expect(f.shell).toBe("phone");
    expect(f.contrast).toBe("high");
    expect(f.theme).toBe("unknown");
  });
});
