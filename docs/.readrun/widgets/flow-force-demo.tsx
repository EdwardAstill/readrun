import React from "react";
import { Flow } from "@readrun/widgets/diagram";
import { Shell, Sub, Stage } from "@readrun/widgets/primitives";

const nodes = [
  { id: "n1", label: "Alpha" },
  { id: "n2", label: "Beta" },
  { id: "n3", label: "Gamma" },
  { id: "n4", label: "Delta" },
  { id: "n5", label: "Epsilon" },
  { id: "n6", label: "Zeta" },
];

const edges = [
  { id: "e1", from: "n1", to: "n2" },
  { id: "e2", from: "n1", to: "n3" },
  { id: "e3", from: "n2", to: "n4" },
  { id: "e4", from: "n3", to: "n4" },
  { id: "e5", from: "n4", to: "n5" },
  { id: "e6", from: "n5", to: "n6" },
  { id: "e7", from: "n6", to: "n1" },
];

export function FlowForceDemo() {
  return (
    <Shell title="Flow / force layout">
      <Sub>Force-directed layout. Nodes repel each other; edges act as springs.</Sub>
      <Stage>
        <Flow
          nodes={nodes}
          edges={edges}
          layout="force"
          edgeRouter="curve"
          width={700}
          height={380}
        />
      </Stage>
    </Shell>
  );
}
