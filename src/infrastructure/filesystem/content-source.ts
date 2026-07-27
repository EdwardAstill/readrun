import * as path from "node:path";
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";

import type { ContentFile, ContentSource } from "../../application/ports/content-source.ts";
import {
  explainScopeDecision,
  type ContentScope,
} from "../../domain/project/scope.ts";
import {
  READRUN_ASSETS_DIR,
  normaliseRelPath,
  relPathSegments,
} from "../../shared/paths.ts";
import { safeJoin } from "./project-config-source.ts";

interface FilesystemContentSourceOptions {
  readDirectory?: (dirPath: string) => Promise<Dirent[]>;
}

export function createFilesystemContentSource(
  root: string,
  options: FilesystemContentSourceOptions = {},
): ContentSource {
  const normalisedRoot = path.resolve(root);
  const readDirectory = options.readDirectory ?? defaultReadDirectory;

  return {
    async listFiles(scope) {
      const files = await walkFiles(normalisedRoot, scope, readDirectory);
      const visible: ContentFile[] = [];

      for (const filePath of files) {
        const relPath = normaliseRelPath(path.relative(normalisedRoot, filePath));
        const decision = explainScopeDecision(relPath, scope);

        if (decision.kind !== "page" && decision.kind !== "asset") {
          continue;
        }

        const stat = await Bun.file(filePath).stat();
        visible.push({
          filePath,
          relPath,
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          decision,
        });
      }

      visible.sort((left, right) => left.relPath.localeCompare(right.relPath));
      return visible;
    },

    async readText(relPath) {
      const filePath = safeJoin(normalisedRoot, relPath);
      if (filePath == null) {
        throw new Error(`Path is outside content root: ${relPath}`);
      }

      return Bun.file(filePath).text();
    },
  };
}

async function walkFiles(
  root: string,
  scope: ContentScope,
  readDirectory: (dirPath: string) => Promise<Dirent[]>,
): Promise<string[]> {
  const files: string[] = [];
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = await readDirectory(current);

    for (const entry of entries) {
      const filePath = path.join(current, entry.name);
      const relPath = normaliseRelPath(path.relative(root, filePath));

      if (entry.isDirectory()) {
        if (shouldDescendDirectory(relPath, scope)) {
          queue.push(filePath);
        }
        continue;
      }

      if (entry.isFile() && !hasHiddenContentSegment(relPath)) {
        files.push(filePath);
      }
    }
  }

  return files;
}

async function defaultReadDirectory(dirPath: string): Promise<Dirent[]> {
  return readdir(dirPath, { withFileTypes: true });
}

function shouldDescendDirectory(
  relPath: string,
  scope: ContentScope,
): boolean {
  const decision = explainScopeDecision(relPath, scope);

  if (relPath === ".readrun" || relPath === READRUN_ASSETS_DIR) {
    return decision.kind !== "ignored" && decision.kind !== "generated";
  }

  if (hasHiddenContentSegment(relPath)) {
    return false;
  }

  return ![
    "config",
    "external",
    "generated",
    "ignored",
    "private",
  ].includes(decision.kind);
}

function hasHiddenContentSegment(relPath: string): boolean {
  return relPathSegments(relPath).some(
    (segment, index) => segment.startsWith(".") && !(index === 0 && segment === ".readrun"),
  );
}
