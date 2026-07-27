import { LineCounter, YAMLMap, isMap, parseDocument } from "yaml";

import type { SourcePosition } from "../validation/model.ts";

export interface NavigationPathRef {
  raw: string;
  path: string;
  position?: SourcePosition;
}

export interface NavigationParseIssue {
  code: string;
  message: string;
  position?: SourcePosition;
}

export interface NavigationDocument {
  index?: NavigationPathRef;
  entries: NavigationSpecEntry[];
  issues: NavigationParseIssue[];
}

export interface NavigationSpecEntry {
  label: string;
  labelPath: string[];
  node: NavigationSpecNode;
  position?: SourcePosition;
}

export type NavigationSpecNode =
  | { kind: "page"; path: string }
  | { kind: "branch"; index?: string; entries: NavigationSpecEntry[] };

export function normaliseNavigationPath(path: string): string {
  const trimmed = path.trim().replace(/\\/g, "/");
  const withoutDot = trimmed.replace(/^(?:\.\/)+/, "");
  return withoutDot.replace(/\/+/g, "/");
}

export function parseNavigationDocument(text: string): NavigationDocument {
  const lineCounter = new LineCounter();
  const parsed = parseDocument(text, {
    lineCounter,
    prettyErrors: false,
    uniqueKeys: false,
  });

  const issues: NavigationParseIssue[] = [];
  const rootPosition = toPosition(parsed.contents, lineCounter);

  if (parsed.errors.length > 0) {
    for (const parseError of parsed.errors) {
      issues.push({
        code: "navigation.parse",
        message: parseError.message,
        position: rootPosition,
      });
    }
  }

  if (!parsed.contents) {
    return { entries: [], issues };
  }

  if (!isMap(parsed.contents)) {
    issues.push({
      code: "navigation.shape",
      message: "navigation.yaml root must be a mapping.",
      position: rootPosition,
    });
    return { entries: [], issues };
  }

  const document = parseRootMap(parsed.contents, [], lineCounter, issues);
  return document;
}

function parseRootMap(
  map: YAMLMap<unknown, unknown>,
  labelPath: string[],
  lineCounter: LineCounter,
  issues: NavigationParseIssue[],
): NavigationDocument {
  let index: NavigationPathRef | undefined;
  let entries: NavigationSpecEntry[] = [];

  for (const pair of map.items) {
    const key = scalarString(pair.key);
    if (!key) {
      issues.push({
        code: "navigation.shape",
        message: "Navigation keys must be strings.",
        position: toPosition(pair.key, lineCounter),
      });
      continue;
    }

    if (key === "index") {
      const path = scalarString(pair.value);
      if (!path) {
        issues.push({
          code: "navigation.shape",
          message: "Root index must be a string path.",
          position: toPosition(pair.value, lineCounter),
        });
        continue;
      }

      index = {
        raw: path,
        path: normaliseNavigationPath(path),
        position: toPosition(pair.value, lineCounter),
      };
      continue;
    }

    if (key !== "pages") {
      issues.push({
        code: "navigation.shape",
        message: `Unknown root key "${key}" in navigation.yaml.`,
        position: toPosition(pair.key, lineCounter),
      });
      continue;
    }

    entries = parseEntriesMap(pair.value, labelPath, lineCounter, issues);
  }

  return { index, entries, issues };
}

function parseEntriesMap(
  value: unknown,
  labelPath: string[],
  lineCounter: LineCounter,
  issues: NavigationParseIssue[],
): NavigationSpecEntry[] {
  if (!isMap(value)) {
    issues.push({
      code: "navigation.shape",
      message: "`pages` must be a mapping of labels to entries.",
      position: toPosition(value, lineCounter),
    });
    return [];
  }

  const entries: NavigationSpecEntry[] = [];
  for (const pair of value.items) {
    const label = scalarString(pair.key);
    if (!label) {
      issues.push({
        code: "navigation.shape",
        message: "Navigation entry labels must be strings.",
        position: toPosition(pair.key, lineCounter),
      });
      continue;
    }

    const entry = parseEntry(
      label,
      pair.value,
      [...labelPath, label],
      lineCounter,
      issues,
    );
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

function parseEntry(
  label: string,
  value: unknown,
  labelPath: string[],
  lineCounter: LineCounter,
  issues: NavigationParseIssue[],
): NavigationSpecEntry | null {
  const position = toPosition(value, lineCounter);
  const pagePath = scalarString(value);

  if (pagePath) {
    return {
      label,
      labelPath,
      position,
      node: { kind: "page", path: normaliseNavigationPath(pagePath) },
    };
  }

  if (!isMap(value)) {
    issues.push({
      code: "navigation.shape",
      message: `Entry "${label}" must be a string path or mapping.`,
      position,
    });
    return null;
  }

  let indexPath: string | undefined;
  let entries: NavigationSpecEntry[] | undefined;
  for (const pair of value.items) {
    const key = scalarString(pair.key);
    if (!key) {
      issues.push({
        code: "navigation.shape",
        message: `Entry "${label}" contains a non-string key.`,
        position: toPosition(pair.key, lineCounter),
      });
      continue;
    }

    if (key === "index") {
      const raw = scalarString(pair.value);
      if (!raw) {
        issues.push({
          code: "navigation.shape",
          message: `Entry "${label}" has a non-string index path.`,
          position: toPosition(pair.value, lineCounter),
        });
        continue;
      }
      indexPath = normaliseNavigationPath(raw);
      continue;
    }

    if (key === "pages") {
      entries = parseEntriesMap(pair.value, labelPath, lineCounter, issues);
      continue;
    }

    issues.push({
      code: "navigation.shape",
      message: `Entry "${label}" has unknown key "${key}".`,
      position: toPosition(pair.key, lineCounter),
    });
  }

  if (!indexPath && (!entries || entries.length === 0)) {
    issues.push({
      code: "navigation.shape",
      message: `Entry "${label}" must define "index", "pages", or both.`,
      position,
    });
    return null;
  }

  if (entries && entries.length === 0) {
    issues.push({
      code: "navigation.shape",
      message: `Entry "${label}" has empty "pages".`,
      position,
    });
  }

  if (!entries || entries.length === 0) {
    if (!indexPath) {
      return null;
    }
    return {
      label,
      labelPath,
      position,
      node: { kind: "page", path: indexPath },
    };
  }

  return {
    label,
    labelPath,
    position,
    node: { kind: "branch", index: indexPath, entries },
  };
}

function scalarString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value;
  }

  return null;
}

function toPosition(
  value: unknown,
  lineCounter: LineCounter,
): SourcePosition | undefined {
  if (!value || typeof value !== "object" || !("range" in value)) {
    return undefined;
  }

  const range = (value as { range?: [number, number, number?] }).range;
  const start = range?.[0];
  if (typeof start !== "number") {
    return undefined;
  }

  const point = lineCounter.linePos(start);
  return {
    relPath: ".readrun/navigation.yaml",
    line: point.line,
    column: point.col,
  };
}
