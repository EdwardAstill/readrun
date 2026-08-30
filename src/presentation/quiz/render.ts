import type {
	QuizDefinition,
	QuizQuestionDefinition,
	RichTextSource,
} from "../../domain/quiz/model.ts";

import type {
	RenderedQuizDefinition,
	RenderedQuizItem,
	RenderedQuizQuestion,
	RenderedRichText,
} from "./model.ts";

export interface QuizRichTextRenderer {
	block(source: string): string;
	inline(source: string): string;
}

export function renderQuizDefinition(
	definition: QuizDefinition,
	options: {
		instanceId: string;
		richText: QuizRichTextRenderer;
	},
): RenderedQuizDefinition {
	return {
		schemaVersion: 1,
		instanceId: options.instanceId,
		id: definition.id,
		title: definition.title ?? "Quiz",
		items: definition.items.map((item): RenderedQuizItem => {
			if (item.type === "info") {
				return {
					type: "info",
					id: item.id,
					content: renderRich(item.content, options.richText.block),
				};
			}
			return renderQuestion(item, options.richText);
		}),
	};
}

function renderQuestion(
	question: QuizQuestionDefinition,
	renderer: QuizRichTextRenderer,
): RenderedQuizQuestion {
	const common = {
		id: question.id,
		prompt: renderRich(question.prompt, renderer.block),
		hint: question.hint
			? renderRich(question.hint, renderer.block)
			: undefined,
		explanation: question.explanation
			? renderRich(question.explanation, renderer.block)
			: undefined,
	};
	if (question.type === "freetext") {
		return { ...common, type: "freetext", answer: question.answer };
	}
	const choices = question.choices.map((choice) => ({
		id: choice.id,
		content: renderRich(choice.content, renderer.inline),
		correct: choice.correct,
	}));
	if (question.type === "truefalse") {
		return {
			...common,
			type: "truefalse",
			choices,
		};
	}
	return { ...common, type: question.type, choices };
}

function renderRich(
	source: RichTextSource,
	render: (source: string) => string,
): RenderedRichText {
	return {
		html: render(source.markdown),
		text: plainText(source.markdown),
	};
}

function plainText(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, (value) =>
			value.replace(/^```[^\n]*\n?|```$/g, ""),
		)
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) =>
			String(label ?? target),
		)
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<\/(?:p|div|li|blockquote|h[1-6])\s*>/gi, " ")
		.replace(/<[^>]*>/g, "")
		.replace(/^[ \t]{0,3}(?:#{1,6}|>|[-+*])(?:[ \t]+|$)/gm, "")
		.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "$1")
		.replace(/__(?=\S)([\s\S]*?\S)__/g, "$1")
		.replace(
			/(^|[\s([{])\*(?=\S)([^*\n]*?\S)\*(?=$|[\s)\]},.!?;:])/gm,
			"$1$2",
		)
		.replace(
			/(^|[\s([{])_(?=\S)([^_\n]*?\S)_(?=$|[\s)\]},.!?;:])/gm,
			"$1$2",
		)
		.replace(/~~(.*?)~~/g, "$1")
		.replace(/`([^`]*)`/g, "$1")
		.replace(/\$\$([\s\S]*?)\$\$/g, "$1")
		.replace(/\$([^$\n]+)\$/g, "$1")
		.replace(/\\([()[\]])/g, "")
		.replace(/\s+/g, " ")
		.replace(/\s+([,.;:!?])/g, "$1")
		.trim();
}
