import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import type { StaffDetail, StaffRoleEdge, StaffRolesPage } from "@/api/social";
import { useContentFilter } from "@/stores/contentFilter";
import { renderWithProviders, signIn, signOut } from "@/test/render";

vi.mock("@/api/anilist", async (orig) => ({
  ...(await orig<typeof import("@/api/anilist")>()),
  isTauri: true,
}));

const detail: StaffDetail = {
  id: 500,
  name: { full: "Konomi Kohara", native: null },
  image: null,
  description: null,
  primaryOccupations: ["Voice Actor"],
  gender: null,
  age: null,
  homeTown: null,
  yearsActive: null,
  languageV2: null,
  dateOfBirth: null,
  dateOfDeath: null,
  favourites: 0,
  siteUrl: null,
  isFavourite: false,
  isFavouriteBlocked: false,
  staffMedia: { edges: [] },
  characters: { nodes: [] },
};

const role = (id: number, year: number | null, title: string, name: string, weight = "SUPPORTING"): StaffRoleEdge => ({
  id,
  characterRole: weight,
  characterName: null,
  node: {
    id: 1000 + id,
    type: "ANIME",
    title: { romaji: title, english: null, native: null },
    coverImage: { large: null },
    format: "TV",
    isAdult: false,
    genres: [],
    startDate: { year },
  } as NonNullable<StaffRoleEdge["node"]>,
  characters: [{ id: 9000 + id, name: { full: name }, image: { medium: null } }],
});

const page = (edges: StaffRoleEdge[], currentPage: number, hasNextPage: boolean): StaffRolesPage => ({
  pageInfo: { currentPage, hasNextPage },
  edges,
});

const staffRoles = vi.fn<(id: number, page: number) => Promise<StaffRolesPage>>();

vi.mock("@/api/social", async (orig) => ({
  ...(await orig<typeof import("@/api/social")>()),
  staff: () => Promise.resolve(detail),
  staffRoles: (id: number, page: number) => staffRoles(id, page),
}));

import { StaffPage } from "./Person";

function mount() {
  return renderWithProviders(
    <Routes>
      <Route path="/staff/:id" element={<StaffPage />} />
    </Routes>,
    { route: "/staff/500" },
  );
}

const rolesSection = () => screen.getByRole("heading", { name: "person.roles" }).closest("section")!;

beforeEach(() => {
  useContentFilter.setState({ level: "off", ready: true, error: null });
  signIn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  signOut();
  useContentFilter.setState({ level: "strict", ready: false, error: null });
});

describe("StaffPage roles", () => {
  it("groups the roles by year, newest first, with an undated title as upcoming", async () => {
    staffRoles.mockResolvedValueOnce(
      page([role(1, null, "Next Season", "Aki"), role(2, 2024, "Older", "Nao"), role(3, 2026, "Newer", "Mei", "MAIN")], 1, true),
    );
    mount();
    await screen.findByRole("heading", { name: "person.roles" });
    const section = rolesSection();
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["person.rolesUpcoming", "2026", "2024"]);
    for (const link of within(section).getAllByRole("link", { name: "Newer" })) expect(link).toHaveAttribute("href", "/media/1003");
    expect(within(section).getByRole("link", { name: "Mei" })).toHaveAttribute("href", "/character/9003");
    expect(within(section).getByText("format.TV · detail.roleMain")).toBeInTheDocument();
    // A page is still behind, so the header makes no count that the next request could change.
    expect(within(section).queryByText("3")).toBeNull();
    expect(staffRoles).toHaveBeenCalledTimes(1);
  });

  it("asks for the next page on a press alone, and counts once the last page is in", async () => {
    staffRoles
      .mockResolvedValueOnce(page([role(1, 2026, "First", "Aki")], 1, true))
      .mockResolvedValueOnce(page([role(2, 2025, "Second", "Nao")], 2, false));
    const user = userEvent.setup({ delay: null });
    mount();
    await screen.findByText("Aki");
    expect(staffRoles).toHaveBeenCalledTimes(1);
    expect(staffRoles).toHaveBeenCalledWith(500, 1);
    await user.click(screen.getByRole("button", { name: "social.loadMorePlain" }));
    await screen.findByText("Nao");
    expect(staffRoles).toHaveBeenLastCalledWith(500, 2);
    expect(screen.queryByRole("button", { name: "social.loadMorePlain" })).toBeNull();
    expect(within(rolesSection()).getByText("2")).toBeInTheDocument();
  });

  it("draws no section for a staff member AniList lists no roles for", async () => {
    staffRoles.mockResolvedValueOnce(page([], 1, false));
    mount();
    await screen.findByRole("heading", { name: "Konomi Kohara" });
    await waitFor(() => expect(staffRoles).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("heading", { name: "person.roles" })).toBeNull();
  });

  it("says the roles could not be loaded and offers to try again", async () => {
    staffRoles.mockRejectedValueOnce(new Error("NETWORK")).mockResolvedValueOnce(page([role(1, 2026, "First", "Aki")], 1, false));
    const user = userEvent.setup({ delay: null });
    mount();
    expect(await screen.findByText("person.rolesFailed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "common.retry" }));
    expect(await screen.findByText("Aki")).toBeInTheDocument();
    expect(screen.queryByText("person.rolesFailed")).toBeNull();
  });
});
