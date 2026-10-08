import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, signIn, signOut } from "@/test/render";
import { LikeButton } from "./LikeButton";

/** One heart for the feed, the comments and the thread: named by its action, and inert without an account. */
describe("LikeButton", () => {
  it("names the action, not the state, and hands the press to a caller that keeps its own cache", async () => {
    const user = userEvent.setup({ delay: null });
    const onLike = vi.fn();
    signIn();
    const { rerender } = renderWithProviders(
      <LikeButton id={7} type="THREAD_COMMENT" likeCount={3} isLiked={false} onLike={onLike} />,
    );
    await user.click(screen.getByRole("button", { name: "social.like" }));
    expect(onLike).toHaveBeenCalledTimes(1);
    rerender(<LikeButton id={7} type="THREAD_COMMENT" likeCount={4} isLiked onLike={onLike} />);
    expect(screen.getByRole("button", { name: "social.unlike" })).toHaveAttribute("aria-pressed", "true");
    signOut();
  });

  it("is a count and no control without an account", () => {
    signOut();
    renderWithProviders(<LikeButton id={7} type="THREAD" likeCount={3} isLiked={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
