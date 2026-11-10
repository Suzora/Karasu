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
