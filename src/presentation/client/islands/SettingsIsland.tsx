import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/Button.tsx";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/Dialog.tsx";
import { Kbd } from "../../components/ui/Kbd.tsx";
import { Label } from "../../components/ui/Label.tsx";
import { NativeSelect } from "../../components/ui/NativeSelect.tsx";
import { Slider } from "../../components/ui/Slider.tsx";
import { Switch } from "../../components/ui/Switch.tsx";
import type { SwitchProps } from "../../components/ui/Switch.tsx";
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
	description?: string;
	label: string;
	labelId: string;
}

export function SettingsSwitchRow({
	id,
	description,
	label,
	labelId,
	...switchProps
}: SettingsSwitchRowProps): React.JSX.Element {
	const descriptionId = description ? `${id}-description` : undefined;

	return (
		<div className="flex items-center justify-between gap-6">
			<div className="grid gap-1">
				<Label
					className={
						switchProps.disabled
							? "text-muted-foreground"
							: "cursor-pointer"
					}
					htmlFor={id}
					id={labelId}
				>
					{label}
				</Label>
				{description ? (
					<p
						className="text-xs leading-relaxed text-muted-foreground"
						id={descriptionId}
					>
						{description}
					</p>
				) : null}
			</div>
			<Switch
				className="self-center"
				id={id}
				aria-labelledby={labelId}
				aria-describedby={descriptionId}
				{...switchProps}
			/>
		</div>
	);
}

export interface SettingsPanelProps {
	settings: Settings;
	localPythonAvailable: boolean;
	initialFocusRef: React.RefObject<HTMLButtonElement>;
	onOpenShortcuts: () => void;
	onUpdate: (patch: Partial<Settings>) => void;
}

export function SettingsPanel({
	settings,
	localPythonAvailable,
	initialFocusRef,
	onOpenShortcuts,
	onUpdate,
}: SettingsPanelProps): React.JSX.Element {
	const handleFontSizeChange = (values: number | readonly number[]) => {
		const value = typeof values === "number" ? values : values[0];
		if (FONT_SIZES.includes(value as (typeof FONT_SIZES)[number])) {
			onUpdate({ fontSize: value as (typeof FONT_SIZES)[number] });
		}
	};

	const handleFontFamilyChange = (
		event: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const value = event.currentTarget.value;
		if (FONT_FAMILIES.includes(value as FontFamily)) {
			onUpdate({ fontFamily: value as FontFamily });
		}
	};

	const localPythonEnabled =
		settings.useLocalPython && localPythonAvailable;

	return (
		<>
			<DialogHeader className="pr-8">
				<DialogTitle id="settings-dialog-title">Settings</DialogTitle>
				<DialogDescription>
					Personalise your reading experience. Changes are saved automatically.
				</DialogDescription>
			</DialogHeader>

			<div
				className="grid gap-4"
				id="settings-panel"
			>
				<section
					className="grid gap-3"
					aria-labelledby="readrun-theme-label"
				>
					<h2 className="text-sm font-medium" id="readrun-theme-label">
						Appearance
					</h2>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{THEMES.map((theme) => {
							const selected = settings.theme === theme;
							return (
								<Button
									ref={selected ? initialFocusRef : undefined}
									type="button"
									key={theme}
									variant={selected ? "secondary" : "outline"}
									data-theme-choice={theme}
									onClick={() => onUpdate({ theme: theme as Theme })}
									aria-pressed={selected}
								>
									{THEME_LABELS[theme]}
								</Button>
							);
						})}
					</div>
				</section>

				<section
					className="grid gap-4 border-t pt-4"
					aria-labelledby="reading-settings-title"
				>
					<h2 className="text-sm font-medium" id="reading-settings-title">
						Reading
					</h2>

					<div className="flex items-center justify-between gap-4">
						<Label htmlFor="readrun-font-family">Typeface</Label>
						<NativeSelect
							className="w-40"
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
						<div className="flex items-center justify-between gap-4">
							<span className="font-medium" id="readrun-font-label">
								Text size
							</span>
							<output className="text-xs text-muted-foreground">
								{settings.fontSize}px
							</output>
						</div>
						<Slider
							id="readrun-font-range"
							min={12}
							max={24}
							step={2}
							value={[settings.fontSize]}
							onValueChange={handleFontSizeChange}
							aria-labelledby="readrun-font-label"
						/>
						<div
							className="flex justify-between text-xs text-muted-foreground"
							aria-hidden="true"
						>
							<span>12px</span>
							<span>24px</span>
						</div>
					</div>

					<div className="hidden gap-2 md:grid" id="width-section">
						<div className="flex items-center justify-between gap-4">
							<span className="font-medium" id="readrun-width-label">
								Content width
							</span>
							<output className="text-xs text-muted-foreground">
								{settings.contentWidth}px
							</output>
						</div>
						<Slider
							id="readrun-width-range"
							min={500}
							max={1400}
							step={20}
							value={[settings.contentWidth]}
							onValueChange={(values) =>
								onUpdate({
									contentWidth:
										typeof values === "number"
											? values
											: (values[0] ?? settings.contentWidth),
								})
							}
							aria-labelledby="readrun-width-label"
						/>
					</div>
				</section>

				<section
					className="grid gap-3 border-t pt-4"
					aria-labelledby="behaviour-settings-title"
				>
					<h2 className="text-sm font-medium" id="behaviour-settings-title">
						Behaviour
					</h2>

					<SettingsSwitchRow
						id="readrun-local-python-toggle"
						label="Run Python locally"
						labelId="readrun-local-python-label"
						description={
							localPythonAvailable
								? "Use the local Python runtime for executable code."
								: "Requires uv to be installed on this device."
						}
						checked={localPythonEnabled}
						disabled={!localPythonAvailable}
						title={
							localPythonAvailable
								? undefined
								: "Local Python execution requires uv to be installed."
						}
						onCheckedChange={(checked) =>
							onUpdate({ useLocalPython: checked })
						}
					/>
				</section>
			</div>

			<DialogFooter className="border-t pt-4 sm:justify-between">
				<Button
					type="button"
					variant="outline"
					id="open-shortcuts-btn"
					onClick={onOpenShortcuts}
				>
					Keyboard shortcuts
					<Kbd>?</Kbd>
				</Button>
				<DialogClose render={<Button />}>
					Done
				</DialogClose>
			</DialogFooter>
		</>
	);
}

export function SettingsIsland(props: SettingsIslandProps): React.JSX.Element {
	const [settings, setSettings] = useState<Settings>(() => loadSettings());
	const initialFocusRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		return subscribeSettings(setSettings);
	}, []);

	const update = useCallback((patch: Partial<Settings>) => {
		setSettings(commitSettings(patch));
	}, []);

	const localPythonAvailable = runtimeConfig?.enableLocalPython === true;
	const closeSettings = useCallback(() => closeOverlay("settings-overlay"), []);

	return (
		<Dialog
			open={props.open}
			onOpenChange={(open) => {
				if (!open) closeSettings();
			}}
		>
			<DialogContent
				id="settings-overlay"
				className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md"
				aria-modal="true"
				aria-labelledby="settings-dialog-title"
				initialFocus={initialFocusRef}
			>
				<SettingsPanel
					settings={settings}
					localPythonAvailable={localPythonAvailable}
					initialFocusRef={initialFocusRef}
					onOpenShortcuts={() => openOverlay("shortcuts-overlay")}
					onUpdate={update}
				/>
			</DialogContent>
		</Dialog>
	);
}
