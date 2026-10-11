import { describe, expect, it } from "vitest";
import { playerName } from "./playerName";

describe("playerName", () => {
  /** The pill and the detection window name the player the same way, without Windows' file extension. */
  it("drops the Windows extension, whatever its case, and nothing else", () => {
    expect(playerName("mpv.exe")).toBe("mpv");
    expect(playerName("PotPlayerMini64.EXE")).toBe("PotPlayerMini64");
    expect(playerName("mpv")).toBe("mpv");
    expect(playerName("my.exe.player")).toBe("my.exe.player");
  });
});
