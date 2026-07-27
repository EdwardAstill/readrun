import { expect, test } from "bun:test";

import { execBlockStyles } from "./exec-blocks.ts";

function ruleFor(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return (
		execBlockStyles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ""
	);
}

test("JSX output uses a consistent inset theme canvas", () => {
	const baseOutput = ruleFor(
		'.exec-block[data-language="jsx"] > .exec-output',
	);
	const output = ruleFor(
		'.exec-block[data-language="jsx"] > .exec-output:not(:empty)',
	);
	const mount = ruleFor(".jsx-output__mount");

	expect(baseOutput).toContain("display: block");
	expect(baseOutput).toContain("white-space: normal");
	expect(output).toContain("margin-top: 0");
	expect(output).toContain("padding: 1rem");
	expect(output).toContain("background: var(--color-surface, var(--rr-surface))");
	expect(mount).toContain("display: flex");
	expect(mount).toContain("width: 100%");
	expect(mount).toContain("min-width: 0");
});
