/**
 * Draggable divider between the two children of a split. Dispatches
 * layout/resize on every move so state (and the state inspector) stays live.
 *
 * Also supports keyboard resize (arrow keys) and double-click to reset to
 * an even split.
 */

import * as React from "react";

import { cn } from "@/presentation/components/ui/cn";
import { useWorkspaceDispatch } from "@/presentation/components/workspace/hooks/use-workspace";

export interface WorkspaceResizeHandleProps {
  splitId: string;
  direction: "horizontal" | "vertical";
  ratio: number;
  /** Step per arrow-key press, as a fraction of the container. */
  keyboardStep?: number;
}

interface DragState {
  startX: number;
  startY: number;
  startRatio: number;
  /** Container extent (width for horizontal, height for vertical) in px. */
  extent: number;
}

const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

function clamp(ratio: number): number {
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
}

export function WorkspaceResizeHandle({
  splitId,
  direction,
  ratio,
  keyboardStep = 0.05,
}: WorkspaceResizeHandleProps) {
  const dispatch = useWorkspaceDispatch();
  const drag = React.useRef<DragState | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const horizontal = direction === "horizontal";

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const extent = horizontal ? rect.width : rect.height;
    if (extent <= 0) return;

    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRatio: ratio,
      extent,
    };
    setDragging(true);
    event.currentTarget.focus();
    // Keep receiving move events when the cursor leaves the handle.
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state) return;
    const delta = horizontal
      ? event.clientX - state.startX
      : event.clientY - state.startY;
    dispatch({
      type: "layout/resize",
      splitId,
      ratio: clamp(state.startRatio + delta / state.extent),
    });
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const forward = horizontal ? "ArrowRight" : "ArrowDown";
    const back = horizontal ? "ArrowLeft" : "ArrowUp";
    if (event.key !== forward && event.key !== back) return;
    event.preventDefault();
    const step = event.key === forward ? keyboardStep : -keyboardStep;
    dispatch({ type: "layout/resize", splitId, ratio: clamp(ratio + step) });
  }

  return (
    <div
      role="separator"
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={MIN_RATIO * 100}
      aria-valuemax={MAX_RATIO * 100}
      aria-label="Resize panes"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onDoubleClick={() =>
        dispatch({ type: "layout/resize", splitId, ratio: 0.5 })
      }
      className={cn(
        "group flex shrink-0 touch-none items-center justify-center rounded outline-none select-none",
        "focus-visible:ring-ring/50 focus-visible:ring-2",
        horizontal ? "w-1.5 cursor-ew-resize" : "h-1.5 cursor-ns-resize",
        dragging && "bg-ring/20",
      )}
    >
      {/* Visible line; expands to a wider/narrower hit area. */}
      <span
        className={cn(
          "rounded-full bg-border transition-colors",
          "group-hover:bg-ring/60 group-focus-visible:bg-ring",
          horizontal ? "h-full w-px" : "h-px w-full",
        )}
      />
    </div>
  );
}
