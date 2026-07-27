import { expect, test } from "bun:test";

import type { ClientFeature } from "./features.ts";
import { mountPresentationClient } from "./lifecycle.ts";

test("remount disposes and mounts page features without remounting application features", () => {
	const events: string[] = [];
	const target = new EventTarget();
	const features: ClientFeature[] = [
		feature("application", "application", events),
		feature("page", "page", events),
	];

	const handle = mountPresentationClient(features, target);
	target.dispatchEvent(new Event("readrun:remount"));

	expect(events).toEqual([
		"mount:application",
		"mount:page",
		"dispose:page",
		"mount:page",
	]);

	handle.teardown();
	expect(events.slice(-2)).toEqual([
		"dispose:page",
		"dispose:application",
	]);
});

test("teardown is idempotent and removes the remount listener", () => {
	const events: string[] = [];
	const target = new EventTarget();
	const handle = mountPresentationClient(
		[feature("page", "page", events)],
		target,
	);

	handle.teardown();
	handle.teardown();
	target.dispatchEvent(new Event("readrun:remount"));

	expect(events).toEqual(["mount:page", "dispose:page"]);
});

function feature(
	name: string,
	scope: ClientFeature["scope"],
	events: string[],
): ClientFeature {
	return {
		name,
		scope,
		mount() {
			events.push(`mount:${name}`);
			return () => events.push(`dispose:${name}`);
		},
	};
}
