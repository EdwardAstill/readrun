import { SELECTION_COMMANDS_URL, type SelectionCommandSettings } from "../../shared/selection-commands.ts";
import { readRuntimeConfig } from "./runtime-config.ts";

export function selectionCommandsAvailable(): boolean {
	return readRuntimeConfig()?.enableSelectionCommands === true &&
		["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}
export async function selectionCommandsRequest<T = SelectionCommandSettings>(suffix = "", body?: unknown): Promise<T> {
	const response = await fetch(`${SELECTION_COMMANDS_URL}${suffix}`, {
		method: body === undefined ? "GET" : "POST",
		headers: { "X-Readrun-Commands": "1", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const result = await response.json();
	if (!response.ok) throw new Error(result.error || "Selection command request failed.");
	return result;
}
