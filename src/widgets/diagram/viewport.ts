import React from "react";
import { screenToViewBox, type GetScreenCTMTarget } from "../interaction/coords";

export interface FlowView {
  panX: number;
  panY: number;
  zoom: number;
}

interface Point {
  x: number;
  y: number;
}

interface PanState {
  startPointer: Point;
  startView: FlowView;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

export function clientToFlow(
  target: GetScreenCTMTarget,
  clientX: number,
  clientY: number,
  innerDx: number,
  innerDy: number,
  view: FlowView,
): Point | null {
  const point = screenToViewBox(target, clientX, clientY);
  if (!point) return null;

  return {
    x: (point.x - innerDx - view.panX) / view.zoom,
    y: (point.y - innerDy - view.panY) / view.zoom,
  };
}

export function panFromPointer(
  startView: FlowView,
  startPointer: Point,
  currentPointer: Point,
): FlowView {
  return {
    ...startView,
    panX: startView.panX + currentPointer.x - startPointer.x,
    panY: startView.panY + currentPointer.y - startPointer.y,
  };
}

export function zoomFromWheel(zoom: number, deltaY: number): number {
  const factor = 1 - deltaY * 0.001;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
}

export function useFlowViewport(
  svgRef: React.RefObject<SVGSVGElement | null>,
): {
  view: FlowView;
  onPointerDown: React.PointerEventHandler<SVGSVGElement>;
  onPointerMove: React.PointerEventHandler<SVGSVGElement>;
  onPointerUp: React.PointerEventHandler<SVGSVGElement>;
  onWheel: React.WheelEventHandler<SVGSVGElement>;
} {
  const [view, setView] = React.useState<FlowView>({
    panX: 0,
    panY: 0,
    zoom: 1,
  });
  const panStateRef = React.useRef<PanState | null>(null);

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.target !== svgRef.current) return;

      const point = screenToViewBox(event.currentTarget, event.clientX, event.clientY);
      if (!point) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      panStateRef.current = { startPointer: point, startView: view };
    },
    [svgRef, view],
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const panState = panStateRef.current;
      if (!panState) return;

      const point = screenToViewBox(event.currentTarget, event.clientX, event.clientY);
      if (!point) return;

      setView(panFromPointer(panState.startView, panState.startPointer, point));
    },
    [],
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      panStateRef.current = null;
    },
    [],
  );

  const onWheel = React.useCallback((event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setView((current) => ({
      ...current,
      zoom: zoomFromWheel(current.zoom, event.deltaY),
    }));
  }, []);

  return { view, onPointerDown, onPointerMove, onPointerUp, onWheel };
}
