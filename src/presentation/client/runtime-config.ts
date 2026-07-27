import type { ReadrunRuntimeConfig } from "../../shared/runtime-config.ts";

export function readRuntimeConfig(): ReadrunRuntimeConfig | null {
	if (typeof document === "undefined") {
		return null;
	}

	const element = document.getElementById("readrun-runtime-config");
	if (!element?.textContent) {
		return null;
	}

	try {
		const parsed = JSON.parse(
			element.textContent,
		) as Partial<ReadrunRuntimeConfig>;
		if (
			typeof parsed.clientScriptUrl !== "string" ||
			typeof parsed.clientStyleUrl !== "string" ||
			typeof parsed.searchIndexUrl !== "string" ||
			typeof parsed.assetBaseUrl !== "string" ||
			typeof parsed.liveEventsUrl !== "string" ||
			typeof parsed.liveRenderUrl !== "string" ||
			typeof parsed.liveStatusUrl !== "string" ||
			typeof parsed.enableLiveReload !== "boolean" ||
			typeof parsed.enableLocalPython !== "boolean"
		) {
			return null;
		}
		return {
			...parsed,
			enableBrowserPython: parsed.enableBrowserPython === true,
		} as ReadrunRuntimeConfig;
	} catch {
		return null;
	}
}
