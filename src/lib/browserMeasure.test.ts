import { describe, expect, it } from "vitest";
import {
  distinctive,
  lz4Block,
  mozLz4,
  profilesOf,
  redactText,
  relation,
  tabsOf,
  unvariant,
} from "../../scripts/browser-measure-core.mjs";

/** The pure half of `scripts/browser-measure.mjs`, the tool behind the browser-detection measurements. */

// Written by the reference LZ4 compressor (python-lz4's block mode) behind a mozLz4 header, as Firefox writes it.
const FIXTURE = "bW96THo0MABsAgAAj0ZyaWVyZW4gCAD/Jv8LQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVoaAPpQSktMTU4=";
const FIXTURE_TEXT =
  "Frieren ".repeat(40) + Array.from({ length: 300 }, (_, i) => String.fromCharCode(65 + (i % 26))).join("");

// The app's tsconfig knows no Node API, so the bytes are built by hand rather than with Buffer.
const bytes = (latin1: string) => Uint8Array.from(latin1, (c) => c.charCodeAt(0));
const mozHeader = (size: number) =>
  Uint8Array.from([...bytes("mozLz40\0"), size & 255, (size >>> 8) & 255, (size >>> 16) & 255, size >>> 24]);

describe("the mozLz4 session format", () => {
  it("decodes the reference compressor's output byte for byte", () => {
    expect(new TextDecoder().decode(mozLz4(bytes(atob(FIXTURE))))).toBe(FIXTURE_TEXT);
  });

  it("refuses a file without the magic", () => {
    expect(() => mozLz4(bytes("not a session file at all"))).toThrow("not a mozLz4 file");
  });

  it("refuses a declared size past the cap before allocating it", () => {
    expect(() => mozLz4(Uint8Array.from([...mozHeader(2 ** 31), 0x10, 0x41]), 1024)).toThrow("past the cap");
  });

  it("refuses a match that reaches before the start of the output", () => {
    // One literal "A", then a match whose offset of 5 points four bytes before anything was written.
    expect(() => lz4Block(Uint8Array.from([0x10, 0x41, 0x05, 0x00]), 64)).toThrow("outside the output");
  });

  it("refuses literals that would overrun the declared size", () => {
    expect(() => lz4Block(Uint8Array.from([0x30, 0x41, 0x42, 0x43]), 2)).toThrow("past a buffer");
  });
});

describe("reading tabs out of a session", () => {
  const state = {
    windows: [
      {
        selected: 2,
        tabs: [
          { index: 1, entries: [{ url: "https://example.test/", title: "Home" }] },
          {
            index: 1,
            lastAccessed: 5,
            entries: [
              { url: "https://example.test/ep-5", title: "Episode 5" },
              { url: "https://example.test/ep-6", title: "Episode 6" },
            ],
          },
        ],
      },
    ],
    _closedWindows: [{ tabs: [{ entries: [{ url: "https://closed.test/", title: "Closed" }] }] }],
  };

  it("takes each tab's current entry, not the newest one in its history", () => {
    const tabs = tabsOf(state);
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toMatchObject({ window: 1, tab: 2, selected: true, title: "Episode 5", lastAccessed: 5 });
  });

  it("never reads a closed window", () => {
    expect(tabsOf(state).map((t) => t.title)).not.toContain("Closed");
  });
});

describe("linking a tab to the media session's title", () => {
  it("links an equal title regardless of quotes and case", () => {
    expect(relation("Frieren’s Journey", "frieren's journey")).toBe("equal");
  });

  it("links a tab that holds a distinctive session title", () => {
    expect(relation("Frieren Episode 5 - The Hero's Party - ExampleStream", "The Hero's Party")).toBe("contains");
  });

  it("does not link on a title that is only an episode number, however often it appears", () => {
    expect(distinctive("Episode 1")).toBe(false);
    expect(distinctive("Folge 12 - Part 2")).toBe(false);
    expect(relation("Frieren Episode 1 - ExampleStream", "Episode 1")).toBeNull();
  });

  it("links whole words only, so the end of a title is not the start of another word", () => {
    expect(relation("Frieren - The Ending Theme", "The End Of It")).toBeNull();
    expect(relation("Show - The Endings Of It - ExampleStream", "The End Of It")).toBeNull();
  });

  it("does not link on a single word", () => {
    expect(distinctive("Departures")).toBe(false);
    expect(distinctive("The Hero's Party")).toBe(true);
  });
});

describe("redacting shared output", () => {
  it("hides hosts, the brand and the home folder", () => {
    const text = "https://www.example-stream.test/watch/x - ExampleStream in /home/kyu/.zen";
    expect(redactText(text, { brands: ["examplestream"], home: "/home/kyu" })).toBe(
      "https://<host>/watch/x - <SITE> in ~/.zen",
    );
  });

  it("keeps hosts when asked", () => {
    expect(redactText("https://example.test/a", { keepHosts: true })).toBe("https://example.test/a");
  });
});

describe("busctl's JSON", () => {
  it("loses its {type, data} wrapping, nested dictionaries included", () => {
    const reply = {
      type: "a{sv}",
      data: [{ Metadata: { type: "a{sv}", data: { "xesam:artist": { type: "as", data: ["A"] } } } }],
    };
    expect(unvariant(reply)).toEqual([{ Metadata: { "xesam:artist": ["A"] } }]);
  });
});

describe("profiles.ini", () => {
  it("resolves relative and absolute profiles and names the install defaults", () => {
    const ini = [
      "[Install308046B0AF4A39CB]",
      "Default=Profiles/abc.default-release",
      "[Profile0]",
      "Name=default-release",
      "IsRelative=1",
      "Path=Profiles/abc.default-release",
      "[Profile1]",
      "Name=elsewhere",
      "IsRelative=0",
      "Path=/data/elsewhere",
      "Default=1",
    ].join("\r\n");
    const [own, elsewhere] = profilesOf("/root/.zen", ini);
    // The joined path takes the platform's separator, and the suite also runs on Windows.
    expect(own.dir).toMatch(/^[\\/]root[\\/]\.zen[\\/]Profiles[\\/]abc\.default-release$/);
    expect(own).toMatchObject({ name: "default-release", installs: ["308046B0AF4A39CB"], legacyDefault: false });
    expect(elsewhere).toEqual({ name: "elsewhere", dir: "/data/elsewhere", installs: [], legacyDefault: true });
  });
});
