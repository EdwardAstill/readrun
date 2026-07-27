// Keyboard action registry and shortcut dispatch.
import {
	commitSettings,
	loadSettings,
	cycleTheme,
	cycleFontSize,
	type Settings,
} from "./settings.ts";
import { openOverlay, isAnyOverlayOpen, escapeSequence } from "./overlay.ts";

// --- Binding parser ---

interface ParsedBinding {
	key: string;
	shift: boolean;
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
}

function parseBinding(raw: string): ParsedBinding {
	const parts = raw.split("+");
	const mods = { shift: false, ctrl: false, meta: false, alt: false };
	let key = parts.pop()!;
	for (const m of parts) {
		const ml = m.toLowerCase();
		if (ml === "shift") mods.shift = true;
		else if (ml === "ctrl" || ml === "control") mods.ctrl = true;
		else if (ml === "meta" || ml === "cmd") mods.meta = true;
		else if (ml === "alt") mods.alt = true;
	}
	if (key === "Space") key = " ";
	return { key, ...mods };
}

function matchesKey(event: KeyboardEvent, parsed: ParsedBinding): boolean {
	return (
		event.key === parsed.key &&
		event.shiftKey === parsed.shift &&
		event.ctrlKey === parsed.ctrl &&
		event.metaKey === parsed.meta &&
		event.altKey === parsed.alt
	);
}

// --- Actions ---

function getSettings(): Settings {
	return loadSettings();
}

function openPageSearch(): void {
	openOverlay("page-search-overlay");
}

function getMainScrollContainer(): HTMLElement | null {
	return document.querySelector<HTMLElement>(".readrun-content");
}

function getNavLinks(): HTMLAnchorElement[] {
	return Array.from(
		document.querySelectorAll<HTMLAnchorElement>(".sidebar-nav a[href]"),
	);
}

function getCurrentPageIndex(): number {
	const links = getNavLinks();
	const path = normalizePath(window.location.pathname);
	return links.findIndex((anchor) => {
		try {
			return normalizePath(new URL(anchor.href).pathname) === path;
		} catch {
			return false;
		}
	});
}

function navigateToPage(direction: 1 | -1): void {
	const links = getNavLinks();
	const current = getCurrentPageIndex();
	if (current >= 0) {
		const next = current + direction;
		if (next >= 0 && next < links.length) {
			links[next]!.click();
		}
	}
}

export interface ShortcutActions {
	nextPage: () => void;
	prevPage: () => void;
	goHome: () => void;
	scrollDown: () => void;
	scrollUp: () => void;
	scrollToTop: () => void;
	scrollToBottom: () => void;
	toggleSidebar: () => void;
	focusMode: () => void;
	nextTheme: () => void;
	prevTheme: () => void;
	fontIncrease: () => void;
	fontDecrease: () => void;
	search: () => void;
	showShortcuts: () => void;
	closeOverlay: () => void;
}

const actions: ShortcutActions = {
	nextPage: () => navigateToPage(1),
	prevPage: () => navigateToPage(-1),
	goHome: () => {
		const links = getNavLinks();
		if (links.length > 0) {
			links[0]!.click();
		}
	},
	scrollDown: () => {
		const container = getMainScrollContainer();
		container?.scrollBy({
			top: container.clientHeight * 0.85,
			behavior: "smooth",
		});
	},
	scrollUp: () => {
		const container = getMainScrollContainer();
		container?.scrollBy({
			top: -container.clientHeight * 0.85,
			behavior: "smooth",
		});
	},
	scrollToTop: () =>
		getMainScrollContainer()?.scrollTo({ top: 0, behavior: "smooth" }),
	scrollToBottom: () => {
		const container = getMainScrollContainer();
		container?.scrollTo({
			top: container.scrollHeight,
			behavior: "smooth",
		});
	},
	toggleSidebar: () => {
		const s = getSettings();
		s.showSidebar = !s.showSidebar;
		commitSettings(s);
	},
	focusMode: () => {
		const s = getSettings();
		s.focusMode = !s.focusMode;
		commitSettings(s);
	},
	nextTheme: () => {
		const s = getSettings();
		const next = cycleTheme(1, s);
		commitSettings(next);
	},
	prevTheme: () => {
		const s = getSettings();
		const next = cycleTheme(-1, s);
		commitSettings(next);
	},
	fontIncrease: () => {
		const s = getSettings();
		const next = cycleFontSize(1, s);
		commitSettings(next);
	},
	fontDecrease: () => {
		const s = getSettings();
		const next = cycleFontSize(-1, s);
		commitSettings(next);
	},
	search: () => openPageSearch(),
	showShortcuts: () => openOverlay("shortcuts-overlay"),
	closeOverlay: () => {
		escapeSequence();
	},
};

function normalizePath(path: string): string {
	return path.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
}

// --- Shortcut bindings ---

export const SHORTCUT_BINDINGS: Record<keyof ShortcutActions, string> = {
	nextPage: "j",
	prevPage: "k",
	goHome: "g h",
	scrollDown: "Space",
	scrollUp: "Shift+Space",
	scrollToTop: "g g",
	scrollToBottom: "G",
	toggleSidebar: "b",
	focusMode: "f",
	nextTheme: "t",
	prevTheme: "T",
	fontIncrease: "=",
	fontDecrease: "-",
	search: "s",
	showShortcuts: "?",
	closeOverlay: "Escape",
};

export const SHORTCUT_GROUPS = [
	{
		label: "Navigation",
		items: [
			["Next page", "nextPage"],
			["Previous page", "prevPage"],
			["Go home", "goHome"],
			["Scroll down", "scrollDown"],
			["Scroll up", "scrollUp"],
		] as const,
	},
	{
		label: "Reading",
		items: [
			["Toggle sidebar", "toggleSidebar"],
			["Focus mode", "focusMode"],
			["Next theme", "nextTheme"],
			["Previous theme", "prevTheme"],
			["Increase font", "fontIncrease"],
			["Decrease font", "fontDecrease"],
		] as const,
	},
	{
		label: "Commands",
		items: [
			["Search page", "search"],
			["Show shortcuts", "showShortcuts"],
			["Close dialog", "closeOverlay"],
		] as const,
	},
] as const;

// --- Simple and chord bindings ---

interface SimpleBinding {
	parsed: ParsedBinding;
	action: keyof ShortcutActions;
	needsPreventDefault: boolean;
}

interface ChordBinding {
	suffix: ParsedBinding;
	action: keyof ShortcutActions;
}

// --- State ---

let chordKey: string | null = null;
let chordTimer: ReturnType<typeof setTimeout> | null = null;

function clearChord(): void {
	chordKey = null;
	if (chordTimer) {
		clearTimeout(chordTimer);
		chordTimer = null;
	}
}

let teardownListener: (() => void) | null = null;

function isEditingInput(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
		return true;
	}
	return target.isContentEditable;
}

function buildDispatchTable(): void {
	const simpleBindings: SimpleBinding[] = [];
	const chordBindings: Record<string, ChordBinding[]> = {};

	for (const [action, binding] of Object.entries(SHORTCUT_BINDINGS)) {
		const tokens = binding.split(/\s+/);
		if (tokens.length === 2) {
			const prefix = tokens[0]!;
			const suffix = parseBinding(tokens[1]!);
			if (!chordBindings[prefix]) {
				chordBindings[prefix] = [];
			}
			chordBindings[prefix]!.push({
				suffix,
				action: action as keyof ShortcutActions,
			});
		} else {
			const parsed = parseBinding(binding);
			const needsPreventDefault = parsed.key === " " || parsed.key === "/";
			simpleBindings.push({
				parsed,
				action: action as keyof ShortcutActions,
				needsPreventDefault,
			});
		}
	}

	const handler = (event: KeyboardEvent): void => {
		// Never fire shortcuts while editing text
		if (isEditingInput(event.target)) {
			// But Escape still blurs
			if (event.key === "Escape") {
				(event.target as HTMLElement).blur();
			}
			return;
		}

		// Escape is special — always handled
		if (event.key === "Escape") {
			actions.closeOverlay();
			return;
		}

		// Skip when an overlay is open (except Escape, already handled)
		if (isAnyOverlayOpen()) {
			return;
		}

		// Check chord completion first
		if (chordKey) {
			const chords = chordBindings[chordKey] ?? [];
			let matched = false;
			for (const { suffix, action } of chords) {
				if (matchesKey(event, suffix)) {
					actions[action]();
					matched = true;
					break;
				}
			}
			if (matched) {
				// Prevent key from entering input-like targets
				event.preventDefault();
			}
			clearChord();
			if (matched) {
				return;
			}
			// If no chord matched, fall through to check simple bindings
		}

		// Check if this key starts a chord (and isn't also a simple binding)
		if (
			!event.shiftKey &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey &&
			chordBindings[event.key]
		) {
			const isAlsoSimple = simpleBindings.some((b) =>
				matchesKey(event, b.parsed),
			);
			if (!isAlsoSimple) {
				chordKey = event.key;
				chordTimer = setTimeout(clearChord, 1000);
				return;
			}
		}

		// Check simple bindings
		for (const { parsed, action, needsPreventDefault } of simpleBindings) {
			if (matchesKey(event, parsed)) {
				if (needsPreventDefault) {
					event.preventDefault();
				}
				actions[action]();
				return;
			}
		}
	};

	// Remove old listener if exists
	if (teardownListener) {
		teardownListener();
	}

	document.addEventListener("keydown", handler);
	teardownListener = () => {
		document.removeEventListener("keydown", handler);
		clearChord();
	};
}

export function initShortcuts(): () => void {
	if (typeof document === "undefined") {
		return () => {};
	}
	buildDispatchTable();
	return () => {
		if (teardownListener) {
			teardownListener();
			teardownListener = null;
		}
	};
}

export function rebindShortcuts(): void {
	clearChord();
	buildDispatchTable();
}
