import type { SourcePosition } from "../validation/model.ts";

export interface QuizSourceSpan {
	relPath: string;
	startLine: number;
	endLine: number;
}

export interface RichTextSource {
	markdown: string;
	source: QuizSourceSpan;
}

export interface QuizDefinition {
	schemaVersion: 1;
	id: string;
	title?: string;
	items: QuizItemDefinition[];
	source: QuizSourceSpan;
}

export interface QuizInfoDefinition {
	type: "info";
	id: string;
	content: RichTextSource;
	source: QuizSourceSpan;
}

export interface ChoiceDefinition {
	id: string;
	content: RichTextSource;
	correct: boolean;
}

interface QuizQuestionBase {
	id: string;
	prompt: RichTextSource;
	hint?: RichTextSource;
	explanation?: RichTextSource;
	source: QuizSourceSpan;
}

export interface SingleChoiceDefinition extends QuizQuestionBase {
	type: "single";
	choices: ChoiceDefinition[];
}

export interface MultiChoiceDefinition extends QuizQuestionBase {
	type: "multi";
	choices: ChoiceDefinition[];
}

export interface TrueFalseDefinition extends QuizQuestionBase {
	type: "truefalse";
	choices: ChoiceDefinition[];
	correctAnswer: boolean;
}

export interface FreeTextDefinition extends QuizQuestionBase {
	type: "freetext";
	answer: {
		expected: string;
		caseSensitive: boolean;
	};
}

export type QuizQuestionDefinition =
	| SingleChoiceDefinition
	| MultiChoiceDefinition
	| TrueFalseDefinition
	| FreeTextDefinition;

export type QuizItemDefinition = QuizInfoDefinition | QuizQuestionDefinition;

export type QuizDiagnosticSeverity = "warning" | "error";

export interface QuizDiagnostic {
	severity: QuizDiagnosticSeverity;
	code: string;
	message: string;
	position: SourcePosition;
}

export interface QuizParseContext {
	relPath: string;
	quizIndex: number;
}

export interface QuizParseResult {
	definition?: QuizDefinition;
	diagnostics: QuizDiagnostic[];
	syntax: "canonical" | "legacy";
}

export function isQuizQuestion(
	item: QuizItemDefinition,
): item is QuizQuestionDefinition {
	return item.type !== "info";
}
