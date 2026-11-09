import { describe, expect, it } from "vitest";
import { collapseStacks, makeStack, moveMember, parseStacks, removeMember, renameStack, type Stack } from "./stacks";

const e = (mediaId: number) => ({ mediaId });

describe("makeStack", () => {
  it("adds a stack of the ids in order and takes them out of any stack they were in", () => {
    const before: Stack[] = [{ id: "a", members: [1, 2, 3] }];
    const after = makeStack(before, [3, 4], "b");
    expect(after).toEqual([
      { id: "a", members: [1, 2] },
      { id: "b", members: [3, 4] },
    ]);
  });

  it("drops a stack left with one member, and makes none from fewer than two", () => {
    expect(makeStack([{ id: "a", members: [1, 2] }], [2, 5], "b")).toEqual([{ id: "b", members: [2, 5] }]);
    expect(makeStack([], [7], "b")).toEqual([]);
  });
});

describe("removeMember and moveMember", () => {
  const stacks: Stack[] = [{ id: "a", members: [1, 2, 3] }];

  it("takes one member out, and dissolves a stack that would hold one", () => {
    expect(removeMember(stacks, "a", 2)).toEqual([{ id: "a", members: [1, 3] }]);
    expect(removeMember([{ id: "a", members: [1, 2] }], "a", 1)).toEqual([]);
  });

  it("moves a member one place and stops at the ends", () => {
    expect(moveMember(stacks, "a", 3, -1)).toEqual([{ id: "a", members: [1, 3, 2] }]);
    expect(moveMember(stacks, "a", 1, -1)).toEqual(stacks);
  });
});

describe("collapseStacks", () => {
  const stacks: Stack[] = [{ id: "s", members: [3, 1, 9] }];

  it("draws a stack where its first member in the list stands, its members in the stack's order", () => {
    const { items, stackOf } = collapseStacks([e(1), e(2), e(3), e(4)], stacks);
    expect(items.map((x) => x.mediaId)).toEqual([1, 2, 4]);
    expect(stackOf.get(1)?.members.map((x) => x.mediaId)).toEqual([3, 1]);
  });

  it("leaves a lone member as an ordinary entry, since a stack of one is no stack", () => {
    const { items, stackOf } = collapseStacks([e(1), e(2)], stacks);
    expect(items.map((x) => x.mediaId)).toEqual([1, 2]);
    expect(stackOf.size).toBe(0);
  });
});

describe("parseStacks", () => {
  it("keeps well-formed stacks and drops anything else", () => {
    expect(parseStacks('{"ANIME":[{"id":"a","members":[1,2]},{"id":"b","members":[3]},{"x":1}]}')).toEqual({
      ANIME: [{ id: "a", members: [1, 2] }],
    });
    expect(parseStacks("nope")).toEqual({});
  });
});

describe("renameStack", () => {
  it("names a stack, and an empty or blank name hands it back to its front title", () => {
    const named = renameStack([{ id: "a", members: [1, 2] }], "a", "  Mushoku  ");
    expect(named).toEqual([{ id: "a", members: [1, 2], name: "Mushoku" }]);
    expect(renameStack(named, "a", " ")).toEqual([{ id: "a", members: [1, 2] }]);
  });

  it("keeps a stored name and drops one that is not text", () => {
    expect(parseStacks('{"ANIME":[{"id":"a","members":[1,2],"name":"X"}]}').ANIME).toEqual([{ id: "a", members: [1, 2], name: "X" }]);
    expect(parseStacks('{"ANIME":[{"id":"a","members":[1,2],"name":5}]}').ANIME).toEqual([]);
  });
});
