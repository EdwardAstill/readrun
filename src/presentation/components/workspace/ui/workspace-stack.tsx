/**
 * Renders one stack: its tab strip plus the active view. Placement-agnostic —
 * the same component renders a stack in the tiled tree, a floating window, or
 * a popout surface.
 */

import * as React from "react";

import { cn } from "@/presentation/components/ui/cn";
import { TabsContent } from "@/presentation/components/ui/Tabs";
import {
  useViewComponent,
  useWorkspaceDispatch,
  useWorkspaceState,
} from "@/presentation/components/workspace/hooks/use-workspace";
import { useWorkspaceDrag } from "@/presentation/components/workspace/hooks/use-workspace-drag";
import { WorkspaceTabList } from "@/presentation/components/workspace/ui/workspace-tab-list";
import { WorkspaceDropOverlay } from "@/presentation/components/workspace/ui/workspace-drop-overlay";
import { canMoveView } from "@/presentation/components/workspace/lib/reducer";
import type { WorkspaceState } from "@/presentation/components/workspace/lib/types";

export interface WorkspaceStackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stackId: string;
}

export function WorkspaceStack({
  stackId,
  className,
  ...props
}: WorkspaceStackProps) {
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  const dragContext = useWorkspaceDrag();

  // Drop-target handlers (early-return without an active drag). Mirrors
  // tiling-tabs: dragover computes the edge live, drop dispatches view/move.
  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!dragContext?.drag) return;
    if (!canMoveView(state, dragContext.drag.viewId, stackId)) {
      event.dataTransfer.dropEffect = "none";
      dragContext.clearDropTarget();
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    dragContext.updateDropTarget(
      stackId,
      { x: event.clientX, y: event.clientY },
      event.currentTarget,
    );
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!dragContext?.drag) return;
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      dragContext.clearDropTarget();
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    const drag = dragContext?.drag;
    if (!dragContext || !drag) return;
    event.preventDefault();
    const edge =
      dragContext.dropTarget?.stackId === stackId
        ? dragContext.dropTarget.edge
        : "center";
    dispatch({
      type: "view/move",
      viewId: drag.viewId,
      targetStackId: stackId,
      edge,
    });
    dragContext.endDrag();
  }

  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background",
        state.activeStackId === stackId && "ring-1 ring-ring/40",
        className,
      )}
      data-stack-id={stackId}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      {...props}
    >
      <StackBody stackId={stackId} />
      {dragContext?.drag && dragContext.dropTarget?.stackId === stackId ? (
        <WorkspaceDropOverlay edge={dragContext.dropTarget.edge} />
      ) : null}
    </div>
  );
}

/** Subscribes to the store so the shell above doesn't re-render on changes. */
function StackBody({ stackId }: { stackId: string }) {
  const state = useWorkspaceState();
  const stack = state.stacks[stackId];
  if (!stack) return null;

  const activeView = stack.activeViewId
    ? state.views[stack.activeViewId]
    : undefined;

  return (
    <WorkspaceTabList stackId={stackId}>
      {activeView ? (
        <TabsContent value={activeView.id} className="flex min-h-0 flex-col">
          <StackContent view={activeView} />
        </TabsContent>
      ) : (
        <StackContent view={null} />
      )}
    </WorkspaceTabList>
  );
}

function StackContent({
  view,
}: {
  view: WorkspaceState["views"][string] | null;
}) {
  const View = useViewComponent(view?.type ?? "");

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {view && View ? (
        <View view={view} />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
          {view
            ? `No component registered for view type "${view.type}".`
            : "No open views."}
        </div>
      )}
    </div>
  );
}
