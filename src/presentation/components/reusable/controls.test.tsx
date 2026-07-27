import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./Button.tsx";
import { TextInput } from "./TextInput.tsx";

test("Button supplies shared classes and preserves native props", () => {
	const html = renderToStaticMarkup(
		<Button
			variant="primary"
			controlSize="default"
			className="feature-hook"
			data-action="run"
			disabled
		>
			Run
		</Button>,
	);

	expect(html).toContain('type="button"');
	expect(html).toContain(
		'class="rr-control rr-control--default rr-button rr-button--primary feature-hook"',
	);
	expect(html).toContain('data-action="run"');
	expect(html).toContain("disabled");
});

test("Button respects an explicit native type", () => {
	const html = renderToStaticMarkup(<Button type="submit">Save</Button>);

	expect(html).toContain('type="submit"');
	expect(html).toContain("rr-button--secondary");
});

test("TextInput supplies shared classes and preserves input attributes", () => {
	const html = renderToStaticMarkup(
		<TextInput
			className="csv-filter"
			type="search"
			size={20}
			aria-label="Filter rows"
			data-filter="csv"
		/>,
	);

	expect(html).toContain('type="search"');
	expect(html).toContain('size="20"');
	expect(html).toContain(
		'class="rr-control rr-control--compact rr-input csv-filter"',
	);
	expect(html).toContain('aria-label="Filter rows"');
	expect(html).toContain('data-filter="csv"');
});
