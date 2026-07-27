import { READRUN_ASSET_BASE_URL, READRUN_SEARCH_INDEX_URL } from "./paths.ts";

export interface ReadrunRuntimeConfig {
	clientScriptUrl: string;
	clientStyleUrl: string;
	searchIndexUrl: string;
	assetBaseUrl: string;
	liveEventsUrl: string;
	liveRenderUrl: string;
	liveStatusUrl: string;
	enableLiveReload: boolean;
	enableLocalPython: boolean;
	enableBrowserPython?: boolean;
}

export const DEFAULT_RUNTIME_CONFIG: ReadrunRuntimeConfig = {
	clientScriptUrl: "/_readrun/client.js",
	clientStyleUrl: "/_readrun/client.css",
	searchIndexUrl: READRUN_SEARCH_INDEX_URL,
	assetBaseUrl: READRUN_ASSET_BASE_URL,
	liveEventsUrl: "/_readrun/live/events",
	liveRenderUrl: "/_readrun/live/render",
	liveStatusUrl: "/_readrun/live/status",
	enableLiveReload: false,
	enableLocalPython: false,
	enableBrowserPython: true,
};

export function resolveRuntimeConfig(
	value?: Partial<ReadrunRuntimeConfig>,
): ReadrunRuntimeConfig {
	return {
		...DEFAULT_RUNTIME_CONFIG,
		...value,
	};
}
