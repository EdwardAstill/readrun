import type {
	RenderedQuizChoice,
	RenderedQuizDefinition,
	RenderedQuizItem,
	RenderedQuizQuestion,
	RenderedRichText,
} from "./model.ts";

export function serializeQuizPayload(
	definition: RenderedQuizDefinition,
): string {
	return JSON.stringify(definition)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

export function parseQuizPayload(value: string): RenderedQuizDefinition {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new Error("Quiz payload is not valid JSON.");
	}
	if (!isRecord(parsed) || parsed.schemaVersion !== 1) {
		throw new Error("Unsupported quiz payload schema.");
	}
	if (
		!isString(parsed.instanceId) ||
		!isString(parsed.id) ||
		!isString(parsed.title) ||
		!Array.isArray(parsed.items)
	) {
		throw new Error("Quiz payload is missing required fields.");
	}

	const itemIds = new Set<string>();
	const items = parsed.items.map((item, index) => {
		const valid = parseItem(item, index);
		if (itemIds.has(valid.id)) {
			throw new Error(`Quiz payload has duplicate item ID "${valid.id}".`);
		}
		itemIds.add(valid.id);
		return valid;
	});

	return {
		schemaVersion: 1,
		instanceId: parsed.instanceId,
		id: parsed.id,
		title: parsed.title,
		items,
	};
}

function parseItem(value: unknown, index: number): RenderedQuizItem {
	if (!isRecord(value) || !isString(value.id) || !isString(value.type)) {
		throw new Error(`Quiz item ${index + 1} is invalid.`);
	}
	if (value.type === "info") {
		return { type: "info", id: value.id, content: parseRich(value.content) };
	}
	if (!["single", "multi", "truefalse", "freetext"].includes(value.type)) {
		throw new Error(`Quiz item "${value.id}" has an unsupported type.`);
	}
	return parseQuestion(value as Record<string, unknown> & { id: string; type: string });
}

function parseQuestion(
	value: Record<string, unknown> & { id: string; type: string },
): RenderedQuizQuestion {
	const common = {
		id: value.id,
		prompt: parseRich(value.prompt),
		hint: value.hint === undefined ? undefined : parseRich(value.hint),
		explanation:
			value.explanation === undefined
				? undefined
				: parseRich(value.explanation),
	};
	if (value.type === "freetext") {
		if (
			!isRecord(value.answer) ||
			!isString(value.answer.expected) ||
			typeof value.answer.caseSensitive !== "boolean"
		) {
			throw new Error(`Free-text question "${value.id}" has an invalid answer.`);
		}
		return {
			...common,
			type: "freetext",
			answer: {
				expected: value.answer.expected,
				caseSensitive: value.answer.caseSensitive,
			},
		};
	}
	const choices = parseChoices(value.choices, value.id);
	if (value.type === "truefalse") {
		return {
			...common,
			type: "truefalse",
			choices,
		};
	}
	return {
		...common,
		type: value.type as "single" | "multi",
		choices,
	};
}

function parseChoices(value: unknown, questionId: string): RenderedQuizChoice[] {
	if (!Array.isArray(value)) {
		throw new Error(`Question "${questionId}" has invalid choices.`);
	}
	const ids = new Set<string>();
	return value.map((choice) => {
		if (
			!isRecord(choice) ||
			!isString(choice.id) ||
			typeof choice.correct !== "boolean"
		) {
			throw new Error(`Question "${questionId}" has an invalid choice.`);
		}
		if (ids.has(choice.id)) {
			throw new Error(`Question "${questionId}" has duplicate choice IDs.`);
		}
		ids.add(choice.id);
		return {
			id: choice.id,
			content: parseRich(choice.content),
			correct: choice.correct,
		};
	});
}

function parseRich(value: unknown): RenderedRichText {
	if (!isRecord(value) || !isString(value.html) || !isString(value.text)) {
		throw new Error("Quiz rich text is invalid.");
	}
	return { html: value.html, text: value.text };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}
