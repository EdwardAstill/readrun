import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { Slider, ToggleRow } from "./index.tsx";

test("widget Slider is an adapter over the shadcn Slider", () => {
	const html = renderToStaticMarkup(
		<Slider
			label="Sample size"
			min={1}
			max={20}
			value={8}
			onChange={() => {}}
		/>,
	);

	expect(html).toContain('data-slot="slider"');
	expect(html).toContain('data-slot="slider-track"');
	expect(html).toContain('data-slot="slider-thumb"');
	expect(html).toContain('role="group"');
});

test("widget ToggleRow is an adapter over the shadcn Switch", () => {
	const html = renderToStaticMarkup(
		<ToggleRow checked onChange={() => {}}>
			Show regions
		</ToggleRow>,
	);

	expect(html).toContain('data-slot="switch"');
	expect(html).toContain('data-slot="switch-thumb"');
	expect(html).toContain('role="switch"');
	expect(html).toContain('data-slot="label"');
	expect(html).toContain("Show regions");
});
