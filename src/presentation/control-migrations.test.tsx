import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CodePanelActions } from "./markdown/components/CodePanel.tsx";
import { CodeBlock } from "./markdown/components/CodeBlock.tsx";
import { CsvViewer } from "./viewers/CsvViewer.tsx";

test("code panel actions retain client hook classes on shared buttons", () => {
	const html = renderToStaticMarkup(
		<CodePanelActions
			blockId="example"
			canRun
			canEnlarge
			canCopy
		/>,
	);

	expect(html).toContain("exec-run-btn");
	expect(html).toContain("exec-enlarge-btn");
	expect(html).toContain("code-copy-btn");
	expect(html).toContain('aria-label="Run"');
	expect(html).toContain('aria-label="Enlarge"');
	expect(html).toContain('aria-label="Copy"');
	expect(html).toContain("lucide-play");
	expect(html).toContain("lucide-maximize-2");
	expect(html).toContain("lucide-copy");
	expect(html.match(/data-slot="button"/g)).toHaveLength(3);
	expect(html).not.toContain('data-slot="button-group"');
	expect(html).not.toContain("bg-primary");
	expect(html).toContain('data-block-id="example"');
});

test("code blocks use the canonical shadcn Card composition", () => {
	const html = renderToStaticMarkup(
		<CodeBlock code="const answer = 42;" language="typescript" />,
	);

	expect(html).toContain('data-slot="card"');
	expect(html).toContain('data-slot="card-header"');
	expect(html).toContain('data-slot="card-title"');
	expect(html).toContain('data-slot="card-action"');
	expect(html).not.toContain('data-slot="button-group"');
	expect(html).toContain('data-slot="card-content"');
	expect(html).toContain("gap-0");
	expect(html).toContain("overflow-hidden");
	expect(html).toContain("py-0");
	expect(html).toContain("bg-muted");
	expect(html).toContain("p-0");
	expect(html).toContain("w-full");
});

test("CSV controls retain client data hooks and expose an input label", () => {
	const rows = [
		["name", "value"],
		...Array.from({ length: 51 }, (_, index) => [
			`row-${index + 1}`,
			String(index + 1),
		]),
	];
	const html = renderToStaticMarkup(<CsvViewer rows={rows} />);

	expect(html).toContain('data-slot="input"');
	expect(html).toContain("h-8");
	expect(html).toContain('aria-label="Filter CSV rows"');
	expect(html).toContain("data-csv-prev");
	expect(html).toContain("data-csv-next");
	expect(html).toContain("border-border");
});
