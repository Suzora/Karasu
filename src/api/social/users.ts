import { gql, TTL } from "../anilist";
import type { MediaType } from "../types";
import { PAGE_INFO, type PageInfo, SOCIAL_MEDIA, SOCIAL_USER, type SocialMedia, type SocialUser } from "./shared";

/** Profiles, follow lists, user search, another user's list and favourites. */

// --- Profile --------------------------------------------------------------

export interface AniListUserOptions {
  titleLanguage: string | null;
  displayAdultContent: boolean | null;
  includeAdultContentInSearch?: boolean | null;
  includeAdultContentInQuickSearch?: boolean | null;
  displayAdultActivities?: boolean | null;
  airingNotifications: boolean | null;
  profileColor: string | null;
  timezone: string | null;
  activityMergeTime: number | null;
  staffNameLanguage: string | null;
  restrictMessagesToFollowing: boolean | null;
  /** Which list statuses do NOT post an activity — `disabled: true` mutes one. */
  disabledListActivity?: { disabled: boolean | null; type: string | null }[] | null;
}

export interface AniListMediaListOptions {
  scoreFormat: string | null;
  rowOrder: string | null;
  animeList: ListTypeOptions | null;
  mangaList: ListTypeOptions | null;
}

export interface ListTypeOptions {
  customLists: string[] | null;
  /** Status sections and, once the user has ordered them, custom lists; read so a new name cannot take a section's. */
  sectionOrder?: string[] | null;
  splitCompletedSectionByFormat: boolean | null;
}

export interface UserProfileStats {
  anime: {
    count: number;
    meanScore: number;
    minutesWatched: number;
    episodesWatched: number;
  } | null;
  manga: {
    count: number;
    meanScore: number;
    chaptersRead: number;
    volumesRead: number;
  } | null;
}

export interface UserProfile {
  id: number;
  name: string;
  siteUrl: string;
  about: string | null;
  avatar: { large: string | null } | null;
  bannerImage: string | null;
  donatorTier: number | null;
  donatorBadge: string | null;
  /** Null rather than `[]` for an ordinary user — AniList really returns null. */
  moderatorRoles: string[] | null;
  createdAt: number | null;
  updatedAt: number | null;
  isFollowing: boolean | null;
  isFollower: boolean | null;
  isBlocked: boolean | null;
  previousNames: { name: string | null; updatedAt: number | null }[];
  options: AniListUserOptions | null;
  mediaListOptions: AniListMediaListOptions | null;
  statistics: UserProfileStats | null;
  favourites: {
    anime: { nodes: SocialMedia[] } | null;
    manga: { nodes: SocialMedia[] } | null;
    characters: { nodes: FavPerson[] } | null;
    staff: { nodes: FavPerson[] } | null;
    studios: { nodes: FavStudio[] } | null;
  } | null;
}

/** A favourited character or staff member — a disc and a name. */
export interface FavPerson {
  id: number;
  name: { full: string | null };
  image: { medium: string | null } | null;
}

export interface FavStudio {
  id: number;
  name: string | null;
}

/** One user by name or id; wide because it is one object, and the settings pane shares it for its options. */
export const USER_PROFILE_QUERY = `
query ($name: String, $id: Int) {
  User(name: $name, id: $id) {
    id
    name
    siteUrl
    about
    avatar { large }
    bannerImage
    donatorTier
    donatorBadge
    moderatorRoles
    createdAt
    updatedAt
    isFollowing
    isFollower
    isBlocked
    previousNames { name updatedAt }
    options {
      titleLanguage
      displayAdultContent
      includeAdultContentInSearch
      includeAdultContentInQuickSearch
      displayAdultActivities
      airingNotifications
      profileColor
      timezone
      activityMergeTime
      staffNameLanguage
      restrictMessagesToFollowing
      disabledListActivity { disabled type }
    }
    mediaListOptions {
      scoreFormat
      rowOrder
      animeList { customLists sectionOrder splitCompletedSectionByFormat }
      mangaList { customLists sectionOrder splitCompletedSectionByFormat }
    }
    statistics {
      anime { count meanScore minutesWatched episodesWatched }
      manga { count meanScore chaptersRead volumesRead }
    }
    favourites {
      anime(perPage: 12) { nodes { ${SOCIAL_MEDIA} } }
      manga(perPage: 12) { nodes { ${SOCIAL_MEDIA} } }
      characters(perPage: 12) { nodes { id name { full } image { medium } } }
      staff(perPage: 12) { nodes { id name { full } image { medium } } }
      studios(perPage: 12) { nodes { id name } }
    }
  }
}`;

export async function userProfile(
  key: { name: string } | { id: number },
): Promise<UserProfile> {
  const data = await gql<{ User: UserProfile | null }>(USER_PROFILE_QUERY, key, { source: "profile", ttlSec: 10 * TTL.minute });
  // A null `User` with no error would otherwise render a blank profile rather than the not-found state.
  if (!data.User) throw new Error("NOT_FOUND");
  return data.User;
}

/** Aliased Page roots, safe since Page cannot 404; a not-found root nulls every sibling, so User is never aliased. */
export const FOLLOW_COUNTS_QUERY = `
query ($userId: Int!) {
  followers: Page(perPage: 1) { pageInfo { total } followers(userId: $userId) { id } }
  following: Page(perPage: 1) { pageInfo { total } following(userId: $userId) { id } }
  mutual: Page(perPage: 1) { pageInfo { total } mutualFollowers(userId: $userId) { id } }
}`;

export interface FollowCounts {
  followers: number;
  following: number;
  /** People who follow this user and whom this user follows back. */
  mutual: number;
}

export async function followCounts(userId: number): Promise<FollowCounts> {
  const data = await gql<{
    followers: { pageInfo: { total: number } };
    following: { pageInfo: { total: number } };
    mutual: { pageInfo: { total: number } } | null;
  }>(FOLLOW_COUNTS_QUERY, { userId });
  return {
    followers: data.followers?.pageInfo?.total ?? 0,
    following: data.following?.pageInfo?.total ?? 0,
    mutual: data.mutual?.pageInfo?.total ?? 0,
  };
}

// --- Follower / following lists -------------------------------------------

/** `sort: USERNAME` because paging needs a total order; no `about`, since a page of bios would dwarf the rows. */
export const FOLLOWERS_QUERY = `
query ($userId: Int!, $page: Int) {
  Page(page: $page, perPage: 50) {
    ${PAGE_INFO}
    followers(userId: $userId, sort: USERNAME) { ${SOCIAL_USER} }
  }
}`;

export const FOLLOWING_QUERY = `
query ($userId: Int!, $page: Int) {
  Page(page: $page, perPage: 50) {
    ${PAGE_INFO}
    following(userId: $userId, sort: USERNAME) { ${SOCIAL_USER} }
  }
}`;

/** Who follows this user and is followed back, which AniList answers for any profile, signed in or not. */
export const MUTUAL_FOLLOWERS_QUERY = `
query ($userId: Int!, $page: Int) {
  Page(page: $page, perPage: 50) {
    ${PAGE_INFO}
    mutualFollowers(userId: $userId, sort: USERNAME) { ${SOCIAL_USER} }
  }
}`;

export interface UserPage {
  pageInfo: PageInfo;
  users: SocialUser[];
}

export async function followers(userId: number, page = 1): Promise<UserPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; followers: SocialUser[] } }>(
    FOLLOWERS_QUERY,
    { userId, page },
  );
  return { pageInfo: data.Page.pageInfo, users: data.Page.followers ?? [] };
}

export async function following(userId: number, page = 1): Promise<UserPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; following: SocialUser[] } }>(
    FOLLOWING_QUERY,
    { userId, page },
  );
  return { pageInfo: data.Page.pageInfo, users: data.Page.following ?? [] };
}

export async function mutualFollowers(userId: number, page = 1): Promise<UserPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; mutualFollowers: SocialUser[] } }>(
    MUTUAL_FOLLOWERS_QUERY,
    { userId, page },
  );
  return { pageInfo: data.Page.pageInfo, users: data.Page.mutualFollowers ?? [] };
}

// --- User search ----------------------------------------------------------

/** Search users by name; below `USER_SEARCH_MIN` the answer is filler, and `total` is a capped sentinel. */
export const USER_SEARCH_QUERY = `
query ($search: String!, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    users(search: $search, sort: SEARCH_MATCH) { ${SOCIAL_USER} }
  }
}`;

export async function searchUsers(search: string, page = 1): Promise<UserPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; users: SocialUser[] } }>(
    USER_SEARCH_QUERY,
    { search, page },
  );
  return { pageInfo: data.Page.pageInfo, users: data.Page.users ?? [] };
}

/** The shortest query this endpoint answers usefully. See `USER_SEARCH_QUERY`. */
export const USER_SEARCH_MIN = 3;

/** Three more searchable entities, lean like `USER_SEARCH_QUERY`; `USER_SEARCH_MIN` gates them too. */
export const CHARACTER_SEARCH_QUERY = `
query ($search: String!, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    characters(search: $search, sort: SEARCH_MATCH) {
      id name { full } image { medium }
    }
  }
}`;

export const STAFF_SEARCH_QUERY = `
query ($search: String!, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    staff(search: $search, sort: SEARCH_MATCH) {
      id name { full } image { medium }
    }
  }
}`;

export const STUDIO_SEARCH_QUERY = `
query ($search: String!, $page: Int) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    studios(search: $search, sort: SEARCH_MATCH) { id name }
  }
}`;

/** What a browse card or row draws of a character or a staff member; `favourites` is the count it is ranked by. */
export const BROWSE_PERSON = "id name { full } image { medium } favourites";

/** Birthdays and favourites for characters and staff in one request, so switching between the two scopes costs nothing. */
export const PEOPLE_BROWSE_QUERY = `
query ($perPage: Int) {
  characterBirthdays: Page(perPage: $perPage) {
    characters(isBirthday: true, sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
  characterFavourites: Page(perPage: $perPage) {
    characters(sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
  staffBirthdays: Page(perPage: $perPage) {
    staff(isBirthday: true, sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
  staffFavourites: Page(perPage: $perPage) {
    staff(sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
}`;

/** One page of a people section's "Show all"; an absent `isBirthday` is no filter, where `false` would drop today's. */
export const CHARACTER_BROWSE_PAGE_QUERY = `
query ($page: Int, $isBirthday: Boolean) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    characters(isBirthday: $isBirthday, sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
}`;

export const STAFF_BROWSE_PAGE_QUERY = `
query ($page: Int, $isBirthday: Boolean) {
  Page(page: $page, perPage: 25) {
    ${PAGE_INFO}
    staff(isBirthday: $isBirthday, sort: FAVOURITES_DESC) { ${BROWSE_PERSON} }
  }
}`;

/** A character or staff hit — just enough to draw a row and link the page. */
export interface PersonHit {
  id: number;
  name: { full: string | null } | null;
  image: { medium: string | null } | null;
}

/** A browse card's person: a search hit plus the favourites count the sections rank by. */
export interface BrowsePerson extends PersonHit {
  favourites: number | null;
}

export type BrowsePeoplePage = { characters?: BrowsePerson[] | null; staff?: BrowsePerson[] | null } | null;

/** The people browse answer, one page per section under the section's own key. */
export interface PeopleBrowse {
  characterBirthdays: BrowsePeoplePage;
  characterFavourites: BrowsePeoplePage;
  staffBirthdays: BrowsePeoplePage;
  staffFavourites: BrowsePeoplePage;
}

/** `day` is declared nowhere in the query: it only keys the cached answer, so a day's birthdays end with the day. */
export async function browsePeople(day: string): Promise<PeopleBrowse> {
  return gql<PeopleBrowse>(PEOPLE_BROWSE_QUERY, { perPage: 20, day }, { source: "browsePeople", ttlSec: TTL.hour });
}

export interface BrowsePeoplePageResult {
  pageInfo: PageInfo;
  rows: BrowsePerson[];
}

/** A people section's "Show all", a page at a time; uncached like every search. */
export async function browsePeoplePage(
  kind: "character" | "staff",
  list: "birthdays" | "favourites",
  page: number,
): Promise<BrowsePeoplePageResult> {
  const data = await gql<{ Page: { pageInfo: PageInfo; characters?: BrowsePerson[] | null; staff?: BrowsePerson[] | null } }>(
    kind === "character" ? CHARACTER_BROWSE_PAGE_QUERY : STAFF_BROWSE_PAGE_QUERY,
    { page, isBirthday: list === "birthdays" ? true : undefined },
    { source: "search" },
  );
  return { pageInfo: data.Page.pageInfo, rows: (kind === "character" ? data.Page.characters : data.Page.staff) ?? [] };
}

export interface StudioHit {
  id: number;
  name: string;
}

export interface PersonSearchPage {
  pageInfo: PageInfo;
  rows: PersonHit[];
}

export interface StudioSearchPage {
  pageInfo: PageInfo;
  rows: StudioHit[];
}

export async function searchCharacters(
  term: string,
  page: number,
): Promise<PersonSearchPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; characters: PersonHit[] | null } }>(
    CHARACTER_SEARCH_QUERY,
    { search: term, page },
  );
  return { pageInfo: data.Page.pageInfo, rows: data.Page.characters ?? [] };
}

export async function searchStaff(
  term: string,
  page: number,
): Promise<PersonSearchPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; staff: PersonHit[] | null } }>(
    STAFF_SEARCH_QUERY,
    { search: term, page },
  );
  return { pageInfo: data.Page.pageInfo, rows: data.Page.staff ?? [] };
}

export async function searchStudios(
  term: string,
  page: number,
): Promise<StudioSearchPage> {
  const data = await gql<{ Page: { pageInfo: PageInfo; studios: StudioHit[] | null } }>(
    STUDIO_SEARCH_QUERY,
    { search: term, page },
  );
  return { pageInfo: data.Page.pageInfo, rows: data.Page.studios ?? [] };
}

// --- Another user's list ---------------------------------------------------

/** A foreign list, read-only; never `fetchMediaList`, whose cache write and queue drain are for your own list. */
export const USER_LIST_QUERY = `
query ($userId: Int!, $type: MediaType!) {
  MediaListCollection(userId: $userId, type: $type) {
    lists {
      name
      status
      isCustomList
      entries {
        id
        mediaId
        status
        score
        progress
        progressVolumes
        media {
          ${SOCIAL_MEDIA}
          episodes
          chapters
        }
      }
    }
  }
}`;

export interface ForeignListEntry {
  id: number;
  mediaId: number;
  status: string;
  /** In the *owner's* score format. */
  score: number;
  progress: number;
  progressVolumes: number | null;
  media: SocialMedia & { episodes: number | null; chapters: number | null };
}

export interface ForeignListGroup {
  name: string;
  status: string | null;
  isCustomList: boolean;
  entries: ForeignListEntry[];
}

export async function userList(
  userId: number,
  type: "ANIME" | "MANGA",
): Promise<ForeignListGroup[]> {
  const data = await gql<{
    MediaListCollection: { lists: ForeignListGroup[] | null } | null;
  }>(USER_LIST_QUERY, { userId, type }, { source: "userList" });
  return data.MediaListCollection?.lists ?? [];
}

/** The Lists and Compare tabs' one definition, so the request they share behaves the same whichever tab started it. */
export const userListQuery = (userId: number, type: MediaType) => ({
  queryKey: ["social", "userList", userId, type] as const,
  queryFn: () => userList(userId, type),
  staleTime: 10 * 60 * 1000,
});

// --- Favourites -----------------------------------------------------------

/** Toggle a favourite, one id per call; the caller patches its own cache from success, not from the response. */
export const TOGGLE_FAVOURITE_MUTATION = `
mutation ($animeId: Int, $mangaId: Int, $characterId: Int, $staffId: Int, $studioId: Int) {
  ToggleFavourite(
    animeId: $animeId
    mangaId: $mangaId
    characterId: $characterId
    staffId: $staffId
    studioId: $studioId
  ) {
    anime { pageInfo { total } }
  }
}`;

export type FavouriteKind = "anime" | "manga" | "character" | "staff" | "studio";

export const FAV_ARG: Record<FavouriteKind, string> = {
  anime: "animeId",
  manga: "mangaId",
  character: "characterId",
  staff: "staffId",
  studio: "studioId",
};

export async function toggleFavourite(kind: FavouriteKind, id: number): Promise<void> {
  await gql<unknown>(TOGGLE_FAVOURITE_MUTATION, { [FAV_ARG[kind]]: id });
}

/** Every favourite of every kind, all five connections on one page counter, so the common case is one request. */
export const FAVOURITES_PAGE_QUERY = `
query ($id: Int!, $page: Int) {
  User(id: $id) {
    favourites {
      anime(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { ${SOCIAL_MEDIA} }
      }
      manga(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { ${SOCIAL_MEDIA} }
      }
      characters(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { id name { full } image { medium } }
      }
      staff(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { id name { full } image { medium } }
      }
      studios(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { id name }
      }
    }
  }
}`;

export const FAVOURITES_MAX_PAGES = 8;

export interface AllFavourites {
  anime: SocialMedia[];
  manga: SocialMedia[];
  characters: FavPerson[];
  staff: FavPerson[];
  studios: FavStudio[];
  /** True when a kind still had pages at the cap — reordering must refuse. */
  truncated: boolean;
}

export interface FavPage<T> {
  pageInfo: { hasNextPage: boolean };
  nodes: T[];
}

export async function allFavourites(userId: number): Promise<AllFavourites> {
  const out: AllFavourites = {
    anime: [],
    manga: [],
    characters: [],
    staff: [],
    studios: [],
    truncated: false,
  };
  for (let page = 1; page <= FAVOURITES_MAX_PAGES; page++) {
    const data = await gql<{
      User: {
        favourites: {
          anime: FavPage<SocialMedia> | null;
          manga: FavPage<SocialMedia> | null;
          characters: FavPage<FavPerson> | null;
          staff: FavPage<FavPerson> | null;
          studios: FavPage<FavStudio> | null;
        } | null;
      } | null;
    }>(FAVOURITES_PAGE_QUERY, { id: userId, page }, { source: "favouritesAll" });
    const fav = data.User?.favourites;
    if (!fav) break;
    out.anime.push(...(fav.anime?.nodes ?? []));
    out.manga.push(...(fav.manga?.nodes ?? []));
    out.characters.push(...(fav.characters?.nodes ?? []));
    out.staff.push(...(fav.staff?.nodes ?? []));
    out.studios.push(...(fav.studios?.nodes ?? []));
    const more =
      fav.anime?.pageInfo.hasNextPage ||
      fav.manga?.pageInfo.hasNextPage ||
      fav.characters?.pageInfo.hasNextPage ||
      fav.staff?.pageInfo.hasNextPage ||
      fav.studios?.pageInfo.hasNextPage;
    if (!more) return out;
  }
  out.truncated = true;
  return out;
}

/** Favourite people and their birthdays for the dashboard digest; a truncated read only shortens a greeting. */
export const BIRTHDAYS_QUERY = `
query ($id: Int!, $page: Int) {
  User(id: $id) {
    favourites {
      characters(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { id name { full } image { medium } dateOfBirth { month day } }
      }
      staff(page: $page, perPage: 25) {
        pageInfo { hasNextPage }
        nodes { id name { full } image { medium } dateOfBirth { month day } }
      }
    }
  }
}`;

export interface BirthdayPerson extends FavPerson {
  dateOfBirth: { month: number | null; day: number | null } | null;
  kind: "character" | "staff";
}

export async function favouriteBirthdays(userId: number): Promise<BirthdayPerson[]> {
  type Node = FavPerson & { dateOfBirth: BirthdayPerson["dateOfBirth"] };
  const out: BirthdayPerson[] = [];
  for (let page = 1; page <= FAVOURITES_MAX_PAGES; page++) {
    const data = await gql<{
      User: {
        favourites: {
          characters: FavPage<Node> | null;
          staff: FavPage<Node> | null;
        } | null;
      } | null;
    }>(BIRTHDAYS_QUERY, { id: userId, page }, { source: "birthdays", ttlSec: TTL.day });
    const fav = data.User?.favourites;
    if (!fav) break;
    out.push(...(fav.characters?.nodes ?? []).map((n) => ({ ...n, kind: "character" as const })));
    out.push(...(fav.staff?.nodes ?? []).map((n) => ({ ...n, kind: "staff" as const })));
    if (!(fav.characters?.pageInfo.hasNextPage || fav.staff?.pageInfo.hasNextPage)) break;
  }
  return out;
}

/** Reorder one kind's favourites; a whole-set replace, so the caller always sends every id from a fresh read. */
export const UPDATE_FAVOURITE_ORDER_MUTATION = `
mutation (
  $animeIds: [Int]
  $animeOrder: [Int]
  $mangaIds: [Int]
  $mangaOrder: [Int]
  $characterIds: [Int]
  $characterOrder: [Int]
  $staffIds: [Int]
  $staffOrder: [Int]
  $studioIds: [Int]
  $studioOrder: [Int]
) {
  UpdateFavouriteOrder(
    animeIds: $animeIds
    animeOrder: $animeOrder
    mangaIds: $mangaIds
    mangaOrder: $mangaOrder
    characterIds: $characterIds
    characterOrder: $characterOrder
    staffIds: $staffIds
    staffOrder: $staffOrder
    studioIds: $studioIds
    studioOrder: $studioOrder
  ) {
    anime { pageInfo { total } }
  }
}`;

export async function updateFavouriteOrder(
  vars: Record<string, number[]>,
): Promise<void> {
  await gql<unknown>(UPDATE_FAVOURITE_ORDER_MUTATION, vars);
}
