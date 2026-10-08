import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./EmptyState";

/** The one shape a failed load takes: the reason in words, and a Retry that is one request per press. */
describe("ErrorState", () => {
  it("words the backend's code instead of printing it, and asks nothing by itself", () => {
    const onRetry = vi.fn();
    render(<ErrorState error="anilist.rateLimited" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent('common.error:{"message":"common.rateLimited"}');
    expect(onRetry).not.toHaveBeenCalled();
  });

  /** A failed query keeps its error while it asks again, so only the held button stops a second request. */
  it("asks once per press and holds the button until the answer is in", async () => {
    let settle: () => void = () => {};
    const onRetry = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    const user = userEvent.setup({ delay: null });
    render(<ErrorState error="AniList answered 500" onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: "common.retry" });
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveFocus();
    await user.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await act(async () => settle());
    expect(button).not.toHaveAttribute("aria-disabled");
  });

  it("keeps a page's own sentence around the reason, inline and without a button where nothing can be asked", () => {
    render(<ErrorState inline error="Network error: refused" title={(reason) => `list.loadError:${reason}`} />);
    expect(screen.getByRole("alert")).toHaveTextContent("list.loadError:common.offlineError");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
