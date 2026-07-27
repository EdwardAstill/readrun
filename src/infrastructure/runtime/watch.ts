import * as path from "node:path";
import { watch } from "node:fs";

import type { ContentChangeReason } from "../../application/read-models/project-snapshot.ts";
import {
  explainScopeDecision,
  type ContentScope,
} from "../../domain/project/scope.ts";
import { normaliseRelPath } from "../../shared/paths.ts";

export interface WatchHandle {
  stop(): void;
}

export interface StartFileWatcherOptions {
  root: string;
  scope?: ContentScope;
  getScope?: () => ContentScope;
  onChange?: (change: { relPath: string; reason: ContentChangeReason }) => void;
  debounceMs?: number;
}

export function startFileWatcher(options: StartFileWatcherOptions): WatchHandle {
  const root = path.resolve(options.root);
  const debounceMs = options.debounceMs ?? 100;
  let timer: Timer | null = null;
  let pending: { relPath: string; reason: ContentChangeReason } | null = null;

  const watcher = watch(root, { recursive: true }, (_eventType, filename) => {
    if (!filename) {
      return;
    }

    const relPath = normaliseRelPath(String(filename));
    if (relPath === "") {
      return;
    }
    if (
      relPath === ".readrun/.widgets-out" ||
      relPath.startsWith(".readrun/.widgets-out/")
    ) {
      return;
    }

    const scope = options.getScope?.() ?? options.scope;
    if (!scope) {
      throw new Error("startFileWatcher requires scope or getScope.");
    }
    const reason = classifyChangeReason(relPath, scope);
    pending = { relPath, reason };

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      if (!pending) {
        return;
      }

      options.onChange?.(pending);
      pending = null;
      timer = null;
    }, debounceMs);
  });

  return {
    stop() {
      watcher.close();
      if (timer) {
        clearTimeout(timer);
      }
    },
  };
}

function classifyChangeReason(
  relPath: string,
  scope: ContentScope,
): ContentChangeReason {
  const decision = explainScopeDecision(relPath, scope);

  if (decision.kind === "asset") {
    return "asset-updated";
  }

  if (relPath === ".readrun/navigation.yaml") {
    return "navigation-updated";
  }

  if (relPath === ".readrun/entry.txt") {
    return "navigation-updated";
  }

  if (relPath === ".readrun/ignore") {
    return "ignore-updated";
  }

  if (
    relPath === ".readrun/widgets" ||
    relPath.startsWith(".readrun/widgets/")
  ) {
    return "config-updated";
  }

  if (decision.kind === "config") {
    return "config-updated";
  }

  return "content-updated";
}

type Timer = ReturnType<typeof setTimeout>;
