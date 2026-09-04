import { expect, test } from "bun:test";

import { viewerUrl } from "./viewer-url.js";

test("accepts supported loopback URLs", () => {
	for (const raw of [
		"http://localhost:3001/docs",
		"http://127.42.0.1:3001/",
		"http://[::1]:3001/",
	]) {
		expect(viewerUrl(raw).toString()).toBe(raw);
	}
});

test("rejects missing or malformed URLs", () => {
	expect(() => viewerUrl(undefined)).toThrow(
		"Desktop viewer URL is required.",
	);
	expect(() => viewerUrl("not a url")).toThrow(
		/^Invalid desktop viewer URL:/,
	);
});

test("rejects non-HTTP and non-loopback URLs", () => {
	expect(() => viewerUrl("https://localhost:3001/")).toThrow(
		"Desktop viewer URL must use http.",
	);
	expect(() => viewerUrl("http://example.com:3001/")).toThrow(
		"Desktop viewer URL must use a loopback host.",
	);
	expect(() => viewerUrl("http://0.0.0.0:3001/")).toThrow(
		"Desktop viewer URL must use a loopback host.",
	);
});
