import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DEFAULT_STATUS_COLORS } from "@/lib/statusColors";
import { useTheme } from "@/stores/theme";
import { useTitleLanguage } from "@/stores/titleLanguage";
import { activeTitleLanguage, SAMPLE_TITLE } from "@/lib/titleLanguage";
import { AppearanceSection } from "./AppearancePane";

// The real setup module wires i18next to React, which the dom project's mocked `react-i18next` cannot serve.
vi.mock("@/i18n", () => ({
  getLanguageSetting: () => "system",
  setLanguageSetting: () => {},
  SUPPORTED_LANGUAGES: [{ value: "system", label: "System" }],
}));

const root = document.documentElement;
let surfaces: HTMLStyleElement;

beforeEach(() => {
  surfaces = document.createElement("style");
  surfaces.textContent = `:root { --color-surface-950: #0b0d12; --color-surface-900: #12141a; }
    :root[data-theme="light"] { --color-surface-950: #f4f6f8; --color-surface-900: #fff; }`;
  document.head.append(surfaces);
  root.dataset.theme = "dark";
  // Near the dark page and far from the light one, so the warning's presence says which theme it measured.
  useTheme.setState({ statusColors: { ...DEFAULT_STATUS_COLORS, PLANNING: "#2a2d35" } });
});

afterEach(() => {
  surfaces.remove();
  delete root.dataset.theme;
  useTheme.setState({ statusColors: DEFAULT_STATUS_COLORS });
});

describe("the status colour warning", () => {
  /** The OS switching theme under "system" rewrites the document and nothing in the store, so the pane must watch it. */
  it("follows a theme the document changes without the store", async () => {
    renderWithProviders(<AppearanceSection />);
    expect(screen.getAllByText(/settings\.statusColorLow/)).toHaveLength(1);

    act(() => {
      root.dataset.theme = "light";
    });
    await waitFor(() => expect(screen.queryByText(/settings\.statusColorLow/)).not.toBeInTheDocument());

    act(() => {
      root.dataset.theme = "dark";
    });
    await waitFor(() => expect(screen.getAllByText(/settings\.statusColorLow/)).toHaveLength(1));
  });
});

describe("the title language row", () => {
  afterEach(() => useTitleLanguage.getState().setLanguage("english"));

  /** With no list cached the example is the sample title, so the three spellings are known here. */
  it("stores the choice and re-spells its example at once", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<AppearanceSection />);
    const row = document.querySelector<HTMLElement>('[data-setting="titleLanguage"]');
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent(SAMPLE_TITLE.english!);

    await user.selectOptions(within(row!).getByRole("combobox"), "romaji");
    expect(useTitleLanguage.getState().language).toBe("romaji");
    expect(activeTitleLanguage()).toBe("romaji");
    expect(localStorage.getItem("karasu-title-language")).toBe("romaji");
    expect(row).toHaveTextContent(SAMPLE_TITLE.romaji!);

    await user.selectOptions(within(row!).getByRole("combobox"), "native");
    // The native line takes the Japanese face, and the romaji moves underneath it.
    expect(within(row!).getByText(SAMPLE_TITLE.native!)).toHaveClass("font-brand-jp");
    expect(within(row!).getByText(SAMPLE_TITLE.romaji!)).not.toHaveClass("font-brand-jp");
  });
});
