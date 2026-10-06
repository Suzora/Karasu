import type { ListOptionsAnswer, ListOptionsInput, ListTypeShape } from "@/api/social";
import type { ListResult, MediaType, MutationResult, SaveEntryInput } from "@/api/types";
import {
  drift,
  hiddenOrphans,
  isSingleEdit,
  planOp,
  snapshot,
  validateName,
  type ListOp,
  type ListOptionsWrite,
  type ListShape,
  type Member,
  type NameProblem,
} from "./customListOps";

/** Everything a custom-list run touches, passed in so the order of requests is tested without a network. */
export interface ListRunDeps {
  readOptions: () => Promise<ListOptionsAnswer>;
  writeOptions: (write: ListOptionsInput) => Promise<ListOptionsAnswer>;
  fetchList: (force: boolean) => Promise<ListResult>;
  save: (input: SaveEntryInput) => Promise<MutationResult>;
  unhide: (entries: Member[]) => Promise<number>;
}

/** Why a run stopped before or at the write; a closed union, so the caller maps it to a sentence. */
export type ListRunFailure =
  | { code: "invalid"; problem: NameProblem }
  | { code: "unreadable" }
  | { code: "failed" }
  | { code: "stale"; options?: ListTypeShape | null; list?: ListResult }
  | { code: "queued" }
  | { code: "offline" }
  | { code: "mismatch"; options?: ListTypeShape | null };

export class ListRunError extends Error {
  constructor(
    readonly failure: ListRunFailure,
    /** Entries already put back on the status lists when the run stopped; that write stays. */
    readonly unhidden = 0,
  ) {
    super(`custom list run stopped: ${failure.code}`);
    this.name = "ListRunError";
  }
}

/** Which account options other than the lists changed under the write; AniList saves them in the same object. */
export type SideEffect = "split" | "advancedScoring";

export interface ListRunResult {
  options: ListTypeShape;
  /** The list as read after the write and its repairs, or null when it could not be read at all. */
  list: ListResult | null;
  /** False when the list could not be read again after the write, so nothing was checked or repaired. */
  verified: boolean;
  repaired: number;
  queued: number;
  /** Repairs that failed; their entries keep whatever membership AniList left them. */
  unrepaired: number;
  sideEffects: SideEffect[];
}

const pick = (answer: ListOptionsAnswer, type: MediaType) => (type === "ANIME" ? answer.animeList : answer.mangaList);

const shapeOf = (s: ListTypeShape | null): ListShape => ({
  customLists: s?.customLists ?? [],
  sectionOrder: s?.sectionOrder ?? [],
});

const same = (a: readonly string[] | null | undefined, b: readonly string[] | null | undefined) =>
  (a ?? []).length === (b ?? []).length && (a ?? []).every((x, i) => x === (b ?? [])[i]);

/** The write with every option the read named sent back unchanged, so an object AniList replaces whole keeps them. */
export function fullWrite(write: ListOptionsWrite, read: ListTypeShape): ListOptionsInput {
  const out: ListOptionsInput = { customLists: write.customLists };
  const order = write.sectionOrder ?? read.sectionOrder;
  if (order && order.length) out.sectionOrder = order;
  if (read.splitCompletedSectionByFormat != null) out.splitCompletedSectionByFormat = read.splitCompletedSectionByFormat;
  if (read.advancedScoring != null) out.advancedScoring = read.advancedScoring;
  if (read.advancedScoringEnabled != null) out.advancedScoringEnabled = read.advancedScoringEnabled;
  return out;
}

/** What AniList kept differently from what was sent, beyond the lists; a value nobody sent is not compared. */
export function sideEffects(sent: ListOptionsInput, after: ListTypeShape | null): SideEffect[] {
  const out: SideEffect[] = [];
  const split = sent.splitCompletedSectionByFormat;
  if (split !== undefined && (after?.splitCompletedSectionByFormat ?? false) !== split) out.push("split");
  const enabled = sent.advancedScoringEnabled;
  const scoring =
    (enabled !== undefined && (after?.advancedScoringEnabled ?? false) !== enabled) ||
    (sent.advancedScoring !== undefined && !same(sent.advancedScoring, after?.advancedScoring));
  if (scoring) out.push("advancedScoring");
  return out;
}

/** What the delete dialog showed: the hidden entries it offered to put back, and whether the box stayed ticked. */
export interface OrphanChoice {
  offered: readonly number[];
  unhide: boolean;
}

/** One custom-list op end to end: fresh read, snapshot, the write, then a re-read that repairs any membership drift. */
export async function runListOp(
  type: MediaType,
  op: ListOp,
  deps: ListRunDeps,
  orphans: OrphanChoice = { offered: [], unhide: false },
): Promise<ListRunResult> {
  const read = pick(await deps.readOptions(), type);
  // An answer without the options is not an account without lists, and a create would then replace every one.
  if (!read) throw new ListRunError({ code: "unreadable" });
  const shape = shapeOf(read);
  const problem =
    op.kind === "create"
      ? validateName(op.name, shape)
      : op.kind === "rename"
        ? validateName(op.to, shape, op.from)
        : null;
  if (problem) throw new ListRunError({ code: "invalid", problem });
  const write = planOp(op, shape);
  if (!write || !isSingleEdit(shape.customLists, write.customLists)) {
    throw new ListRunError({ code: "stale", options: read });
  }

  let before: Map<number, Member> | null = null;
  let unhidden = 0;
  if (op.kind !== "create") {
    const current = await deps.fetchList(true);
    // A copy served because the fetch failed is not the account, and a repair against it would undo edits made elsewhere.
    if (current.fromCache) throw new ListRunError({ code: "offline" });
    // A queued save still names the old lists and would replay them over the new names.
    if (current.pending > 0) throw new ListRunError({ code: "queued" });
    before = snapshot(current.lists);
    if (op.kind === "delete") {
      const stranded = hiddenOrphans(before, op.name);
      const offered = new Set(orphans.offered);
      // An entry the dialog did not show is a choice nobody was asked, so the screen is redrawn before anything is written.
      if (stranded.some((o) => !offered.has(o.id))) throw new ListRunError({ code: "stale", options: read, list: current });
      if (orphans.unhide && stranded.length) {
        try {
          unhidden = await deps.unhide(stranded);
        } catch (e) {
          // A bulk edit that stopped partway still landed what it counts, and the toast has to say so.
          const landed = e instanceof Error && "updated" in e && typeof e.updated === "number" ? e.updated : 0;
          throw new ListRunError({ code: "failed" }, landed);
        }
      }
    }
  }

  const sent = fullWrite(write, read);
  let answer: ListOptionsAnswer;
  try {
    answer = await deps.writeOptions(sent);
  } catch (e) {
    if (unhidden === 0) throw e;
    throw new ListRunError(e instanceof ListRunError ? e.failure : { code: "failed" }, unhidden);
  }
  const after = pick(answer, type);
  // An answer that is not what was sent means the account works differently than assumed; nothing more is written.
  if (!after || !same(after.customLists, write.customLists)) {
    throw new ListRunError({ code: "mismatch", options: after }, unhidden);
  }
  const effects = sideEffects(sent, after);

  // The write has landed by now, so a read that fails is an unchecked success and never a failed op.
  let list = await deps.fetchList(true).catch(() => null);
  const verified = list !== null && !list.fromCache;
  const result = { options: after, list, verified, repaired: 0, queued: 0, unrepaired: 0, sideEffects: effects };
  if (!before || !list || !verified) return result;
  for (const fix of drift(op, before, snapshot(list.lists))) {
    try {
      const res = await deps.save({ mediaId: fix.mediaId, customLists: fix.lists });
      if (res.queued) result.queued++;
      else result.repaired++;
    } catch {
      result.unrepaired++;
    }
  }
  // The repairs patched Rust's copy as they landed, so this read is served from it without a request.
  if (result.repaired + result.queued > 0) list = await deps.fetchList(false).catch(() => list);
  return { ...result, list };
}
