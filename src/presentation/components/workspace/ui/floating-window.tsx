/**
 * Floating window shell. Works controlled (position/size props + change
 * callbacks — geometry owned by workspace state) or uncontrolled (default*
 * props + internal state — standalone usage like the floating-window demo).
 *
 * Chrome (title bar) is optional: frameless windows are moved by holding
 * the configured modifier key (e.g. ctrl) and dragging anywhere.
 */

import * as React from "react";

import { cn } from "@/presentation/components/ui/cn";
import type { ModifierKey } from "@/presentation/components/workspace/lib/keymap";
import { modifierToEventKey } from "@/presentation/components/workspace/lib/keymap";

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DragState {
  edge: "move" | ResizeEdge;
  startX: number;
  startY: number;
  originPosition: Position;
  originSize: Size;
}

export interface FloatingWindowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDragStart"> {
  title?: string;
  /** Controlled position/size — geometry lives outside the component. */
  position?: Position;
  size?: Size;
  /** Uncontrolled fallbacks used when position/size are omitted. */
  defaultPosition?: Position;
  defaultSize?: Size;
  onPositionChange?: (position: Position) => void;
  onSizeChange?: (size: Size) => void;
  /** Show the title bar? Default true. */
  chrome?: boolean;
  /** Modifier held on pointer-down anywhere to move the window. */
  dragModifier?: ModifierKey | null;
  /** Stacking order applied as z-index. */
  zIndex?: number;
  onClose?: () => void;
  /** Override the content area padding (e.g. "p-0" to fill edge to edge). */
  contentClassName?: string;
  minWidth?: number;
  minHeight?: number;
}

const resizeHandles: { edge: ResizeEdge; className: string }[] = [
  { edge: "n", className: "inset-x-3 top-0 h-1.5 cursor-ns-resize" },
  { edge: "s", className: "inset-x-3 bottom-0 h-1.5 cursor-ns-resize" },
  { edge: "w", className: "inset-y-3 left-0 w-1.5 cursor-ew-resize" },
  { edge: "e", className: "inset-y-3 right-0 w-1.5 cursor-ew-resize" },
  { edge: "nw", className: "left-0 top-0 size-3.5 cursor-nwse-resize" },
  { edge: "ne", className: "right-0 top-0 size-3.5 cursor-nesw-resize" },
  { edge: "sw", className: "bottom-0 left-0 size-3.5 cursor-nesw-resize" },
  { edge: "se", className: "bottom-0 right-0 size-3.5 cursor-nwse-resize" },
];

function FloatingWindow({
  title,
  position: positionProp,
  size: sizeProp,
  defaultPosition = { x: 40, y: 40 },
  defaultSize = { width: 320, height: 220 },
  onPositionChange,
  onSizeChange,
  chrome = true,
  dragModifier,
  zIndex,
  onClose,
  contentClassName,
  minWidth = 220,
  minHeight = 140,
  className,
  children,
  onPointerDown,
  ...props
}: FloatingWindowProps) {
  // Controlled when position/size are given; internal state otherwise.
  const [internalPosition, setInternalPosition] =
    React.useState<Position>(defaultPosition);
  const [internalSize, setInternalSize] = React.useState<Size>(defaultSize);
  const position = positionProp ?? internalPosition;
  const size = sizeProp ?? internalSize;
  const [dragging, setDragging] = React.useState(false);
  const drag = React.useRef<DragState | null>(null);

  function updatePosition(next: Position) {
    if (onPositionChange) onPositionChange(next);
    else setInternalPosition(next);
  }

  function updateSize(next: Size) {
    if (onSizeChange) onSizeChange(next);
    else setInternalSize(next);
  }

  function beginDrag(edge: DragState["edge"], event: React.PointerEvent) {
    event.preventDefault();
    drag.current = {
      edge,
      startX: event.clientX,
      startY: event.clientY,
      originPosition: position,
      originSize: size,
    };
    setDragging(true);
    // Capture the pointer so move/up events keep firing over this window
    // even when the cursor leaves it.
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onRootPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (dragModifier && event[modifierToEventKey(dragModifier)]) {
      beginDrag("move", event);
    }
    onPointerDown?.(event);
  }

  function onPointerMove(event: React.PointerEvent) {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (state.edge === "move") {
      updatePosition({
        x: state.originPosition.x + dx,
        y: state.originPosition.y + dy,
      });
      return;
    }

    let { x, y } = state.originPosition;
    let { width, height } = state.originSize;

    // Grow/shrink from the dragged edge, clamping to the minimum size.
    // Edges that pull the opposite side also translate the window so the
    // anchored edge stays put.
    if (state.edge.includes("e")) {
      width = Math.max(minWidth, state.originSize.width + dx);
    }
    if (state.edge.includes("s")) {
      height = Math.max(minHeight, state.originSize.height + dy);
    }
    if (state.edge.includes("w")) {
      width = Math.max(minWidth, state.originSize.width - dx);
      x = state.originPosition.x + (state.originSize.width - width);
    }
    if (state.edge.includes("n")) {
      height = Math.max(minHeight, state.originSize.height - dy);
      y = state.originPosition.y + (state.originSize.height - height);
    }

    updatePosition({ x, y });
    updateSize({ width, height });
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  return (
    <div
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-lg border bg-background shadow-lg",
        dragging && "select-none",
        className,
      )}
      onPointerDown={onRootPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...props}
    >
      {chrome ? (
        <div
          onPointerDown={(event) => beginDrag("move", event)}
          className="flex h-9 shrink-0 touch-none items-center justify-between border-b bg-muted/50 px-3 active:cursor-grabbing"
        >
          <span className="cursor-grab text-sm font-medium">{title}</span>
          {onClose ? (
            <button
              type="button"
              aria-label={`Close ${title ?? "window"}`}
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex size-4 items-center justify-center rounded-sm text-muted-foreground/70 hover:bg-accent hover:text-foreground"
            >
              ×
            </button>
          ) : (
            <span aria-hidden className="flex gap-1">
              <i className="size-1.5 rounded-full bg-muted-foreground/40" />
              <i className="size-1.5 rounded-full bg-muted-foreground/40" />
              <i className="size-1.5 rounded-full bg-muted-foreground/40" />
            </span>
          )}
        </div>
      ) : null}
      <div className={cn("flex-1 overflow-auto p-4", contentClassName)}>
        {children}
      </div>
      {resizeHandles.map((handle) => (
        <div
          key={handle.edge}
          onPointerDown={(event) => beginDrag(handle.edge, event)}
          className={cn("absolute touch-none", handle.className)}
        />
      ))}
    </div>
  );
}

export { FloatingWindow };
