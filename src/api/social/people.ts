import { gql, TTL } from "../anilist";
import { SOCIAL_MEDIA, type SocialMedia } from "./shared";

/** Characters, staff and studios. */

// --- People and studios ---------------------------------------------------

/** Characters, staff and studios; a studio's media edge is `isMainStudio`, not the `isMain` of `StudioEdge`. */

export interface PersonMediaEdge {
  node: SocialMedia;
  characterRole?: string | null;
  staffRole?: string | null;
  isMainStudio?: boolean | null;
  voiceActors?: { id: number; name: { full: string | null }; image: { medium: string | null } | null }[] | null;
}

export interface CharacterDetail {
  id: number;
  name: { full: string | null; native: string | null; alternative: string[] | null };
  image: { large: string | null } | null;
  description: string | null;
  gender: string | null;
  age: string | null;
  bloodType: string | null;
  dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
  favourites: number | null;
  siteUrl: string | null;
  isFavourite: boolean | null;
  isFavouriteBlocked: boolean | null;
  media: { edges: PersonMediaEdge[] } | null;
}

/** `asHtml: false` on purpose: the description is markdown, rendered by `lib/anilistMarkdown` like a bio. */
export const CHARACTER_QUERY = `
query ($id: Int!) {
  Character(id: $id) {
    id
    name { full native alternative }
    image { large }
    description(asHtml: false)
    gender age bloodType
    dateOfBirth { year month day }
    favourites siteUrl isFavourite isFavouriteBlocked
    media(sort: POPULARITY_DESC, perPage: 24) {
      edges {
        characterRole
        voiceActors(language: JAPANESE) { id name { full } image { medium } }
        node { ${SOCIAL_MEDIA} }
      }
    }
  }
}`;

export async function character(id: number): Promise<CharacterDetail> {
  const data = await gql<{ Character: CharacterDetail | null }>(CHARACTER_QUERY, { id }, { source: "person", ttlSec: TTL.day });
  if (!data.Character) throw new Error("NOT_FOUND");
  return data.Character;
}

export interface StaffDetail {
  id: number;
  name: { full: string | null; native: string | null };
  image: { large: string | null } | null;
  description: string | null;
  primaryOccupations: string[] | null;
  gender: string | null;
  age: number | null;
  homeTown: string | null;
  yearsActive: number[] | null;
  languageV2: string | null;
  dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
  dateOfDeath: { year: number | null; month: number | null; day: number | null } | null;
  favourites: number | null;
  siteUrl: string | null;
  isFavourite: boolean | null;
  isFavouriteBlocked: boolean | null;
  staffMedia: { edges: PersonMediaEdge[] } | null;
  characters: {
    nodes: { id: number; name: { full: string | null }; image: { medium: string | null } | null }[];
  } | null;
}

export const STAFF_QUERY = `
query ($id: Int!) {
  Staff(id: $id) {
    id
    name { full native }
    image { large }
    description(asHtml: false)
    primaryOccupations gender age homeTown yearsActive languageV2
    dateOfBirth { year month day }
    dateOfDeath { year month day }
    favourites siteUrl isFavourite isFavouriteBlocked
    staffMedia(sort: POPULARITY_DESC, perPage: 24) {
      edges { staffRole node { ${SOCIAL_MEDIA} } }
    }
    characters(sort: FAVOURITES_DESC, perPage: 12) {
      nodes { id name { full } image { medium } }
    }
  }
}`;

export async function staff(id: number): Promise<StaffDetail> {
  const data = await gql<{ Staff: StaffDetail | null }>(STAFF_QUERY, { id }, { source: "person", ttlSec: TTL.day });
  if (!data.Staff) throw new Error("NOT_FOUND");
  return data.Staff;
}

/** One voice role: the title, the character voiced and the role's weight; the title's start year is what groups them. */
export interface StaffRoleEdge {
  id: number;
  characterRole: string | null;
  characterName: string | null;
  node: (SocialMedia & { startDate: { year: number | null } | null }) | null;
  characters: { id: number; name: { full: string | null }; image: { medium: string | null } | null }[] | null;
}

/** One page of a person page's year list; `total` is never asked for, since the connections' is not a count. */
export interface YearPage<E> {
  pageInfo: { currentPage: number; hasNextPage: boolean };
  edges: E[];
}

export type StaffRolesPage = YearPage<StaffRoleEdge>;

/** Newest title first, an undated one ahead of all; the page is AniList's cap for this connection, `total` no count. */
export const STAFF_ROLES_QUERY = `
query ($id: Int!, $page: Int!) {
  Staff(id: $id) {
    characterMedia(sort: START_DATE_DESC, page: $page, perPage: 25) {
      pageInfo { currentPage hasNextPage }
      edges {
        id characterRole characterName
        node { ${SOCIAL_MEDIA} startDate { year } }
        characters { id name { full } image { medium } }
      }
    }
  }
}`;

/** One page of a voice actor's roles; a staff member AniList does not know answers an empty last page. */
export async function staffRoles(id: number, page: number): Promise<StaffRolesPage> {
  const data = await gql<{ Staff: { characterMedia: StaffRolesPage | null } | null }>(
    STAFF_ROLES_QUERY,
    { id, page },
    { source: "staffRoles", ttlSec: TTL.day },
  );
  return data.Staff?.characterMedia ?? { pageInfo: { currentPage: page, hasNextPage: false }, edges: [] };
}

/** A title on a character's or a studio's page: the role's weight and the Japanese voice, or the studio's part. */
export interface MediaYearEdge {
  id: number;
  characterRole?: string | null;
  isMainStudio?: boolean | null;
  voiceActors?: { id: number; name: { full: string | null }; image: { medium: string | null } | null }[] | null;
  node: (SocialMedia & { startDate: { year: number | null } | null }) | null;
}

export type MediaYearPage = YearPage<MediaYearEdge>;

/** A character's appearances, newest title first, with the Japanese voice for the face on the card. */
export const CHARACTER_MEDIA_QUERY = `
query ($id: Int!, $page: Int!) {
  Character(id: $id) {
    media(sort: START_DATE_DESC, page: $page, perPage: 25) {
      pageInfo { currentPage hasNextPage }
      edges {
        id characterRole
        voiceActors(language: JAPANESE) { id name { full } image { medium } }
        node { ${SOCIAL_MEDIA} startDate { year } }
      }
    }
  }
}`;

export async function characterMedia(id: number, page: number): Promise<MediaYearPage> {
  const data = await gql<{ Character: { media: MediaYearPage | null } | null }>(
    CHARACTER_MEDIA_QUERY,
    { id, page },
    { source: "characterMedia", ttlSec: TTL.day },
  );
  return data.Character?.media ?? { pageInfo: { currentPage: page, hasNextPage: false }, edges: [] };
}

/** A studio's productions, newest title first, each saying whether the studio was the main one. */
export const STUDIO_MEDIA_QUERY = `
query ($id: Int!, $page: Int!) {
  Studio(id: $id) {
    media(sort: START_DATE_DESC, page: $page, perPage: 25) {
      pageInfo { currentPage hasNextPage }
      edges {
        id isMainStudio
        node { ${SOCIAL_MEDIA} startDate { year } }
      }
    }
  }
}`;

export async function studioMedia(id: number, page: number): Promise<MediaYearPage> {
  const data = await gql<{ Studio: { media: MediaYearPage | null } | null }>(
    STUDIO_MEDIA_QUERY,
    { id, page },
    { source: "studioMedia", ttlSec: TTL.day },
  );
  return data.Studio?.media ?? { pageInfo: { currentPage: page, hasNextPage: false }, edges: [] };
}

/** The studio's facts alone; its productions come by year through `studioMedia`. */
export interface StudioDetail {
  id: number;
  name: string | null;
  isAnimationStudio: boolean | null;
  favourites: number | null;
  siteUrl: string | null;
  isFavourite: boolean | null;
}

export const STUDIO_QUERY = `
query ($id: Int!) {
  Studio(id: $id) {
    id name isAnimationStudio favourites siteUrl isFavourite
  }
}`;

export async function studio(id: number): Promise<StudioDetail> {
  const data = await gql<{ Studio: StudioDetail | null }>(STUDIO_QUERY, { id }, { source: "person", ttlSec: TTL.day });
  if (!data.Studio) throw new Error("NOT_FOUND");
  return data.Studio;
}
