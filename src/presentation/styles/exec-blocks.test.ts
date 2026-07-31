import { expect, test } from "bun:test";

import { execBlockStyles } from "./exec-blocks.ts";

function ruleFor(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return (
		execBlockStyles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ""
	);
}

test("JSX output only adds functional layout and theme colours to its Card", () => {
	const baseOutput = ruleFor(
		'.exec-block[data-language="jsx"] .exec-output',
	);
	const mount = ruleFor(".jsx-output__mount");

	expect(baseOutput).toContain("display: block");
	expect(baseOutput).toContain("white-space: normal");
	expect(baseOutput).toContain(
		"background: var(--color-surface, var(--rr-surface))",
	);
	expect(mount).toContain("display: flex");
	expect(mount).toContain("width: 100%");
	expect(mount).toContain("min-width: 0");
	expect(execBlockStyles).not.toContain(".code-panel {");
	expect(execBlockStyles).not.toContain(".code-panel__header");
	expect(execBlockStyles).not.toContain(".code-modal__code");
});
