import { expect, test } from "bun:test";

import { getToolkitDefinition, TOOLKIT_DEFINITIONS } from "./registry.tsx";

test("ships without built-in toolkits", () => {
	expect(TOOLKIT_DEFINITIONS).toEqual([]);
	expect(getToolkitDefinition("missing")).toBeUndefined();
});
