// Settings state, persistence, and DOM application.
import {
	themeLabels,
	themeNames,
	type ThemeName,
} from "../styles/tokens.ts";
import { readRuntimeConfig } from "./runtime-config.ts";

const STORAGE_KEY = "readrun:settings";
type SettingsListener = (settings: Settings) => void;
const settingsListeners = new Set<SettingsListener>();

export const THEMES = themeNames;
export type Theme = ThemeName;
export const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24] as const;
export type FontSize = (typeof FONT_SIZES)[number];
export const FONT_FAMILIES = ["sans", "serif", "mono", "system"] as const;
export type FontFamily = (typeof FONT_FAMILIES)[number];

export const THEME_LABELS = themeLabels;

export interface Settings {
	theme: Theme;
	fontSize: FontSize;
	fontFamily: FontFamily;
	contentWidth: number;
	showSidebar: boolean;
	focusMode: boolean;
	useLocalPython: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	theme: "light",
	fontSize: 16,
	fontFamily: "sans",
	contentWidth: 880,
	showSidebar: true,
	focusMode: false,
	useLocalPython: true,
};

export const runtimeConfig = readRuntimeConfig();

export function loadSettings(): Settings {
	if (typeof window === "undefined") {
		return normaliseSettings(DEFAULT_SETTINGS);
	}
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return normaliseSettings(raw ? JSON.parse(raw) : {});
	} catch {
		return normaliseSettings(DEFAULT_SETTINGS);
	}
}

export function normaliseSettings(value: unknown): Settings {
	const input =
		value && typeof value === "object" ? (value as Partial<Settings>) : {};
	const merged = { ...DEFAULT_SETTINGS, ...input };

	if (!THEMES.includes(merged.theme as Theme)) {
		merged.theme = DEFAULT_SETTINGS.theme;
	}
	if (!FONT_SIZES.includes(merged.fontSize as FontSize)) {
		merged.fontSize = DEFAULT_SETTINGS.fontSize;
	}
	if (!FONT_FAMILIES.includes(merged.fontFamily as FontFamily)) {
		merged.fontFamily = DEFAULT_SETTINGS.fontFamily;
	}
	if (
		typeof merged.contentWidth !== "number" ||
		merged.contentWidth < 500 ||
		merged.contentWidth > 1400
	) {
		merged.contentWidth = DEFAULT_SETTINGS.contentWidth;
	}
	if (typeof merged.showSidebar !== "boolean") {
		merged.showSidebar = DEFAULT_SETTINGS.showSidebar;
	}
	if (typeof merged.focusMode !== "boolean") {
		merged.focusMode = DEFAULT_SETTINGS.focusMode;
	}
	if (typeof merged.useLocalPython !== "boolean") {
		merged.useLocalPython = DEFAULT_SETTINGS.useLocalPython;
	}
	if (runtimeConfig && !runtimeConfig.enableLocalPython) {
		merged.useLocalPython = false;
	}

	return merged as Settings;
}

export function saveSettings(s: Settings): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	} catch {
		// Ignore storage errors
	}
}

export function subscribeSettings(listener: SettingsListener): () => void {
	settingsListeners.add(listener);
	return () => settingsListeners.delete(listener);
}

/** The only durable settings write path. */
export function commitSettings(value: Settings | Partial<Settings>): Settings {
	const next = normaliseSettings({ ...loadSettings(), ...value });
	saveSettings(next);
	applySettings(next);
	for (const listener of settingsListeners) listener(next);
	return next;
}

export function applySettings(s: Settings): void {
	if (typeof document === "undefined") {
		return;
	}

	// Font size
	document.body.style.fontSize = `${s.fontSize}px`;
	const fontStack = fontStackFor(s.fontFamily);
	document.documentElement.style.setProperty("--font-body", fontStack);
	document.documentElement.dataset.font = s.fontFamily;

	// Content width
	document.documentElement.style.setProperty(
		"--readrun-content-width",
		`${s.contentWidth}px`,
	);
	const main = document.getElementById("main-content");
	if (main) {
		main.style.maxWidth = `${s.contentWidth}px`;
	}

	// Sidebar
	const sidebar = document.getElementById("readrun-sidebar");
	if (sidebar) {
		sidebar.style.display = s.showSidebar && !s.focusMode ? "" : "none";
	}

	// Theme
	if (s.theme === "light") {
		delete document.documentElement.dataset.theme;
	} else {
		document.documentElement.dataset.theme = s.theme;
	}

	// Focus mode
	if (s.focusMode) {
		document.body.dataset.focus = "true";
	} else {
		delete document.body.dataset.focus;
	}
}

export function cycleTheme(direction: 1 | -1, current: Settings): Settings {
	const idx = THEMES.indexOf(current.theme as Theme);
	const nextIdx = (idx + direction + THEMES.length) % THEMES.length;
	return { ...current, theme: THEMES[nextIdx] as Theme };
}

export function cycleFontSize(direction: 1 | -1, current: Settings): Settings {
	const idx = FONT_SIZES.indexOf(current.fontSize as FontSize);
	const nextIdx = idx + direction;
	if (nextIdx < 0 || nextIdx >= FONT_SIZES.length) {
		return current;
	}
	return { ...current, fontSize: FONT_SIZES[nextIdx] as FontSize };
}

export function fontStackFor(fontFamily: FontFamily): string {
	switch (fontFamily) {
		case "serif":
			return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
		case "mono":
			return 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';
		case "system":
			return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
		case "sans":
		default:
			return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';
	}
}
