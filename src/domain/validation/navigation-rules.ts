import { findDuplicateNavigationRefs } from "../navigation/tree.ts";
import { normaliseNavigationPath } from "../navigation/schema.ts";
import type { NavigationDocument, NavigationSpecEntry } from "../navigation/schema.ts";

import {
  createValidationResult,
  error,
  warning,
  type ValidationContext,
  type ValidationResult,
} from "./model.ts";

export function validateNavigation(
  context: ValidationContext,
): ValidationResult {
  const document = context.navigationDocument;
  if (!document) {
    return createValidationResult();
  }
  const typedDocument = document as NavigationDocument;

  const issues = [
    ...(typedDocument.issues ?? []).map((issue) =>
      error({
        code: "navigation.parse",
        message: issue.message,
        position: issue.position,
      }),
    ),
    ...findDuplicateNavigationRefs(typedDocument),
  ];

  const pages = context.pages ?? context.index?.pages ?? [];
  const byRelPath =
    context.index?.byRelPath ?? new Map(pages.map((page) => [page.relPath, page]));
  const referenced = new Set<string>();

  if (typedDocument.index) {
    const indexPath = normaliseNavigationPath(typedDocument.index.path);
    referenced.add(indexPath);
    if (!byRelPath.has(indexPath)) {
      issues.push(
        error({
          code: "navigation.ref.missing",
          message: `Navigation root index "${indexPath}" does not resolve to a discovered page.`,
          position: typedDocument.index.position,
        }),
      );
    }
  }

  for (const entry of typedDocument.entries) {
    validateEntry(entry, byRelPath, referenced, issues);
  }

  for (const page of pages) {
    if (!referenced.has(normaliseNavigationPath(page.relPath))) {
      issues.push(
        warning({
          code: "navigation.page.unlisted",
          message: `Page "${page.relPath}" is not listed in navigation.yaml.`,
        }),
      );
    }
  }

  return createValidationResult(issues);
}

function validateEntry(
  entry: NavigationSpecEntry,
  byRelPath: Map<string, { relPath: string }>,
  referenced: Set<string>,
  issues: ReturnType<typeof createValidationResult>["issues"],
): void {
  if (entry.node.kind === "page") {
    const relPath = normaliseNavigationPath(entry.node.path);
    referenced.add(relPath);
    if (!byRelPath.has(relPath)) {
      issues.push(
        error({
          code: "navigation.ref.missing",
          message: `Navigation entry "${entry.label}" points to missing page "${relPath}".`,
          position: entry.position,
        }),
      );
    }
    return;
  }

  if (entry.node.index) {
    const relPath = normaliseNavigationPath(entry.node.index);
    referenced.add(relPath);
    if (!byRelPath.has(relPath)) {
      issues.push(
        error({
          code: "navigation.ref.missing",
          message: `Navigation branch "${entry.label}" points to missing index page "${relPath}".`,
          position: entry.position,
        }),
      );
    }
  }

  for (const child of entry.node.entries) {
    validateEntry(child, byRelPath, referenced, issues);
  }
}
