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

export interface HljsColors {
	comment: string;
	keyword: string;
	string: string;
	number: string;
	builtIn: string;
	title: string;
	attr: string;
	name: string;
	deletion: string;
	deletionBg: string;
}

export interface ThemeDefinition {
	label: string;
	colors: ThemeColors;
	syntax: HljsColors;
}

/**
 * Canonical theme catalog. Theme selectors, settings labels, UI variables,
 * syntax highlighting, and picker swatches are all generated from this data.
 */
export const themeCatalog = {
	light: {
		label: "Light",
		colors: {
			colorScheme: "light",
			background: "#ffffff",
			sidebarBackground: "#f6f8fa",
			surface: "#f6f7f9",
			border: "#d0d7de",
			text: "#1f2328",
			muted: "#656d76",
			accent: "#0f62fe",
			accentForeground: "#ffffff",
			link: "#0969da",
			activeBackground: "#dcdcdc",
			codeBackground: "#f6f8fa",
			highlightBackground: "rgba(9, 105, 218, 0.18)",
		},
		syntax: {
			comment: "#6e7781",
			keyword: "#cf222e",
			string: "#0a3069",
			number: "#0550ae",
			builtIn: "#8250df",
			title: "#8250df",
			attr: "#0550ae",
			name: "#116329",
			deletion: "#82071e",
			deletionBg: "#ffebe9",
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
		syntax: {
			comment: "#8b949e",
			keyword: "#ff7b72",
			string: "#a5d6ff",
			number: "#79c0ff",
			builtIn: "#d2a8ff",
			title: "#d2a8ff",
			attr: "#79c0ff",
			name: "#7ee787",
			deletion: "#ffa198",
			deletionBg: "#490202",
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
		syntax: {
			comment: "#93a1a1",
			keyword: "#859900",
			string: "#2aa198",
			number: "#d33682",
			builtIn: "#b58900",
			title: "#268bd2",
			attr: "#b58900",
			name: "#268bd2",
			deletion: "#dc322f",
			deletionBg: "#fdf6e3",
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
		syntax: {
			comment: "#616e88",
			keyword: "#81a1c1",
			string: "#a3be8c",
			number: "#b48ead",
			builtIn: "#88c0d0",
			title: "#8fbcbb",
			attr: "#8fbcbb",
			name: "#81a1c1",
			deletion: "#bf616a",
			deletionBg: "#3b4252",
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
		syntax: {
			comment: "#6272a4",
			keyword: "#ff79c6",
			string: "#f1fa8c",
			number: "#bd93f9",
			builtIn: "#50fa7b",
			title: "#50fa7b",
			attr: "#50fa7b",
			name: "#ff79c6",
			deletion: "#ff5555",
			deletionBg: "#44475a",
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
		syntax: {
			comment: "#75715e",
			keyword: "#f92672",
			string: "#e6db74",
			number: "#ae81ff",
			builtIn: "#a6e22e",
			title: "#a6e22e",
			attr: "#a6e22e",
			name: "#f92672",
			deletion: "#f92672",
			deletionBg: "#3e3d32",
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
		syntax: {
			comment: "#928374",
			keyword: "#fb4934",
			string: "#b8bb26",
			number: "#d3869b",
			builtIn: "#fabd2f",
			title: "#83a598",
			attr: "#fabd2f",
			name: "#fb4934",
			deletion: "#fb4934",
			deletionBg: "#3c3836",
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
		syntax: {
			comment: "#6c7086",
			keyword: "#cba6f7",
			string: "#a6e3a1",
			number: "#fab387",
			builtIn: "#94e2d5",
			title: "#89b4fa",
			attr: "#94e2d5",
			name: "#cba6f7",
			deletion: "#f38ba8",
			deletionBg: "#313244",
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

export const hljsPalette = Object.fromEntries(
	themeNames.map((name) => [name, themeCatalog[name].syntax]),
) as Record<ThemeName, HljsColors>;
