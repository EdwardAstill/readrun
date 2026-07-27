import { expect, test } from "bun:test";

import {
	createLiveUpdateRequest,
	isStaleLiveRequest,
	parseLiveEvent,
} from "./live.ts";

test("parseLiveEvent accepts the runtime snapshot contract", () => {
	expect(
		parseLiveEvent(
			JSON.stringify({
				type: "snapshot",
				version: 3,
				url: "/guide/",
			}),
		),
	).toEqual({ type: "snapshot", version: 3, url: "/guide/" });
});

test("parseLiveEvent rejects events without a numeric version", () => {
	expect(parseLiveEvent(JSON.stringify({ type: "snapshot" }))).toBeNull();
	expect(parseLiveEvent(JSON.stringify({ type: "connected", version: 1 }))).toBeNull();
});

test("live snapshot requests reserve distinct navigation ids", () => {
	let requestId = 4;
	const navigation = {
		reserveRequestId: () => ++requestId,
	};

	const first = createLiveUpdateRequest(
		navigation,
		{ type: "snapshot", version: 7 },
		"/current/",
	);
	const second = createLiveUpdateRequest(
		navigation,
		{ type: "snapshot", version: 8 },
		"/current/",
	);

	expect([first.id, second.id]).toEqual([5, 6]);
	expect(second.contentVersion).toBe(8);
	expect(isStaleLiveRequest({ currentRequestId: second.id }, first)).toBeTrue();
	expect(isStaleLiveRequest({ currentRequestId: second.id }, second)).toBeFalse();
});
