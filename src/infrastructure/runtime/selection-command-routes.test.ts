import { expect, test } from "bun:test";
import { selectionCommandResponse } from "./selection-command-routes.ts";

test("local command routes reject foreign origins, remote hosts, and missing custom headers", async () => {
	for (const request of [
		new Request("http://localhost:3000/_readrun/selection-commands"),
		new Request("http://localhost:3000/_readrun/selection-commands", { headers: { "X-Readrun-Commands": "1", Origin: "https://example.org" } }),
		new Request("http://example.org/_readrun/selection-commands", { headers: { "X-Readrun-Commands": "1" } }),
	]) expect((await selectionCommandResponse(request, "/tmp"))?.status).toBe(403);
});

test("oversized command bodies are rejected before execution", async () => {
	const request = new Request("http://localhost:3000/_readrun/selection-commands/launch", {
		method: "POST", headers: { "X-Readrun-Commands": "1", "Content-Type": "application/json" }, body: "x".repeat(1000001),
	});
	const response = await selectionCommandResponse(request, "/tmp");
	expect(response?.status).toBe(400);
	expect(await response?.json()).toEqual({ error: "Request is too large." });
});
