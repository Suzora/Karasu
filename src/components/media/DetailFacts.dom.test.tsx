import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MediaDetail } from "@/api/queries";
import { NextEpisode } from "./DetailFacts";

const airing = (inSeconds: number) =>
  ({
    type: "ANIME",
    nextAiringEpisode: { episode: 9, airingAt: Math.floor(Date.now() / 1000) + inSeconds, timeUntilAiring: inSeconds },
  }) as unknown as MediaDetail;

/** A bare "(4 h 59 min)" beside a date did not say whether it was past or to come. */
describe("NextEpisode", () => {
  it("says the countdown is still to come, in the line and in the phone's bar", () => {
    const { unmount } = render(<NextEpisode data={airing(5 * 3600)} />);
    expect(screen.getByText(/detail\.airsIn/)).toBeInTheDocument();
    unmount();
    render(<NextEpisode data={airing(5 * 3600)} bar />);
    expect(screen.getByText(/detail\.airsIn/)).toBeInTheDocument();
  });
});
