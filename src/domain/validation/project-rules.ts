import {
  createValidationResult,
  error,
  warning,
  type ValidationContext,
  type ValidationResult,
} from "./model.ts";

export function validateProjectConfig(
  context: ValidationContext,
): ValidationResult {
  const issues = [];
  const config = context.config;

  if (!config) {
    return createValidationResult();
  }

  const hasNavigationDocument = Boolean(context.navigationDocument);
  const hasEntryPath = typeof config.entryPath === "string" && config.entryPath.length > 0;

  if (config.mode === "wiki" && hasNavigationDocument) {
    issues.push(
      error({
        code: "project.navigation.unexpected",
        message: "Wiki mode must not define navigation.yaml.",
      }),
    );
  }

  if (config.mode === "wiki") {
    if (!hasEntryPath) {
      issues.push(
        error({
          code: "project.entry.missing",
          message: "Wiki mode requires an entry page path.",
        }),
      );
    }

    const entryPage = context.index?.entryPage;
    if (hasEntryPath && !entryPage) {
      issues.push(
        error({
          code: "project.entry.invalid",
          message: `Wiki entry path "${config.entryPath}" does not resolve to a discovered page.`,
        }),
      );
    }
  }

  if (config.mode === "tree" && hasEntryPath) {
    issues.push(
      warning({
        code: "project.mode.mismatch",
        message: "Tree mode ignores wiki entry.txt configuration.",
      }),
    );
  }

  if (config.mode === "tree" && config.navigationSource === "navigation" && !hasNavigationDocument) {
    issues.push(
      error({
        code: "project.mode.mismatch",
        message: 'Tree mode with source "navigation" requires navigation.yaml.',
      }),
    );
  }

  if (config.mode === "tree" && config.navigationSource === "filesystem" && hasNavigationDocument) {
    issues.push(
      warning({
        code: "project.mode.mismatch",
        message: 'Tree mode with source "filesystem" has an unused navigation document.',
      }),
    );
  }

  return createValidationResult(issues);
}
