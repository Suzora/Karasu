import { afterEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import type { MutationResult } from "@/api/types";
import { entry, listResult, media } from "@/test/fixtures";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { forgetAllTold, toldEntry } from "@/lib/sessionEntries";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
  saveListEntry: vi.fn(() =>
    Promise.resolve<MutationResult>({
      queued: false,
      entry: { id: 90, mediaId: 7, status: "PLANNING", progress: 0, score: 0, repeat: 0, notes: null, updatedAt: 0 },
    }),
  ),
  deleteListEntry: vi.fn(() => Promise.resolve<MutationResult>({ queued: false, entry: null })),
}));

import { useListMutations } from "./useListMutations";

const probe: { hook?: ReturnType<typeof useListMutations> } = {};
function Probe({ userId }: { userId: number }) {
  probe.hook = useListMutations(userId, "ANIME");
  return null;
}

afterEach(() => {
  signOut();
  forgetAllTold();
});

/** The discovery cards read the list, so what the list cannot show after a write has to be said to them. */
describe("useListMutations tells the discovery cards", () => {
  it("that a removed title is gone, since a search response still names it as listed", async () => {
    const viewer = signIn();
    const { queryClient } = renderWithProviders(<Probe userId={viewer.id} />);
    queryClient.setQueryData(["mediaList", "ANIME", viewer.id], listResult([entry({ id: 40, media: media({ id: 21 }) })]));

    act(() => probe.hook!.remove.mutate(40));

    await waitFor(() => expect(toldEntry(viewer.id, 21)).toBeNull());
  });

  it("that a first add the list cannot hold yet is on the list, with the entry AniList answered", async () => {
    const viewer = signIn();
    const { queryClient } = renderWithProviders(<Probe userId={viewer.id} />);
    queryClient.setQueryData(["mediaList", "ANIME", viewer.id], listResult([entry({ id: 40, media: media({ id: 21 }) })]));

    act(() => probe.hook!.save.mutate({ mediaId: 7, status: "PLANNING" }));

    await waitFor(() => expect(toldEntry(viewer.id, 7)).toMatchObject({ id: 90, status: "PLANNING" }));
  });

  it("nothing about an edit of a listed title, which the list itself now shows", async () => {
    const viewer = signIn();
    const { queryClient } = renderWithProviders(<Probe userId={viewer.id} />);
    queryClient.setQueryData(["mediaList", "ANIME", viewer.id], listResult([entry({ id: 40, media: media({ id: 21 }) })]));

    act(() => probe.hook!.save.mutate({ mediaId: 21, progress: 4 }));

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(toldEntry(viewer.id, 21)).toBeUndefined();
  });
});
