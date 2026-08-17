import type { Block, BlockAttr, BlockNode, TextRun } from "../blocks/model.ts";

import { parseLegacyQuiz } from "./legacy-parser.ts";
import type {
	ChoiceDefinition,
	FreeTextDefinition,
	MultiChoiceDefinition,
	QuizDefinition,
	QuizDiagnostic,
	QuizInfoDefinition,
	QuizParseContext,
	QuizParseResult,
	QuizQuestionDefinition,
	QuizSourceSpan,
	RichTextSource,
	SingleChoiceDefinition,
	TrueFalseDefinition,
} from "./model.ts";

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
const CHOICE_PATTERN = /^[-+*]\s+\[([xX ])\]\s+(.+?)\s*$/;
const POSSIBLE_CHOICE_PATTERN = /^[-+*]\s+\[/;
const TRAILING_STAR_PATTERN = /^[-+*]\s+(.+?)\s+\*\s*$/;
const FREE_TEXT_PATTERN = /^=\s+(.+?)\s*$/;

interface SourceLine {
	text: string;
	line: number;
}

export function parseQuiz(
	block: Block,
	context: QuizParseContext,
): QuizParseResult {
	if (!(block.children ?? []).some((child) => child.type === "block")) {
		return parseLegacyQuiz(block, context);
	}

	const diagnostics: QuizDiagnostic[] = [];
	const attrs = readAttributes(
		block,
		new Set(["id", "title"]),
		diagnostics,
		"warning",
		context,
	);
	const id = stringAttribute(attrs, "id") ?? `quiz-${context.quizIndex + 1}`;
	const title = stringAttribute(attrs, "title");
	const items: QuizDefinition["items"] = [];
	let questionIndex = 0;
	let infoIndex = 0;

	for (const child of block.children ?? []) {
		if (child.type !== "block") {
			if (child.text.trim()) {
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.content.unexpected",
						"A canonical quiz can contain only [info] and [question] blocks; move this text into one of those blocks.",
						context,
						child.position?.line ?? block.source.startLine,
					),
				);
			}
			continue;
		}

		switch (child.name.toLowerCase()) {
			case "info": {
				infoIndex += 1;
				const item = parseInfo(child, context, infoIndex, diagnostics);
				if (item) items.push(item);
				break;
			}
			case "question": {
				questionIndex += 1;
				const item = parseQuestion(child, context, questionIndex, diagnostics);
				if (item) items.push(item);
				break;
			}
			case "group":
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.group.unsupported",
						"[group] is not supported in quizzes in notes yet; use separate [question] blocks.",
						context,
						child.source.startLine,
					),
				);
				break;
			case "hint":
			case "explain":
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.child.misplaced",
						`[${child.name}] must be a direct child of [question], not [quiz].`,
						context,
						child.source.startLine,
					),
				);
				break;
			default:
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.child.unsupported",
						`[${child.name}] is not supported directly inside [quiz].`,
						context,
						child.source.startLine,
					),
				);
		}
	}

	if (!ID_PATTERN.test(id)) {
		diagnostics.push(
			diagnostic(
				"error",
				"quiz.id.invalid",
				`Quiz ID "${id}" must match ${ID_PATTERN.source}.`,
				context,
				block.source.startLine,
			),
		);
	}

	return {
		definition: {
			schemaVersion: 1,
			id,
			title,
			items,
			source: span(block, context),
		},
		diagnostics,
		syntax: "canonical",
	};
}

function parseInfo(
	block: Block,
	context: QuizParseContext,
	index: number,
	diagnostics: QuizDiagnostic[],
): QuizInfoDefinition | undefined {
	const attrs = readAttributes(
		block,
		new Set(["id"]),
		diagnostics,
		"error",
		context,
	);
	for (const child of block.children ?? []) {
		if (child.type === "block") {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.info.child",
					`[${child.name}] cannot be nested inside [info].`,
					context,
					child.source.startLine,
				),
			);
		}
	}

	const id = stringAttribute(attrs, "id") ?? `info-${index}`;
	return {
		type: "info",
		id,
		content: richTextFromLines(directTextLines(block), span(block, context)),
		source: span(block, context),
	};
}

function parseQuestion(
	block: Block,
	context: QuizParseContext,
	index: number,
	diagnostics: QuizDiagnostic[],
): QuizQuestionDefinition | undefined {
	const attrs = readAttributes(
		block,
		new Set(["id", "type", "case-sensitive"]),
		diagnostics,
		"error",
		context,
	);
	const type = stringAttribute(attrs, "type")?.toLowerCase();
	const id = stringAttribute(attrs, "id") ?? `q-${index}`;
	const source = span(block, context);

	if (!type) {
		diagnostics.push(
			diagnostic(
				"error",
				"quiz.question.type",
				"[question] requires type=single, multi, truefalse, or freetext.",
				context,
				block.source.startLine,
			),
		);
		return undefined;
	}
	if (!(["single", "multi", "truefalse", "freetext"] as const).includes(
		type as "single" | "multi" | "truefalse" | "freetext",
	)) {
		diagnostics.push(
			diagnostic(
				"error",
				"quiz.question.type",
				`Unsupported question type "${type}". Use single, multi, truefalse, or freetext.`,
				context,
				block.source.startLine,
			),
		);
		return undefined;
	}

	const nested = parseQuestionChildren(block, context, diagnostics);
	const lines = directTextLines(block);
	const parsedBody = parseQuestionBody(lines, type, id, context, source, diagnostics);
	const common = {
		id,
		prompt: parsedBody.prompt,
		hint: nested.hint,
		explanation: nested.explanation,
		source,
	};

	if (type !== "freetext" && attrs.has("case-sensitive")) {
		diagnostics.push(
			diagnostic(
				"error",
				"quiz.question.attribute",
				"case-sensitive is valid only on type=freetext questions.",
				context,
				block.source.startLine,
			),
		);
	}

	switch (type) {
		case "single":
			return {
				...common,
				type: "single",
				choices: parsedBody.choices,
			} satisfies SingleChoiceDefinition;
		case "multi":
			return {
				...common,
				type: "multi",
				choices: parsedBody.choices,
			} satisfies MultiChoiceDefinition;
		case "truefalse": {
			const trueChoice = parsedBody.choices.find(
				(choice) => choice.content.markdown.trim().toLowerCase() === "true",
			);
			return {
				...common,
				type: "truefalse",
				choices: parsedBody.choices,
				correctAnswer: trueChoice?.correct ?? false,
			} satisfies TrueFalseDefinition;
		}
		case "freetext": {
			const caseSensitive = booleanAttribute(
				attrs,
				"case-sensitive",
				false,
				context,
				block.source.startLine,
				diagnostics,
			);
			return {
				...common,
				type: "freetext",
				answer: {
					expected: parsedBody.expectedAnswers[0] ?? "",
					caseSensitive,
				},
			} satisfies FreeTextDefinition;
		}
	}
}

function parseQuestionChildren(
	block: Block,
	context: QuizParseContext,
	diagnostics: QuizDiagnostic[],
): { hint?: RichTextSource; explanation?: RichTextSource } {
	let hint: RichTextSource | undefined;
	let explanation: RichTextSource | undefined;

	for (const child of block.children ?? []) {
		if (child.type !== "block") continue;
		const name = child.name.toLowerCase();
		if (name !== "hint" && name !== "explain") {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.question.child",
					`[${child.name}] is not supported inside [question].`,
					context,
					child.source.startLine,
				),
			);
			continue;
		}

		if (child.attrs.length > 0) {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.child.attribute",
					`[${child.name}] does not accept attributes.`,
					context,
					child.source.startLine,
				),
			);
		}
		if ((child.children ?? []).some((node) => node.type === "block")) {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.child.nested",
					`[${child.name}] cannot contain nested readrun blocks.`,
					context,
					child.source.startLine,
				),
			);
		}

		const rich = richTextFromLines(directTextLines(child), span(child, context));
		if (name === "hint") {
			if (hint) {
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.hint.duplicate",
						"A question can contain at most one [hint] block.",
						context,
						child.source.startLine,
					),
				);
			} else {
				hint = rich;
			}
		} else if (explanation) {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.explanation.duplicate",
					"A question can contain at most one [explain] block.",
					context,
					child.source.startLine,
				),
			);
		} else {
			explanation = rich;
		}
	}

	return { hint, explanation };
}

function parseQuestionBody(
	lines: SourceLine[],
	type: string,
	questionId: string,
	context: QuizParseContext,
	fallbackSpan: QuizSourceSpan,
	diagnostics: QuizDiagnostic[],
): {
	prompt: RichTextSource;
	choices: ChoiceDefinition[];
	expectedAnswers: string[];
} {
	const promptLines: SourceLine[] = [];
	const choices: ChoiceDefinition[] = [];
	const expectedAnswers: string[] = [];
	let answerStarted = false;

	for (const line of lines) {
		const trimmed = line.text.trim();
		if (!trimmed) {
			if (!answerStarted) promptLines.push(line);
			continue;
		}

		const trailingStar = trimmed.match(TRAILING_STAR_PATTERN);
		if (trailingStar) {
			answerStarted = true;
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.choice.marker",
					`Use "- [x] ${trailingStar[1]!.trim()}" for a correct answer or "- [ ] ${trailingStar[1]!.trim()}" for a distractor; trailing * answer markers are not supported.`,
					context,
					line.line,
				),
			);
			continue;
		}

		if (type === "freetext") {
			const expected = trimmed.match(FREE_TEXT_PATTERN);
			if (expected) {
				answerStarted = true;
				expectedAnswers.push(expected[1]!.trim());
				continue;
			}
			if (trimmed.startsWith("=")) {
				answerStarted = true;
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.freetext.answer",
						"A free-text answer must use `= expected answer`.",
						context,
						line.line,
					),
				);
				continue;
			}
		} else {
			const choice = trimmed.match(CHOICE_PATTERN);
			if (choice) {
				answerStarted = true;
				const content = choice[2]!.trim();
				choices.push({
					id: `${questionId}-choice-${choices.length + 1}`,
					content: {
						markdown: content,
						source: {
							relPath: context.relPath,
							startLine: line.line,
							endLine: line.line,
						},
					},
					correct: choice[1]!.toLowerCase() === "x",
				});
				continue;
			}
			if (POSSIBLE_CHOICE_PATTERN.test(trimmed)) {
				answerStarted = true;
				diagnostics.push(
					diagnostic(
						"error",
						"quiz.choice.marker",
						"Choice answers must use `- [x] answer` or `- [ ] answer` on one line.",
						context,
						line.line,
					),
				);
				continue;
			}
		}

		if (answerStarted) {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.answer.continuation",
					"Answer options must stay on one line; move additional text into [hint] or [explain].",
					context,
					line.line,
				),
			);
		} else {
			promptLines.push(line);
		}
	}

	if (type === "freetext" && expectedAnswers.length > 1) {
		const second = lines.find(
			(line) => line.text.trim().match(FREE_TEXT_PATTERN)?.[1] === expectedAnswers[1],
		);
		diagnostics.push(
			diagnostic(
				"error",
				"quiz.freetext.multiple",
				"A free-text question must define exactly one `= expected answer` line.",
				context,
				second?.line ?? fallbackSpan.startLine,
			),
		);
	}

	return {
		prompt: richTextFromLines(promptLines, fallbackSpan),
		choices,
		expectedAnswers,
	};
}

function directTextLines(block: Block): SourceLine[] {
	const lines: SourceLine[] = [];
	for (const child of block.children ?? []) {
		if (child.type === "block") continue;
		const startLine = child.position?.line ?? block.source.startLine + 1;
		child.text.split("\n").forEach((text, index) => {
			lines.push({ text, line: startLine + index });
		});
	}
	return lines;
}

function richTextFromLines(
	lines: SourceLine[],
	fallback: QuizSourceSpan,
): RichTextSource {
	let start = 0;
	let end = lines.length;
	while (start < end && !lines[start]!.text.trim()) start += 1;
	while (end > start && !lines[end - 1]!.text.trim()) end -= 1;
	const content = lines.slice(start, end);
	return {
		markdown: content.map((line) => line.text).join("\n"),
		source: content.length
			? {
					relPath: fallback.relPath,
					startLine: content[0]!.line,
					endLine: content.at(-1)!.line,
				}
			: fallback,
	};
}

function readAttributes(
	block: Block,
	allowed: ReadonlySet<string>,
	diagnostics: QuizDiagnostic[],
	severity: "warning" | "error",
	context?: QuizParseContext,
): Map<string, string | true> {
	const attrs = new Map<string, string | true>();
	const attrContext = context ?? {
		relPath: block.source.relPath ?? "",
		quizIndex: 0,
	};
	for (const attr of block.attrs) {
		const name = attr.name.toLowerCase();
		if (attrs.has(name)) {
			diagnostics.push(
				diagnostic(
					"error",
					"quiz.attribute.duplicate",
					`Attribute "${name}" is defined more than once on [${block.name}].`,
					attrContext,
					block.source.startLine,
				),
			);
		}
		attrs.set(name, attr.value);
		if (!allowed.has(name)) {
			diagnostics.push(
				diagnostic(
					severity,
					"quiz.attribute.unknown",
					`Unknown attribute "${name}" on [${block.name}].`,
					attrContext,
					block.source.startLine,
				),
			);
		}
	}
	return attrs;
}

function stringAttribute(
	attrs: ReadonlyMap<string, string | true>,
	name: string,
): string | undefined {
	const value = attrs.get(name);
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function booleanAttribute(
	attrs: ReadonlyMap<string, string | true>,
	name: string,
	fallback: boolean,
	context: QuizParseContext,
	line: number,
	diagnostics: QuizDiagnostic[],
): boolean {
	const value = attrs.get(name);
	if (value === undefined) return fallback;
	if (value === true || value === "true") return true;
	if (value === "false") return false;
	diagnostics.push(
		diagnostic(
			"error",
			"quiz.attribute.boolean",
			`Attribute "${name}" must be true or false.`,
			context,
			line,
		),
	);
	return fallback;
}

function span(block: Block, context: QuizParseContext): QuizSourceSpan {
	return {
		relPath: context.relPath,
		startLine: block.source.startLine,
		endLine: block.source.endLine,
	};
}

function diagnostic(
	severity: "warning" | "error",
	code: string,
	message: string,
	context: QuizParseContext,
	line: number,
): QuizDiagnostic {
	return {
		severity,
		code,
		message,
		position: { relPath: context.relPath, line },
	};
}
