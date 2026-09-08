/**
 * Stack model — the "stacktab" layer. Pure operations on a single TabStack
 * record and view records: adding, removing, activating tabs. Knows nothing
 * about surfaces or the layout tree; the reducer composes these with the
 * layout and surface models.
 */

import { createId } from "../ids";
import type { TabStack, WorkspaceView } from "../types";

/** Create a view record. */
export function createView(
 type: string,
 title?: string,
 options: Pick<WorkspaceView, "closable" | "pinned"> = {},
): WorkspaceView {
 return { id: createId("view"), type, title: title ?? type,
  ...(options.closable !== undefined ? { closable: options.closable } : {}),
  ...(options.pinned !== undefined ? { pinned: options.pinned } : {}),
 };
}

/** Create a stack record, optionally seeded with views (first is active). */
export function createStack(viewIds: string[] = []): TabStack {
 return {
  id: createId("stack"),
  viewIds: [...viewIds],
  activeViewId: viewIds[0] ?? null,
 };
}

/** Append a view as a tab and activate it. */
export function addView(stack: TabStack, viewId: string): TabStack {
 return {
  ...stack,
  viewIds: [...stack.viewIds, viewId],
  activeViewId: viewId,
 };
}

/**
 * Remove a view's tab. Closing the active tab promotes the first remaining
 * tab; removing the last tab yields an empty stack (the caller decides
 * whether an empty stack is pruned, kept, or destroyed with its surface).
 */
export function removeView(stack: TabStack, viewId: string): TabStack {
 const viewIds = stack.viewIds.filter((id) => id !== viewId);
 const activeViewId =
  stack.activeViewId === viewId ? (viewIds[0] ?? null) : stack.activeViewId;
 return { ...stack, viewIds, activeViewId };
}

/** Activate an existing tab. */
export function activateView(stack: TabStack, viewId: string): TabStack {
 return stack.activeViewId === viewId
  ? stack
  : { ...stack, activeViewId: viewId };
}

/** Move the active tab forward (delta = 1) or backward (delta = -1), wrapping. */
export function cycleActive(stack: TabStack, delta: number): TabStack {
 if (stack.viewIds.length < 2) return stack;
 const index = stack.viewIds.indexOf(stack.activeViewId ?? "");
 const next = (index + delta + stack.viewIds.length) % stack.viewIds.length;
 return { ...stack, activeViewId: stack.viewIds[next] ?? null };
}

/** Does this stack hold the view as a tab? */
export function holdsView(
 stack: TabStack | undefined,
 viewId: string,
): boolean {
 return stack?.viewIds.includes(viewId) ?? false;
}
