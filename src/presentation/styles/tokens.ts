export interface ThemeColors {
	colorScheme: "light" | "dark";
	background: string;
	sidebarBackground: string;
	surface: string;
	border: string;
	text: string;
	muted: string;
	accent: string;
	accentForeground: string;
	link: string;
	activeBackground: string;
	codeBackground: string;
	highlightBackground: string;
}

export interface ThemeDefinition {
	label: string;
	colors: ThemeColors;
}

/**
 * Canonical theme catalog. Theme selectors, settings labels, UI variables,
 * and picker swatches are all generated from this data.
 */
export const themeCatalog = {
	light: {
		label: "Light",
		colors: {
			colorScheme: "light",
			background: "#ffffff",
			sidebarBackground: "#fafafa",
			surface: "#f4f4f5",
			border: "#e4e4e7",
			text: "#18181b",
			muted: "#71717a",
			accent: "#18181b",
			accentForeground: "#fafafa",
			link: "#2563eb",
			activeBackground: "#f0f0f1",
			codeBackground: "#f4f4f5",
			highlightBackground: "#dbeafe",
		},
	},
	dark: {
		label: "Dark",
		colors: {
			colorScheme: "dark",
			background: "#0d1117",
			sidebarBackground: "#161b22",
			surface: "#161b22",
			border: "#30363d",
			text: "#e6edf3",
			muted: "#8b949e",
			accent: "#58a6ff",
			accentForeground: "#0d1117",
			link: "#58a6ff",
			activeBackground: "#1f2a38",
			codeBackground: "#161b22",
			highlightBackground: "rgba(88, 166, 255, 0.25)",
		},
	},
	solarized: {
		label: "Solarized",
		colors: {
			colorScheme: "light",
			background: "#fdf6e3",
			sidebarBackground: "#eee8d5",
			surface: "#eee8d5",
			border: "#d6ccb1",
			text: "#657b83",
			muted: "#93a1a1",
			accent: "#268bd2",
			accentForeground: "#002b36",
			link: "#268bd2",
			activeBackground: "#e8dfc8",
			codeBackground: "#eee8d5",
			highlightBackground: "rgba(38, 139, 210, 0.20)",
		},
	},
	nord: {
		label: "Nord",
		colors: {
			colorScheme: "dark",
			background: "#2e3440",
			sidebarBackground: "#3b4252",
			surface: "#3b4252",
			border: "#434c5e",
			text: "#d8dee9",
			muted: "#616e88",
			accent: "#88c0d0",
			accentForeground: "#2e3440",
			link: "#88c0d0",
			activeBackground: "#434c5e",
			codeBackground: "#3b4252",
			highlightBackground: "rgba(136, 192, 208, 0.25)",
		},
	},
	dracula: {
		label: "Dracula",
		colors: {
			colorScheme: "dark",
			background: "#282a36",
			sidebarBackground: "#21222c",
			surface: "#21222c",
			border: "#44475a",
			text: "#f8f8f2",
			muted: "#6272a4",
			accent: "#8be9fd",
			accentForeground: "#282a36",
			link: "#8be9fd",
			activeBackground: "#44475a",
			codeBackground: "#21222c",
			highlightBackground: "rgba(139, 233, 253, 0.22)",
		},
	},
	monokai: {
		label: "Monokai",
		colors: {
			colorScheme: "dark",
			background: "#272822",
			sidebarBackground: "#1e1f1c",
			surface: "#1e1f1c",
			border: "#3e3d32",
			text: "#f8f8f2",
			muted: "#75715e",
			accent: "#66d9ef",
			accentForeground: "#272822",
			link: "#66d9ef",
			activeBackground: "#3e3d32",
			codeBackground: "#1e1f1c",
			highlightBackground: "rgba(102, 217, 239, 0.22)",
		},
	},
	gruvbox: {
		label: "Gruvbox",
		colors: {
			colorScheme: "dark",
			background: "#282828",
			sidebarBackground: "#3c3836",
			surface: "#3c3836",
			border: "#504945",
			text: "#ebdbb2",
			muted: "#928374",
			accent: "#83a598",
			accentForeground: "#282828",
			link: "#83a598",
			activeBackground: "#504945",
			codeBackground: "#3c3836",
			highlightBackground: "rgba(131, 165, 152, 0.25)",
		},
	},
	catppuccin: {
		label: "Catppuccin",
		colors: {
			colorScheme: "dark",
			background: "#1e1e2e",
			sidebarBackground: "#181825",
			surface: "#181825",
			border: "#313244",
			text: "#cdd6f4",
			muted: "#6c7086",
			accent: "#89b4fa",
			accentForeground: "#1e1e2e",
			link: "#89b4fa",
			activeBackground: "#313244",
			codeBackground: "#181825",
			highlightBackground: "rgba(137, 180, 250, 0.25)",
		},
	},
} as const satisfies Record<string, ThemeDefinition>;

export type ThemeName = keyof typeof themeCatalog;

export const themeNames = Object.keys(themeCatalog) as ThemeName[];

export const themeLabels = Object.fromEntries(
	themeNames.map((name) => [name, themeCatalog[name].label]),
) as Record<ThemeName, string>;

/** Derived compatibility views for the root token modules. */
export const themePalette = Object.fromEntries(
	themeNames.map((name) => [name, themeCatalog[name].colors]),
) as Record<ThemeName, ThemeColors>;
