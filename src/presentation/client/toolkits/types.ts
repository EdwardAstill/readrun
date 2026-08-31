import type React from "react";

export type ToolkitId = "python-terminal" | "scientific-calculator";

export interface ToolkitSize {
  width: number;
  height: number;
}

export interface WindowRect extends ToolkitSize {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ToolkitDefinition {
  id: ToolkitId;
  title: string;
  description: string;
  defaultSize: ToolkitSize;
  minimumSize: ToolkitSize;
  render: () => React.ReactNode;
}

export interface ToolkitWindowState {
  id: ToolkitId;
  minimized: boolean;
  rect: WindowRect;
  zIndex: number;
}

export interface ToolkitWorkspaceState {
  windows: ToolkitWindowState[];
  nextZIndex: number;
}
