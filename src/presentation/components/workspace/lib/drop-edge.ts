/**
 * Drop-edge detection for drag & drop docking, ported from tiling-tabs.
 * Pure geometry: given a pointer position and a stack's bounding rect, find
 * which edge zone the pointer is in. Near an edge (within `threshold` of the
 * stack's normalized extent) means "split at that edge"; anywhere else means
 * "drop as a tab into the stack" (center).
 */

export type DropEdge = "top" | "right" | "bottom" | "left" | "center";

export interface DropPoint {
 x: number;
 y: number;
}

export interface DropRect {
 left: number;
 top: number;
 width: number;
 height: number;
}

export function computeDropEdge(
 point: DropPoint,
 rect: DropRect,
 threshold = 0.24,
): DropEdge {
 if (rect.width <= 0 || rect.height <= 0) return "center";
 const x = Math.min(Math.max((point.x - rect.left) / rect.width, 0), 1);
 const y = Math.min(Math.max((point.y - rect.top) / rect.height, 0), 1);
 const edges: Array<[Exclude<DropEdge, "center">, number]> = [
  ["left", x],
  ["right", 1 - x],
  ["top", y],
  ["bottom", 1 - y],
 ];
 const nearest = edges.reduce((best, edge) =>
  edge[1] < best[1] ? edge : best,
 );
 return nearest[1] <= threshold ? nearest[0] : "center";
}
