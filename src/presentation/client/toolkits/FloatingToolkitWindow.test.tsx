import {
	afterAll,
	afterEach,
	beforeAll,
	expect,
	test,
} from "bun:test";
import { act, useReducer } from "react";
import { createRoot, type Root } from "react-dom/client";

import { installHappyDom } from "../../../test/happy-dom.ts";
import { ToolkitWorkspace } from "./ToolkitWorkspace.tsx";
import type {
	ToolkitDefinition,
	ToolkitWorkspaceState,
} from "./types.ts";
import {
	createToolkitWorkspaceState,
	reduceToolkitWindows,
} from "./window-state.ts";

const terminal: ToolkitDefinition = {
	id: "python-terminal",
	title: "Python Terminal",
	description: "Run browser Python",
	defaultSize: { width: 640, height: 420 },
	minimumSize: { width: 360, height: 240 },
	render: () => (
		<input
			aria-label="Tool input"
			data-toolkit-primary-input
			defaultValue="preserved"
		/>
	),
};

const defaultViewport = { width: 1000, height: 700 };

let restoreDom: (() => void) | undefined;
let root: Root | undefined;

beforeAll(() => {
	restoreDom = installHappyDom("https://readrun.test/toolkits");
});

afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.replaceChildren();
	setViewport(defaultViewport.width, defaultViewport.height);
});

afterAll(() => {
	restoreDom?.();
});

test("renders a labelled modeless window and preserves its child while minimized", async () => {
	await renderWorkspace();
	const dialog = getDialog();
	const input = document.querySelector('[aria-label="Tool input"]');
	const titleId = dialog.getAttribute("aria-labelledby");

	expect(dialog.getAttribute("aria-modal")).toBe("false");
	expect(document.getElementById(titleId ?? "")?.textContent).toBe(
		"Python Terminal",
	);

	await clickLabel("Minimize Python Terminal");
	expect(dialog.hidden).toBe(true);
	expect(dialog.inert).toBe(true);
	expect(dialog.style.display).toBe("none");
	expect(document.querySelector('[aria-label="Tool input"]')).toBe(input);
	expect(
		document.querySelector('[aria-label="Restore Python Terminal"]'),
	).toBeTruthy();

	await clickLabel("Restore Python Terminal");
	await nextAnimationFrame();
	expect(dialog.hidden).toBe(false);
	expect(dialog.inert).toBe(false);
	expect(document.querySelector('[aria-label="Tool input"]')).toBe(input);
	expect(document.activeElement).toBe(input);
});

test("exposes Close on right click without an action button", async () => {
	await renderWorkspace();

	expect(
		document.querySelector('[aria-label="Window actions for Python Terminal"]'),
	).toBeNull();
	await openContextMenu(getDialog());
	expect(
		document.querySelector('[aria-label="Window menu for Python Terminal"]'),
	).toBeTruthy();

	await clickMenuItem("Close");
	expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("Escape closes the toolkit", async () => {
	await renderWorkspace();

	await act(async () => {
		document.body.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
		);
	});
	expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("leaves Escape to an active shell overlay", async () => {
	await renderWorkspace([terminal], openTerminalState(), false);

	await act(async () => {
		document.body.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
		);
	});
	expect(document.querySelector('[role="dialog"]')).toBeTruthy();
});

test("drags the title bar and resizes from the southeast handle", async () => {
	await renderWorkspace();

	await pointerSequence("Move Python Terminal", {
		start: { x: 100, y: 100 },
		end: { x: 140, y: 125 },
	});
	expect(readInlineRect()).toMatchObject({ x: 64, y: 49 });

	await pointerSequence("Resize Python Terminal", {
		start: { x: 500, y: 400 },
		end: { x: 530, y: 420 },
	});
	expect(readInlineRect()).toMatchObject({ width: 670, height: 440 });
});

test("switches to a top-inset compact surface with flush viewport edges", async () => {
	await renderWorkspace();
	setViewport(500, 720);

	await dispatchWindowResize();
	const dialog = getDialog();
	expect(dialog.dataset.compact).toBe("true");
	expect(readInlineRect().width).toBeLessThanOrEqual(500);
	expect(dialog.style.top).toBe("8px");
	expect(dialog.style.left).toBe("0px");
	expect(dialog.style.right).toBe("0px");
	expect(dialog.style.bottom).toBe("0px");
	expect(dialog.style.borderBottomLeftRadius).toBe("0px");
	expect(dialog.style.borderBottomRightRadius).toBe("0px");
});

test("omits an unknown definition once without breaking known windows", async () => {
	const errors: unknown[][] = [];
	const originalError = console.error;
	console.error = (...args: unknown[]) => errors.push(args);

	try {
		await renderWorkspace([terminal], {
			windows: [
				{
					id: "python-terminal",
					minimized: false,
					rect: { x: 24, y: 24, width: 640, height: 420 },
					zIndex: 1,
				},
				{
					id: "scientific-calculator",
					minimized: false,
					rect: { x: 48, y: 48, width: 480, height: 360 },
					zIndex: 2,
				},
			],
			nextZIndex: 3,
		});

		expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
		expect(getDialog().textContent).toContain("Python Terminal");
		expect(errors).toHaveLength(1);

		await dispatchWindowResize();
		expect(errors).toHaveLength(1);
	} finally {
		console.error = originalError;
	}
});

async function openContextMenu(element: HTMLElement): Promise<void> {
	await act(async () => {
		element.dispatchEvent(
			new MouseEvent("contextmenu", {
				bubbles: true,
				button: 2,
				clientX: 180,
				clientY: 140,
			}),
		);
	});
}

async function renderWorkspace(
	definitions: readonly ToolkitDefinition[] = [terminal],
	initialState = openTerminalState(),
	escapeClosesTopmost = true,
): Promise<void> {
	const container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
	await act(async () => {
		root?.render(
			<WorkspaceHarness
				definitions={definitions}
				initialState={initialState}
				escapeClosesTopmost={escapeClosesTopmost}
			/>,
		);
	});
}

function WorkspaceHarness({
	definitions,
	initialState,
	escapeClosesTopmost,
}: {
	definitions: readonly ToolkitDefinition[];
	initialState: ToolkitWorkspaceState;
	escapeClosesTopmost: boolean;
}) {
	const [state, dispatch] = useReducer(reduceToolkitWindows, initialState);
	return (
		<ToolkitWorkspace
			definitions={definitions}
			state={state}
			dispatch={dispatch}
			escapeClosesTopmost={escapeClosesTopmost}
		/>
	);
}

function openTerminalState(): ToolkitWorkspaceState {
	return reduceToolkitWindows(createToolkitWorkspaceState(), {
		type: "open",
		definition: terminal,
		viewport: defaultViewport,
	});
}

function getDialog(): HTMLElement {
	const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
	if (!dialog) throw new Error("Expected toolkit dialog");
	return dialog;
}

async function clickLabel(label: string): Promise<void> {
	const element = document.querySelector<HTMLElement>(
		`[aria-label="${label}"]`,
	);
	if (!element) throw new Error(`Expected control labelled "${label}"`);
	await act(async () => {
		element.focus();
		element.click();
	});
}

async function clickMenuItem(label: string): Promise<void> {
	const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
		(candidate) => candidate.textContent === label,
	);
	if (!item) {
		throw new Error(
			`Expected menu item "${label}"; DOM: ${document.body.innerHTML}`,
		);
	}
	await act(async () => {
		item.focus();
		item.click();
	});
}

async function pointerSequence(
	label: string,
	points: {
		start: { x: number; y: number };
		end: { x: number; y: number };
	},
): Promise<void> {
	const element = document.querySelector<HTMLElement>(
		`[aria-label="${label}"]`,
	);
	if (!element) throw new Error(`Expected pointer target labelled "${label}"`);
	await act(async () => {
		element.dispatchEvent(
			new PointerEvent("pointerdown", {
				bubbles: true,
				button: 0,
				clientX: points.start.x,
				clientY: points.start.y,
				pointerId: 1,
			}),
		);
		element.dispatchEvent(
			new PointerEvent("pointermove", {
				bubbles: true,
				clientX: points.end.x,
				clientY: points.end.y,
				pointerId: 1,
			}),
		);
		element.dispatchEvent(
			new PointerEvent("pointerup", {
				bubbles: true,
				clientX: points.end.x,
				clientY: points.end.y,
				pointerId: 1,
			}),
		);
	});
}

function readInlineRect(): {
	x: number;
	y: number;
	width: number;
	height: number;
} {
	const dialog = getDialog();
	return {
		x: Number(dialog.dataset.x),
		y: Number(dialog.dataset.y),
		width: Number(dialog.dataset.width),
		height: Number(dialog.dataset.height),
	};
}

function setViewport(width: number, height: number): void {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: width,
	});
	Object.defineProperty(window, "innerHeight", {
		configurable: true,
		value: height,
	});
}

async function dispatchWindowResize(): Promise<void> {
	await act(async () => {
		window.dispatchEvent(new Event("resize"));
	});
}

async function nextAnimationFrame(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => resolve());
			}),
	);
}
