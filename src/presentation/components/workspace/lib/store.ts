/**
 * Framework-agnostic workspace store. Built on a subscribe/getSnapshot
 * contract so React binds to it with useSyncExternalStore — and so a future
 * popout browser window can subscribe to the exact same store instance.
 */

import type { WorkspaceAction } from "./actions";
import { applyWorkspaceCommand } from "./reducer";
import type { WorkspaceCommand } from "./keymap";
import { reducer } from "./reducer";
import type { WorkspaceState } from "./types";

export interface WorkspaceStore {
  getState(): WorkspaceState;
  dispatch(action: WorkspaceAction): void;
  /** Apply a high-level command (keymap layer); resolves the active view. */
  applyCommand(command: WorkspaceCommand): void;
  /**
   * Replace the entire state (persistence restore). Callers are responsible
   * for passing a valid WorkspaceState — see lib/workspace/persistence.ts.
   */
  hydrate(state: WorkspaceState): void;
  subscribe(listener: () => void): () => void;
}

export function createWorkspaceStore(
  initialState: WorkspaceState,
): WorkspaceStore {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    dispatch(action: WorkspaceAction) {
      const next = reducer(state, action);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener();
    },
    applyCommand(command: WorkspaceCommand) {
      const next = applyWorkspaceCommand(state, command);
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener();
    },
    hydrate(next: WorkspaceState) {
      if (next === state) return;
      state = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
