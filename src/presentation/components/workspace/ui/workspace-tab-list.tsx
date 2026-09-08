/**
 * Tab strip for a single stack. Fully placement-agnostic: it reads its stack
 * from workspace state and works the same inside a split, a floating window,
 * or a popout.
 */

import * as React from "react";

import { cn } from "@/presentation/components/ui/cn";
import { Tabs, TabsList, TabsTrigger } from "@/presentation/components/ui/Tabs";
import {
  useWorkspaceDispatch,
  useWorkspaceState,
} from "@/presentation/components/workspace/hooks/use-workspace";
import { useWorkspaceDrag } from "@/presentation/components/workspace/hooks/use-workspace-drag";

export interface WorkspaceTabListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  stackId: string;
}

export function WorkspaceTabList({
  stackId,
  className,
  children,
  ...props
}: WorkspaceTabListProps) {
  const state = useWorkspaceState();
  const dispatch = useWorkspaceDispatch();
  const dragContext = useWorkspaceDrag();

  const stack = state.stacks[stackId];
  if (!stack) return null;

  function startDrag(event: React.DragEvent<HTMLDivElement>, viewId: string) {
    if (!dragContext) return;
    dragContext.beginDrag(
      { viewId, sourceStackId: stackId },
      event.dataTransfer,
    );
  }

  return (
    <Tabs
      value={stack.activeViewId}
      onValueChange={(viewId) => {
        if (typeof viewId === "string") dispatch({ type: "view/activate", viewId });
      }}
      className="min-h-0 min-w-0 flex-1 gap-0"
    >
      <div className="shrink-0 overflow-x-auto border-b p-1">
        <TabsList className={cn("w-max", className)} {...props}>
          {stack.viewIds.map((viewId) => {
            const view = state.views[viewId];
            if (!view) return null;
            const active = stack.activeViewId === viewId;
            return (
              <div
                key={viewId}
                draggable
                onDragStart={(event) => startDrag(event, viewId)}
                onDragEnd={() => dragContext?.endDrag()}
                className="group relative h-full shrink-0"
              >
                <TabsTrigger
                  value={viewId}
                  className={cn("h-full max-w-48 px-2.5", view.closable !== false && "pr-7")}
                >
                  <span className="truncate">{view.title}</span>
                </TabsTrigger>
                {view.closable !== false && <button
                  type="button"
                  aria-label={`Close ${view.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "view/close", viewId });
                  }}
                  className={cn(
                    "absolute top-1/2 right-1.5 -translate-y-1/2 flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60",
                    "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                    "hover:bg-accent hover:text-foreground",
                    active && "opacity-70",
                  )}
                >
                  ×
                </button>}
              </div>
            );
          })}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
