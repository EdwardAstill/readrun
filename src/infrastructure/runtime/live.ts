import type { LiveChannel, LiveEvent } from "../../application/ports/live-channel.ts";
import type {
  ContentChangeReason,
  ProjectRuntimeState,
} from "../../application/read-models/project-snapshot.ts";

export interface ProjectRuntimeStateOptions {
  root: string;
  version?: number;
}

export function createLiveRuntime(): LiveChannel {
  const listeners = new Set<(event: LiveEvent) => void>();

  return {
    publish(event) {
      for (const listener of listeners) {
        listener(event);
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      listener({ type: "connected", at: Date.now() });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createProjectRuntimeState(
  options: ProjectRuntimeStateOptions,
): ProjectRuntimeState {
  return {
    root: options.root,
    startedAt: Date.now(),
    version: options.version ?? 0,
  };
}

export function updateProjectRuntimeState(
  state: ProjectRuntimeState,
  reason: ContentChangeReason,
  relPath?: string,
): ProjectRuntimeState {
  return {
    ...state,
    version: state.version + 1,
    lastChange: {
      at: Date.now(),
      relPath,
      reason,
    },
  };
}

export function createSseResponse(channel: LiveChannel): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      unsubscribe = channel.subscribe((event) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      controller.enqueue(encoder.encode("retry: 1000\n\n"));
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
