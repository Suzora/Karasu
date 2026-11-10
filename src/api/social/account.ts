import { gql } from "../anilist";
import { type AniListUserOptions } from "./users";

/** The account's AniList settings and its custom lists. */

// --- Account settings -----------------------------------------------------

/** `UpdateUser`; keep `animeListOptions` and `mangaListOptions` out, since `customLists` is a full replacement. */
export const UPDATE_USER_MUTATION = `
mutation (
  $about: String
  $titleLanguage: UserTitleLanguage
  $staffNameLanguage: UserStaffNameLanguage
  $scoreFormat: ScoreFormat
  $rowOrder: String
  $profileColor: String
  $timezone: String
  $activityMergeTime: Int
  $displayAdultContent: Boolean
  $includeAdultContentInSearch: Boolean
  $includeAdultContentInQuickSearch: Boolean
  $displayAdultActivities: Boolean
  $airingNotifications: Boolean
  $restrictMessagesToFollowing: Boolean
  $notificationOptions: [NotificationOptionInput]
  $donatorBadge: String
  $disabledListActivity: [ListActivityOptionInput]
) {
  UpdateUser(
    about: $about
    titleLanguage: $titleLanguage
    staffNameLanguage: $staffNameLanguage
    scoreFormat: $scoreFormat
    rowOrder: $rowOrder
    profileColor: $profileColor
    timezone: $timezone
    activityMergeTime: $activityMergeTime
    displayAdultContent: $displayAdultContent
    includeAdultContentInSearch: $includeAdultContentInSearch
    includeAdultContentInQuickSearch: $includeAdultContentInQuickSearch
    displayAdultActivities: $displayAdultActivities
    airingNotifications: $airingNotifications
    restrictMessagesToFollowing: $restrictMessagesToFollowing
    notificationOptions: $notificationOptions
    donatorBadge: $donatorBadge
    disabledListActivity: $disabledListActivity
  ) {
    id
    about
    donatorBadge
    options {
      titleLanguage displayAdultContent airingNotifications profileColor
      includeAdultContentInSearch includeAdultContentInQuickSearch displayAdultActivities
      timezone activityMergeTime staffNameLanguage restrictMessagesToFollowing
      notificationOptions { type enabled }
      disabledListActivity { disabled type }
    }
    mediaListOptions { scoreFormat rowOrder }
  }
}`;

export interface UpdatedUser {
  id: number;
  about: string | null;
  donatorBadge: string | null;
  options: (AniListUserOptions & {
    notificationOptions: { type: string | null; enabled: boolean | null }[] | null;
    disabledListActivity: { disabled: boolean | null; type: string | null }[] | null;
  }) | null;
  mediaListOptions: { scoreFormat: string | null; rowOrder: string | null } | null;
}

export async function updateUser(vars: Record<string, unknown>): Promise<UpdatedUser> {
  const data = await gql<{ UpdateUser: UpdatedUser }>(UPDATE_USER_MUTATION, vars);
  return data.UpdateUser;
}

/** The viewer's notification options, read fresh on their own key since `UpdateUser` replaces the array. */
export const NOTIFICATION_OPTIONS_QUERY = `
query ($id: Int!) {
  User(id: $id) { id options { notificationOptions { type enabled } } }
}`;

export async function notificationOptions(
  id: number,
): Promise<{ type: string | null; enabled: boolean | null }[]> {
  const data = await gql<{
    User: { options: { notificationOptions: { type: string | null; enabled: boolean | null }[] | null } | null } | null;
  }>(NOTIFICATION_OPTIONS_QUERY, { id });
  return data.User?.options?.notificationOptions ?? [];
}

// --- Custom lists ---------------------------------------------------------

export const LIST_TYPE_FIELDS = "customLists sectionOrder splitCompletedSectionByFormat advancedScoring advancedScoringEnabled";

/** One list type's options as a custom-list write reads and checks them. */
export interface ListTypeShape {
  customLists: string[] | null;
  sectionOrder: string[] | null;
  splitCompletedSectionByFormat: boolean | null;
  advancedScoring: string[] | null;
  advancedScoringEnabled: boolean | null;
}

export interface ListOptionsAnswer {
  animeList: ListTypeShape | null;
  mangaList: ListTypeShape | null;
}

/** Both list types' options, read fresh before every custom-list write because `customLists` is replaced whole. */
export const LIST_OPTIONS_QUERY = `
query ($id: Int!) {
  User(id: $id) {
    id
    mediaListOptions {
      animeList { ${LIST_TYPE_FIELDS} }
      mangaList { ${LIST_TYPE_FIELDS} }
    }
  }
}`;

export async function listOptions(id: number): Promise<ListOptionsAnswer> {
  const data = await gql<{ User: { mediaListOptions: ListOptionsAnswer | null } | null }>(
    LIST_OPTIONS_QUERY,
    { id },
    { source: "listOptions" },
  );
  return data.User?.mediaListOptions ?? { animeList: null, mangaList: null };
}

/** One list type's options with the changed `customLists`; the other type's variable is left unset. */
export const UPDATE_LIST_OPTIONS_MUTATION = `
mutation ($anime: MediaListOptionsInput, $manga: MediaListOptionsInput) {
  UpdateUser(animeListOptions: $anime, mangaListOptions: $manga) {
    id
    mediaListOptions {
      animeList { ${LIST_TYPE_FIELDS} }
      mangaList { ${LIST_TYPE_FIELDS} }
    }
  }
}`;

/** One list type's write: the lists, and every option the read before it named, sent back so none can be reset. */
export interface ListOptionsInput {
  customLists: string[];
  sectionOrder?: string[];
  splitCompletedSectionByFormat?: boolean;
  advancedScoring?: string[];
  advancedScoringEnabled?: boolean;
}

export async function updateListOptions(type: "ANIME" | "MANGA", write: ListOptionsInput): Promise<ListOptionsAnswer> {
  const data = await gql<{ UpdateUser: { mediaListOptions: ListOptionsAnswer | null } }>(
    UPDATE_LIST_OPTIONS_MUTATION,
    type === "ANIME" ? { anime: write } : { manga: write },
    { source: "customLists" },
  );
  return data.UpdateUser.mediaListOptions ?? { animeList: null, mangaList: null };
}
