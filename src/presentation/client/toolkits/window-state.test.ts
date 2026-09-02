import { describe, expect, test } from "bun:test";
import {
  clampWindowRect,
  createToolkitWorkspaceState,
  reduceToolkitWindows,
} from "./window-state.ts";
import type { ToolkitDefinition } from "./types.ts";

const calculator: ToolkitDefinition = {
  id: "scientific-calculator",
  title: "Scientific Calculator",
  description: "Open the scientific calculator.",
  defaultSize: { width: 640, height: 420 },
  minimumSize: { width: 360, height: 240 },
  render: () => null,
};

const viewport = { width: 1000, height: 700 };

describe("floating toolkit state", () => {
  test("opens one bounded window and raises rather than duplicates it", () => {
    let state = createToolkitWorkspaceState();
    state = reduceToolkitWindows(state, {
      type: "open",
      definition: calculator,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "open",
      definition: calculator,
      viewport,
    });

    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]).toMatchObject({
      id: "scientific-calculator",
      minimized: false,
      rect: { x: 24, y: 24, width: 640, height: 420 },
      zIndex: 2,
    });
  });

  test("returns the original state when raising an absent window", () => {
    const state = createToolkitWorkspaceState();

    const next = reduceToolkitWindows(state, {
      type: "raise",
      id: "scientific-calculator",
    });

    expect(next).toBe(state);
    expect(next).toEqual({ windows: [], nextZIndex: 1 });
  });

  test("minimizes, restores, and removes a window", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: calculator,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "minimize",
      id: "scientific-calculator",
    });
    expect(state.windows[0]?.minimized).toBe(true);

    state = reduceToolkitWindows(state, {
      type: "open",
      definition: calculator,
      viewport,
    });
    expect(state.windows[0]?.minimized).toBe(false);

    state = reduceToolkitWindows(state, {
      type: "close",
      id: "scientific-calculator",
    });
    expect(state.windows).toEqual([]);
  });

  test("clamps movement and size to the usable viewport", () => {
    expect(
      clampWindowRect(
        { x: 900, y: -20, width: 1200, height: 100 },
        viewport,
        calculator.minimumSize,
      ),
    ).toEqual({ x: 0, y: 0, width: 1000, height: 240 });
  });

  test("normalizes every open window after viewport shrink", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: calculator,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "set-rect",
      id: "scientific-calculator",
      rect: { x: 600, y: 400, width: 400, height: 300 },
      viewport,
      minimumSize: calculator.minimumSize,
    });
    state = reduceToolkitWindows(state, {
      type: "normalize",
      viewport: { width: 500, height: 360 },
      definitions: [calculator],
    });

    expect(state.windows[0]?.rect).toEqual({
      x: 100,
      y: 60,
      width: 400,
      height: 300,
    });
  });
});
