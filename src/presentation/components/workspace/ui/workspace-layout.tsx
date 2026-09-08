/**
 * Recursively renders a LayoutNode tree as a flex layout. Splits use
 * normalized ratios (flex-grow), so the tree scales with its container.
 * Resize handles arrive in segment 2; ratios are fixed here for now.
 */

import * as React from "react";

import { cn } from "@/presentation/components/ui/cn";
import { WorkspaceResizeHandle } from "@/presentation/components/workspace/ui/workspace-resize-handle";
import { WorkspaceStack } from "@/presentation/components/workspace/ui/workspace-stack";
import type { LayoutNode } from "@/presentation/components/workspace/lib/types";

export interface WorkspaceLayoutProps
  extends React.HTMLAttributes<HTMLDivElement> {
  node: LayoutNode;
}

export function WorkspaceLayout({
  node,
  className,
  ...props
}: WorkspaceLayoutProps) {
  return (
    <div className={cn("h-full w-full", className)} {...props}>
      <LayoutNodeView node={node} />
    </div>
  );
}

function LayoutNodeView({ node }: { node: LayoutNode }) {
  if (node.type === "stack") {
    return <WorkspaceStack stackId={node.stackId} className="h-full w-full" />;
  }

  const horizontal = node.direction === "horizontal";

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 min-w-0",
        horizontal ? "flex-row" : "flex-col",
      )}
    >
      <div style={{ flexGrow: node.ratio }} className="min-h-0 min-w-0 basis-0">
        <LayoutNodeView node={node.first} />
      </div>
      <WorkspaceResizeHandle
        splitId={node.id}
        direction={node.direction}
        ratio={node.ratio}
      />
      <div
        style={{ flexGrow: 1 - node.ratio }}
        className="min-h-0 min-w-0 basis-0"
      >
        <LayoutNodeView node={node.second} />
      </div>
    </div>
  );
}
