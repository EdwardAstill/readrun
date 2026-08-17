import type { BlockNode } from "../blocks/model.ts";
import { parseBlockTree } from "../blocks/parser.ts";
import { getBlockDefinition } from "../blocks/registry.ts";
import { parseQuiz } from "../quiz/parser.ts";
import { validateQuiz } from "../quiz/validation.ts";

import {
	createValidationResult,
	error,
	warning,
	type ValidationContext,
	type ValidationIssue,
	type ValidationPageLike,
	type ValidationResult,
} from "./model.ts";

export function validateBlocks(context: ValidationContext): ValidationResult {
	const issues: ValidationIssue[] = [];
	const pages = context.pages ?? context.index?.pages ?? [];

	for (const page of pages) {
		if (page.kind && page.kind !== "markdown") continue;
		const parsed = parseBlockTree(page.body ?? "");
		issues.push(
			...parsed.issues.map((issue) => ({
				...issue,
				position: issue.position
					? { ...issue.position, relPath: page.relPath }
					: { relPath: page.relPath },
			})),
		);
		issues.push(...validateBlockTree(parsed.tree, page));
	}

	return createValidationResult(issues);
}

export function validateBlockTree(
	nodes: readonly BlockNode[],
	page: ValidationPageLike,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	let quizIndex = 0;
	const quizIds = new Set<string>();

	const visit = (children: readonly BlockNode[]): void => {
		for (const node of children) {
			if (node.type !== "block") continue;
			const name = node.name.toLowerCase();

			if (name === "quiz") {
				const parsed = parseQuiz(node, { relPath: page.relPath, quizIndex });
				quizIndex += 1;
				for (const diagnostic of parsed.diagnostics) {
					issues.push(toValidationIssue(diagnostic));
				}
				if (parsed.definition) {
					if (quizIds.has(parsed.definition.id)) {
						issues.push(
							error({
								code: "quiz.id.duplicate",
								message: `Quiz ID "${parsed.definition.id}" is duplicated on this page.`,
								position: {
									relPath: page.relPath,
									line: node.source.startLine,
								},
							}),
						);
					}
					quizIds.add(parsed.definition.id);
					for (const diagnostic of validateQuiz(parsed.definition)) {
						issues.push(toValidationIssue(diagnostic));
					}
				}
				continue;
			}

			const definition = getBlockDefinition(name);
			if (!definition) {
				issues.push(
					warning({
						code: "block.unknown",
						message: `Unknown block "${node.name}" in "${page.relPath}".`,
						position: {
							relPath: page.relPath,
							line: node.source.startLine,
						},
					}),
				);
			}
			visit(node.children ?? []);
		}
	};

	visit(nodes);
	return issues;
}

function toValidationIssue(diagnostic: {
	severity: "warning" | "error";
	code: string;
	message: string;
	position: { relPath: string; line?: number; column?: number };
}): ValidationIssue {
	const input = {
		code: diagnostic.code,
		message: diagnostic.message,
		position: diagnostic.position,
	};
	return diagnostic.severity === "warning" ? warning(input) : error(input);
}
