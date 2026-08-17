import type { Block } from "../blocks/model.ts";

import type {
	ChoiceDefinition,
	QuizDefinition,
	QuizDiagnostic,
	QuizParseContext,
	QuizParseResult,
	QuizSourceSpan,
	RichTextSource,
} from "./model.ts";

const CHOICE_PATTERN = /^[-+*]\s+\[([xX ])\]\s+(.+)$/;
const TRAILING_STAR_PATTERN = /^[-+*]\s+(.+?)\s+\*\s*$/;

interface LegacyGroup {
	lines: Array<{ text: string; line: number }>;
}

export function parseLegacyQuiz(
	block: Block,
	context: QuizParseContext,
): QuizParseResult {
	const diagnostics: QuizDiagnostic[] = [
		{
			severity: "warning",
			code: "quiz.syntax.legacy",
			message:
				"This quiz uses the legacy compact syntax. Migrate it to nested [question] and [info] blocks; see Quizzes in Notes.",
			position: { relPath: context.relPath, line: block.source.startLine },
		},
	];
	const attrs = new Map(block.attrs.map((attr) => [attr.name.toLowerCase(), attr.value]));
	const idValue = attrs.get("id");
	const titleValue = attrs.get("title");
	const id = typeof idValue === "string" ? idValue : `quiz-${context.quizIndex + 1}`;
	const title = typeof titleValue === "string" ? titleValue : undefined;
	const items: QuizDefinition["items"] = [];
	let questionIndex = 0;
	let infoIndex = 0;

	for (const group of splitGroups(block.body, block.source.startLine + 1)) {
		const nonblank = group.lines.filter((line) => line.text.trim());
		if (nonblank.length === 0) continue;
		for (const line of nonblank) {
			const trailing = line.text.trim().match(TRAILING_STAR_PATTERN);
			if (trailing) {
				diagnostics.push({
					severity: "error",
					code: "quiz.choice.marker",
					message: `Use "- [x] ${trailing[1]!.trim()}" for a correct answer or "- [ ] ${trailing[1]!.trim()}" for a distractor; trailing * answer markers are not supported.`,
					position: { relPath: context.relPath, line: line.line },
				});
			}
		}

		const answerLines = nonblank.slice(1);
		const hasChoice = answerLines.some((line) => CHOICE_PATTERN.test(line.text.trim()));
		const hasTrueFalse = answerLines.some((line) => /^(true|false)$/i.test(line.text.trim()));
		const hasFreeText = answerLines.some((line) => /^=\s/.test(line.text.trim()));
		const groupSpan = sourceSpan(context, nonblank[0]!.line, nonblank.at(-1)!.line);

		if (!hasChoice && !hasTrueFalse && !hasFreeText) {
			infoIndex += 1;
			items.push({
				type: "info",
				id: `info-${infoIndex}`,
				content: rich(nonblank.map((line) => line.text).join("\n"), groupSpan),
				source: groupSpan,
			});
			continue;
		}

		questionIndex += 1;
		const questionId = `q-${questionIndex}`;
		const promptLine = nonblank[0]!;
		const hintLine = answerLines.find((line) => line.text.trim().startsWith("_"));
		const explanationLines = answerLines.filter((line) => line.text.trim().startsWith(">"));
		const common = {
			id: questionId,
			prompt: rich(
				promptLine.text.trim().replace(/^\?\s*/, ""),
				sourceSpan(context, promptLine.line, promptLine.line),
			),
			hint: hintLine
				? rich(
						hintLine.text.trim().replace(/^_\s*/, ""),
						sourceSpan(context, hintLine.line, hintLine.line),
					)
				: undefined,
			explanation:
				explanationLines.length > 0
					? rich(
							explanationLines
								.map((line) => line.text.trim().replace(/^>\s?/, ""))
								.join("\n"),
							sourceSpan(
								context,
								explanationLines[0]!.line,
								explanationLines.at(-1)!.line,
							),
						)
					: undefined,
			source: groupSpan,
		};

		if (hasTrueFalse) {
			const correctLine = answerLines.find((line) => /^(true|false)$/i.test(line.text.trim()));
			const correctAnswer = correctLine?.text.trim().toLowerCase() === "true";
			const choices = ["True", "False"].map((label, index): ChoiceDefinition => ({
				id: `${questionId}-choice-${index + 1}`,
				content: rich(label, sourceSpan(context, correctLine?.line ?? groupSpan.endLine, correctLine?.line ?? groupSpan.endLine)),
				correct: (label === "True") === correctAnswer,
			}));
			items.push({ ...common, type: "truefalse", choices, correctAnswer });
			continue;
		}

		if (hasFreeText) {
			const answerLine = answerLines.find((line) => /^=\s/.test(line.text.trim()));
			items.push({
				...common,
				type: "freetext",
				answer: {
					expected: answerLine?.text.trim().replace(/^=\s*/, "") ?? "",
					caseSensitive: false,
				},
			});
			continue;
		}

		const choices: ChoiceDefinition[] = [];
		for (const line of answerLines) {
			const match = line.text.trim().match(CHOICE_PATTERN);
			if (!match) continue;
			choices.push({
				id: `${questionId}-choice-${choices.length + 1}`,
				content: rich(match[2]!.trim(), sourceSpan(context, line.line, line.line)),
				correct: match[1]!.toLowerCase() === "x",
			});
		}
		const correctCount = choices.filter((choice) => choice.correct).length;
		if (correctCount === 1) {
			items.push({ ...common, type: "single", choices });
		} else {
			items.push({ ...common, type: "multi", choices });
		}
	}

	return {
		definition: {
			schemaVersion: 1,
			id,
			title,
			items,
			source: sourceSpan(context, block.source.startLine, block.source.endLine),
		},
		diagnostics,
		syntax: "legacy",
	};
}

function splitGroups(body: string, firstLine: number): LegacyGroup[] {
	const groups: LegacyGroup[] = [];
	let current: LegacyGroup = { lines: [] };
	body.split(/\r?\n/).forEach((text, index) => {
		if (!text.trim() && current.lines.some((line) => line.text.trim())) {
			groups.push(current);
			current = { lines: [] };
			return;
		}
		current.lines.push({ text, line: firstLine + index });
	});
	if (current.lines.some((line) => line.text.trim())) groups.push(current);
	return groups;
}

function rich(markdown: string, source: QuizSourceSpan): RichTextSource {
	return { markdown, source };
}

function sourceSpan(
	context: QuizParseContext,
	startLine: number,
	endLine: number,
): QuizSourceSpan {
	return { relPath: context.relPath, startLine, endLine };
}
