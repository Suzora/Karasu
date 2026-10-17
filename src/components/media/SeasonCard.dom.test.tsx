import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MediaWithListStatus } from "@/api/queries";
import { renderWithProviders, signOut, useLocalProfile } from "@/test/render";
import { forgetAllTold } from "@/lib/sessionEntries";

vi.mock("@/api/anilist", async (orig) => {
  const actual = await orig<typeof import("@/api/anilist")>();
  return { ...actual, isTauri: true, saveListEntry: vi.fn(() => Promise.resolve({ queued: false, entry: null })) };
});

import { saveListEntry } from "@/api/anilist";
import SeasonCard from "./SeasonCard";

const NOW = Math.floor(Date.now() / 1000);
const media = (over: Partial<MediaWithListStatus> = {}) =>
  ({
    id: 7,
    type: "ANIME",
    title: { romaji: "Frieren", english: null, native: null },
    coverImage: { large: null },
    format: "TV",
    episodes: 12,
    status: "RELEASING",
    genres: ["Adventure", "Drama", "Fantasy", "Slice of Life"],
    isAdult: false,
    averageScore: 88,
    nextAiringEpisode: { episode: 5, airingAt: NOW + 2 * 86400 },
    mediaListEntry: null,
    ...over,
  }) as unknown as MediaWithListStatus;

beforeEach(useLocalProfile);
afterEach(() => {
  signOut();
  forgetAllTold();
});

/** The season page's broadcast card: what a title is, when its next episode airs, and the one-press plan. */
describe("SeasonCard", () => {
  it("names the title as a link with its format, episodes, score and at most three genres", () => {
    renderWithProviders(<SeasonCard media={media()} />);
    expect(screen.getByRole("link", { name: /Frieren/ })).toHaveAttribute("href", "/media/7");
    expect(screen.getByText(/seasonal\.episodes/)).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("Fantasy")).toBeInTheDocument();
    expect(screen.queryByText("Slice of Life")).toBeNull();
  });

  it("counts down to the next episode, and names the airing state when none is planned", () => {
    const { unmount } = renderWithProviders(<SeasonCard media={media()} />);
    expect(screen.getByText(/seasonal\.nextEpisode.*"n":5/)).toBeInTheDocument();
    unmount();
    renderWithProviders(<SeasonCard media={media({ nextAiringEpisode: null, status: "FINISHED" })} />);
    expect(screen.getByText("mediaStatus.FINISHED")).toBeInTheDocument();
  });

  it("adds an unlisted title in the default status with one press", async () => {
    renderWithProviders(<SeasonCard media={media()} />);
    await userEvent.setup({ delay: null }).click(screen.getByRole("button", { name: "media.addDefault" }));
    expect(saveListEntry).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 7, status: "PLANNING" }), expect.anything());
  });

  it("shows a listed title's status as the way into its editor instead of the add", () => {
    renderWithProviders(<SeasonCard media={media({ mediaListEntry: { id: 1, status: "CURRENT", progress: 2, score: 0, repeat: 0, notes: null } })} />);
    expect(screen.queryByRole("button", { name: "media.addDefault" })).toBeNull();
    expect(screen.getByRole("button", { name: /common\.edit/ })).toHaveTextContent("status.ANIME.CURRENT");
  });

  it("carries the identity the action host reads, and draws the roving ring", () => {
    const { container } = renderWithProviders(<SeasonCard media={media()} focused />);
    const card = container.querySelector("[data-media-id]");
    expect(card).toHaveAttribute("data-media-id", "7");
    expect(card).toHaveAttribute("data-media-type", "ANIME");
    expect(card).toHaveClass("ring-2");
  });
});
