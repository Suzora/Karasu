import { afterEach, describe, expect, it, vi } from "vitest";
import { useAiringMutes } from "@/stores/airingMutes";

const api = vi.hoisted(() => ({
  listAiringMutes: vi.fn(() => Promise.resolve([{ mediaId: 7, title: "Mushishi" }])),
  getAiringNotify: vi.fn(() => Promise.resolve(false)),
  setAiringMute: vi.fn((): Promise<null> => Promise.resolve(null)),
}));
vi.mock("@/api/anilist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/anilist")>()),
  ...api,
  isTauri: true,
}));

afterEach(() => {
  useAiringMutes.setState({ mutes: [], ids: new Set(), notify: true, error: null });
  vi.clearAllMocks();
});

describe("airing mutes store", () => {
  it("reads the mutes and the new-episode switch together", async () => {
    await useAiringMutes.getState().init();
    const s = useAiringMutes.getState();
    expect(s.mutes).toEqual([{ mediaId: 7, title: "Mushishi" }]);
    expect(s.ids.has(7)).toBe(true);
    expect(s.notify).toBe(false);
  });

  it("paints a mute first and keeps it once the write lands", async () => {
    const pending = useAiringMutes.getState().setMuted(42, "Frieren", true);
    expect(useAiringMutes.getState().ids.has(42)).toBe(true);
    await pending;
    expect(api.setAiringMute).toHaveBeenCalledWith(42, "Frieren", true);
    expect(useAiringMutes.getState().error).toBeNull();
  });

  it("undoes only its own title when the write fails, and says why", async () => {
    useAiringMutes.setState({ mutes: [{ mediaId: 7, title: "Mushishi" }], ids: new Set([7]) });
    api.setAiringMute.mockRejectedValueOnce("disk full");
    await useAiringMutes.getState().setMuted(42, "Frieren", true);
    expect(useAiringMutes.getState().mutes).toEqual([{ mediaId: 7, title: "Mushishi" }]);
    expect(useAiringMutes.getState().error).toBe("disk full");

    api.setAiringMute.mockRejectedValueOnce("disk full");
    await useAiringMutes.getState().setMuted(7, "Mushishi", false);
    expect(useAiringMutes.getState().ids.has(7)).toBe(true);
  });
});
