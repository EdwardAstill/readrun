import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SettingsSwitchRow } from "./SettingsIsland.tsx";

test("settings switch rows associate their shadcn label with the control", () => {
	const html = renderToStaticMarkup(
		<SettingsSwitchRow
			id="readrun-sidebar-toggle"
			label="Show sidebar"
			labelId="readrun-sidebar-label"
			checked
			onCheckedChange={() => {}}
		/>,
	);

	expect(html).toContain('data-slot="label"');
	expect(html).toContain('for="readrun-sidebar-toggle"');
	expect(html).toContain('id="readrun-sidebar-label"');
	expect(html).toContain('role="switch"');
	expect(html).toContain('aria-checked="true"');
	expect(html).toContain('id="readrun-sidebar-toggle"');
});

test("settings switch rows preserve the disabled state", () => {
	const html = renderToStaticMarkup(
		<SettingsSwitchRow
			id="readrun-local-python-toggle"
			label="Run Python locally"
			labelId="readrun-local-python-label"
			checked={false}
			disabled
			onCheckedChange={() => {}}
		/>,
	);

	expect(html).toContain('aria-checked="false"');
	expect(html).toContain("disabled");
});
