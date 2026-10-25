import { describe, expect, it } from "vitest";
import {
  afterRemoval,
  followRelation,
  isFollowing,
  isSelf,
  nextRelation,
  relationBadgeKey,
  relationFlags,
  withoutUser,
  type FollowRelation,
} from "./follows";

const ALL: FollowRelation[] = ["mutual", "following", "followsYou", "none"];

describe("followRelation", () => {
  it("maps all four combinations", () => {
    expect(followRelation({ isFollowing: true, isFollower: true })).toBe("mutual");
    expect(followRelation({ isFollowing: true, isFollower: false })).toBe("following");
    expect(followRelation({ isFollowing: false, isFollower: true })).toBe("followsYou");
    expect(followRelation({ isFollowing: false, isFollower: false })).toBe("none");
  });

  it("treats null, undefined and absent as not-following", () => {
    // An unknown flag fails safe: offering a follow is recoverable, claiming a relationship that does not exist is not.
    expect(followRelation({})).toBe("none");
    expect(followRelation({ isFollowing: null, isFollower: null })).toBe("none");
    expect(followRelation({ isFollowing: undefined, isFollower: true })).toBe("followsYou");
  });
});

describe("nextRelation", () => {
  it("toggles only the viewer's own half", () => {
    expect(nextRelation("none")).toBe("following");
    expect(nextRelation("following")).toBe("none");
    // Whether they follow you is not yours to change.
    expect(nextRelation("followsYou")).toBe("mutual");
    expect(nextRelation("mutual")).toBe("followsYou");
  });

  it("is its own inverse, which is what makes undo one code path", () => {
    for (const r of ALL) expect(nextRelation(nextRelation(r))).toBe(r);
  });

  it("never changes the follower half", () => {
    for (const r of ALL) {
      expect(relationFlags(nextRelation(r)).isFollower).toBe(relationFlags(r).isFollower);
    }
  });
});

describe("relationFlags", () => {
  it("round-trips through followRelation for every relation", () => {
    for (const r of ALL) expect(followRelation(relationFlags(r))).toBe(r);
  });
});

describe("isFollowing", () => {
  it("is true exactly when the viewer follows them", () => {
    expect(isFollowing("following")).toBe(true);
    expect(isFollowing("mutual")).toBe(true);
    expect(isFollowing("followsYou")).toBe(false);
    expect(isFollowing("none")).toBe(false);
  });

  it("agrees with the flags it was derived from", () => {
    for (const r of ALL) expect(isFollowing(r)).toBe(relationFlags(r).isFollowing);
  });
});

describe("relationBadgeKey", () => {
  it("labels the two relations the button does not already state", () => {
    expect(relationBadgeKey("mutual")).toBe("social.badgeMutual");
    expect(relationBadgeKey("followsYou")).toBe("social.badgeFollowsYou");
  });

  it("says nothing when the button already says it", () => {
    expect(relationBadgeKey("following")).toBeNull();
    expect(relationBadgeKey("none")).toBeNull();
  });

  it("returns only keys from the closed union, so i18nKeys can see them", () => {
    const allowed = new Set(["social.badgeMutual", "social.badgeFollowsYou", null]);
    for (const r of ALL) expect(allowed.has(relationBadgeKey(r))).toBe(true);
  });
});

describe("isSelf", () => {
  it("matches on id", () => {
    expect(isSelf(7, 7)).toBe(true);
    expect(isSelf(7, 8)).toBe(false);
  });

  it("is false when there is no viewer, rather than throwing", () => {
    expect(isSelf(null, 7)).toBe(false);
    expect(isSelf(undefined, 7)).toBe(false);
  });

  it("does not treat id 0 as absent", () => {
    // Keep the `!= null` check rather than truthiness; a truthy test breaks the day an id is 0.
    expect(isSelf(0, 0)).toBe(true);
    expect(isSelf(0, 1)).toBe(false);
  });
});

describe("removing a follower", () => {
  it("takes away only their half of the relation", () => {
    expect(afterRemoval("mutual")).toBe("following");
    expect(afterRemoval("followsYou")).toBe("none");
    expect(afterRemoval("following")).toBe("following");
    expect(afterRemoval("none")).toBe("none");
  });

  it("drops the user from every loaded page and counts them out of the total", () => {
    const page = (ids: number[]) => ({
      pageInfo: { total: 3, currentPage: 1, lastPage: 2, hasNextPage: true, perPage: 2 },
      users: ids.map((id) => ({ id })),
    });
    const after = withoutUser([page([1, 2]), page([3])], 2);
    expect(after.map((p) => p.users.map((u) => u.id))).toEqual([[1], [3]]);
    expect(after.map((p) => p.pageInfo.total)).toEqual([2, 2]);
  });

  it("leaves the pages alone when the user is not on them", () => {
    const pages = [{ pageInfo: { total: 1 }, users: [{ id: 1 }] }];
    expect(withoutUser(pages, 9)).toBe(pages);
  });
});
