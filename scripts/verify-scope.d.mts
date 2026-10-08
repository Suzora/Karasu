// The types of `verify-scope.mjs` for `src/lib/verifyScope.test.ts`; the app's tsconfig reads no JavaScript.

export interface Change {
  path: string;
  versionOnly: boolean;
}

export interface Collected {
  since: string;
  changes: Change[];
}

export const RAW_READ_GLOBS: string[];
export function globToRegExp(glob: string): RegExp;
export function versionOnly(path: string, before: string | null, after: string | null): boolean;
export function scope(changes: Change[]): { rust: boolean; frontend: boolean };
export function collectChanges(git: (args: string[]) => string, readWorking: (path: string) => string | null): Collected | null;
export function decide(input: { flags: Set<string>; ci: boolean; collected: Collected | null }): {
  vitest: boolean;
  cargo: boolean;
  why: string | null;
};
