import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { entry, listResult, media } from "@/test/fixtures";
import { renderWithProviders, signIn, signOut } from "@/test/render";

const done = entry({ status: "COMPLETED", completedAt: { year: 2026, month: 3, day: 1 }, media: media({ seasonYear: 2026, season: "WINTER" }) });
vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  fetchMediaList: () => Promise.resolve(listResult([done])),
}));

import Wrapped from "./Wrapped";

afterEach(signOut);

/** Wrapped's column: Save first, then the period and the export choices, each a pressed button. */
describe("Wrapped's column", () => {
  it("puts Save at the top of the column and the template choices as pressed buttons", async () => {
    signIn();
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Wrapped />, { route: "/wrapped" });
    const column = await screen.findByRole("complementary");
    const buttons = within(column).getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("wrapped.save");
    expect(await within(column).findByRole("button", { name: "wrapped.presetPage" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(column).getByRole("button", { name: "wrapped.presetSquare" }));
    expect(within(column).getByRole("button", { name: "wrapped.presetSquare" })).toHaveAttribute("aria-pressed", "true");
  });
});
