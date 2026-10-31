import { useRef } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useColumnCount } from "./useColumnCount";

const observed: Element[] = [];

class RecordingObserver {
  observe(el: Element) {
    observed.push(el);
  }
  disconnect() {}
  unobserve() {}
}

function Grid() {
  const ref = useRef<HTMLDivElement>(null);
  useColumnCount(ref);
  return (
    <div ref={ref} data-testid="grid">
      <div data-testid="cell" />
    </div>
  );
}

afterEach(() => {
  observed.length = 0;
  vi.unstubAllGlobals();
});

describe("useColumnCount", () => {
  it("watches the first cell, whose width moves when the tracks re-flow at the same grid width", () => {
    vi.stubGlobal("ResizeObserver", RecordingObserver);
    const { getByTestId } = render(<Grid />);
    expect(observed).toContain(getByTestId("grid"));
    expect(observed).toContain(getByTestId("cell"));
  });
});
