import { parseBlocks } from "../blocks/parser.ts";
import { getBlockDefinition } from "../blocks/registry.ts";
import { parseQuiz } from "../quiz/parser.ts";
import { validateQuiz } from "../quiz/validation.ts";

import {
  createValidationResult,
  error,
  warning,
  type ValidationContext,
  type ValidationResult,
} from "./model.ts";

export function validateBlocks(context: ValidationContext): ValidationResult {
  const issues = [];
  const pages = context.pages ?? context.index?.pages ?? [];

  for (const page of pages) {
    if (page.kind && page.kind !== "markdown") {
      continue;
    }

    const body = page.body ?? "";
    const parsed = parseBlocks(body);
    issues.push(...parsed.issues);

    for (const block of parsed.blocks) {
      const definition = getBlockDefinition(block.name);
      if (!definition) {
        issues.push(
          warning({
            code: "block.unknown",
            message: `Unknown block "${block.name}" in "${page.relPath}".`,
          }),
        );
        continue;
      }

      if (definition.name === "quiz") {
        const quiz = parseQuiz(block);
        for (const quizIssue of validateQuiz(quiz)) {
          issues.push(
            error({
              code: "block.quiz.invalid",
              message: `${quizIssue.message} (${page.relPath})`,
              position: quizIssue.position,
            }),
          );
        }
      }
    }
  }

  return createValidationResult(issues);
}
