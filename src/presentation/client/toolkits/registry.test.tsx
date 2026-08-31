import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
	getToolkitDefinition,
	TOOLKIT_DEFINITIONS,
} from "./registry.tsx";

test("registers exactly the two approved built-in toolkits", () => {
	expect(
		TOOLKIT_DEFINITIONS.map(({ id, title, description }) => ({
			id,
			title,
			description,
		})),
	).toEqual([
		{
			id: "python-terminal",
			title: "Python Terminal",
			description: "Run persistent Python commands in this browser.",
		},
		{
			id: "scientific-calculator",
			title: "Scientific Calculator",
			description: "Open the scientific calculator.",
		},
	]);
});

test("renders each toolkit through its definition", () => {
	const terminal = getToolkitDefinition("python-terminal");
	const calculator = getToolkitDefinition("scientific-calculator");

	expect(renderToStaticMarkup(terminal!.render())).toContain(
		"Python terminal input",
	);
	expect(renderToStaticMarkup(calculator!.render())).toContain(
		"Scientific calculator",
	);
	expect(getToolkitDefinition("missing" as never)).toBeUndefined();
});
