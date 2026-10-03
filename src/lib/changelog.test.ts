import { describe, expect, it } from "vitest";
import { addEntries } from "../../scripts/changelog-section.mjs";

/** `scripts/changelog.mjs`'s edit to the Unreleased section, without git: the entries are what `collect` would hand it. */

const RELEASE = "## 1.32.0 — 2026-10-03\n\nThe first Stable release since 1.0.0.\n";
const changelog = (unreleased: string, after = RELEASE) => `# Changelog\n\n${unreleased}${after}`;

const fixed = (text: string) => ({ group: "Fixed", text });

describe("adding entries to the Unreleased section", () => {
  it("keeps the blank line before the release heading when it opens a group", () => {
    const file = changelog("## Unreleased\n\n<!-- generated-through: d71187f -->\n\n");
    expect(addEntries(file, [fixed("A fix.")], "79acbe2")).toBe(
      changelog("## Unreleased\n\n<!-- generated-through: 79acbe2 -->\n\n### Fixed\n\n- A fix.\n\n"),
    );
  });

  it("keeps the blank line before the release heading when it extends the last group", () => {
    const file = changelog("## Unreleased\n\n<!-- generated-through: d71187f -->\n\n### Fixed\n\n- A fix.\n\n");
    expect(addEntries(file, [fixed("Another fix.")], "79acbe2")).toBe(
      changelog("## Unreleased\n\n<!-- generated-through: 79acbe2 -->\n\n### Fixed\n\n- A fix.\n- Another fix.\n\n"),
    );
  });

  it("restores the blank line a section had already lost", () => {
    const file = changelog("## Unreleased\n\n<!-- generated-through: d71187f -->\n\n### Fixed\n\n- A fix.\n");
    expect(addEntries(file, [fixed("Another fix.")], "79acbe2")).toBe(
      changelog("## Unreleased\n\n<!-- generated-through: 79acbe2 -->\n\n### Fixed\n\n- A fix.\n- Another fix.\n\n"),
    );
  });

  it("adds to a group in the middle without touching the ones after it", () => {
    const file = changelog("## Unreleased\n\n<!-- generated-through: d71187f -->\n\n### Added\n\n- A.\n\n### Fixed\n\n- B.\n\n");
    expect(addEntries(file, [{ group: "Added", text: "C." }], "79acbe2")).toBe(
      changelog("## Unreleased\n\n<!-- generated-through: 79acbe2 -->\n\n### Added\n\n- A.\n- C.\n\n### Fixed\n\n- B.\n\n"),
    );
  });

  it("ends on the entry's own newline when nothing follows the section", () => {
    const file = changelog("## Unreleased\n\n<!-- generated-through: d71187f -->\n\n### Fixed\n\n- A fix.\n", "");
    expect(addEntries(file, [fixed("Another fix."), { group: "Added", text: "New." }], "79acbe2")).toBe(
      changelog(
        "## Unreleased\n\n<!-- generated-through: 79acbe2 -->\n\n### Fixed\n\n- A fix.\n- Another fix.\n\n### Added\n\n- New.\n",
        "",
      ),
    );
  });
});
