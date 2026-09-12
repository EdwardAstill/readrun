import { SELECTION_COMMANDS_URL } from "../../shared/selection-commands.ts";
import { launchSelectionCommand, readSelectionCommands, writeSelectionCommands } from "../execution/selection-commands.ts";

export function isLoopback(host: string): boolean {
	return ["localhost", "127.0.0.1", "::1", "[::1]", "::ffff:127.0.0.1"].includes(host);
}
export async function selectionCommandResponse(request: Request, root: string): Promise<Response | null> {
	const url = new URL(request.url);
	if (url.pathname !== SELECTION_COMMANDS_URL && url.pathname !== `${SELECTION_COMMANDS_URL}/launch`) return null;
	if (!isLoopback(url.hostname) || request.headers.get("X-Readrun-Commands") !== "1" ||
		(request.headers.has("origin") && request.headers.get("origin") !== url.origin)) {
		return Response.json({ error: "Selection commands require a local readrun window." }, { status: 403 });
	}
	try {
		if (url.pathname === SELECTION_COMMANDS_URL && request.method === "GET") {
			return Response.json(await readSelectionCommands(), { headers: { "Cache-Control": "no-store" } });
		}
		if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
		if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Expected JSON.");
		// Bound the streamed body too; Content-Length is optional and untrusted.
		const reader = request.body?.getReader();
		if (!reader) throw new Error("Missing request body.");
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.length;
				if (size > 1000000) { await reader.cancel(); throw new Error("Request is too large."); }
				chunks.push(value);
			}
		} finally { reader.releaseLock(); }
		const input = JSON.parse(await new Blob(chunks.map((chunk) => new Uint8Array(chunk))).text());
		if (url.pathname.endsWith("/launch")) {
			await launchSelectionCommand(root, input, await readSelectionCommands());
			return Response.json({ ok: true });
		}
		return Response.json(await writeSelectionCommands(input));
	} catch (error) {
		return Response.json({ error: error instanceof Error ? error.message : "Selection command failed." }, { status: 400 });
	}
}
