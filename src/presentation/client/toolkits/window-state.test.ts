import { describe, expect, test } from "bun:test";
import {
  clampWindowRect,
  createToolkitWorkspaceState,
  reduceToolkitWindows,
} from "./window-state.ts";
import type { ToolkitDefinition } from "./types.ts";

const terminal: ToolkitDefinition = {
  id: "python-terminal",
  title: "Python Terminal",
  description: "Run browser Python",
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
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "open",
      definition: terminal,
      viewport,
    });

    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]).toMatchObject({
      id: "python-terminal",
      minimized: false,
      rect: { x: 24, y: 24, width: 640, height: 420 },
      zIndex: 2,
    });
  });

  test("returns the original state when raising an absent window", () => {
    const state = {
      windows: [
        {
          id: "python-terminal" as const,
          minimized: false,
          rect: { x: 24, y: 24, width: 640, height: 420 },
          zIndex: 1,
        },
      ],
      nextZIndex: 2,
    };

    const next = reduceToolkitWindows(state, {
      type: "raise",
      id: "scientific-calculator",
    });

    expect(next).toBe(state);
    expect(next).toEqual({
      windows: [
        {
          id: "python-terminal",
          minimized: false,
          rect: { x: 24, y: 24, width: 640, height: 420 },
          zIndex: 1,
        },
      ],
      nextZIndex: 2,
    });
  });

  test("minimizes, restores, and removes a window", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "minimize",
      id: "python-terminal",
    });
    expect(state.windows[0]?.minimized).toBe(true);

    state = reduceToolkitWindows(state, {
      type: "open",
      definition: terminal,
      viewport,
    });
    expect(state.windows[0]?.minimized).toBe(false);

    state = reduceToolkitWindows(state, {
      type: "close",
      id: "python-terminal",
    });
    expect(state.windows).toEqual([]);
  });

  test("clamps movement and size to the usable viewport", () => {
    expect(
      clampWindowRect(
        { x: 900, y: -20, width: 1200, height: 100 },
        viewport,
        terminal.minimumSize,
      ),
    ).toEqual({ x: 0, y: 0, width: 1000, height: 240 });
  });

  test("normalizes every open window after viewport shrink", () => {
    let state = reduceToolkitWindows(createToolkitWorkspaceState(), {
      type: "open",
      definition: terminal,
      viewport,
    });
    state = reduceToolkitWindows(state, {
      type: "set-rect",
      id: "python-terminal",
      rect: { x: 600, y: 400, width: 400, height: 300 },
      viewport,
      minimumSize: terminal.minimumSize,
    });
    state = reduceToolkitWindows(state, {
      type: "normalize",
      viewport: { width: 500, height: 360 },
      definitions: [terminal],
    });

    expect(state.windows[0]?.rect).toEqual({
      x: 100,
      y: 60,
      width: 400,
      height: 300,
    });
  });
});
