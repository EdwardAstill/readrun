import React from "react";
import { Flow } from "@readrun/widgets/diagram";
import { Shell, Sub, Stage } from "@readrun/widgets/primitives";

const nodes = [
  { id: "input", label: "Input", shape: "circle" as const, width: 70, height: 70 },
  { id: "parse", label: "Parse" },
  { id: "validate", label: "Validate", shape: "diamond" as const, width: 110, height: 60 },
  { id: "transform", label: "Transform" },
  { id: "filter", label: "Filter", shape: "ellipse" as const, width: 110, height: 50 },
  { id: "output", label: "Output", shape: "circle" as const, width: 70, height: 70 },
];

const edges = [
  { id: "e1", from: "input", to: "parse" },
  { id: "e2", from: "parse", to: "validate" },
  { id: "e3", from: "parse", to: "transform" },
  { id: "e4", from: "validate", to: "filter" },
  { id: "e5", from: "transform", to: "filter" },
  { id: "e6", from: "filter", to: "output" },
];

export function FlowDagDemo() {
  return (
    <Shell title="Flow / dag layout">
      <Sub>DAG layout with orthogonal edges. Mixed shapes: circle / rect / diamond / ellipse. Drag nodes, drag empty space to pan, scroll to zoom.</Sub>
      <Stage>
        <Flow
          nodes={nodes}
          edges={edges}
          layout="dag"
          edgeRouter="orthogonal"
          width={700}
          height={520}
        />
      </Stage>
    </Shell>
  );
}
