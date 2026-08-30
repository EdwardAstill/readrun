export interface RenderedRichText {
	html: string;
	text: string;
}

export interface RenderedQuizDefinition {
	schemaVersion: 1;
	instanceId: string;
	id: string;
	title: string;
	items: RenderedQuizItem[];
}

export interface RenderedQuizInfo {
	type: "info";
	id: string;
	content: RenderedRichText;
}

export interface RenderedQuizChoice {
	id: string;
	content: RenderedRichText;
	correct: boolean;
}

interface RenderedQuizQuestionBase {
	id: string;
	prompt: RenderedRichText;
	hint?: RenderedRichText;
	explanation?: RenderedRichText;
}

export interface RenderedSingleChoice extends RenderedQuizQuestionBase {
	type: "single";
	choices: RenderedQuizChoice[];
}

export interface RenderedMultiChoice extends RenderedQuizQuestionBase {
	type: "multi";
	choices: RenderedQuizChoice[];
}

export interface RenderedTrueFalse extends RenderedQuizQuestionBase {
	type: "truefalse";
	choices: RenderedQuizChoice[];
}

export interface RenderedFreeText extends RenderedQuizQuestionBase {
	type: "freetext";
	answer: {
		expected: string;
		caseSensitive: boolean;
	};
}

export type RenderedQuizQuestion =
	| RenderedSingleChoice
	| RenderedMultiChoice
	| RenderedTrueFalse
	| RenderedFreeText;

export type RenderedQuizItem = RenderedQuizInfo | RenderedQuizQuestion;

export function isRenderedQuizQuestion(
	item: RenderedQuizItem,
): item is RenderedQuizQuestion {
	return item.type !== "info";
}
