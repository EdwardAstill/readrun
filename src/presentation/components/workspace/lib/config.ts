/**
 * Workspace configuration — how the user talks to the workspace. Config is
 * deliberately NOT part of WorkspaceState: it describes behavior/controls,
 * not workspace content, so it travels via context instead of the reducer.
 */

import type { ModifierKey, WorkspaceKeymap } from "./keymap";
import { defaultKeymap } from "./keymap";

export interface WorkspaceFloatingConfig {
  /** "frame" renders a title bar; "frameless" renders only the stack. */
  chrome: "frame" | "frameless";
  /** Modifier held on pointer-down anywhere to move a window (e.g. ctrl-drag). */
  dragModifier: ModifierKey | null;
  /** Optional modifier + drag to resize from the nearest edge. */
  resizeModifier: ModifierKey | null;
}

/** Partial config consumers may provide; missing fields fall back to defaults. */
export interface WorkspaceConfigInput {
  floating?: Partial<WorkspaceFloatingConfig>;
  keymap?: WorkspaceKeymap;
}

export interface WorkspaceConfig {
  floating: WorkspaceFloatingConfig;
  keymap: WorkspaceKeymap;
}

export const defaultWorkspaceConfig: WorkspaceConfig = {
  floating: {
    chrome: "frame",
    dragModifier: "ctrl",
    resizeModifier: null,
  },
  keymap: defaultKeymap,
};

/** Merge a partial consumer config over the defaults (shallow per section). */
export function resolveConfig(partial?: WorkspaceConfigInput): WorkspaceConfig {
  return {
    floating: { ...defaultWorkspaceConfig.floating, ...partial?.floating },
    keymap: { ...defaultWorkspaceConfig.keymap, ...partial?.keymap },
  };
}
