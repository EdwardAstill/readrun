import type {
  ToolkitDefinition,
  ToolkitId,
  ToolkitSize,
  ToolkitWorkspaceState,
  ViewportSize,
  WindowRect,
} from "./types.ts";

export type ToolkitWindowAction =
  | { type: "open"; definition: ToolkitDefinition; viewport: ViewportSize }
  | { type: "raise"; id: ToolkitId }
  | { type: "minimize"; id: ToolkitId }
  | { type: "close"; id: ToolkitId }
  | {
      type: "set-rect";
      id: ToolkitId;
      rect: WindowRect;
      viewport: ViewportSize;
      minimumSize: ToolkitSize;
    }
  | {
      type: "normalize";
      viewport: ViewportSize;
      definitions: readonly ToolkitDefinition[];
    };

export function createToolkitWorkspaceState(): ToolkitWorkspaceState {
  return { windows: [], nextZIndex: 1 };
}

export function clampWindowRect(
  rect: WindowRect,
  viewport: ViewportSize,
  minimum: ToolkitSize,
): WindowRect {
  const width = clampDimension(rect.width, viewport.width, minimum.width);
  const height = clampDimension(rect.height, viewport.height, minimum.height);

  return {
    x: clamp(rect.x, 0, viewport.width - width),
    y: clamp(rect.y, 0, viewport.height - height),
    width,
    height,
  };
}

export function reduceToolkitWindows(
  state: ToolkitWorkspaceState,
  action: ToolkitWindowAction,
): ToolkitWorkspaceState {
  switch (action.type) {
    case "open": {
      const existing = state.windows.find((window) => window.id === action.definition.id);
      if (existing) {
        return {
          windows: state.windows.map((window) =>
            window.id === action.definition.id
              ? { ...window, minimized: false, zIndex: state.nextZIndex }
              : window,
          ),
          nextZIndex: state.nextZIndex + 1,
        };
      }

      const offset = (state.windows.length + 1) * 24;
      return {
        windows: [
          ...state.windows,
          {
            id: action.definition.id,
            minimized: false,
            rect: clampWindowRect(
              {
                x: offset,
                y: offset,
                width: action.definition.defaultSize.width,
                height: action.definition.defaultSize.height,
              },
              action.viewport,
              action.definition.minimumSize,
            ),
            zIndex: state.nextZIndex,
          },
        ],
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "raise": {
      if (!state.windows.some((window) => window.id === action.id)) {
        return state;
      }

      return {
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, zIndex: state.nextZIndex } : window,
        ),
        nextZIndex: state.nextZIndex + 1,
      };
    }

    case "minimize":
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id ? { ...window, minimized: true } : window,
        ),
      };

    case "close":
      return {
        ...state,
        windows: state.windows.filter((window) => window.id !== action.id),
      };

    case "set-rect":
      return {
        ...state,
        windows: state.windows.map((window) =>
          window.id === action.id
            ? {
                ...window,
                rect: clampWindowRect(action.rect, action.viewport, action.minimumSize),
              }
            : window,
        ),
      };

    case "normalize":
      return {
        ...state,
        windows: state.windows.map((window) => {
          const definition = action.definitions.find((item) => item.id === window.id);
          return definition
            ? {
                ...window,
                rect: clampWindowRect(window.rect, action.viewport, definition.minimumSize),
              }
            : window;
        }),
      };
  }
}

function clampDimension(value: number, viewport: number, minimum: number): number {
  return Math.min(Math.max(value, viewport >= minimum ? minimum : 0), viewport);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
