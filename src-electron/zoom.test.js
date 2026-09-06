import { expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { enableWheelZoom } from "./zoom.js";

function contents() {
	const events = new EventEmitter();
	let factor = 1;
	events.getZoomFactor = () => factor;
	events.setZoomFactor = (value) => { factor = value; };
	enableWheelZoom(events);
	return events;
}

test("wheel zoom requests change page scale in both directions", () => {
	const page = contents();
	page.emit("zoom-changed", {}, "in");
	expect(page.getZoomFactor()).toBeCloseTo(1.2);
	page.emit("zoom-changed", {}, "out");
	expect(page.getZoomFactor()).toBeCloseTo(1);
	page.setZoomFactor(1.5);
	page.emit("zoom-changed", {}, "in");
	expect(page.getZoomFactor()).toBeCloseTo(1.8);
});

test("wheel zoom stays between 50 and 300 percent", () => {
	const page = contents();
	for (let i = 0; i < 30; i++) page.emit("zoom-changed", {}, "in");
	expect(page.getZoomFactor()).toBe(3);
	for (let i = 0; i < 30; i++) page.emit("zoom-changed", {}, "out");
	expect(page.getZoomFactor()).toBe(0.5);
});
