import { afterEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { useAuth } from "@/stores/auth";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import AccountButton from "./AccountButton";

afterEach(() => signOut());

/** The titlebar names the signed-in account and is the desktop's one way to its profile. */
describe("AccountButton", () => {
  it("shows the account's name and links to its profile", () => {
    const viewer = signIn({ name: "Crow Fan" });
    renderWithProviders(<AccountButton />);
    const link = screen.getByRole("link", { name: /Crow Fan/ });
    expect(link).toHaveAttribute("href", "/user/Crow%20Fan");
    expect(link).toHaveTextContent(viewer.name);
  });

  it("draws nothing for a local profile, which has no AniList page", () => {
    useAuth.setState({ viewer: null, mode: "local", loading: false });
    const { container } = renderWithProviders(<AccountButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
