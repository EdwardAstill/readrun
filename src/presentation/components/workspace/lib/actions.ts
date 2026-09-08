/**
 * All state transitions are expressed as plain action objects handled by the
 * reducer. Keeping them serializable makes time-travel debugging, undo, and
 * persistence straightforward later.
 */

import type { ViewType } from "./types";

export type WorkspaceAction =
 /**
  * Open a new view of `viewType` and add it to a stack. If `stackId` is
  * omitted, the active stack is used (falling back to the first stack in
  * the tiled tree). The new view becomes active in its stack.
  */
 | { type: "view/open"; viewType: ViewType; title?: string; closable?: boolean; pinned?: boolean; stackId?: string }

 /** Close a view. Empty stacks are pruned from the tree automatically. */
 | { type: "view/close"; viewId: string }

 /** Make a view the active tab of the stack that contains it. */
 | { type: "view/activate"; viewId: string }

 /**
  * Split the tree at the node holding `stackId` (defaults to the active
  * stack), creating a new stack as the second child. The new stack receives
  * either a newly opened view (`viewType`) or an existing view moved out of
  * the split stack (`viewId`). The new stack becomes the active stack.
  */
 | {
    type: "stack/split";
    stackId?: string;
    direction: "horizontal" | "vertical";
    ratio?: number;
    viewType?: ViewType;
    title?: string;
    closable?: boolean;
    pinned?: boolean;
    viewId?: string;
   }

 /**
  * Set the ratio of the split with `splitId`. Clamped by the reducer so a
  * pane can never be squeezed out of existence.
  */
 | { type: "layout/resize"; splitId: string; ratio: number }

 /**
  * Float a view in a new floating window. With `viewId`, an existing view
  * moves out of its tiled stack (which is pruned if it becomes empty);
  * with `viewType`, a new view opens straight into the float. Geometry
  * defaults cascade from the top-left; pass `geometry` to place explicitly.
  */
 | {
    type: "view/float";
    viewId?: string;
    viewType?: ViewType;
    title?: string;
    closable?: boolean;
    pinned?: boolean;
    geometry?: { x: number; y: number; width: number; height: number };
   }

 /** Move a view out of a floating window back into the tiled tree. */
 | { type: "view/dock"; viewId: string }

 /**
  * Move a view into another stack. "center" adds it as a tab; edges split
  * the target stack in the tiled tree and place the view in the new half
  * (50/50). Edge drops targeting a floating window are treated as "center"
  * — windows host a single stack and don't split (yet).
  */
 | {
    type: "view/move";
    viewId: string;
    targetStackId: string;
    edge: "top" | "right" | "bottom" | "left" | "center";
   }

 /** Move a view into a popout browser window (single-view stack). */
 | {
    type: "view/popout";
    surfaceId: string;
    viewId: string;
    width?: number;
    height?: number;
   }

 /** Close a popout window and all views inside it. */
 | { type: "popout/close"; surfaceId: string }

 /** Reposition a floating window. Coordinates are unclamped. */
 | { type: "floating/move"; surfaceId: string; x: number; y: number }

 /** Resize a floating window. Clamped to minimum dimensions. */
 | { type: "floating/resize"; surfaceId: string; width: number; height: number }

 /** Bring a floating window to the front and focus its stack. */
 | { type: "floating/focus"; surfaceId: string }

 /** Close a floating window and all views inside it. */
 | { type: "floating/close"; surfaceId: string };
