import { PythonTerminal } from "./PythonTerminal.tsx";
import { ScientificCalculatorToolkit } from "./ScientificCalculatorToolkit.tsx";
import type { ToolkitDefinition, ToolkitId } from "./types.ts";

export const TOOLKIT_DEFINITIONS = [
	{
		id: "python-terminal",
		title: "Python Terminal",
		description: "Run persistent Python commands in this browser.",
		defaultSize: { width: 640, height: 420 },
		minimumSize: { width: 360, height: 240 },
		render: () => <PythonTerminal autoFocus />,
	},
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
