import { Switch } from "@base-ui/react/switch";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../../components/reusable/Modal.tsx";
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

export function SettingsIsland(props: SettingsIslandProps): React.JSX.Element {
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const initialFocusRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		return subscribeSettings(setSettings);
	}, []);

	const update = useCallback((patch: Partial<Settings>) => {
		setSettings(commitSettings(patch));
	}, []);

	const handleFontSizeChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = Number(event.currentTarget.value);
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
			className="overlay"
			contentClassName="overlay__card"
			ariaLabelledBy="settings-dialog-title"
			initialFocusRef={initialFocusRef}
		>
			<div className="overlay__header">
				<h2 className="overlay__title" id="settings-dialog-title">
					Settings
				</h2>
				<button
					type="button"
					className="overlay__close-hint"
					data-overlay-close="settings-overlay"
					aria-label="Close settings"
					onClick={() => closeOverlay("settings-overlay")}
				>
					<span aria-hidden="true">×</span>
				</button>
			</div>
			<div className="settings-panel" id="settings-panel">
				<div className="settings__section">
					<span className="settings__label" id="readrun-font-label">
						Font size — {settings.fontSize}px
					</span>
					<input
						ref={initialFocusRef}
						className="settings__range"
						id="readrun-font-range"
						type="range"
						min={12}
						max={24}
						step={2}
						value={settings.fontSize}
						onChange={handleFontSizeChange}
						aria-labelledby="readrun-font-label"
					/>
				</div>

				<div className="settings__section">
					<label className="settings__label" htmlFor="readrun-font-family">
						Font
					</label>
					<select
						className="settings__select"
						id="readrun-font-family"
						value={settings.fontFamily}
						onChange={handleFontFamilyChange}
					>
						<option value="sans">Inter</option>
						<option value="system">System</option>
						<option value="serif">Serif</option>
						<option value="mono">Mono</option>
					</select>
				</div>

				<div className="settings__section">
					<span className="settings__label" id="readrun-theme-label">
						Theme
					</span>
					<div className="theme-grid" aria-labelledby="readrun-theme-label">
						{THEMES.map((theme) => (
							<button
								type="button"
								key={theme}
								className={`theme-card${
									settings.theme === theme ? " theme-card--active" : ""
								}`}
								data-theme-choice={theme}
								onClick={() => update({ theme: theme as Theme })}
								aria-pressed={settings.theme === theme}
							>
								<span className="theme-card__swatches" aria-hidden="true">
									<span />
									<span />
									<span />
								</span>
								<span className="theme-card__name">
									{THEME_LABELS[theme]}
								</span>
							</button>
						))}
					</div>
				</div>

				<div className="settings__section" id="width-section">
					<span className="settings__label" id="readrun-width-label">
						Content width — {settings.contentWidth}px
					</span>
					<input
						className="settings__range"
						id="readrun-width-range"
						type="range"
						min={500}
						max={1400}
						step={20}
						value={settings.contentWidth}
						onChange={(event) =>
							update({ contentWidth: Number(event.currentTarget.value) })
						}
						aria-labelledby="readrun-width-label"
					/>
				</div>

				<div className="settings__section">
					<div className="settings__toggle-row">
						<span className="settings__label" id="readrun-sidebar-label">
							Show sidebar
						</span>
						<Switch.Root
							render={<button type="button" />}
							nativeButton
							className={({ checked }) =>
								`settings__switch${
									checked ? " settings__switch--on" : ""
								}`
							}
							id="readrun-sidebar-toggle"
							aria-labelledby="readrun-sidebar-label"
							checked={settings.showSidebar}
							onCheckedChange={(checked) => update({ showSidebar: checked })}
						>
							<Switch.Thumb className="settings__switch-thumb" />
						</Switch.Root>
					</div>
				</div>

				<div className="settings__section">
					<div className="settings__toggle-row">
						<span className="settings__label" id="readrun-local-python-label">
							Run Python locally
						</span>
						<Switch.Root
							render={<button type="button" />}
							nativeButton
							className={({ checked }) =>
								`settings__switch${
									checked ? " settings__switch--on" : ""
								}${!localPythonAvailable ? " settings__switch--locked" : ""}`
							}
							id="readrun-local-python-toggle"
							aria-labelledby="readrun-local-python-label"
							checked={localPythonEnabled}
							disabled={!localPythonAvailable}
							title={
								localPythonAvailable
									? undefined
									: "Local Python execution requires uv to be installed."
							}
							onCheckedChange={(checked) => update({ useLocalPython: checked })}
						>
							<Switch.Thumb className="settings__switch-thumb" />
						</Switch.Root>
					</div>
				</div>

				<div className="settings__section">
					<button
						type="button"
						className="settings__shortcuts-btn"
						id="open-shortcuts-btn"
						onClick={() => openOverlay("shortcuts-overlay")}
					>
						Keyboard Shortcuts
					</button>
				</div>
			</div>
		</Modal>
	);
}
