import { gql } from "../anilist";
import { PAGE_INFO, type PageInfo, SOCIAL_USER, type SocialUser } from "./shared";

/** Reviews of a title. */

// --- Reviews ---------------------------------------------------------------

/** A title's reviews, best-rated first; `body` is markdown (never `asHtml`) so the social renderer applies. */
export const REVIEWS_QUERY = `
query ($mediaId: Int!, $page: Int) {
  Page(page: $page, perPage: 5) {
    ${PAGE_INFO}
    reviews(mediaId: $mediaId, sort: RATING_DESC) {
      id
      summary
      body
      rating
      ratingAmount
      userRating
      score
      createdAt
      siteUrl
      user { ${SOCIAL_USER} }
    }
  }
}`;

export interface ReviewRow {
  id: number;
  summary: string | null;
  body: string | null;
  /** Up-votes — the site renders "{rating} of {ratingAmount} liked this". */
  rating: number | null;
  ratingAmount: number | null;
  /** UP_VOTE | DOWN_VOTE | NO_VOTE — the viewer's own. */
  userRating: string | null;
  /** The reviewer's verdict, always hundred-point here. */
  score: number | null;
  createdAt: number;
  siteUrl: string | null;
  user: SocialUser | null;
}

export interface ReviewPage {
  pageInfo: PageInfo;
  reviews: ReviewRow[];
}

export async function reviews(mediaId: number, page = 1): Promise<ReviewPage> {
  const data = await gql<{ Page: ReviewPage }>(REVIEWS_QUERY, { mediaId, page });
  return { pageInfo: data.Page.pageInfo, reviews: data.Page.reviews ?? [] };
}

/** Vote on a review's helpfulness. Returns what the optimistic UI needs. */
export const RATE_REVIEW_MUTATION = `
mutation ($reviewId: Int, $rating: ReviewRating) {
  RateReview(reviewId: $reviewId, rating: $rating) {
    id
    rating
    ratingAmount
    userRating
  }
}`;

export async function rateReview(
  reviewId: number,
  rating: "UP_VOTE" | "DOWN_VOTE" | "NO_VOTE",
): Promise<{ rating: number | null; ratingAmount: number | null; userRating: string | null }> {
  const data = await gql<{
    RateReview: { rating: number | null; ratingAmount: number | null; userRating: string | null };
  }>(RATE_REVIEW_MUTATION, { reviewId, rating });
  return data.RateReview;
}

/** Creates with `id` absent, edits with it present — AniList's own upsert. */
export const SAVE_REVIEW_MUTATION = `
mutation ($id: Int, $mediaId: Int, $body: String, $summary: String, $score: Int, $private: Boolean) {
  SaveReview(id: $id, mediaId: $mediaId, body: $body, summary: $summary, score: $score, private: $private) {
    id
  }
}`;

export async function saveReview(input: {
  id?: number;
  mediaId: number;
  body: string;
  summary: string;
  score: number;
  private: boolean;
}): Promise<number> {
  const data = await gql<{ SaveReview: { id: number } }>(SAVE_REVIEW_MUTATION, input);
  return data.SaveReview.id;
}

/** The viewer's own review, the composer's prefill; `private` comes along so the composer never resets it. */
export const MY_REVIEW_QUERY = `
query ($mediaId: Int!, $userId: Int!) {
  Page(page: 1, perPage: 1) {
    reviews(mediaId: $mediaId, userId: $userId) {
      id
      summary
      body
      score
      private
    }
  }
}`;

export interface MyReview {
  id: number;
  summary: string | null;
  body: string | null;
  score: number | null;
  private: boolean;
}

export async function myReview(mediaId: number, userId: number): Promise<MyReview | null> {
  const data = await gql<{ Page: { reviews: (MyReview & { private: boolean | null })[] | null } }>(
    MY_REVIEW_QUERY,
    { mediaId, userId },
  );
  const row = data.Page.reviews?.[0];
  return row ? { ...row, private: row.private === true } : null;
}
