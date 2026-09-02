import { ScientificCalculatorToolkit } from "./ScientificCalculatorToolkit.tsx";
import type { ToolkitDefinition, ToolkitId } from "./types.ts";

export const TOOLKIT_DEFINITIONS = [
	{
		id: "scientific-calculator",
		title: "Scientific Calculator",
		description: "Open the scientific calculator.",
		defaultSize: { width: 900, height: 620 },
		minimumSize: { width: 600, height: 420 },
		render: () => <ScientificCalculatorToolkit />,
	},
] as const satisfies readonly ToolkitDefinition[];

export function getToolkitDefinition(
	id: ToolkitId,
): (typeof TOOLKIT_DEFINITIONS)[number] | undefined {
	return TOOLKIT_DEFINITIONS.find((definition) => definition.id === id);
}
