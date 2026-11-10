import { describe, expect, it } from "vitest";

const FILES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** The browser's clipboard is reliable in WebView2 and conditional in WebKitGTK, so one module decides who writes. */
describe("the clipboard", () => {
  it("is written through lib/clipboard and nowhere else", () => {
    const api = ["navigator", "clipboard"].join(".");
    const users = Object.entries(FILES)
      .filter(([path, text]) => !path.endsWith(".test.ts") && !path.endsWith(".test.tsx") && text.includes(api))
      .map(([path]) => path);
    expect(users).toEqual(["/src/lib/clipboard.ts"]);
  });
});
