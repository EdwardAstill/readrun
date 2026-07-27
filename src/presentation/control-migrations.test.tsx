import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { CodePanelActions } from "./markdown/components/CodePanel.tsx";
import { CsvViewer } from "./viewers/CsvViewer.tsx";

test("code panel actions retain client hook classes on shared buttons", () => {
	const html = renderToStaticMarkup(
		<CodePanelActions
			blockId="example"
			canRun
			canEnlarge
			canCopy
			canEdit
		/>,
	);

	expect(html).toContain("rr-button--primary");
	expect(html).toContain("exec-run-btn");
	expect(html).toContain("exec-enlarge-btn");
	expect(html).toContain("code-copy-btn");
	expect(html).toContain("exec-toggle-btn");
	expect(html).toContain('data-block-id="example"');
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

	expect(html).toContain("rr-input csv-filter");
	expect(html).toContain('aria-label="Filter CSV rows"');
	expect(html).toContain("data-csv-prev");
	expect(html).toContain("data-csv-next");
	expect(html).toContain("rr-button--secondary");
});
