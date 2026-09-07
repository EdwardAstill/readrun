import type { ToolkitDefinition, ToolkitId } from "./types.ts";

export const TOOLKIT_DEFINITIONS: readonly ToolkitDefinition[] = [];

export function getToolkitDefinition(
	id: ToolkitId,
): (typeof TOOLKIT_DEFINITIONS)[number] | undefined {
	return TOOLKIT_DEFINITIONS.find((definition) => definition.id === id);
}
