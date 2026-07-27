import React from "react";
import { Flow } from "@readrun/widgets/diagram";
import type { DiagramNode } from "@readrun/widgets/diagram";
import { Shell, Sub, Stage } from "@readrun/widgets/primitives";

const nodes: DiagramNode[] = [
  { id: "root", label: "Root" },
  { id: "a", label: "Node A" },
  { id: "b", label: "Node B" },
  { id: "c", label: "Node C" },
  { id: "a1", label: "A.1" },
  { id: "a2", label: "A.2" },
  { id: "b1", label: "B.1" },
  { id: "c1", label: "C.1" },
  { id: "c2", label: "C.2" },
];

const edges = [
  { id: "e1", from: "root", to: "a" },
  { id: "e2", from: "root", to: "b" },
  { id: "e3", from: "root", to: "c" },
  { id: "e4", from: "a", to: "a1" },
  { id: "e5", from: "a", to: "a2" },
  { id: "e6", from: "b", to: "b1" },
  { id: "e7", from: "c", to: "c1" },
  { id: "e8", from: "c", to: "c2" },
];

const childMap: Record<string, string[]> = {
  root: ["a", "b", "c"],
  a: ["a1", "a2"],
  b: ["b1"],
  c: ["c1", "c2"],
};

const nodeById = new Map(nodes.map((n) => [n.id, n]));

function childrenOf(node: DiagramNode): DiagramNode[] {
  return (childMap[node.id] ?? []).map((id) => nodeById.get(id)!).filter(Boolean);
}

export function FlowTreeDemo() {
  return (
    <Shell title="Flow / tree layout">
      <Sub>Tree layout using Reingold-Tilford. Pass rootId and childrenOf to define the hierarchy.</Sub>
      <Stage>
        <Flow
          nodes={nodes}
          edges={edges}
          layout="tree"
          rootId="root"
          childrenOf={childrenOf}
          edgeRouter="orthogonal"
          width={700}
          height={380}
        />
      </Stage>
    </Shell>
  );
}
