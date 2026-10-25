import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { AniListUserOptions, UserProfile } from "@/api/social";
import { renderWithProviders, signIn, signOut } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const profile = vi.fn<() => Promise<UserProfile>>();
vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  userProfile: () => profile(),
}));

import { AniListProfileSection } from "./AniListPane";

const withOptions = (options: Partial<AniListUserOptions>) =>
  ({
    id: 1,
    name: "Viewer",
    donatorTier: 0,
    options: {
      titleLanguage: "ROMAJI",
      displayAdultContent: false,
      airingNotifications: false,
      profileColor: "blue",
      timezone: null,
      activityMergeTime: 0,
      staffNameLanguage: "ROMAJI",
      restrictMessagesToFollowing: false,
      ...options,
    },
    mediaListOptions: { scoreFormat: "POINT_10", rowOrder: "score" },
  }) as unknown as UserProfile;

const SUBS = ["settings.alAdultSearch", "settings.alAdultQuickSearch", "settings.alAdultActivities"];

afterEach(() => signOut());

/** AniList's three adult sub-options only mean something while adult content is on, so they stand down without it. */
describe("the adult sub-options", () => {
  it("are switched off and disabled while adult content is off", async () => {
    signIn();
    profile.mockResolvedValue(withOptions({ displayAdultContent: false, includeAdultContentInSearch: true }));
    renderWithProviders(<AniListProfileSection />);
    for (const name of SUBS) expect(await screen.findByRole("switch", { name: new RegExp(name) })).toBeDisabled();
  });

  it("read the account's answer once adult content is on", async () => {
    signIn();
    profile.mockResolvedValue(
      withOptions({ displayAdultContent: true, includeAdultContentInSearch: true, displayAdultActivities: false }),
    );
    renderWithProviders(<AniListProfileSection />);
    const search = await screen.findByRole("switch", { name: /settings\.alAdultSearch/ });
    expect(search).toBeEnabled();
    expect(search).toBeChecked();
    expect(screen.getByRole("switch", { name: /settings\.alAdultActivities/ })).not.toBeChecked();
  });
});
