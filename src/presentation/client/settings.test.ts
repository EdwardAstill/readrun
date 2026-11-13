import { afterEach, describe, expect, test } from "bun:test";

import {
	applySettings,
	commitSettings,
	DEFAULT_SETTINGS,
	normaliseSettings,
	subscribeSettings,
} from "./settings.ts";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

afterEach(() => {
	restoreGlobal("window", originalWindow);
	restoreGlobal("document", originalDocument);
});

describe("settings state", () => {
	test("normalises invalid persisted values", () => {
		expect(
			normaliseSettings({
				theme: "unknown",
				fontSize: 13,
				fontFamily: "comic",
				contentWidth: 20,
				showSidebar: "yes",
			}),
		).toMatchObject({
			theme: DEFAULT_SETTINGS.theme,
			fontSize: DEFAULT_SETTINGS.fontSize,
			fontFamily: DEFAULT_SETTINGS.fontFamily,
			contentWidth: DEFAULT_SETTINGS.contentWidth,
			showSidebar: DEFAULT_SETTINGS.showSidebar,
		});
	});

	test("commitSettings persists, applies, and notifies once", () => {
		const values = new Map<string, string>();
		Object.assign(globalThis, {
			window: {
				localStorage: {
					getItem: (key: string) => values.get(key) ?? null,
					setItem: (key: string, value: string) => values.set(key, value),
				},
			},
			document: createDocumentStub(),
		});

		const observed: string[] = [];
		const unsubscribe = subscribeSettings((settings) => {
			observed.push(settings.theme);
		});
		const next = commitSettings({ theme: "dark" });
		unsubscribe();

		expect(next.theme).toBe("dark");
		expect(observed).toEqual(["dark"]);
		expect(JSON.parse(values.get("readrun:settings") ?? "{}").theme).toBe(
			"dark",
		);
	});

	test("settings received from another document update controls without persisting again", () => {
		const doc = createDocumentStub();
		let writes = 0;
		Object.assign(globalThis, {
			window: {
				localStorage: { setItem: () => writes++ },
			},
			document: doc,
		});
		let displayed = DEFAULT_SETTINGS;
		const unsubscribe = subscribeSettings((settings) => {
			displayed = settings;
		});
		try {
			applySettings({ ...DEFAULT_SETTINGS, theme: "nord", fontSize: 20 });
			expect(displayed.theme).toBe("nord");
			expect(displayed.fontSize).toBe(20);
			expect(doc.documentElement!.dataset.theme).toBe("nord");
			expect(doc.body!.style.fontSize).toBe("20px");
			expect(writes).toBe(0);
		} finally {
			unsubscribe();
		}
	});
});

function createDocumentStub(): Partial<Document> {
	return {
		body: {
			style: { fontSize: "" },
			dataset: {},
		} as unknown as HTMLBodyElement,
		documentElement: {
			style: { setProperty: () => {} },
			dataset: {},
		} as unknown as HTMLElement,
		getElementById: () => null,
	};
}

function restoreGlobal(name: "window" | "document", value: unknown): void {
	if (value === undefined) {
		Reflect.deleteProperty(globalThis, name);
	} else {
		Object.assign(globalThis, { [name]: value });
	}
}
