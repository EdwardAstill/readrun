export interface FlowchartNode {
	id: string;
	position: { x: number; y: number };
	data: { label: string; description?: string };
}

export interface FlowchartEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
	arrow?: boolean;
}

export interface FlowchartDefinition {
	nodes: FlowchartNode[];
	edges: FlowchartEdge[];
}

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function parseFlowchart(source: string): FlowchartDefinition {
	const value: unknown = JSON.parse(source);
	if (!record(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
		throw new Error("Flowchart must contain nodes and edges arrays.");
	}
	const nodeIds = new Set<string>();
	const nodes = value.nodes.map((node: unknown, index): FlowchartNode => {
		if (!record(node) || !nonempty(node.id) || !record(node.data) || !nonempty(node.data.label)
			|| !record(node.position) || typeof node.position.x !== "number" || !Number.isFinite(node.position.x)
			|| typeof node.position.y !== "number" || !Number.isFinite(node.position.y)
			|| (node.data.description !== undefined && typeof node.data.description !== "string")) {
			throw new Error(`Node ${index + 1} requires an id, data.label, and finite position.x/y; description must be text.`);
		}
		if (nodeIds.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
		nodeIds.add(node.id);
		return { id: node.id, position: { x: node.position.x, y: node.position.y },
			data: { label: node.data.label, description: node.data.description as string | undefined } };
	});
	const edgeIds = new Set<string>();
	const edges = value.edges.map((edge: unknown, index): FlowchartEdge => {
		if (!record(edge) || !nonempty(edge.id) || !nonempty(edge.source) || !nonempty(edge.target)
			|| (edge.label !== undefined && typeof edge.label !== "string")
			|| (edge.arrow !== undefined && typeof edge.arrow !== "boolean")) {
			throw new Error(`Edge ${index + 1} requires an id, source, and target; label must be text and arrow must be a boolean.`);
		}
		if (edgeIds.has(edge.id)) throw new Error(`Duplicate edge id: ${edge.id}`);
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
			throw new Error(`Edge ${edge.id} references an unknown node.`);
		}
		edgeIds.add(edge.id);
		return { id: edge.id, source: edge.source, target: edge.target, label: edge.label as string | undefined,
			...(edge.arrow !== undefined ? { arrow: edge.arrow as boolean } : {}) };
	});
	return { nodes, edges };
}
