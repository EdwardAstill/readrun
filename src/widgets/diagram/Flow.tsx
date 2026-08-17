import React from "react";
import type { DiagramNode, DiagramEdge, PositionedNode } from "./types";
import { dag, tree, force } from "./layout";
import { selectEdgePorts } from "./edge/ports";
import { straightWithPorts, curveWithPorts, orthogonalWithPorts } from "./edge/router";
import { FlowNode } from "./FlowNode";
import { useFlowViewport } from "./viewport";

interface FlowProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  layout: "manual" | "dag" | "tree" | "force";
  /** Required for "tree" layout mode. */
  childrenOf?: (node: DiagramNode) => DiagramNode[];
  /** Required for "tree" layout mode: id of the root node. */
  rootId?: string;
  /**
   * Edge path generator. Defaults to "orthogonal" for dag/tree,
   * "curve" for force, and "straight" for manual.
   */
  edgeRouter?: "straight" | "curve" | "orthogonal";
  /** Custom node renderer. If omitted, a default styled rect is drawn.
   *  Custom renderers do NOT receive drag — pass `draggable={false}` and
   *  handle interaction in the consumer if you need a custom render. */
  renderNode?: (node: PositionedNode) => React.ReactNode;
  /**
   * Custom edge renderer. If omitted, a default styled path with an
   * arrowhead is drawn.
   */
  renderEdge?: (
    path: string,
    edge: DiagramEdge,
    fromNode: PositionedNode,
    toNode: PositionedNode,
  ) => React.ReactNode;
  width: number;
  height: number;
  onNodeClick?: (node: PositionedNode) => void;
  onNodeHover?: (node: PositionedNode | null) => void;
  /** When false, disables interactive node dragging. Default true. */
  draggable?: boolean;
}

const ARROW_ID = "readrun-widget-flow-arrow";

const DEF_W = 100;
const DEF_H = 50;

const EDGE_STROKE = "var(--text-muted, #656d76)";

const INNER_DX_FACTOR = 0.5; // place layout origin at width/2
const INNER_DY = 20;

function defaultRenderEdge(
  pathStr: string,
  edge: DiagramEdge,
): React.ReactNode {
  return (
    <path
      key={edge.id}
      d={pathStr}
      stroke={EDGE_STROKE}
      strokeWidth={1.5}
      fill="none"
      markerEnd={`url(#${ARROW_ID})`}
    />
  );
}

function pathFromPorts(
  router: "straight" | "curve" | "orthogonal",
  from: { x: number; y: number; dir: { dx: number; dy: number } },
  to: { x: number; y: number; dir: { dx: number; dy: number } },
): string {
  switch (router) {
    case "straight":
      return straightWithPorts(from, to);
    case "curve":
      return curveWithPorts(from, to);
    case "orthogonal":
    default:
      return orthogonalWithPorts(from, to);
  }
}

export function Flow({
  nodes,
  edges,
  layout: layoutMode,
  childrenOf,
  rootId,
  edgeRouter,
  renderNode,
  renderEdge,
  width,
  height,
  onNodeClick,
  onNodeHover,
  draggable = true,
}: FlowProps): React.JSX.Element {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const innerDx = width * INNER_DX_FACTOR;
  const innerDy = INNER_DY;

  const [overrides, setOverrides] = React.useState<
    Record<string, { x: number; y: number }>
  >({});
  const viewport = useFlowViewport(svgRef);
  const { view } = viewport;

  const updateOverride = React.useCallback((id: string, x: number, y: number) => {
    setOverrides((prev) => ({ ...prev, [id]: { x, y } }));
  }, []);

  const layoutNodes = React.useMemo<PositionedNode[]>(() => {
    if (layoutMode === "manual") {
      return nodes.map((node) => ({
        ...node,
        x: node.x ?? 0,
        y: node.y ?? 0,
        width: (node.width as number | undefined) ?? DEF_W,
        height: (node.height as number | undefined) ?? DEF_H,
      }));
    }

    if (layoutMode === "dag") return dag(nodes, edges);

    if (layoutMode === "tree") {
      const root = nodes.find((node) => node.id === rootId) ?? nodes[0];
      return root
        ? tree(root, childrenOf ?? (() => []), {
            levelSeparation: height / Math.max(4, nodes.length),
          })
        : [];
    }

    return force(nodes, edges, { width, height });
  }, [childrenOf, edges, height, layoutMode, nodes, rootId, width]);

  const positioned = React.useMemo(
    () =>
      layoutNodes.map((node) => {
        const override = overrides[node.id];
        return override ? { ...node, ...override } : node;
      }),
    [layoutNodes, overrides],
  );

  const posById = React.useMemo(
    () => new Map<string, PositionedNode>(positioned.map((node) => [node.id, node])),
    [positioned],
  );

  const router: "straight" | "curve" | "orthogonal" =
    edgeRouter ??
    (layoutMode === "force"
      ? "curve"
      : layoutMode === "manual"
        ? "straight"
        : "orthogonal");

  // Per-node port-usage tracker: greedy-assign ports so two edges sharing a
  // node don't collide on the same port. An edge's source side and target side
  // each consume one port; in/out are pooled — once a port is used by any edge
  // (either as input or output), later edges have to pick a different one.
  const edgeElements = React.useMemo(() => {
    const usedPorts = new Map<string, Set<import("./edge/ports").PortName>>();
    return edges
      .map((edge) => {
        const fromNode = posById.get(edge.from);
        const toNode = posById.get(edge.to);
        if (!fromNode || !toNode) return null;

        const fromUsed = usedPorts.get(edge.from) ?? new Set();
        const toUsed = usedPorts.get(edge.to) ?? new Set();
        const { from, to, fromName, toName } = selectEdgePorts(fromNode, toNode, {
          excludeFrom: fromUsed,
          excludeTo: toUsed,
        });
        fromUsed.add(fromName);
        toUsed.add(toName);
        usedPorts.set(edge.from, fromUsed);
        usedPorts.set(edge.to, toUsed);

        const path = pathFromPorts(router, from, to);
        return renderEdge
          ? renderEdge(path, edge, fromNode, toNode)
          : defaultRenderEdge(path, edge);
      })
      .filter(Boolean);
  }, [edges, posById, renderEdge, router]);

  const nodeElements = positioned.map((n) => {
    if (renderNode) return <React.Fragment key={n.id}>{renderNode(n)}</React.Fragment>;
    return (
      <FlowNode
        key={n.id}
        node={n}
        svgRef={svgRef}
        innerDx={innerDx}
        innerDy={innerDy}
        view={view}
        draggable={draggable}
        onClick={onNodeClick}
        onHover={onNodeHover}
        onDragMove={(x, y) => updateOverride(n.id, x, y)}
      />
    );
  });

  const innerTransform = `translate(${innerDx + view.panX}, ${innerDy + view.panY}) scale(${view.zoom})`;

  return (
    <div
      style={{
        position: "relative",
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border, #d0d7de)",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ display: "block", maxWidth: "100%", touchAction: "none" }}
        onPointerDown={viewport.onPointerDown}
        onPointerMove={viewport.onPointerMove}
        onPointerUp={viewport.onPointerUp}
        onPointerCancel={viewport.onPointerUp}
        onWheel={viewport.onWheel}
      >
        <defs>
          <marker
            id={ARROW_ID}
            viewBox="0 0 10 10"
            refX={10}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_STROKE} />
          </marker>
        </defs>
        <g transform={innerTransform}>
          {edgeElements}
          {nodeElements}
        </g>
      </svg>
      {draggable && (
        <div
          style={{
            position: "absolute",
            bottom: 6,
            right: 8,
            fontSize: 11,
            color: "var(--text-muted, #656d76)",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            letterSpacing: "0.04em",
            pointerEvents: "none",
          }}
        >
          drag nodes • drag empty • scroll to zoom
        </div>
      )}
    </div>
  );
}
