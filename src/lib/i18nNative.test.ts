import { describe, expect, it } from "vitest";
import { escape, qualifier, xmlFor } from "../../scripts/i18n-native.mjs";

describe("the native catalogs' Android output", () => {
  it("names the resource folder Android reads for each code", () => {
    expect(qualifier("en")).toBe("values");
    expect(qualifier("de")).toBe("values-de");
    expect(qualifier("pt-BR")).toBe("values-pt-rBR");
    expect(qualifier("zh-Hans")).toBe("values-b+zh+Hans");
    expect(qualifier("es-419")).toBe("values-b+es+419");
  });

  it("escapes what Android's string syntax would read as markup or a reference", () => {
    expect(escape("Today's <b> & \"x\"")).toBe("Today\\'s &lt;b&gt; &amp; \\\"x\\\"");
    expect(escape("@home")).toBe("\\@home");
  });

  it("writes only the android keys, without their prefix", () => {
    const xml = xmlFor("en", { "android.widget_open": "Open Karasu", trayQuit: "Quit" });
    expect(xml).toContain('<string name="widget_open">Open Karasu</string>');
    expect(xml).not.toContain("Quit");
  });
});
