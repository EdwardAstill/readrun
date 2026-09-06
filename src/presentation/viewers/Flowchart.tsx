import { useState } from "react";
import { Background, Controls, Handle, MarkerType, Panel, Position, ReactFlow, type Node, type NodeProps } from "@xyflow/react";
import type { FlowchartDefinition, FlowchartNode } from "../../domain/flowchart/model.ts";
import { Button } from "../components/ui/Button.tsx";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/Card.tsx";

function FlowchartCard({ data }: NodeProps<Node<FlowchartNode["data"]>>) {
	return <>
		<Handle type="target" position={Position.Top} />
		<Card className="w-60 py-4">
			<CardHeader className="px-4">
				<CardTitle className="break-words leading-snug">{data.label}</CardTitle>
				{data.description && <CardDescription className="whitespace-pre-wrap break-words">{data.description}</CardDescription>}
			</CardHeader>
		</Card>
		<Handle type="source" position={Position.Bottom} />
	</>;
}

const nodeTypes = { card: FlowchartCard };

export function Flowchart({ definition }: { definition: FlowchartDefinition }) {
	const [resetCount, setResetCount] = useState(0);
	if (definition.nodes.length === 0) return <p role="status">This flowchart has no nodes.</p>;
	return <ReactFlow
		key={resetCount}
		defaultNodes={definition.nodes.map(node => ({ ...node, position: { ...node.position }, type: "card" }))}
		defaultEdges={definition.edges.map(({ arrow, ...edge }) => ({ ...edge, type: "smoothstep",
			markerEnd: arrow === false ? undefined : { type: MarkerType.ArrowClosed } }))}
		nodeTypes={nodeTypes} fitView nodesDraggable nodesConnectable={false}
		edgesReconnectable={false} zoomOnScroll={false} preventScrolling={false}
		minZoom={0.1} maxZoom={2}>
		<Background />
		<Controls showInteractive={false} />
		<Panel position="top-right">
			<Button variant="outline" size="sm" onClick={() => setResetCount(count => count + 1)}>
				Reset layout
			</Button>
		</Panel>
	</ReactFlow>;
}
