import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ListResult, MutationResult, Viewer } from "@/api/types";
import type { ListEntryStub, MediaWithListStatus } from "@/api/queries";
import { renderWithProviders, signIn, signOut, useLocalProfile } from "@/test/render";
import { entry as listEntry, listResult, media as baseMedia } from "@/test/fixtures";
import { forgetAllTold, noteRemoved } from "@/lib/sessionEntries";

/** Proves the card resolves its entry from the local list, since AniList reports null for every title without a token. */
vi.mock("@/api/anilist", async (orig) => {
  const actual = await orig<typeof import("@/api/anilist")>();
  return {
    ...actual,
    isTauri: true,
    // Spied so a test can prove the card never fetches with an account; the local profile still reaches the real one.
    fetchMediaList: vi.fn(actual.fetchMediaList),
    saveListEntry: vi.fn(() => Promise.resolve({ queued: false, entry: null })),
  };
});

import { fetchMediaList, saveListEntry } from "@/api/anilist";
import MediaCard from "./MediaCard";

const media = (over: Partial<MediaWithListStatus> = {}) =>
  ({
    id: 21,
    type: "ANIME",
    title: { romaji: "One Piece", english: null, native: null },
    coverImage: { large: null },
    format: "TV",
    genres: [],
    isAdult: false,
    averageScore: null,
    // What AniList always returns in local mode, for every title.
    mediaListEntry: null,
    ...over,
  }) as unknown as MediaWithListStatus;

/** A local list that *does* hold the title, as SQLite would serve it. */
const localList = (): ListResult => ({
  fromCache: false,
  pending: 0,
  lists: [
    {
      name: "Watching",
      status: "CURRENT",
      isCustomList: false,
      entries: [
        {
          id: 500,
          mediaId: 21,
          status: "CURRENT",
          score: 9,
          progress: 87,
          progressVolumes: 0,
          repeat: 0,
          notes: "keep me",
          updatedAt: 0,
          private: false,
        },
      ],
    },
  ],
} as unknown as ListResult);

beforeEach(useLocalProfile);
afterEach(() => {
  signOut();
  forgetAllTold();
});

describe("MediaCard in the account-free profile", () => {
  it("finds the entry in the local list when AniList reports none", async () => {
    const { queryClient } = renderWithProviders(<MediaCard media={media()} />);
    // The list screens key on user 0 — the `?? 0` convention.
    queryClient.setQueryData(["mediaList", "ANIME", 0], localList());

    // The status circle, not the add-to-Planning plus: the card resolved the entry rather than believing the null.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "media.addDefault" })).toBeNull(),
    );
    expect(screen.getByTitle("status.ANIME.CURRENT")).toBeInTheDocument();
  });

  it("keeps one control on a cover too narrow for two circles: the quick add for a new title", async () => {
    const { queryClient } = renderWithProviders(<MediaCard media={media({ id: 999 })} />);
    queryClient.setQueryData(["mediaList", "ANIME", 0], localList());
    await screen.findByRole("button", { name: "media.addDefault" });
    expect(screen.getByRole("button", { name: "common.edit" })).toHaveClass("@max-cover-pair:hidden");
    expect(screen.getByRole("button", { name: "media.addDefault" })).not.toHaveClass("@max-cover-pair:hidden");
  });

  it("keeps the editor for a listed title, and lets the status badge go, since a badge is no control", async () => {
    const { queryClient } = renderWithProviders(<MediaCard media={media()} />);
    queryClient.setQueryData(["mediaList", "ANIME", 0], localList());
    const badge = await screen.findByTitle("status.ANIME.CURRENT");
    expect(badge).toHaveClass("@max-cover-pair:hidden");
    expect(screen.getByRole("button", { name: "common.edit" })).not.toHaveClass("@max-cover-pair:hidden");
  });

  /** A title genuinely absent must still offer the quick add. */
  it("still offers the quick add for a title that is not on the local list", async () => {
    const { queryClient } = renderWithProviders(
      <MediaCard media={media({ id: 999 })} />,
    );
    queryClient.setQueryData(["mediaList", "ANIME", 0], localList());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "media.addDefault" })).toBeInTheDocument(),
    );
  });
});

/** The response's stub for a title the viewer was watching when the search ran. */
const stub = (over: Partial<ListEntryStub> = {}): ListEntryStub => ({
  id: 55,
  status: "CURRENT",
  progress: 5,
  score: 0,
  repeat: 0,
  notes: null,
  ...over,
});

const frieren = (mediaListEntry: ListEntryStub | null): MediaWithListStatus => ({
  ...baseMedia({ episodes: 28 }),
  type: "ANIME",
  mediaListEntry,
});

/** The viewer's list after the title page moved the title to Completed at the last episode. */
const completedList = (): ListResult =>
  listResult([], {
    lists: [
      {
        name: "Completed",
        status: "COMPLETED",
        isCustomList: false,
        entries: [listEntry({ media: baseMedia({ episodes: 28 }), status: "COMPLETED", progress: 28 })],
      },
    ],
  });

/** A loaded list that holds some other title and not this one. */
const listWithoutIt = (over: Partial<ListResult> = {}): ListResult =>
  listResult([listEntry({ media: baseMedia({ id: 999 }) })], over);

const added: MutationResult = {
  queued: false,
  entry: { id: 77, mediaId: 1, status: "PLANNING", progress: 0, score: 0, repeat: 0, notes: null, updatedAt: 0 },
};

describe("MediaCard with an AniList account", () => {
  let viewer: Viewer;
  const listKey = () => ["mediaList", "ANIME", viewer.id];

  beforeEach(() => {
    viewer = signIn();
  });

  it("shows the list's entry over a response from before the title page's edit", async () => {
    const { queryClient } = renderWithProviders(<MediaCard media={frieren(stub())} />);
    queryClient.setQueryData(listKey(), completedList());

    expect(await screen.findByTitle("status.ANIME.COMPLETED")).toBeInTheDocument();
    expect(screen.queryByTitle("status.ANIME.CURRENT")).not.toBeInTheDocument();
    expect(fetchMediaList).not.toHaveBeenCalled();
  });

  it("saves an edit of a listed title through the list, so the stale stub is never written back", async () => {
    const user = userEvent.setup({ delay: null });
    const { queryClient } = renderWithProviders(<MediaCard media={frieren(stub())} />);
    queryClient.setQueryData(listKey(), completedList());
    await screen.findByTitle("status.ANIME.COMPLETED");

    await user.click(screen.getByRole("button", { name: "common.edit" }));
    await user.click(await screen.findByRole("button", { name: "common.save" }));

    expect(saveListEntry).toHaveBeenCalledWith(expect.objectContaining({ mediaId: 1, status: "COMPLETED", progress: 28 }));
  });

  it("keeps a title the loaded list lacks as the response says, since a hidden entry or one added elsewhere is listed", async () => {
    const { queryClient } = renderWithProviders(<MediaCard media={frieren(stub())} />);
    queryClient.setQueryData(listKey(), listWithoutIt());

    expect(await screen.findByTitle("status.ANIME.CURRENT")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "media.addDefault" })).not.toBeInTheDocument();
  });

  it("keeps the response's stub while no list is cached, and never fetches one", async () => {
    renderWithProviders(<MediaCard media={frieren(stub())} />);

    expect(await screen.findByTitle("status.ANIME.CURRENT")).toBeInTheDocument();
    expect(fetchMediaList).not.toHaveBeenCalled();
  });

  it("keeps its own add on screen, remounted too, while the list cannot hold it yet", async () => {
    vi.mocked(saveListEntry).mockResolvedValueOnce(added);
    const user = userEvent.setup({ delay: null });
    const media = frieren(null);
    const { queryClient, rerender } = renderWithProviders(<MediaCard media={media} />);
    queryClient.setQueryData(listKey(), listWithoutIt());

    await user.click(await screen.findByRole("button", { name: "media.addDefault" }));
    expect(await screen.findByTitle("status.ANIME.PLANNING")).toBeInTheDocument();

    // A new key is a new card over the same response, as Back from the title page builds one.
    rerender(<MediaCard key="back" media={media} />);
    expect(await screen.findByTitle("status.ANIME.PLANNING")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "media.addDefault" })).not.toBeInTheDocument();
    expect(fetchMediaList).not.toHaveBeenCalled();
  });

  it("follows the list once it holds the title, over its own earlier add", async () => {
    vi.mocked(saveListEntry).mockResolvedValueOnce(added);
    const user = userEvent.setup({ delay: null });
    const { queryClient } = renderWithProviders(<MediaCard media={frieren(null)} />);
    queryClient.setQueryData(listKey(), listWithoutIt());
    await user.click(await screen.findByRole("button", { name: "media.addDefault" }));
    await screen.findByTitle("status.ANIME.PLANNING");

    queryClient.setQueryData(
      listKey(),
      listResult([listEntry({ media: baseMedia({ episodes: 28 }), status: "CURRENT", progress: 3 })]),
    );
    expect(await screen.findByTitle("status.ANIME.CURRENT")).toBeInTheDocument();
  });

  it("shows a title removed in this session as not on the list, whatever the response says", async () => {
    noteRemoved(viewer.id, 1);
    const { queryClient } = renderWithProviders(<MediaCard media={frieren(stub())} />);
    queryClient.setQueryData(listKey(), listWithoutIt());

    expect(await screen.findByRole("button", { name: "media.addDefault" })).toBeInTheDocument();
    expect(screen.queryByTitle("status.ANIME.CURRENT")).not.toBeInTheDocument();
  });
});
