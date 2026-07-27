import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../../components/reusable/Modal.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Label } from "../../components/ui/Label.tsx";
import { NativeSelect } from "../../components/ui/NativeSelect.tsx";
import { Slider } from "../../components/ui/Slider.tsx";
import { Switch } from "../../components/ui/Switch.tsx";
import type { SwitchProps } from "../../components/ui/Switch.tsx";
import {
	DialogHeader,
	DialogTitle,
} from "../../components/ui/Dialog.tsx";
import { closeOverlay, openOverlay } from "../overlay.ts";
import {
	commitSettings,
	loadSettings,
	runtimeConfig,
	subscribeSettings,
	THEMES,
	THEME_LABELS,
	FONT_SIZES,
	FONT_FAMILIES,
	type Settings,
	type Theme,
	type FontFamily,
} from "../settings.ts";

export interface SettingsIslandProps {
	open: boolean;
}

interface SettingsSwitchRowProps
	extends Pick<
		SwitchProps,
		"checked" | "disabled" | "onCheckedChange" | "title"
	> {
	id: string;
	label: string;
	labelId: string;
}

export function SettingsSwitchRow({
	id,
	label,
	labelId,
	...switchProps
}: SettingsSwitchRowProps): React.JSX.Element {
	return (
		<div className="flex items-center justify-between gap-2">
			<Label
				className={switchProps.disabled ? "text-muted-foreground" : "cursor-pointer"}
				htmlFor={id}
				id={labelId}
			>
				{label}
			</Label>
			<Switch
				id={id}
				aria-labelledby={labelId}
				{...switchProps}
			/>
		</div>
	);
}

export function SettingsIsland(props: SettingsIslandProps): React.JSX.Element {
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const initialFocusRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		return subscribeSettings(setSettings);
	}, []);

	const update = useCallback((patch: Partial<Settings>) => {
		setSettings(commitSettings(patch));
	}, []);

	const handleFontSizeChange = useCallback(
		(values: number | readonly number[]) => {
			const value = typeof values === "number" ? values : values[0];
			if (FONT_SIZES.includes(value as (typeof FONT_SIZES)[number])) {
				update({ fontSize: value as (typeof FONT_SIZES)[number] });
			}
		},
		[update],
	);

	const handleFontFamilyChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const value = event.currentTarget.value;
			if (FONT_FAMILIES.includes(value as FontFamily)) {
				update({ fontFamily: value as FontFamily });
			}
		},
		[update],
	);

	const localPythonAvailable = runtimeConfig?.enableLocalPython === true;
	const localPythonEnabled = settings.useLocalPython && localPythonAvailable;

	return (
		<Modal
			id="settings-overlay"
			open={props.open}
			onClose={() => closeOverlay("settings-overlay")}
			ariaLabelledBy="settings-dialog-title"
			initialFocusRef={initialFocusRef}
		>
			<DialogHeader>
				<DialogTitle id="settings-dialog-title">
					Settings
				</DialogTitle>
			</DialogHeader>
			<div className="grid gap-4" id="settings-panel">
				<div className="grid gap-2">
					<span className="text-sm font-medium" id="readrun-font-label">
						Font size — {settings.fontSize}px
					</span>
					<Slider
						ref={initialFocusRef}
						id="readrun-font-range"
						min={12}
						max={24}
						step={2}
						value={[settings.fontSize]}
						onValueChange={handleFontSizeChange}
						aria-labelledby="readrun-font-label"
					/>
				</div>

				<div className="grid gap-2">
					<label className="text-sm font-medium" htmlFor="readrun-font-family">
						Font
					</label>
					<NativeSelect
						id="readrun-font-family"
						value={settings.fontFamily}
						onChange={handleFontFamilyChange}
					>
						<option value="sans">Inter</option>
						<option value="system">System</option>
						<option value="serif">Serif</option>
						<option value="mono">Mono</option>
					</NativeSelect>
				</div>

				<div className="grid gap-2">
					<span className="text-sm font-medium" id="readrun-theme-label">
						Theme
					</span>
					<div className="grid grid-cols-2 gap-2" aria-labelledby="readrun-theme-label">
						{THEMES.map((theme) => (
							<Button
								type="button"
								key={theme}
								variant={settings.theme === theme ? "secondary" : "outline"}
								data-theme-choice={theme}
								onClick={() => update({ theme: theme as Theme })}
								aria-pressed={settings.theme === theme}
							>
								<span>{THEME_LABELS[theme]}</span>
							</Button>
						))}
					</div>
				</div>

				<div className="hidden gap-2 md:grid" id="width-section">
					<span className="text-sm font-medium" id="readrun-width-label">
						Content width — {settings.contentWidth}px
					</span>
					<Slider
						id="readrun-width-range"
						min={500}
						max={1400}
						step={20}
						value={[settings.contentWidth]}
						onValueChange={(values) =>
							update({
								contentWidth:
									typeof values === "number"
										? values
										: (values[0] ?? settings.contentWidth),
							})
						}
						aria-labelledby="readrun-width-label"
					/>
				</div>

				<SettingsSwitchRow
					id="readrun-sidebar-toggle"
					label="Show sidebar"
					labelId="readrun-sidebar-label"
					checked={settings.showSidebar}
					onCheckedChange={(checked) => update({ showSidebar: checked })}
				/>

				<SettingsSwitchRow
					id="readrun-local-python-toggle"
					label="Run Python locally"
					labelId="readrun-local-python-label"
					checked={localPythonEnabled}
					disabled={!localPythonAvailable}
					title={
						localPythonAvailable
							? undefined
							: "Local Python execution requires uv to be installed."
					}
					onCheckedChange={(checked) => update({ useLocalPython: checked })}
				/>

				<div>
					<Button
						variant="outline"
						size="default"
						id="open-shortcuts-btn"
						onClick={() => openOverlay("shortcuts-overlay")}
					>
						Keyboard Shortcuts
					</Button>
				</div>
			</div>
		</Modal>
	);
}
