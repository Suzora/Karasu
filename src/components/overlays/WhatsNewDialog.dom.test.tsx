import { fireEvent, screen, within } from "@testing-library/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pending } from "@/lib/whatsNew";
import { renderWithProviders } from "@/test/render";
import { changeSection, changelog } from "@/test/fixtures";
import WhatsNewDialog, { CHANGELOG_URL } from "./WhatsNewDialog";

const phone = vi.hoisted(() => ({ on: false }));
vi.mock("@/hooks/usePhoneShell", () => ({ usePhoneShell: () => phone.on }));

afterEach(() => {
  phone.on = false;
});

const R144 = changeSection("1.44.0", { added: ["Titles in your language."], fixed: ["No more freezes."] }, {
  intro: [[{ type: "text", text: "The second Stable release." }]],
});
const R132 = changeSection("1.32.0", { changed: ["Quieter rows."] });
const LOG = changelog({ releases: [R144, R132] });
const none: Pending = { sections: [], crossed: [], unreleased: null, older: false };

describe("WhatsNewDialog after an update", () => {
  it("names a Stable's version and shows its intro and grouped lines", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [R144] }} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName('whatsNew.titleVersion:{"version":"1.44.0"}');
    expect(within(dialog).getByText("The second Stable release.")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "whatsNew.added" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "whatsNew.fixed" })).toBeInTheDocument();
    expect(within(dialog).getByText("Titles in your language.")).toBeInTheDocument();
  });

  it("shows a Nightly's new lines, and a crossed release folded until asked for", () => {
    const fresh = changeSection(null, { added: ["A new line."] });
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, crossed: [R144], unreleased: fresh }} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("whatsNew.titleNightly");
    expect(screen.getByText("A new line.")).toBeInTheDocument();
    const fold = screen.getByRole("button", { name: 'whatsNew.crossed:{"version":"1.44.0"}' });
    expect(fold).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("No more freezes.")).not.toBeInTheDocument();
    fireEvent.click(fold);
    expect(screen.getByText("No more freezes.")).toBeInTheDocument();
  });

  it("says when releases older than the bundled ones lie in between", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [R144, R132], older: true }} onClose={() => {}} />);
    expect(screen.getByText("whatsNew.older")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^1\.32\.0/ })).toBeInTheDocument();
  });

  it("marks the changelog's own text as English for a screen reader", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [R144] }} onClose={() => {}} />);
    expect(screen.getByText("Titles in your language.").closest("[lang]")).toHaveAttribute("lang", "en");
  });

  it("opens links outside the app", () => {
    const linked = changeSection("1.44.0", {}, {
      groups: [{ kind: "fixed", lines: [{ id: "x", text: [{ type: "link", href: "https://github.com/Suzora/Karasu/issues/62", children: [{ type: "text", text: "#62" }] }] }] }],
    });
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [linked] }} onClose={() => {}} />);
    fireEvent.click(screen.getByRole("link", { name: "#62" }));
    expect(openUrl).toHaveBeenCalledWith("https://github.com/Suzora/Karasu/issues/62");
    fireEvent.click(screen.getByRole("link", { name: "whatsNew.fullChangelog" }));
    expect(openUrl).toHaveBeenCalledWith(CHANGELOG_URL);
  });

  it("closes from its button", () => {
    const onClose = vi.fn();
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [R144] }} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "common.done" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("rises as a sheet on the phone", () => {
    phone.on = true;
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [R144] }} onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: 'whatsNew.titleVersion:{"version":"1.44.0"}' })).toBeInTheDocument();
    expect(screen.getByText("Titles in your language.")).toBeInTheDocument();
  });
});

describe("WhatsNewDialog from About", () => {
  it("opens a Stable on its own release, the same view an update shows, with the older ones folded", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName('whatsNew.titleVersion:{"version":"1.44.0"}');
    expect(screen.getByText("Titles in your language.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^1\.32\.0/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("whatsNew.older")).toBeInTheDocument();
  });

  it("opens a Nightly on its Unreleased lines, named by the release they follow", () => {
    const log = changelog({ releases: [R144, R132], unreleased: changeSection(null, { fixed: ["Since then."] }) });
    renderWithProviders(<WhatsNewDialog log={log} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveAccessibleName('whatsNew.titleSince:{"version":"1.44.0"}');
    expect(screen.getByText("Since then.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^1\.44\.0/ })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("the compact view", () => {
  const long = changeSection("1.45.0", { added: ["A1.", "A2.", "A3."], changed: ["C1.", "C2."], fixed: ["F1.", "F2."] }, {
    intro: [[{ type: "text", text: "The intro." }]],
  });

  it("shows the first five lines without the intro, and the rest on asking", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, sections: [long] }} onClose={() => {}} />);
    expect(screen.getByText("C2.")).toBeInTheDocument();
    expect(screen.queryByText("F1.")).not.toBeInTheDocument();
    expect(screen.queryByText("The intro.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: 'whatsNew.showAll:{"count":7}' }));
    expect(screen.getByText("F2.")).toBeInTheDocument();
    expect(screen.getByText("The intro.")).toBeInTheDocument();
    // The button went with the click; focus lands on what it revealed instead of dropping to the page.
    expect(document.activeElement).toContainElement(screen.getByText("F2."));
  });

  it("opens a crossed release by itself when it is all the update brings", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, crossed: [R144] }} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: 'whatsNew.crossed:{"version":"1.44.0"}' })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("No more freezes.")).toBeInTheDocument();
  });

  it("keeps a folded release compact once it is opened", () => {
    renderWithProviders(<WhatsNewDialog log={LOG} pending={{ ...none, crossed: [long] }} onClose={() => {}} />);
    expect(screen.getByText("C2.")).toBeInTheDocument();
    expect(screen.queryByText("F1.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: 'whatsNew.showAll:{"count":7}' })).toBeInTheDocument();
  });
});
