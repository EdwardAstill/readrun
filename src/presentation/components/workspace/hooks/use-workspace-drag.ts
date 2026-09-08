/**
 * Workspace drag & drop context — interaction state for docking views by
 * dragging tabs. Deliberately NOT part of the reducer: an in-flight drag is
 * UI state, not workspace content (no persistence, no history entry).
 *
 * Behavior ported from tiling-tabs: native HTML5 drag from tabs, live drop
 * preview via dropTarget {stackId, edge}, dispatch on drop.
 */

import * as React from "react";

import { computeDropEdge } from "@/presentation/components/workspace/lib/drop-edge";
import type { DropEdge } from "@/presentation/components/workspace/lib/drop-edge";

export interface WorkspaceDragInfo {
  viewId: string;
  sourceStackId: string;
}

export interface WorkspaceDropTarget {
  stackId: string;
  edge: DropEdge;
}

interface WorkspaceDragContextValue {
  drag: WorkspaceDragInfo | null;
  dropTarget: WorkspaceDropTarget | null;
  beginDrag(info: WorkspaceDragInfo, dataTransfer?: DataTransfer | null): void;
  updateDropTarget(
    stackId: string,
    point: { x: number; y: number },
    element: Element,
  ): void;
  clearDropTarget(): void;
  endDrag(): void;
}

const WorkspaceDragContext =
  React.createContext<WorkspaceDragContextValue | null>(null);

export function WorkspaceDragProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drag, setDrag] = React.useState<WorkspaceDragInfo | null>(null);
  const [dropTarget, setDropTarget] =
    React.useState<WorkspaceDropTarget | null>(null);

  const value = React.useMemo<WorkspaceDragContextValue>(
    () => ({
      drag,
      dropTarget,
      beginDrag(info, dataTransfer) {
        if (dataTransfer) {
          dataTransfer.effectAllowed = "move";
          dataTransfer.setData("text/plain", info.viewId);
        }
        setDrag(info);
      },
      updateDropTarget(stackId, point, element) {
        setDropTarget({
          stackId,
          edge: computeDropEdge(point, element.getBoundingClientRect()),
        });
      },
      clearDropTarget() {
        setDropTarget(null);
      },
      endDrag() {
        setDrag(null);
        setDropTarget(null);
      },
    }),
    [drag, dropTarget],
  );

  // createElement keeps this a .ts file (no JSX) while providing context.
  return React.createElement(
    WorkspaceDragContext.Provider,
    { value },
    children,
  );
}

/** Null when no provider is mounted — drag sources/targets then no-op. */
export function useWorkspaceDrag(): WorkspaceDragContextValue | null {
  return React.useContext(WorkspaceDragContext);
}
