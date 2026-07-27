import * as path from "node:path";

import { parseNavigationDocument } from "../../domain/navigation/schema.ts";
import type {
  ProjectConfigDocuments,
  ProjectConfigSourceDocument,
} from "../../domain/project/config-schema.ts";
import type { ContentIssue } from "../../domain/project/model.ts";
import {
  READRUN_ENTRY_PATH,
  READRUN_IGNORE_PATH,
  READRUN_NAVIGATION_PATH,
} from "../../shared/paths.ts";

const DEPRECATED_PROJECT_FILES = [
  ".readrun/virtual-paths.yaml",
  ".readrun/.ignore",
  "exclude.yaml",
  "nav.yaml",
] as const;

export async function readProjectConfigDocuments(
  root: string,
): Promise<ProjectConfigDocuments> {
  const [entry, navigation, ignore, deprecatedIssues] = await Promise.all([
    readMaybeText(root, READRUN_ENTRY_PATH),
    readMaybeText(root, READRUN_NAVIGATION_PATH),
    readMaybeText(root, READRUN_IGNORE_PATH),
    collectDeprecatedIssues(root),
  ]);

  const documents: ProjectConfigDocuments = {
    contentDir: root,
    ignorePatterns: ignore ? parseIgnoreLines(ignore.text) : [],
    issues: deprecatedIssues,
  };

  if (entry) {
    documents.entry = entry;
  }

  if (navigation) {
    documents.navigation = {
      ...navigation,
      document: parseNavigationDocument(navigation.text),
    };
  }

  return documents;
}

export function safeJoin(root: string, relPath: string): string | null {
  const target = path.resolve(root, relPath);
  const normalisedRoot = path.resolve(root);

  if (target === normalisedRoot || target.startsWith(`${normalisedRoot}${path.sep}`)) {
    return target;
  }

  return null;
}

async function readMaybeText(
  root: string,
  relPath: string,
): Promise<ProjectConfigSourceDocument | undefined> {
  const filePath = safeJoin(root, relPath);
  if (filePath == null) {
    return undefined;
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return undefined;
  }

  return {
    path: relPath,
    text: await file.text(),
  };
}

function parseIgnoreLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

async function collectDeprecatedIssues(root: string): Promise<ContentIssue[]> {
  const issues: ContentIssue[] = [];

  for (const relPath of DEPRECATED_PROJECT_FILES) {
    const filePath = safeJoin(root, relPath);
    if (filePath == null) {
      continue;
    }

    if (await Bun.file(filePath).exists()) {
      issues.push({
        severity: "warning",
        code: "project.deprecated-config",
        relPath,
        message: `Deprecated project file detected: ${relPath}`,
      });
    }
  }

  return issues;
}
