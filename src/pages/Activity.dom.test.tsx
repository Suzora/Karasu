import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { renderWithProviders } from "@/test/render";

const answer = vi.hoisted(() => ({ next: (): Promise<unknown> => Promise.resolve(null) }));

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  singleActivity: vi.fn(() => answer.next()),
}));

import Activity from "./Activity";

const mount = () =>
  renderWithProviders(
    <Routes>
      <Route path="/activity/:id" element={<Activity />} />
    </Routes>,
    { route: "/activity/5001" },
  );

afterEach(() => {
  answer.next = () => Promise.resolve(null);
});

/** A failure to ask is not an answer: only AniList saying the activity is not there may read as "gone". */
describe("Activity", () => {
  it("offers Retry when the request failed, and never calls the activity gone", async () => {
    answer.next = () => Promise.reject("anilist.rateLimited");
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent('common.error:{"message":"common.rateLimited"}');
    expect(screen.getByRole("button", { name: "common.retry" })).toBeInTheDocument();
    expect(screen.queryByText("social.activityGone")).toBeNull();
  });

  it("calls it gone when AniList answers that it is not there", async () => {
    answer.next = () => Promise.reject("Not Found.");
    mount();
    expect(await screen.findByText("social.activityGone")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
