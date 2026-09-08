/**
 * Pure reducer for workspace state — a thin command interpreter over the
 * model layer:
 *
 *   model/stack.ts   — tab-level ops on a single stack record
 *   model/layout.ts  — tiled tree surgery (split, prune, resize)
 *   model/surface.ts — floating surfaces + unified view placement lookup
 *
 * Every operation is a plain function from (state, action) => state over
 * serializable data; the UI layer is only a projection of this.
 */

import type { WorkspaceAction } from "./actions";
import { createId } from "./ids";
import type { WorkspaceCommand } from "./keymap";
import type { DropEdge } from "./drop-edge";
import { withoutKey } from "./model/record";
import {
  activateView as activateTab,
  addView,
  createStack,
  createView,
  cycleActive,
  holdsView,
  removeView,
} from "./model/stack";
import {
  findFirstStackId,
  splitBeside,
  splitAtEdge,
  pruneStack,
  resizeSplit,
} from "./model/layout";
import {
  DEFAULT_POPOUT_HEIGHT,
  DEFAULT_POPOUT_WIDTH,
  cascadeGeometry,
  clampSurfaceSize,
  findPopoutForView,
  findStackIdForView,
  findSurfaceForStack,
  findSurfaceForView,
  isSurfaceStack,
} from "./model/surface";
import type {
  FloatingSurface,
  LayoutNode,
  LayoutStack,
  PopoutSurface,
  TabStack,
  WorkspaceState,
} from "./types";

export function reducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "view/open":
      return openView(state, action);
    case "view/close":
      return closeView(state, action.viewId);
    case "view/activate":
      return activateView(state, action.viewId);
    case "stack/split":
      return splitStack(state, action);
    case "layout/resize":
      return resizeLayout(state, action.splitId, action.ratio);
    case "view/float":
      return floatView(state, action);
    case "view/dock":
      return dockView(state, action.viewId);
    case "view/move":
      return moveView(state, action);
    case "floating/move":
      return moveFloating(state, action.surfaceId, action.x, action.y);
    case "floating/resize":
      return resizeFloating(
        state,
        action.surfaceId,
        action.width,
        action.height,
      );
    case "floating/focus":
      return focusFloating(state, action.surfaceId);
    case "floating/close":
      return closeFloating(state, action.surfaceId);
    case "view/popout":
      return popoutView(state, action);
    case "popout/close":
      return closePopout(state, action.surfaceId);
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// View actions
// ---------------------------------------------------------------------------

function openView(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { type: "view/open" }>,
): WorkspaceState {
  const stackId =
    action.stackId ?? state.activeStackId ?? findFirstStackId(state.tiled);
  const stack = stackId ? state.stacks[stackId] : undefined;
  if (!stack) return state;

  const view = createView(action.viewType, action.title, action);
  return {
    ...state,
    activeStackId: stack.id,
    views: { ...state.views, [view.id]: view },
    stacks: { ...state.stacks, [stack.id]: addView(stack, view.id) },
  };
}

function closeView(state: WorkspaceState, viewId: string): WorkspaceState {
  const view = state.views[viewId];
  if (!view || view.closable === false) return state;

  // The view may live in a floating window instead of the tiled tree.
  const surface = findSurfaceForView(state, viewId);
  if (surface) {
    const stack = state.stacks[surface.stackId];
    if (!stack) return state;
    const closed = removeView(stack, viewId);
    if (closed.viewIds.length > 0) {
      return {
        ...state,
        views: withoutKey(state.views, viewId),
        stacks: { ...state.stacks, [stack.id]: closed },
      };
    }
    // Last tab of the window closed — the window goes with it.
    return closeFloating(state, surface.id);
  }

  // The view may live in a popout window instead of the tiled tree.
  const popout = findPopoutForView(state, viewId);
  if (popout) {
    const stack = state.stacks[popout.stackId];
    if (!stack) return state;
    const closed = removeView(stack, viewId);
    if (closed.viewIds.length > 0) {
      return {
        ...state,
        views: withoutKey(state.views, viewId),
        stacks: { ...state.stacks, [stack.id]: closed },
      };
    }
    // Last tab of the popout closed — the window goes with it.
    return closePopout(state, popout.id);
  }

  const stackId = findStackIdForView(state, viewId);
  const stack = stackId ? state.stacks[stackId] : undefined;
  if (!stack) return state;

  const closed = removeView(stack, viewId);
  let stacks = { ...state.stacks, [stack.id]: closed };
  let tiled = state.tiled;

  // Prune the stack from the tree if it became empty, collapsing its parent
  // split so the sibling takes the full space. The lone tiled stack stays
  // (empty) so the tiled surface never vanishes — but the view still closes.
  if (closed.viewIds.length === 0) {
    const wasRootStack = tiled.type === "stack" && tiled.stackId === stack.id;
    if (!wasRootStack) {
      const pruned = pruneStack(tiled, stack.id);
      if (!pruned) return state;
      tiled = pruned.node;
      stacks = withoutKey(stacks, stack.id);
    }
  }

  return {
    ...state,
    views: withoutKey(state.views, viewId),
    stacks,
    tiled,
    // Keep tools and keyboard commands aimed at a surviving pane.
    activeStackId:
      state.activeStackId === stack.id
        ? (stacks[stack.id] ? stack.id : findFirstStackId(tiled) ?? null)
        : state.activeStackId,
  };
}

function activateView(state: WorkspaceState, viewId: string): WorkspaceState {
  const stackId = findStackIdForView(state, viewId);
  const stack = stackId ? state.stacks[stackId] : undefined;
  if (!stack || !holdsView(stack, viewId)) return state;

  return {
    ...state,
    activeStackId: stack.id,
    stacks: { ...state.stacks, [stack.id]: activateTab(stack, viewId) },
  };
}

function moveView(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { type: "view/move" }>,
): WorkspaceState {
  const { viewId, targetStackId, edge } = action;
  if (!canMoveView(state, viewId, targetStackId)) return state;

  const sourcePopout = findPopoutForView(state, viewId);
  const sourceSurface = sourcePopout
    ? undefined
    : findSurfaceForView(state, viewId);
  const sourceStackId =
    sourcePopout?.stackId ??
    sourceSurface?.stackId ??
    findStackIdForView(state, viewId);
  if (!sourceStackId) return state;

  const sourceStack = state.stacks[sourceStackId];
  const targetStack = state.stacks[targetStackId];
  if (!sourceStack || !targetStack) return state;

  // Edge splits are a tiled-tree operation; floating and popout targets
  // take center.
  const effectiveEdge: DropEdge = isSurfaceStack(state, targetStackId)
    ? "center"
    : edge;

  if (sourceStackId === targetStackId) {
    if (effectiveEdge === "center") return activateView(state, viewId);
    // Splitting a stack against itself needs another tab to leave behind.
    if (sourceStack.viewIds.length <= 1) return state;
  }

  // 1) Detach the view from its current stack.
  let stacks = state.stacks;
  let tiled = state.tiled;
  let floating = state.floating;
  let popouts = state.popouts;

  if (sourcePopout) {
    const detached = removeView(sourceStack, viewId);
    if (detached.viewIds.length > 0) {
      stacks = { ...stacks, [sourceStackId]: detached };
    } else {
      // An empty popout window disappears with its last view.
      stacks = withoutKey(stacks, sourceStackId);
      popouts = withoutKey(popouts, sourcePopout.id);
    }
  } else if (sourceSurface) {
    const detached = removeView(sourceStack, viewId);
    if (detached.viewIds.length > 0) {
      stacks = { ...stacks, [sourceStackId]: detached };
    } else {
      // An empty floating window disappears with its last view.
      stacks = withoutKey(stacks, sourceStackId);
      floating = withoutKey(floating, sourceSurface.id);
    }
  } else {
    const detachedFrom = detachFromTiledStack(state, sourceStack, viewId);
    if (!detachedFrom) return state;
    stacks = detachedFrom.stacks;
    tiled = detachedFrom.tiled;
  }

  // 2) Insert into the target.
  if (effectiveEdge === "center") {
    return {
      ...state,
      stacks: {
        ...stacks,
        [targetStackId]: addView(targetStack, viewId),
      },
      tiled,
      floating,
      popouts,
      activeStackId: targetStackId,
    };
  }

  // Edge drop: a fresh stack beside the target in the tiled tree, 50/50.
  const newStack = createStack([viewId]);
  const direction =
    edge === "left" || edge === "right" ? "horizontal" : "vertical";
  const before = edge === "left" || edge === "top";
  const splitRoot = splitAtEdge(
    tiled,
    targetStackId,
    newStack.id,
    direction,
    before,
  );
  if (splitRoot === tiled) return state; // target stack not in the tree

  return {
    ...state,
    stacks: { ...stacks, [newStack.id]: newStack },
    tiled: splitRoot,
    floating,
    popouts,
    activeStackId: newStack.id,
  };
}

// ---------------------------------------------------------------------------
// Splitting
// ---------------------------------------------------------------------------

function splitStack(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { type: "stack/split" }>,
): WorkspaceState {
  const stackId = action.stackId ?? state.activeStackId;
  if (!stackId) return state;
  const stack = state.stacks[stackId];
  if (!stack) return state;

  // Splitting is a tiled-tree operation. Floating windows and popouts host
  // a single unsplittable stack, so "split" there degrades to opening a
  // tab (or moving a view into the window as a tab).
  if (isSurfaceStack(state, stackId)) {
    if (action.viewType) {
      const view = createView(action.viewType, action.title, action);
      return {
        ...state,
        views: { ...state.views, [view.id]: view },
        stacks: { ...state.stacks, [stack.id]: addView(stack, view.id) },
        activeStackId: stack.id,
      };
    }
    if (action.viewId) {
      return moveView(state, {
        type: "view/move",
        viewId: action.viewId,
        targetStackId: stackId,
        edge: "center",
      });
    }
    return state;
  }

  let views = state.views;
  let seedViewId: string | null = null;

  if (action.viewType) {
    const view = createView(action.viewType, action.title, action);
    views = { ...views, [view.id]: view };
    seedViewId = view.id;
  } else if (action.viewId) {
    const view = state.views[action.viewId];
    if (!view) return state;
    if (!holdsView(stack, action.viewId)) return state;

    const source = removeView(stack, action.viewId);
    // The view is the stack's only content: a split would just relocate it
    // (and orphan an empty stack) — leave the stack as it is.
    if (source.viewIds.length === 0) return state;

    const newStack = createStack([action.viewId]);
    return {
      ...state,
      views,
      stacks: {
        ...state.stacks,
        [stack.id]: source,
        [newStack.id]: newStack,
      },
      tiled: splitBeside(
        state.tiled,
        stack.id,
        newStack.id,
        action.direction,
        action.ratio,
      ),
      activeStackId: newStack.id,
    };
  }
  // Neither viewType nor viewId: an empty new stack.

  const newStack = createStack(seedViewId ? [seedViewId] : []);
  return {
    ...state,
    views,
    stacks: { ...state.stacks, [newStack.id]: newStack },
    tiled: splitBeside(
      state.tiled,
      stack.id,
      newStack.id,
      action.direction,
      action.ratio,
    ),
    activeStackId: newStack.id,
  };
}

function resizeLayout(
  state: WorkspaceState,
  splitId: string,
  ratio: number,
): WorkspaceState {
  const tiled = resizeSplit(state.tiled, splitId, ratio);
  return tiled === state.tiled ? state : { ...state, tiled };
}

// ---------------------------------------------------------------------------
// Floating surfaces
// ---------------------------------------------------------------------------

function floatView(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { type: "view/float" }>,
): WorkspaceState {
  let viewId: string;
  let views = state.views;
  let stacks = state.stacks;
  let tiled = state.tiled;

  if (action.viewId) {
    const view = state.views[action.viewId];
    if (!view || view.pinned) return state;
    if (findSurfaceForView(state, action.viewId)) return state; // already floating
    if (findPopoutForView(state, action.viewId)) return state; // already popped out

    const sourceId = findStackIdForView(state, action.viewId);
    const source = sourceId ? state.stacks[sourceId] : undefined;
    if (!source) return state;

    const detachedFrom = detachFromTiledStack(state, source, action.viewId);
    if (!detachedFrom) return state;
    stacks = detachedFrom.stacks;
    tiled = detachedFrom.tiled;
    viewId = action.viewId;
  } else if (action.viewType) {
    const view = createView(action.viewType, action.title, action);
    views = { ...views, [view.id]: view };
    viewId = view.id;
  } else {
    return state;
  }

  const newStack = createStack([viewId]);
  // Default geometry cascades so successive floats don't perfectly overlap.
  const geometry =
    action.geometry ?? cascadeGeometry(Object.keys(state.floating).length);
  const surface: FloatingSurface = {
    id: createId("float"),
    stackId: newStack.id,
    ...geometry,
    zIndex: state.nextZIndex,
  };

  return {
    views,
    stacks: { ...stacks, [newStack.id]: newStack },
    tiled,
    activeStackId: newStack.id,
    floating: { ...state.floating, [surface.id]: surface },
    popouts: state.popouts,
    nextZIndex: state.nextZIndex + 1,
  };
}

function dockView(state: WorkspaceState, viewId: string): WorkspaceState {
  if (state.views[viewId]?.pinned) return state;
  const float = findSurfaceForView(state, viewId);
  const popout = findPopoutForView(state, viewId);
  const surface = float ?? popout;
  if (!surface) return state;
  const sourceStack = state.stacks[surface.stackId];
  if (!sourceStack) return state;
  const detached = removeView(sourceStack, viewId);

  // Dock target: the focused stack if it is tiled, else the first tiled one.
  const activeIsTiled =
    state.activeStackId !== null && !isSurfaceStack(state, state.activeStackId);
  const targetId =
    (activeIsTiled ? state.activeStackId : undefined) ??
    findFirstStackId(state.tiled);
  if (!targetId) return state;
  const target = state.stacks[targetId];
  if (!target) return state;

  let stacks = { ...state.stacks, [target.id]: addView(target, viewId) };
  let floating = state.floating;
  let popouts = state.popouts;
  if (detached.viewIds.length > 0) {
    stacks = { ...stacks, [sourceStack.id]: detached };
  } else if (float) {
    // The floating window was hosting only this view — it goes away.
    stacks = withoutKey(stacks, sourceStack.id);
    floating = withoutKey(floating, float.id);
  } else if (popout) {
    // The popout window was hosting only this view — it goes away.
    stacks = withoutKey(stacks, sourceStack.id);
    popouts = withoutKey(popouts, popout.id);
  } else {
    return state;
  }

  return {
    ...state,
    stacks,
    floating,
    popouts,
    activeStackId: target.id,
  };
}

/**
 * Move a view into a popout browser window: a dedicated single-view stack
 * hosted by a PopoutSurface. The live Window handle is managed by the
 * popouts hook layer; state keeps only serializable facts.
 */
function popoutView(
  state: WorkspaceState,
  action: Extract<WorkspaceAction, { type: "view/popout" }>,
): WorkspaceState {
  const view = state.views[action.viewId];
  if (!view || view.pinned) return state;
  if (
    findSurfaceForView(state, action.viewId) ||
    findPopoutForView(state, action.viewId)
  ) {
    return state; // already on a non-tiled surface
  }

  const sourceId = findStackIdForView(state, action.viewId);
  const source = sourceId ? state.stacks[sourceId] : undefined;
  if (!source) return state;

  let stacks = state.stacks;
  let tiled = state.tiled;
  let floating = state.floating;

  const sourceFloat = findSurfaceForStack(state, source.id);
  const detached = removeView(source, action.viewId);
  if (detached.viewIds.length > 0) {
    stacks = { ...stacks, [source.id]: detached };
  } else if (sourceFloat) {
    // The floating window was hosting only this view — it goes away.
    stacks = withoutKey(stacks, source.id);
    floating = withoutKey(floating, sourceFloat.id);
  } else {
    const detachedFrom = detachFromTiledStack(state, source, action.viewId);
    if (!detachedFrom) return state;
    stacks = detachedFrom.stacks;
    tiled = detachedFrom.tiled;
  }

  const newStack = createStack([action.viewId]);
  const surface: PopoutSurface = {
    id: action.surfaceId,
    stackId: newStack.id,
    width: action.width ?? DEFAULT_POPOUT_WIDTH,
    height: action.height ?? DEFAULT_POPOUT_HEIGHT,
  };

  return {
    views: state.views,
    stacks: { ...stacks, [newStack.id]: newStack },
    tiled,
    activeStackId: newStack.id,
    floating,
    popouts: { ...state.popouts, [surface.id]: surface },
    nextZIndex: state.nextZIndex,
  };
}

/** Close a popout window and every view inside it. */
function closePopout(state: WorkspaceState, surfaceId: string): WorkspaceState {
  const surface = state.popouts[surfaceId];
  if (!surface) return state;
  const stack = state.stacks[surface.stackId];

  let views = state.views;
  if (stack) {
    for (const viewId of stack.viewIds) {
      views = withoutKey(views, viewId);
    }
  }

  return {
    ...state,
    views,
    stacks: stack ? withoutKey(state.stacks, stack.id) : state.stacks,
    popouts: withoutKey(state.popouts, surfaceId),
    activeStackId:
      state.activeStackId === surface.stackId ? null : state.activeStackId,
  };
}

function moveFloating(
  state: WorkspaceState,
  surfaceId: string,
  x: number,
  y: number,
): WorkspaceState {
  const surface = state.floating[surfaceId];
  if (!surface) return state;
  if (surface.x === x && surface.y === y) return state;
  return {
    ...state,
    floating: { ...state.floating, [surfaceId]: { ...surface, x, y } },
  };
}

function resizeFloating(
  state: WorkspaceState,
  surfaceId: string,
  width: number,
  height: number,
): WorkspaceState {
  const surface = state.floating[surfaceId];
  if (!surface) return state;
  const clamped = clampSurfaceSize(width, height);
  if (clamped.width === surface.width && clamped.height === surface.height) {
    return state;
  }
  return {
    ...state,
    floating: { ...state.floating, [surfaceId]: { ...surface, ...clamped } },
  };
}

function focusFloating(
  state: WorkspaceState,
  surfaceId: string,
): WorkspaceState {
  const surface = state.floating[surfaceId];
  if (!surface) return state;

  // Already in front: just make sure its stack holds focus.
  if (surface.zIndex === state.nextZIndex - 1) {
    return state.activeStackId === surface.stackId
      ? state
      : { ...state, activeStackId: surface.stackId };
  }
  return {
    ...state,
    activeStackId: surface.stackId,
    floating: {
      ...state.floating,
      [surfaceId]: { ...surface, zIndex: state.nextZIndex },
    },
    nextZIndex: state.nextZIndex + 1,
  };
}

function closeFloating(
  state: WorkspaceState,
  surfaceId: string,
): WorkspaceState {
  const surface = state.floating[surfaceId];
  if (!surface) return state;
  const stack = state.stacks[surface.stackId];
  if (stack?.viewIds.some((id) => state.views[id]?.closable === false)) return state;

  let views = state.views;
  if (stack) {
    for (const viewId of stack.viewIds) {
      views = withoutKey(views, viewId);
    }
  }

  return {
    ...state,
    views,
    stacks: stack ? withoutKey(state.stacks, stack.id) : state.stacks,
    floating: withoutKey(state.floating, surfaceId),
    activeStackId:
      state.activeStackId === surface.stackId ? findFirstStackId(state.tiled) ?? null : state.activeStackId,
  };
}

// ---------------------------------------------------------------------------
// Keymap commands
// ---------------------------------------------------------------------------

/**
 * Resolve a high-level keymap command against current state. Commands act on
 * the active view of the active stack (tiled or floating).
 */
export function applyWorkspaceCommand(
  state: WorkspaceState,
  command: WorkspaceCommand,
): WorkspaceState {
  switch (command) {
    case "view/close": {
      const viewId = activeViewId(state);
      return viewId ? closeView(state, viewId) : state;
    }
    case "view/activate-next":
      return cycleActiveView(state, 1);
    case "view/activate-prev":
      return cycleActiveView(state, -1);
    case "view/float": {
      const viewId = activeViewId(state);
      return viewId ? floatView(state, { type: "view/float", viewId }) : state;
    }
    case "view/dock": {
      const viewId = activeViewId(state);
      return viewId ? dockView(state, viewId) : state;
    }
    case "view/popout": {
      const viewId = activeViewId(state);
      return viewId
        ? popoutView(state, {
            type: "view/popout",
            surfaceId: createId("popout"),
            viewId,
          })
        : state;
    }
    default:
      return state;
  }
}

function activeViewId(state: WorkspaceState): string | null {
  const stack = state.activeStackId
    ? state.stacks[state.activeStackId]
    : undefined;
  return stack?.activeViewId ?? null;
}

function cycleActiveView(state: WorkspaceState, delta: number): WorkspaceState {
  const stack = state.activeStackId
    ? state.stacks[state.activeStackId]
    : undefined;
  if (!stack) return state;
  const next = cycleActive(stack, delta);
  if (next === stack) return state;
  return { ...state, stacks: { ...state.stacks, [stack.id]: next } };
}

// ---------------------------------------------------------------------------
// Shared detach helper
// ---------------------------------------------------------------------------

/**
 * Remove a view from its tiled stack. Empty non-tiled stacks are pruned from
 * the tree (collapsing their split); the lone empty tiled stack is kept so
 * the tiled surface never vanishes. Returns null if pruning failed
 * (caller keeps state unchanged).
 */
function detachFromTiledStack(
  state: WorkspaceState,
  source: TabStack,
  viewId: string,
): { stacks: WorkspaceState["stacks"]; tiled: LayoutNode } | null {
  const detached = removeView(source, viewId);
  const isRootStack =
    state.tiled.type === "stack" && state.tiled.stackId === source.id;

  if (detached.viewIds.length > 0 || isRootStack) {
    return {
      stacks: { ...state.stacks, [source.id]: detached },
      tiled: state.tiled,
    };
  }

  const pruned = pruneStack(state.tiled, source.id);
  if (!pruned) return null;
  return {
    stacks: withoutKey(state.stacks, source.id),
    tiled: pruned.node,
  };
}

// ---------------------------------------------------------------------------
// Public query helpers — stable API for consumers of the lib
// ---------------------------------------------------------------------------

export function findStack(
  state: WorkspaceState,
  stackId: string,
): TabStack | undefined {
  return state.stacks[stackId];
}

export function findStackForView(
  state: WorkspaceState,
  viewId: string,
): TabStack | undefined {
  const stackId = findStackIdForView(state, viewId);
  return stackId ? state.stacks[stackId] : undefined;
}

export function isLayoutStack(node: LayoutNode): node is LayoutStack {
  return node.type === "stack";
}

export { createView, createStack } from "./model/stack";

/** Pinned views may move between stacks only within the same surface kind. */
export function canMoveView(
  state: WorkspaceState,
  viewId: string,
  targetStackId: string,
): boolean {
  const view = state.views[viewId];
  if (!view || !state.stacks[targetStackId]) return false;
  const sourceStackId = findStackIdForView(state, viewId);
  if (!sourceStackId) return false;
  if (!view.pinned) return true;
  const kind = (stackId: string) =>
    findSurfaceForStack(state, stackId)
      ? "floating"
      : isSurfaceStack(state, stackId) ? "popout" : "tiled";
  return kind(sourceStackId) === kind(targetStackId);
}
