// The types of `agent-guard-core.mjs` for `src/lib/agentGuard.test.ts`; the app's tsconfig reads no JavaScript.

export interface Judgement {
  deny: { rule: string; message: string } | null;
  commits: boolean;
  adds: boolean;
  dev: boolean;
}

export function secretRules(text: string): string[];
export function keyMaterial(path: string): boolean;
export function localOnly(path: string): boolean;
export function judgeCommand(command: string): Judgement;

export interface Stamp {
  state: string;
  ran: string[];
}

export function treeState(git: (args: string[], input?: string) => string, read: (path: string) => string | null): string;
export function stopVerdict(input: {
  state: string;
  baseline: string;
  stamp: Stamp | null;
  need: { rust: boolean; frontend: boolean };
  cloud: boolean;
  asked: string[];
}): string | null;
export function guardFile(git: (args: string[]) => string, name: string): string;
export function writeStamp(root: string, ran: string[]): void;
