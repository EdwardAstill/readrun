export interface SourcePosition {
  relPath: string;
  line?: number;
  column?: number;
}

export type ValidationSeverity = "error" | "warning";

export type ValidationIssueCode =
  | "project.mode.conflict"
  | "project.mode.mismatch"
  | "project.entry.missing"
  | "project.entry.invalid"
  | "project.navigation.unexpected"
  | "navigation.parse"
  | "navigation.shape"
  | "navigation.ref.missing"
  | "navigation.ref.duplicate"
  | "navigation.page.unlisted"
  | "navigation.page.unresolved"
  | "link.unresolved"
  | "link.ambiguous"
  | "block.parse"
  | "block.unknown"
  | "block.quiz.invalid"
  | "asset.missing"
  | "asset.unresolved"
  | (string & {});

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: ValidationIssueCode;
  message: string;
  position?: SourcePosition;
  related?: SourcePosition[];
}

export type ContentIssue = ValidationIssue;

export interface ValidationResult {
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  hasErrors: boolean;
}

export interface ValidationPageLike {
  kind?: string;
  relPath: string;
  title: string;
  url?: string;
  body?: string;
  outboundLinks?: Array<{
    raw: string;
    target: string;
    label?: string;
    position?: {
      relPath?: string;
      line?: number;
      column?: number;
    };
  }>;
}

export interface ValidationTagLike {
  id: string;
  label: string;
  slug: string;
  pages: ValidationPageLike[];
}

export interface ValidationIndexLike {
  mode?: "tree" | "wiki";
  pages: ValidationPageLike[];
  byRelPath?: Map<string, ValidationPageLike>;
  byUrl?: Map<string, ValidationPageLike>;
  byExactTarget?: Map<string, { page: ValidationPageLike } | "ambiguous">;
  byKey?: Map<string, { page: ValidationPageLike } | "ambiguous">;
  tags?: Map<string, ValidationTagLike>;
  entryPage?: ValidationPageLike;
}

export interface ValidationConfigLike {
  mode?: "tree" | "wiki";
  navigationSource?: "filesystem" | "navigation";
  entryPath?: string;
}

export interface ValidationAssetRefLike {
  relPath: string;
  url?: string;
  mediaType?: string;
}

export interface ValidationContext {
  relPath?: string;
  config?: ValidationConfigLike;
  index?: ValidationIndexLike;
  pages?: ValidationPageLike[];
  assets?: ValidationAssetRefLike[] | Map<string, ValidationAssetRefLike>;
  navigationDocument?: {
    index?: { path: string; position?: SourcePosition };
    entries: Array<{
      label: string;
      labelPath: string[];
      position?: SourcePosition;
      node:
        | { kind: "page"; path: string }
        | {
            kind: "branch";
            index?: string;
            entries: Array<unknown>;
          };
    }>;
    issues?: Array<{
      code: string;
      message: string;
      position?: SourcePosition;
    }>;
  };
}

interface ValidationIssueInput extends Omit<ValidationIssue, "severity"> {
  severity?: ValidationSeverity;
}

export function error(issue: ValidationIssueInput): ValidationIssue {
  return { ...issue, severity: "error" };
}

export function warning(issue: ValidationIssueInput): ValidationIssue {
  return { ...issue, severity: "warning" };
}

export function createValidationResult(
  issues: readonly ValidationIssue[] = [],
): ValidationResult {
  const all = [...issues];
  const errors = all.filter((issue) => issue.severity === "error");
  const warnings = all.filter((issue) => issue.severity === "warning");
  return {
    issues: all,
    errors,
    warnings,
    hasErrors: errors.length > 0,
  };
}

export function mergeValidationResults(
  results: readonly ValidationResult[],
): ValidationResult {
  return createValidationResult(results.flatMap((result) => result.issues));
}
