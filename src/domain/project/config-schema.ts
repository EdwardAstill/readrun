import {
  READRUN_ENTRY_PATH,
  READRUN_NAVIGATION_PATH,
} from "../../shared/paths.ts";
import type {
  ContentIssue,
  ContentProjectConfig,
  SourcePosition,
} from "./model.ts";

export interface EntryConfigDocument {
  entryPath: string;
  position: SourcePosition;
}

export interface ProjectConfigSourceDocument {
  path: string;
  text: string;
}

export interface ProjectConfigDocuments {
  contentDir: string;
  entry?: ProjectConfigSourceDocument;
  navigation?: ProjectConfigSourceDocument & { document?: unknown };
  ignorePatterns?: string[];
  issues?: ContentIssue[];
}

export type ProjectConfigParseResult<T> =
  | { ok: true; value: T; issues: ContentIssue[] }
  | { ok: false; value: null; issues: ContentIssue[] };

export function parseEntryConfig(
  text: string,
): ProjectConfigParseResult<EntryConfigDocument> {
  const issues: ContentIssue[] = [];
  const candidates: EntryConfigDocument[] = [];
  let offset = 0;

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const trimmed = rawLine.trim();

    if (trimmed !== "" && !trimmed.startsWith("#")) {
      const column = rawLine.indexOf(trimmed) + 1;
      candidates.push({
        entryPath: trimmed,
        position: { line: index + 1, column, offset: offset + column - 1 },
      });
    }

    offset += rawLine.length + 1;
  }

  if (candidates.length === 0) {
    issues.push({
      severity: "error",
      code: "entry.missing",
      relPath: READRUN_ENTRY_PATH,
      message: "entry.txt must contain exactly one non-comment path.",
    });

    return { ok: false, value: null, issues };
  }

  if (candidates.length > 1) {
    for (const candidate of candidates.slice(1)) {
      issues.push({
        severity: "error",
        code: "entry.multiple",
        relPath: READRUN_ENTRY_PATH,
        position: candidate.position,
        message: "entry.txt must contain exactly one non-comment path.",
      });
    }

    return { ok: false, value: null, issues };
  }

  return { ok: true, value: candidates[0]!, issues };
}

export function resolveProjectMode(
  docs: ProjectConfigDocuments,
): ContentProjectConfig {
  const issues = [...(docs.issues ?? [])];
  const ignorePatterns = [...(docs.ignorePatterns ?? [])];

  if (docs.entry && docs.navigation) {
    return {
      contentDir: docs.contentDir,
      mode: "invalid",
      ignorePatterns,
      issues: [
        ...issues,
        {
          severity: "error",
          code: "project.mode.conflict",
          message:
            "A project cannot define both .readrun/entry.txt and .readrun/navigation.yaml.",
        },
      ],
    };
  }

  if (docs.entry) {
    const parsedEntry = parseEntryConfig(docs.entry.text);

    if (!parsedEntry.ok) {
      return {
        contentDir: docs.contentDir,
        mode: "invalid",
        ignorePatterns,
        issues: [...issues, ...parsedEntry.issues],
      };
    }

    return {
      contentDir: docs.contentDir,
      mode: "wiki",
      entryPath: parsedEntry.value.entryPath,
      ignorePatterns,
      issues: [...issues, ...parsedEntry.issues],
    };
  }

  if (docs.navigation) {
    return {
      contentDir: docs.contentDir,
      mode: "tree",
      treeSource: "navigation",
      navigationPath: docs.navigation.path || READRUN_NAVIGATION_PATH,
      navigationDocument: docs.navigation.document,
      ignorePatterns,
      issues,
    };
  }

  return {
    contentDir: docs.contentDir,
    mode: "tree",
    treeSource: "filesystem",
    ignorePatterns,
    issues,
  };
}
