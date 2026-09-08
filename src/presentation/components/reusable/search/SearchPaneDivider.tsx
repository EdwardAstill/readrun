// Adapted from edcn search primitives.
import * as React from "react";
import { cn } from "../../ui/cn.ts";

/** A draggable divider for adjacent panes, with keyboard resizing and reset. */
export function SearchPaneDivider({ ratio, onRatioChange, className, "aria-label": label = "Resize panes" }: {
  ratio: number;
  onRatioChange: (ratio: number) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const drag = React.useRef<{ pointerId: number; x: number; width: number; ratio: number } | null>(null);
  const clamp = (value: number) => Math.min(0.85, Math.max(0.15, value));
  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div role="separator" aria-label={label} aria-orientation="vertical"
    aria-valuemin={15} aria-valuemax={85} aria-valuenow={Math.round(ratio * 100)} tabIndex={0}
    className={cn("relative z-10 w-px shrink-0 cursor-col-resize touch-none select-none bg-border outline-none before:absolute before:inset-y-0 before:-inset-x-1 hover:bg-foreground focus-visible:bg-foreground", className)}
    onPointerDown={(event) => {
      if (event.button !== 0 || drag.current) return;
      const before = event.currentTarget.previousElementSibling;
      const after = event.currentTarget.nextElementSibling;
      const width = (before?.getBoundingClientRect().width ?? 0) + (after?.getBoundingClientRect().width ?? 0);
      if (!width) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, x: event.clientX, width, ratio };
    }}
    onPointerMove={(event) => {
      const current = drag.current;
      if (current?.pointerId === event.pointerId) onRatioChange(clamp(current.ratio + (event.clientX - current.x) / current.width));
    }}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={() => { drag.current = null; }}
    onKeyDown={(event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      onRatioChange(event.key === "Home" ? 0.15 : event.key === "End" ? 0.85 : clamp(ratio + (event.key === "ArrowRight" ? 0.05 : -0.05)));
    }}
    onDoubleClick={() => onRatioChange(0.5)} />;
}
