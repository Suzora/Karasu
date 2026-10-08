import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LocalEntryRow } from "@/api/anilist";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { listResult, media } from "@/test/fixtures";
import { checkA11y } from "@/test/a11y";

const api = vi.hoisted(() => ({ list: vi.fn() }));

const row: LocalEntryRow = {
  mediaId: 1,
  mediaType: "ANIME",
  status: "CURRENT",
  progress: 3,
  progressVolumes: 0,
  score: 0,
  repeat: 0,
  notes: "",
  private: false,
  startedAt: null,
  completedAt: null,
  updatedAt: 0,
  media: media(),
};

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  localAllEntries: () => Promise.resolve([row]),
  anilistFetchList: (...args: unknown[]) => api.list(...args),
}));

import SignInMerge from "./SignInMerge";

afterEach(signOut);

/** The merge offered at sign-in: a read that failed can be asked again, and the choice is a real radio group. */
describe("SignInMerge", () => {
  it("asks AniList again on Retry after a failed read, then offers the strategies as radios", async () => {
    const user = userEvent.setup({ delay: null });
    api.list.mockRejectedValueOnce("Network error: refused").mockResolvedValue(listResult([]));
    signIn();
    const { baseElement } = renderWithProviders(<SignInMerge />);
    expect(await screen.findByText("merge.blocked")).toBeInTheDocument();
    expect(screen.getByText("merge.laterHint")).toBeInTheDocument();
    expect(await checkA11y(baseElement)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "common.retry" }));
    expect(await screen.findByRole("button", { name: "merge.run" })).toBeInTheDocument();
    expect(screen.queryByText("merge.blocked")).toBeNull();
    expect(await checkA11y(baseElement)).toHaveNoViolations();
  });
});
