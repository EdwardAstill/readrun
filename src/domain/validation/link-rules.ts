import {
  createValidationResult,
  warning,
  type ValidationContext,
  type ValidationResult,
} from "./model.ts";
import {
  exactWikilinkTarget,
  normaliseWikilinkKey,
} from "../pages/wikilinks.ts";

export function validateLinks(context: ValidationContext): ValidationResult {
  const issues = [];
  const pages = context.pages ?? context.index?.pages ?? [];
  const byExactTarget = context.index?.byExactTarget;
  const byKey = context.index?.byKey;

  for (const page of pages) {
    for (const link of page.outboundLinks ?? []) {
      const exactMatch = byExactTarget?.get(exactWikilinkTarget(link.target));
      const match =
        exactMatch != null && exactMatch !== "ambiguous"
          ? exactMatch
          : byKey?.get(normaliseWikilinkKey(link.target));
      if (match === "ambiguous") {
        issues.push(
          warning({
            code: "link.ambiguous",
            message: `Wikilink "${link.raw}" in "${page.relPath}" is ambiguous.`,
            position: link.position
              ? { ...link.position, relPath: link.position.relPath ?? page.relPath }
              : undefined,
          }),
        );
        continue;
      }

      if (!match) {
        issues.push(
          warning({
            code: "link.unresolved",
            message: `Wikilink "${link.raw}" in "${page.relPath}" does not resolve.`,
            position: link.position
              ? { ...link.position, relPath: link.position.relPath ?? page.relPath }
              : undefined,
          }),
        );
      }
    }
  }

  return createValidationResult(issues);
}
