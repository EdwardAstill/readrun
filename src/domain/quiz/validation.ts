import type {
	ChoiceDefinition,
	QuizDefinition,
	QuizDiagnostic,
	QuizItemDefinition,
	QuizQuestionDefinition,
	QuizSourceSpan,
	RichTextSource,
} from "./model.ts";
import { isQuizQuestion } from "./model.ts";

const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export function validateQuiz(definition: QuizDefinition): QuizDiagnostic[] {
	const diagnostics: QuizDiagnostic[] = [];
	validateId(definition.id, "Quiz", definition.source, diagnostics);

	if (definition.items.length === 0) {
		diagnostics.push(issue("quiz.empty", "Quiz must define at least one item.", definition.source));
	}
	if (!definition.items.some(isQuizQuestion)) {
		diagnostics.push(
			issue(
				"quiz.noQuestions",
				"Quiz must contain at least one interactive question.",
				definition.source,
			),
		);
	}

	const itemIds = new Set<string>();
	for (const item of definition.items) {
		validateId(item.id, "Item", item.source, diagnostics);
		if (itemIds.has(item.id)) {
			diagnostics.push(
				issue(
					"quiz.id.duplicate",
					`Quiz item ID "${item.id}" is duplicated.`,
					item.source,
				),
			);
		}
		itemIds.add(item.id);
		validateItem(item, diagnostics);
	}

	try {
		JSON.stringify(definition);
	} catch {
		diagnostics.push(
			issue(
				"quiz.serialization",
				"Quiz definition cannot be serialized for a static page.",
				definition.source,
			),
		);
	}

	return diagnostics;
}

function validateItem(
	item: QuizItemDefinition,
	diagnostics: QuizDiagnostic[],
): void {
	if (item.type === "info") {
		validateRichText(item.content, "Info item", "quiz.info.empty", diagnostics);
		return;
	}

	validateQuestion(item, diagnostics);
}

function validateQuestion(
	question: QuizQuestionDefinition,
	diagnostics: QuizDiagnostic[],
): void {
	validateRichText(
		question.prompt,
		`Question "${question.id}" prompt`,
		"quiz.question.prompt",
		diagnostics,
	);
	if (question.hint) {
		validateRichText(question.hint, "Hint", "quiz.hint.empty", diagnostics);
	}
	if (question.explanation) {
		validateRichText(
			question.explanation,
			"Explanation",
			"quiz.explanation.empty",
			diagnostics,
		);
	}

	if (question.type === "freetext") {
		if (!question.answer.expected.trim()) {
			diagnostics.push(
				issue(
					"quiz.question.answer",
					`Question "${question.id}" must specify exactly one expected answer with \`= answer\`.`,
					question.source,
				),
			);
		}
		return;
	}

	validateChoices(question.id, question.choices, question.source, diagnostics);
	const correctCount = question.choices.filter((choice) => choice.correct).length;
	if (question.type === "single" && correctCount !== 1) {
		diagnostics.push(
			issue(
				"quiz.question.correct",
				`Single-choice question "${question.id}" must have exactly one checked answer.`,
				question.source,
			),
		);
	}
	if (question.type === "multi" && correctCount < 1) {
		diagnostics.push(
			issue(
				"quiz.question.correct",
				`Multiple-choice question "${question.id}" must have at least one checked answer.`,
				question.source,
			),
		);
	}
	if (question.type === "truefalse") {
		const labels = question.choices.map((choice) =>
			choice.content.markdown.trim().toLowerCase(),
		);
		if (
			question.choices.length !== 2 ||
			!labels.includes("true") ||
			!labels.includes("false")
		) {
			diagnostics.push(
				issue(
					"quiz.truefalse.options",
					`True/false question "${question.id}" must contain exactly the choices True and False.`,
					question.source,
				),
			);
		}
		if (correctCount !== 1) {
			diagnostics.push(
				issue(
					"quiz.question.correct",
					`True/false question "${question.id}" must have exactly one checked answer.`,
					question.source,
				),
			);
		}
		const trueChoice = question.choices.find(
			(choice) => choice.content.markdown.trim().toLowerCase() === "true",
		);
		if (trueChoice && trueChoice.correct !== question.correctAnswer) {
			diagnostics.push(
				issue(
					"quiz.truefalse.answer",
					`True/false question "${question.id}" has an inconsistent correct answer.`,
					question.source,
				),
			);
		}
	}
}

function validateChoices(
	questionId: string,
	choices: ChoiceDefinition[],
	questionSource: QuizSourceSpan,
	diagnostics: QuizDiagnostic[],
): void {
	if (choices.length < 2) {
		diagnostics.push(
			issue(
				"quiz.question.options",
				`Question "${questionId}" must have at least two choices.`,
				choices[0]?.content.source ?? questionSource,
			),
		);
	}
	const ids = new Set<string>();
	for (const choice of choices) {
		validateId(choice.id, "Choice", choice.content.source, diagnostics);
		validateRichText(choice.content, "Choice", "quiz.choice.empty", diagnostics);
		if (ids.has(choice.id)) {
			diagnostics.push(
				issue(
					"quiz.choice.duplicate",
					`Choice ID "${choice.id}" is duplicated.`,
					choice.content.source,
				),
			);
		}
		ids.add(choice.id);
	}
}

function validateRichText(
	value: RichTextSource,
	label: string,
	code: string,
	diagnostics: QuizDiagnostic[],
): void {
	if (!value.markdown.trim()) {
		diagnostics.push(issue(code, `${label} must not be empty.`, value.source));
	}
}

function validateId(
	id: string,
	label: string,
	span: QuizSourceSpan,
	diagnostics: QuizDiagnostic[],
): void {
	if (!ID_PATTERN.test(id)) {
		diagnostics.push(
			issue(
				"quiz.id.invalid",
				`${label} ID "${id}" must match ${ID_PATTERN.source}.`,
				span,
			),
		);
	}
}

function issue(
	code: string,
	message: string,
	span: QuizSourceSpan,
): QuizDiagnostic {
	return {
		severity: "error",
		code,
		message,
		position: { relPath: span.relPath, line: span.startLine },
	};
}
