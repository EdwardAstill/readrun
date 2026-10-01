import * as path from "node:path";
import { watch, type FSWatcher } from "node:fs";

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
  filePath?: string;
  scope?: ContentScope;
  getScope?: () => ContentScope;
  onChange?: (change: { relPath: string; reason: ContentChangeReason }) => void;
  debounceMs?: number;
}

export function startFileWatcher(options: StartFileWatcherOptions): WatchHandle {
  const root = path.resolve(options.root);
  const selectedFile = options.filePath
    ? normaliseRelPath(path.relative(root, path.resolve(root, options.filePath)))
    : undefined;
  const debounceMs = options.debounceMs ?? 100;
  let timer: Timer | null = null;
  let pending: { relPath: string; reason: ContentChangeReason } | null = null;

  const changed = (relPath: string) => {
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
    if (selectedFile && relPath !== selectedFile && !relPath.startsWith(".readrun/")) return;
    const decision = explainScopeDecision(relPath, scope);
    if (decision.kind === "ignored" || decision.kind === "generated" ||
      decision.kind === "private" && !relPath.startsWith(".readrun/")) return;
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
  };

  let metadataWatcher: FSWatcher | undefined;
  const watchMetadata = () => {
    metadataWatcher?.close();
    metadataWatcher = undefined;
    try {
      metadataWatcher = watch(path.join(root, ".readrun"), { recursive: true }, (_event, filename) => {
        if (filename) changed(normaliseRelPath(path.join(".readrun", String(filename))));
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  };
  const watcher = watch(root, { recursive: !selectedFile }, (_event, filename) => {
    if (!filename) return;
    const relPath = normaliseRelPath(String(filename));
    if (selectedFile && relPath === ".readrun") {
      watchMetadata();
      changed(".readrun/navigation.yaml");
    } else changed(relPath);
  });
  if (selectedFile) watchMetadata();

  return {
    stop() {
      watcher.close();
      metadataWatcher?.close();
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
