/**
 * Surface model — floating-window queries and geometry, plus the space-level
 * view lookup that unifies tiled and floating placement. Pure functions over
 * WorkspaceState.
 *
 * The central invariant this module encodes: a view lives in exactly one
 * stack, and that stack is reachable either through a floating surface or
 * through the tiled tree — never neither, never both.
 */

import { findStackIdForView as findTiledStackIdForView } from "./layout";
import type { FloatingSurface, PopoutSurface, WorkspaceState } from "../types";

/** Minimum floating window dimensions the reducer enforces. */
export const MIN_FLOATING_WIDTH = 200;
export const MIN_FLOATING_HEIGHT = 140;

/** Default popout browser window dimensions. */
export const DEFAULT_POPOUT_WIDTH = 520;
export const DEFAULT_POPOUT_HEIGHT = 400;

/** The surface hosting the stack, if the stack is floating. */
export function findSurfaceForStack(
 state: WorkspaceState,
 stackId: string,
): FloatingSurface | undefined {
 return Object.values(state.floating).find((s) => s.stackId === stackId);
}

/** The popout surface hosting the stack, if the stack is popped out. */
export function findPopoutForStack(
 state: WorkspaceState,
 stackId: string,
): PopoutSurface | undefined {
 return Object.values(state.popouts).find((s) => s.stackId === stackId);
}

/** The floating surface whose stack holds the view, if any. */
export function findSurfaceForView(
 state: WorkspaceState,
 viewId: string,
): FloatingSurface | undefined {
 for (const surface of Object.values(state.floating)) {
  if (state.stacks[surface.stackId]?.viewIds.includes(viewId)) {
   return surface;
  }
 }
 return undefined;
}

/** The popout surface whose stack holds the view, if any. */
export function findPopoutForView(
 state: WorkspaceState,
 viewId: string,
): PopoutSurface | undefined {
 for (const surface of Object.values(state.popouts)) {
  if (state.stacks[surface.stackId]?.viewIds.includes(viewId)) {
   return surface;
  }
 }
 return undefined;
}

/**
 * Is this stack hosted by a non-tiled surface (floating window or popout)?
 * Such stacks host a single unsplittable stack, so edge drops and splits
 * targeting them degrade to "center".
 */
export function isSurfaceStack(
 state: WorkspaceState,
 stackId: string,
): boolean {
 return (
  findSurfaceForStack(state, stackId) !== undefined ||
  findPopoutForStack(state, stackId) !== undefined
 );
}

/**
 * Find the stack that actually CONTAINS a view — checking floating surfaces
 * first, then the tiled tree. Membership-checked: a stack that merely
 * appears first in the tree must never be returned for an unrelated view.
 */
export function findStackIdForView(
 state: WorkspaceState,
 viewId: string,
): string | undefined {
 for (const surface of Object.values(state.floating)) {
  if (state.stacks[surface.stackId]?.viewIds.includes(viewId)) {
   return surface.stackId;
  }
 }
 for (const surface of Object.values(state.popouts)) {
  if (state.stacks[surface.stackId]?.viewIds.includes(viewId)) {
   return surface.stackId;
  }
 }
 return findTiledStackIdForView(
  state.tiled,
  (stackId) => state.stacks[stackId]?.viewIds.includes(viewId) ?? false,
 );
}

/**
 * Default geometry for a newly floated window: cascades by 28px per existing
 * surface so successive floats don't perfectly overlap.
 */
export function cascadeGeometry(existingSurfaceCount: number): {
 x: number;
 y: number;
 width: number;
 height: number;
} {
 const offset = existingSurfaceCount * 28;
 return { x: 48 + offset, y: 48 + offset, width: 360, height: 260 };
}

/** Clamp a floating window's size to the reducer's minimums. */
export function clampSurfaceSize(
 width: number,
 height: number,
): { width: number; height: number } {
 return {
  width: Math.max(MIN_FLOATING_WIDTH, width),
  height: Math.max(MIN_FLOATING_HEIGHT, height),
 };
}
