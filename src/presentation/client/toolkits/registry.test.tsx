import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
	getToolkitDefinition,
	TOOLKIT_DEFINITIONS,
} from "./registry.tsx";

test("registers exactly the approved built-in toolkit", () => {
	expect(
		TOOLKIT_DEFINITIONS.map(({ id, title, description }) => ({
			id,
			title,
			description,
		})),
	).toEqual([
		{
			id: "scientific-calculator",
			title: "Scientific Calculator",
			description: "Open the scientific calculator.",
		},
	]);
});

test("renders each toolkit through its definition", () => {
	const calculator = getToolkitDefinition("scientific-calculator");

	expect(renderToStaticMarkup(calculator!.render())).toContain(
		"Scientific calculator",
	);
	expect(getToolkitDefinition("missing" as never)).toBeUndefined();
});
