import { describe, expect, it } from "vitest";
import { feedKinds, feedVariables, kindsFor, parseFeedView, writeFeedView } from "./feedView";

/** The activity page's column: which feed and which kinds, as AniList variables that never name private mail. */
describe("feedVariables", () => {
  it("asks the following feed, everyone's, or the viewer's own", () => {
    expect(feedVariables({ feed: "following", kind: "all" }, 7)).toMatchObject({ isFollowing: true });
    expect(feedVariables({ feed: "everyone", kind: "all" }, 7)).not.toHaveProperty("isFollowing");
    expect(feedVariables({ feed: "everyone", kind: "all" }, 7)).not.toHaveProperty("userId");
    expect(feedVariables({ feed: "mine", kind: "all" }, 7)).toMatchObject({ userId: 7 });
  });

  it("narrows the kinds, and never lets MESSAGE into type_in", () => {
    expect(feedVariables({ feed: "following", kind: "text" }, 7).types).toEqual(["TEXT"]);
    expect(feedVariables({ feed: "following", kind: "anime" }, 7).types).toEqual(["ANIME_LIST"]);
    expect(feedVariables({ feed: "following", kind: "manga" }, 7).types).toEqual(["MANGA_LIST"]);
    for (const kind of feedKinds) expect(feedVariables({ feed: "everyone", kind }, 7).types).not.toContain("MESSAGE");
  });
});

describe("the feed in the URL", () => {
  it("reads both choices, falling back to following and everything", () => {
    expect(parseFeedView(new URLSearchParams("feed=mine&kind=text"))).toEqual({ feed: "mine", kind: "text" });
    expect(parseFeedView(new URLSearchParams("feed=bogus"))).toEqual({ feed: "following", kind: "all" });
  });

  it("writes only what differs from the default", () => {
    expect(writeFeedView(new URLSearchParams("feed=mine"), { feed: "following", kind: "anime" }).toString()).toBe("kind=anime");
  });
});

describe("kindsFor", () => {
  it("leaves status updates out of everyone's feed, which AniList answers empty", () => {
    expect(kindsFor("everyone")).toEqual(["all", "anime", "manga"]);
    expect(kindsFor("following")).toEqual(["all", "text", "anime", "manga"]);
    expect(parseFeedView(new URLSearchParams("feed=everyone&kind=text"))).toEqual({ feed: "everyone", kind: "all" });
  });
});
