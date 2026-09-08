/**
 * Convenience builders for constructing an initial WorkspaceState without
 * hand-writing ids. All pure; ids are generated for you.
 */

import { createId } from "./ids";
import { createView, createStack } from "./reducer";
import type {
  LayoutNode,
  TabStack,
  WorkspaceState,
  WorkspaceView,
} from "./types";

export interface InitialStackSpec {
  /** View types to open in this stack, in tab order. */
  views: { type: string; title?: string; closable?: boolean; pinned?: boolean }[];
}

export interface InitialSplitSpec {
  direction: "horizontal" | "vertical";
  ratio?: number;
  first: InitialNodeSpec;
  second: InitialNodeSpec;
}

export type InitialNodeSpec = InitialStackSpec | InitialSplitSpec;

export function createInitialState(rootSpec: InitialNodeSpec): WorkspaceState {
  const views: Record<string, WorkspaceView> = {};
  const stacks: Record<string, TabStack> = {};
  let activeStackId: string | null = null;

  function build(spec: InitialNodeSpec): LayoutNode {
    if ("direction" in spec) {
      return {
        type: "split",
        id: createId("split"),
        direction: spec.direction,
        ratio: spec.ratio ?? 0.5,
        first: build(spec.first),
        second: build(spec.second),
      };
    }

    const stack = createStack();
    for (const viewSpec of spec.views) {
      const view = createView(viewSpec.type, viewSpec.title, viewSpec);
      views[view.id] = view;
      stack.viewIds.push(view.id);
    }
    stack.activeViewId = stack.viewIds[0] ?? null;
    stacks[stack.id] = stack;
    if (!activeStackId) activeStackId = stack.id;
    return { type: "stack", stackId: stack.id };
  }

  const tiled = build(rootSpec);
  return {
    views,
    stacks,
    tiled,
    activeStackId,
    floating: {},
    popouts: {},
    nextZIndex: 1,
  };
}
