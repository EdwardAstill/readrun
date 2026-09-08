/**
 * React bindings for the workspace store.
 *
 * The store instance lives in a ref-style context (stable across renders),
 * while state snapshots flow through useSyncExternalStore. The consumer's
 * views map (viewType -> component) travels in its own context so ui
 * primitives stay generic.
 */

import * as React from "react";

import { createWorkspaceStore } from "@/presentation/components/workspace/lib/store";
import type { WorkspaceAction } from "@/presentation/components/workspace/lib/actions";
import { resolveConfig } from "@/presentation/components/workspace/lib/config";
import type {
  WorkspaceConfig,
  WorkspaceConfigInput,
} from "@/presentation/components/workspace/lib/config";
import { WorkspaceDragProvider } from "@/presentation/components/workspace/hooks/use-workspace-drag";
import type { WorkspaceState } from "@/presentation/components/workspace/lib/types";

export interface WorkspaceViewProps {
  /** Every view component receives its view descriptor. */
  view: WorkspaceState["views"][string];
}

export type WorkspaceViewsMap = Record<
  string,
  React.ComponentType<WorkspaceViewProps>
>;

interface WorkspaceContextValue {
  store: ReturnType<typeof createWorkspaceStore>;
  views: WorkspaceViewsMap;
  config: WorkspaceConfig;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(
  null,
);

export function useWorkspaceContext(): WorkspaceContextValue {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error(
      "Workspace components must be rendered inside <WorkspaceProvider>.",
    );
  }
  return context;
}

export interface WorkspaceProviderSharedProps {
  /** Map of view type to component. Keys match WorkspaceView.type values. */
  views: WorkspaceViewsMap;
  /**
   * Existing store to bind instead of creating one — used by popout windows,
   * which render their own provider against the host's store instance.
   * When given, initialState is ignored.
   */
  store?: ReturnType<typeof createWorkspaceStore>;
  /** Merged over the defaults; see lib/workspace/config.ts. */
  config?: WorkspaceConfigInput;
  /** Also accepted as the createElement third argument (popout render). */
  children?: React.ReactNode;
}

export type WorkspaceProviderProps = WorkspaceProviderSharedProps &
  (
    | {
        store: ReturnType<typeof createWorkspaceStore>;
        initialState?: WorkspaceState;
      }
    | { store?: undefined; initialState: WorkspaceState }
  );

export function WorkspaceProvider({
  views,
  initialState,
  store: storeProp,
  config,
  children,
}: WorkspaceProviderProps) {
  // One store per mounted workspace; initial state is captured on first render.
  const storeRef = React.useRef<ReturnType<typeof createWorkspaceStore> | null>(
    null,
  );
  if (storeRef.current === null) {
    storeRef.current = storeProp ?? createWorkspaceStore(initialState);
  }

  const resolvedConfig = React.useMemo(() => resolveConfig(config), [config]);
  const value = React.useMemo(
    () => ({ store: storeRef.current!, views, config: resolvedConfig }),
    [views, resolvedConfig],
  );

  // Drag & drop context wraps the workspace so every stack/tab has access;
  // createElement keeps this a .ts file (no JSX) while providing context.
  return React.createElement(
    WorkspaceDragProvider,
    null,
    React.createElement(WorkspaceContext.Provider, { value }, children),
  );
}

/** Full workspace state snapshot. Re-renders on any dispatch. */
export function useWorkspaceState(): WorkspaceState {
  const { store } = useWorkspaceContext();
  return React.useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getState,
  );
}

export function useWorkspaceDispatch(): (action: WorkspaceAction) => void {
  const { store } = useWorkspaceContext();
  return store.dispatch;
}

/** Store access for high-level commands (store.applyCommand). */
export function useWorkspaceStore(): ReturnType<typeof createWorkspaceStore> {
  const { store } = useWorkspaceContext();
  return store;
}

/** Resolved workspace configuration. */
export function useWorkspaceConfig(): WorkspaceConfig {
  const { config } = useWorkspaceContext();
  return config;
}

/** Resolve a view type to its component, if the consumer registered one. */
export function useViewComponent(
  viewType: string,
): React.ComponentType<WorkspaceViewProps> | undefined {
  const { views } = useWorkspaceContext();
  return views[viewType];
}
