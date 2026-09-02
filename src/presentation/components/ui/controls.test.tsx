import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./Button.tsx";
import { Input } from "./Input.tsx";

test("Button uses the shadcn defaults and preserves native props", () => {
	const html = renderToStaticMarkup(
		<Button className="feature-hook" data-action="run" disabled>
			Run
		</Button>,
	);

	expect(html).toContain('type="button"');
	expect(html).toContain('data-slot="button"');
	expect(html).toContain("bg-primary");
	expect(html).toContain("h-8");
	expect(html).toContain("feature-hook");
	expect(html).toContain('data-action="run"');
	expect(html).toContain("disabled");
});

test("Button respects an explicit native type", () => {
	const html = renderToStaticMarkup(<Button type="submit">Save</Button>);

	expect(html).toContain('type="submit"');
	expect(html).toContain("bg-primary");
});

test("Input supplies shared classes and preserves input attributes", () => {
	const html = renderToStaticMarkup(
		<Input
			className="csv-filter"
			type="search"
			size={20}
			aria-label="Filter rows"
			data-filter="csv"
		/>,
	);

	expect(html).toContain('type="search"');
	expect(html).toContain('size="20"');
	expect(html).toContain('data-slot="input"');
	expect(html).toContain("h-8");
	expect(html).toContain("csv-filter");
	expect(html).toContain('aria-label="Filter rows"');
	expect(html).toContain('data-filter="csv"');
});
