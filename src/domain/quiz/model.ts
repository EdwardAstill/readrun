import type { SourcePosition } from "../validation/model.ts";

// --- Question types ---

export interface SingleChoiceQuestion {
	id: string;
	type: "single";
	prompt: string;
	options: string[];
	correctIndex: number;
	hint?: string;
	explanation?: string;
}

export interface MultiChoiceQuestion {
	id: string;
	type: "multi";
	prompt: string;
	options: string[];
	correctIndexes: number[];
	hint?: string;
	explanation?: string;
}

export interface TrueFalseQuestion {
	id: string;
	type: "truefalse";
	prompt: string;
	correctAnswer: boolean;
	hint?: string;
	explanation?: string;
}

export interface FreeTextQuestion {
	id: string;
	type: "freetext";
	prompt: string;
	correctAnswer: string;
	caseSensitive?: boolean;
	hint?: string;
	explanation?: string;
}

export interface QuestionGroup {
	id: string;
	type: "group";
	prompt: string;
	parts: InteractiveQuestion[];
	hint?: string;
	explanation?: string;
}

export interface InfoItem {
	id: string;
	type: "info";
	content: string;
}

export type InteractiveQuestion =
	| SingleChoiceQuestion
	| MultiChoiceQuestion
	| TrueFalseQuestion
	| FreeTextQuestion;

export type QuizQuestion = InteractiveQuestion | QuestionGroup;

export type QuizItem = QuizQuestion | InfoItem;

// --- Quiz container ---

export interface Quiz {
	title?: string;
	items: QuizItem[];
}

// --- Validation ---

export interface QuizValidationIssue {
	code: string;
	message: string;
	position?: SourcePosition;
}
