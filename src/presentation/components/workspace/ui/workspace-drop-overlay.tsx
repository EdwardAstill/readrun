/**
 * Drop preview overlay for a stack, rendered while a view is dragged over
 * it — shows where the view will land BEFORE it drops (ported from
 * tiling-tabs): center = tab into the stack, edges = split at that edge.
 */

import { cn } from "@/presentation/components/ui/cn";
import type { DropEdge } from "@/presentation/components/workspace/lib/drop-edge";

export interface WorkspaceDropOverlayProps {
  edge: DropEdge;
}

export function WorkspaceDropOverlay({ edge }: WorkspaceDropOverlayProps) {
  return (
    <div
      aria-hidden="true"
      data-drop-edge={edge}
      className={cn(
        "pointer-events-none absolute z-20 border-2 border-primary/50 bg-primary/10",
        edge === "center" && "inset-2",
        edge === "left" && "inset-y-2 left-2 w-[calc(50%-0.5rem)]",
        edge === "right" && "inset-y-2 right-2 w-[calc(50%-0.5rem)]",
        edge === "top" && "inset-x-2 top-2 h-[calc(50%-0.5rem)]",
        edge === "bottom" && "inset-x-2 bottom-2 h-[calc(50%-0.5rem)]",
      )}
    />
  );
}
