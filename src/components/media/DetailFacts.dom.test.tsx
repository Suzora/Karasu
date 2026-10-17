import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MediaDetail } from "@/api/queries";
import { MetaLine, NextEpisode } from "./DetailFacts";

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

describe("MetaLine on artwork", () => {
  it("takes the artwork's light ink and gold, which hold on any banner", () => {
    const data = { averageScore: 85, format: "TV", status: "RELEASING", episodes: 14, chapters: null, volumes: null, duration: 24, seasonYear: 2026, season: "SUMMER" } as unknown as MediaDetail;
    const { container } = render(<MetaLine data={data} studios={[]} onCover />);
    expect(container.firstElementChild).toHaveClass("text-on-cover-edge/80");
    expect(screen.getByText("85%", { exact: false })).toHaveClass("text-on-cover-gold");
  });

  it("keeps the studio in the artwork's ink instead of the page's muted grey", () => {
    const data = { averageScore: null, format: "TV", status: null, episodes: null, chapters: null, volumes: null, duration: null, seasonYear: null, season: null } as unknown as MediaDetail;
    render(<MetaLine data={data} studios={["Studio Bind"]} onCover />);
    expect(screen.getByText("Studio Bind")).not.toHaveClass("text-ink-500");
  });
});
