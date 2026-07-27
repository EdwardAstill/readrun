import type { Quiz, QuizItem, QuizValidationIssue } from "./model.ts";

export function validateQuiz(quiz: Quiz): QuizValidationIssue[] {
	const issues: QuizValidationIssue[] = [];

	if (quiz.items.length === 0) {
		issues.push({
			code: "quiz.empty",
			message: "Quiz must define at least one item.",
		});
		return issues;
	}

	const interactiveCount = quiz.items.filter(isInteractive).length;
	if (interactiveCount === 0) {
		issues.push({
			code: "quiz.noQuestions",
			message: "Quiz must contain at least one interactive question.",
		});
		return issues;
	}

	for (const item of quiz.items) {
		validateItem(item, issues);
	}

	return issues;
}

function validateItem(item: QuizItem, issues: QuizValidationIssue[]): void {
	switch (item.type) {
		case "info":
			if (!item.content.trim()) {
				issues.push({
					code: "quiz.info.empty",
					message: `Info item "${item.id}" must have content.`,
				});
			}
			break;

		case "single":
			if (!item.prompt.trim()) {
				issues.push({
					code: "quiz.question.prompt",
					message: `Question "${item.id}" must have a prompt.`,
				});
			}
			if (item.options.length < 2) {
				issues.push({
					code: "quiz.question.options",
					message: `Question "${item.id}" must have at least two options.`,
				});
			}
			if (item.correctIndex < 0 || item.correctIndex >= item.options.length) {
				issues.push({
					code: "quiz.question.correct",
					message: `Question "${item.id}" correctIndex ${item.correctIndex} is out of range.`,
				});
			}
			break;

		case "multi":
			if (!item.prompt.trim()) {
				issues.push({
					code: "quiz.question.prompt",
					message: `Question "${item.id}" must have a prompt.`,
				});
			}
			if (item.options.length < 2) {
				issues.push({
					code: "quiz.question.options",
					message: `Question "${item.id}" must have at least two options.`,
				});
			}
			if (item.correctIndexes.length === 0) {
				issues.push({
					code: "quiz.question.correct",
					message: `Question "${item.id}" must have at least one correct answer.`,
				});
			}
			break;

		case "truefalse":
			if (!item.prompt.trim()) {
				issues.push({
					code: "quiz.question.prompt",
					message: `Question "${item.id}" must have a prompt.`,
				});
			}
			break;

		case "freetext":
			if (!item.prompt.trim()) {
				issues.push({
					code: "quiz.question.prompt",
					message: `Question "${item.id}" must have a prompt.`,
				});
			}
			if (!item.correctAnswer.trim()) {
				issues.push({
					code: "quiz.question.answer",
					message: `Question "${item.id}" must specify a correct answer.`,
				});
			}
			break;

		case "group":
			if (!item.prompt.trim()) {
				issues.push({
					code: "quiz.group.prompt",
					message: `Group "${item.id}" must have a prompt.`,
				});
			}
			if (item.parts.length === 0) {
				issues.push({
					code: "quiz.group.empty",
					message: `Group "${item.id}" must contain at least one part.`,
				});
			}
			for (const part of item.parts) {
				validateItem(part, issues);
			}
			break;
	}
}

function isInteractive(item: QuizItem): boolean {
	return (
		item.type === "single" ||
		item.type === "multi" ||
		item.type === "truefalse" ||
		item.type === "freetext" ||
		item.type === "group"
	);
}
