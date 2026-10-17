import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { nowPlaying } from "@/test/fixtures";
import { useNowPlaying } from "@/stores/nowPlaying";
import { useOverviewRail } from "@/stores/overviewRail";

vi.mock("./DetectionPopup", () => ({ default: () => <div data-testid="popup" /> }));

import DetectionPopupGate from "./DetectionPopupGate";

afterEach(() => {
  useNowPlaying.setState({ current: null });
  useOverviewRail.setState({ showsDetection: false });
});

/** The floating detection window: loaded with the first detection, stepping back while the Overview's rail shows it. */
describe("DetectionPopupGate", () => {
  it("loads the window with the first detection", async () => {
    renderWithProviders(<DetectionPopupGate />);
    expect(screen.queryByTestId("popup")).toBeNull();
    act(() => useNowPlaying.setState({ current: nowPlaying() }));
    expect(await screen.findByTestId("popup")).toBeInTheDocument();
  });

  it("steps back while the rail draws the detected title, and returns when it stops", async () => {
    useNowPlaying.setState({ current: nowPlaying() });
    renderWithProviders(<DetectionPopupGate />);
    expect(await screen.findByTestId("popup")).toBeInTheDocument();
    act(() => useOverviewRail.setState({ showsDetection: true }));
    expect(screen.queryByTestId("popup")).toBeNull();
    act(() => useOverviewRail.setState({ showsDetection: false }));
    expect(await screen.findByTestId("popup")).toBeInTheDocument();
  });
});
