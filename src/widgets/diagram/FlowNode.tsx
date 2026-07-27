import React from "react";
import type { PositionedNode } from "./types";
import { clientToFlow, type FlowView } from "./viewport";

const NODE_FILL = "var(--bg, #ffffff)";
const NODE_STROKE = "var(--text, #1f2328)";

function NodeShape({
  shape,
  width,
  height,
}: {
  shape: string;
  width: number;
  height: number;
}): React.ReactElement {
  const sharedProps = {
    fill: NODE_FILL,
    stroke: NODE_STROKE,
    strokeWidth: 1,
  };

  if (shape === "circle") {
    return (
      <circle
        cx={width / 2}
        cy={height / 2}
        r={Math.min(width, height) / 2}
        {...sharedProps}
      />
    );
  }

  if (shape === "ellipse") {
    return (
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2}
        ry={height / 2}
        {...sharedProps}
      />
    );
  }

  if (shape === "diamond") {
    return (
      <polygon
        points={`${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`}
        {...sharedProps}
      />
    );
  }

  return (
    <rect
      width={width}
      height={height}
      x={0}
      y={0}
      {...sharedProps}
      rx={0}
    />
  );
}

export function FlowNode({
  node,
  svgRef,
  innerDx,
  innerDy,
  view,
  onClick,
  onHover,
  onDragMove,
  draggable,
}: {
  node: PositionedNode;
  svgRef: React.RefObject<SVGSVGElement | null>;
  innerDx: number;
  innerDy: number;
  view: FlowView;
  onClick?: (node: PositionedNode) => void;
  onHover?: (node: PositionedNode | null) => void;
  onDragMove: (x: number, y: number) => void;
  draggable: boolean;
}): React.ReactElement {
  const offsetRef = React.useRef<{ x: number; y: number } | null>(null);
  const movedRef = React.useRef(false);

  const onPointerDown = (event: React.PointerEvent<SVGGElement>) => {
    if (!draggable || !svgRef.current) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const point = clientToFlow(
      svgRef.current,
      event.clientX,
      event.clientY,
      innerDx,
      innerDy,
      view,
    );
    if (!point) return;

    offsetRef.current = { x: point.x - node.x, y: point.y - node.y };
    movedRef.current = false;
  };

  const onPointerMove = (event: React.PointerEvent<SVGGElement>) => {
    const offset = offsetRef.current;
    if (!offset || !svgRef.current) return;

    const point = clientToFlow(
      svgRef.current,
      event.clientX,
      event.clientY,
      innerDx,
      innerDy,
      view,
    );
    if (!point) return;

    onDragMove(point.x - offset.x, point.y - offset.y);
    movedRef.current = true;
  };

  const onPointerUp = (event: React.PointerEvent<SVGGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    offsetRef.current = null;

    if (!movedRef.current && onClick) {
      onClick(node);
    }
  };

  const { x, y, width, height, id } = node;
  const label = typeof node["label"] === "string" ? node["label"] : id;
  const shape = (node.shape as string | undefined) ?? "rect";

  return (
    <g
      transform={`translate(${x - width / 2}, ${y - height / 2})`}
      style={{
        cursor: draggable ? "grab" : onClick ? "pointer" : "default",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={onHover ? () => onHover(node) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      <NodeShape shape={shape} width={width} height={height} />
      <text
        x={width / 2}
        y={height / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={11}
        fill="var(--text, #1f2328)"
        fontFamily="var(--font-body, ui-sans-serif, system-ui, sans-serif)"
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {label}
      </text>
    </g>
  );
}
