import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router";
import GlobalKeys from "./GlobalKeys";
import { renderWithProviders } from "@/test/render";

/** Where the router stands, URL query included, since a restored search lives there. */
function Where() {
  const { pathname, search } = useLocation();
  return <output aria-label="where">{pathname + search}</output>;
}

/** The shell as far as "/" can see it: the keys, a `<main>` holding the Search page's field, and the location. */
function Shell() {
  return (
    <>
      <GlobalKeys />
      <main id="main" tabIndex={-1}>
        <input aria-label="search field" data-page-search="" defaultValue="frieren" />
      </main>
      <Where />
    </>
  );
}

const where = () => screen.getByRole("status", { name: "where" });

describe("GlobalKeys", () => {
  /** A bare push would reset the search the URL holds, so on its own page "/" goes to the field instead. */
  it("focuses the Search page's field on the Search page and stays where it is", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Shell />, { route: "/search?q=frieren" });
    const main = document.getElementById("main")!;
    main.focus();
    await user.keyboard("/");
    const field = screen.getByRole<HTMLInputElement>("textbox", { name: "search field" });
    await waitFor(() => expect(field).toHaveFocus());
    // Selected whole, so typing replaces the query, and the slash itself was never typed into it.
    expect(field).toHaveValue("frieren");
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, 7]);
    expect(where()).toHaveTextContent("/search?q=frieren");
  });

  it("opens the Search page from anywhere else", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Shell />, { route: "/list?status=CURRENT" });
    document.getElementById("main")!.focus();
    await user.keyboard("/");
    await waitFor(() => expect(where()).toHaveTextContent(/^\/search$/));
  });

  it("leaves a slash typed into a field alone", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<Shell />, { route: "/list" });
    const field = screen.getByRole<HTMLInputElement>("textbox", { name: "search field" });
    await user.click(field);
    await user.keyboard("/");
    expect(field).toHaveValue("frieren/");
    expect(where()).toHaveTextContent(/^\/list$/);
  });
});
