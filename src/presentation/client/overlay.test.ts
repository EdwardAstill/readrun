import { afterEach, describe, expect, test } from "bun:test";

import {
	closeAllOverlays,
	closeOverlay,
	escapeSequence,
	getActiveOverlay,
	openOverlay,
	subscribeOverlays,
} from "./overlay.ts";

afterEach(() => closeAllOverlays());

describe("overlay coordination", () => {
	test("keeps exactly one active overlay and notifies subscribers", () => {
		const snapshots: Array<string | null> = [];
		const unsubscribe = subscribeOverlays(() => {
			snapshots.push(getActiveOverlay());
		});

		openOverlay("page-search-overlay");
		openOverlay("site-search-overlay");
		closeOverlay("site-search-overlay");
		unsubscribe();

		expect(snapshots).toEqual([
			"page-search-overlay",
			"site-search-overlay",
			null,
		]);
	});

	test("returns from shortcuts to the settings dialog", () => {
		openOverlay("settings-overlay");
		openOverlay("shortcuts-overlay");
		expect(getActiveOverlay()).toBe("shortcuts-overlay");

		closeOverlay("shortcuts-overlay");
		expect(getActiveOverlay()).toBe("settings-overlay");
	});

	test("ignores unknown overlay IDs", () => {
		openOverlay("not-an-overlay");
		expect(getActiveOverlay()).toBeNull();
	});

	test("opens settings when Escape has nothing to dismiss", () => {
		const documentDescriptor = Object.getOwnPropertyDescriptor(
			globalThis,
			"document",
		);
		Object.defineProperty(globalThis, "document", {
			configurable: true,
			value: { querySelector: () => null },
		});

		try {
			expect(escapeSequence()).toBe(true);
			expect(getActiveOverlay()).toBe("settings-overlay");
		} finally {
			if (documentDescriptor) {
				Object.defineProperty(globalThis, "document", documentDescriptor);
			} else {
				Reflect.deleteProperty(globalThis, "document");
			}
		}
	});
});
