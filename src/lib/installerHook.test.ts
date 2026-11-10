import { describe, expect, it } from "vitest";

/** The Windows installer carries an install made under the old publisher name over, and leans on one CLI version to do it. */

const HOOK = import.meta.glob("/src-tauri/windows/hooks.nsh", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const CONFIG = import.meta.glob("/src-tauri/tauri.conf.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const PACKAGE = import.meta.glob("/package.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

/** The CLI whose installer template the hook was read against and run under; a new one means reading it again. */
const CHECKED_CLI = "2.12.4";

describe("the Windows installer's publisher migration", () => {
  const hook = HOOK["/src-tauri/windows/hooks.nsh"] ?? "";
  const config = JSON.parse(CONFIG["/src-tauri/tauri.conf.json"]) as {
    productName: string;
    bundle: { publisher: string; windows: { nsis: { installerHooks?: string } } };
  };

  it("is wired into the bundle", () => {
    expect(config.bundle.windows.nsis.installerHooks).toBe("windows/hooks.nsh");
  });

  it("writes the key the installer reads, under the publisher and product the bundle names", () => {
    expect(hook).toContain(`!define KARASU_NEW_KEY "Software\\${config.bundle.publisher}\\${config.productName}"`);
    expect(hook).toContain('!define KARASU_OLD_KEY "Software\\Kyu\\Karasu"');
  });

  it("adopts before the first page, again for a silent install, and clears the old key afterwards", () => {
    expect(hook).toContain("!define MUI_CUSTOMFUNCTION_GUIINIT KarasuAdoptOldPublisher");
    expect(hook).toMatch(/!macro NSIS_HOOK_PREINSTALL\s+!insertmacro KARASU_ADOPT_OLD_PUBLISHER/);
    expect(hook).toMatch(/!macro NSIS_HOOK_POSTINSTALL\s+DeleteRegKey SHCTX "\$\{KARASU_OLD_KEY\}"/);
  });

  it("is built by the CLI version it was checked against, pinned exactly", () => {
    const cli = (JSON.parse(PACKAGE["/package.json"]) as { devDependencies: Record<string, string> }).devDependencies["@tauri-apps/cli"];
    expect(cli).toBe(CHECKED_CLI);
  });
});
