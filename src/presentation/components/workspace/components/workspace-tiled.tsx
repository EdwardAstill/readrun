/**
 * The main tiled surface: renders the workspace's tiled LayoutNode tree inside a
 * padded container. Floating/popout surfaces (segment 3+) will render
 * alongside this in <Workspace>.
 */

import { useWorkspaceState } from "@/presentation/components/workspace/hooks/use-workspace";
import { WorkspaceLayout } from "@/presentation/components/workspace/ui/workspace-layout";

export function WorkspaceTiled() {
 return (
  <div className="relative h-full w-full p-1.5">
   <TiledRoot />
  </div>
 );
}

/** Subscribes to the store; re-renders only the recursive layout tree. */
function TiledRoot() {
 const state = useWorkspaceState();
 return <WorkspaceLayout node={state.tiled} />;
}
