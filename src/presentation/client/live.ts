import type { ReadrunRuntimeConfig } from "../../shared/runtime-config.ts";
import {
  createShellNavigation,
  type PageSwapRequest,
  type ShellNavigationState,
} from "./navigation.ts";

export interface LiveUpdateEvent {
  type: "snapshot" | "reload";
  version: number;
  url?: string;
}

export interface LiveClientOptions {
  runtime: ReadrunRuntimeConfig;
  navigation?: ShellNavigationState;
  connect?: (url: string) => EventSource;
}

export interface LiveClient {
  status: "idle" | "connected" | "closed";
  disconnect(): void;
}

export function createLiveClient(options: LiveClientOptions): LiveClient {
  if (!options.runtime.enableLiveReload || typeof window === "undefined") {
    return { status: "idle", disconnect() {} };
  }

  const navigation = options.navigation ?? createShellNavigation();
  const source = (options.connect ?? ((url) => new EventSource(url)))(
    options.runtime.liveEventsUrl,
  );

  const handleEvent = (event: MessageEvent<string>): void => {
    const parsed = parseLiveEvent(event.data);
    if (!parsed) {
      return;
    }
    if (parsed.type === "reload") {
      window.location.reload();
      return;
    }
    void refreshCurrentPage(navigation, parsed);
  };
  source.addEventListener("snapshot", handleEvent);
  source.addEventListener("reload", handleEvent);

  return {
    status: "connected",
    disconnect() {
      source.close();
    },
  };
}

export function parseLiveEvent(raw: string): LiveUpdateEvent | null {
  try {
    const parsed = JSON.parse(raw) as Partial<LiveUpdateEvent>;
    if (
      (parsed.type === "snapshot" || parsed.type === "reload") &&
      typeof parsed.version === "number"
    ) {
      return {
        type: parsed.type,
        version: parsed.version,
        url: parsed.url,
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function refreshCurrentPage(
  navigation: ShellNavigationState,
  event: LiveUpdateEvent,
): Promise<void> {
  const request = createLiveUpdateRequest(navigation, event);
  try {
    if (typeof fetch === "undefined") {
      reloadUnlessStale(navigation, request);
      return;
    }
    const response = await fetch(request.url, {
      headers: { "x-readrun-soft-render": "true" },
    });
    if (!response.ok) {
      reloadUnlessStale(navigation, request);
      return;
    }
    const html = await response.text();
    const documentSnapshot = new DOMParser().parseFromString(html, "text/html");
    if (!navigation.swap(request, documentSnapshot)) {
      reloadUnlessStale(navigation, request);
    }
  } catch {
    reloadUnlessStale(navigation, request);
  }
}

function reloadUnlessStale(
  navigation: Pick<ShellNavigationState, "currentRequestId">,
  request: PageSwapRequest,
): void {
  if (!isStaleLiveRequest(navigation, request)) window.location.reload();
}

export function isStaleLiveRequest(
  navigation: Pick<ShellNavigationState, "currentRequestId">,
  request: Pick<PageSwapRequest, "id">,
): boolean {
  return request.id < navigation.currentRequestId;
}

export function createLiveUpdateRequest(
  navigation: Pick<ShellNavigationState, "reserveRequestId">,
  event: LiveUpdateEvent,
  currentPath = window.location.pathname,
): PageSwapRequest {
  return {
    id: navigation.reserveRequestId(),
    url: event.url ?? currentPath,
    reason: "live-update",
    contentVersion: event.version,
  };
}
