import { expect, test } from "bun:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Dialog } from "../../components/ui/Dialog.tsx";
import { DEFAULT_SETTINGS } from "../settings.ts";
import { SettingsPanel, SettingsSwitchRow } from "./SettingsIsland.tsx";

test("settings switch rows associate their shadcn label with the control", () => {
	const html = renderToStaticMarkup(
		<SettingsSwitchRow
			id="example-toggle"
			label="Example setting"
			labelId="example-label"
			description="Explains what the setting changes."
			checked
			onCheckedChange={() => {}}
		/>,
	);

	expect(html).toContain('data-slot="label"');
	expect(html).toContain('for="example-toggle"');
	expect(html).toContain('id="example-label"');
	expect(html).toContain('data-slot="switch"');
	expect(html).toContain('role="switch"');
	expect(html).toContain('aria-checked="true"');
	expect(html).toContain('id="example-toggle"');
	expect(html).toContain('aria-describedby="example-toggle-description"');
	expect(html).toContain('id="example-toggle-description"');
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

test("settings panel uses the approved controls and omits sidebar visibility", () => {
	const html = renderToStaticMarkup(
		<Dialog open>
			<SettingsPanel
				settings={DEFAULT_SETTINGS}
				localPythonAvailable={false}
				initialFocusRef={createRef<HTMLButtonElement>()}
				onOpenShortcuts={() => {}}
				onUpdate={() => {}}
			/>
		</Dialog>,
	);

	expect(html).toContain("Changes are saved automatically.");
	expect(html).toContain("Appearance");
	expect(html).toContain("Reading");
	expect(html).toContain("Behaviour");
	expect(html).toContain('data-slot="slider-track"');
	expect(html).toContain("bg-input");
	expect(html).toContain("data-[orientation=horizontal]:h-1.5");
	expect(html).toContain('data-slot="slider-thumb"');
	expect(html).toContain("border-primary");
	expect(html).toContain("bg-background");
	expect(html).not.toContain("Show sidebar");
	expect(html).not.toContain("readrun-sidebar-toggle");
	expect(html).toContain('id="open-shortcuts-btn"');
	expect(html).toMatch(/<button[^>]*id="open-shortcuts-btn"/);
	expect(html).toContain("Keyboard shortcuts");
	expect(html).toContain("Done");
});
