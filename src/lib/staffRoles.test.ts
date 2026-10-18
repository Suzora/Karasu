import { describe, expect, it } from "vitest";
import { languageName, staffRoleLabel, staffRoleParts } from "./staffRoles";

const t = (key: string) => `<${key}>`;

describe("staffRoleLabel", () => {
  it("names a known role through its key and keeps AniList's bracketed qualifier", () => {
    expect(staffRoleLabel("Theme Song Performance (OP)", t)).toBe("<staffRole.themeSong> (OP)");
    expect(staffRoleLabel("Director", t)).toBe("<staffRole.director>");
  });

  it("leaves a role it does not know exactly as AniList wrote it", () => {
    expect(staffRoleLabel("2nd Key Animation (ep 4)", t)).toBe("2nd Key Animation (ep 4)");
    expect(staffRoleParts("In-Between Animation").key).toBeNull();
  });
});

describe("languageName", () => {
  it("names AniList's English language name in the user's language", () => {
    expect(languageName("Japanese", "de")).toBe("Japanisch");
    expect(languageName("Portuguese (BR)", "en")).toMatch(/Portuguese/);
  });

  it("keeps a name it has no tag for", () => {
    expect(languageName("Klingon", "de")).toBe("Klingon");
  });
});
