import type { Block } from "../blocks/model.ts";

import type {
	Quiz,
	QuizItem,
	QuizQuestion,
	InteractiveQuestion,
	InfoItem,
} from "./model.ts";

export function parseQuiz(block: Block): Quiz {
	const attrs = new Map(block.attrs.map((attr) => [attr.name, attr.value]));
	const title = stringAttr(attrs.get("title"));
	const items: QuizItem[] = [];

	// Split into question groups (blank-line separated)
	const groups = splitQuestionGroups(block.body);
	let idIndex = 0;

	for (const group of groups) {
		const item = parseItem(group, idIndex);
		if (item) {
			items.push(item);
			idIndex++;
		}
	}

	return { title, items };
}

function splitQuestionGroups(body: string): string[] {
	return body
		.split(/\n\s*\n/)
		.map((g) => g.trim())
		.filter(Boolean);
}

function parseItem(raw: string, index: number): QuizItem | null {
	const lines = raw
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);
	if (lines.length === 0) return null;

	// Detect info item: no answer markers, just text
	if (isInfoItem(lines)) {
		return parseInfoItem(lines, index);
	}

	return parseQuestion(lines, index);
}

function isInfoItem(lines: string[]): boolean {
	return !lines.some((l) => {
		const trimmed = l.trim();
		return (
			/^[-+*]\s+\[[xX ]\]\s/.test(trimmed) ||
			/^(true|false)\s*$/i.test(trimmed) ||
			/^=\s/.test(trimmed)
		);
	});
}

function parseInfoItem(lines: string[], index: number): InfoItem {
	return {
		id: `i${index + 1}`,
		type: "info",
		content: lines.join("\n"),
	};
}

function parseQuestion(lines: string[], index: number): QuizQuestion | null {
	const prompt = extractPrompt(lines);
	const answerLines = lines.slice(1);
	const explanation = extractExplanation(answerLines);
	const cleanAnswers = answerLines.filter(
		(l) => !l.startsWith("_") && !l.startsWith("> "),
	);
	const hint = extractHint(answerLines);

	// Detect question type from answer markers
	if (cleanAnswers.some((l) => /^(true|false)\s*$/i.test(l))) {
		return parseTrueFalse(index, prompt, cleanAnswers, hint, explanation);
	}

	if (cleanAnswers.some((l) => /^=\s/.test(l))) {
		return parseFreeText(index, prompt, cleanAnswers, hint, explanation);
	}

	// Multiple choice — detect single vs multi
	return parseMultipleChoice(index, prompt, cleanAnswers, hint, explanation);
}

function extractPrompt(lines: string[]): string {
	const first = lines[0]?.trim() ?? "";
	return first.replace(/^\?\s*/, ""); // Strip leading ? if present
}

function extractHint(lines: string[]): string | undefined {
	for (const line of lines) {
		if (line.startsWith("_")) {
			return line.replace(/^_\s*/, "").trim();
		}
	}
	return undefined;
}

function extractExplanation(lines: string[]): string | undefined {
	const expLines: string[] = [];
	for (const line of lines) {
		if (line.startsWith("> ")) {
			expLines.push(line.replace(/^>\s*/, ""));
		}
	}
	return expLines.length > 0 ? expLines.join("\n") : undefined;
}

function parseMultipleChoice(
	index: number,
	prompt: string,
	lines: string[],
	hint: string | undefined,
	explanation: string | undefined,
): QuizQuestion {
	const options: string[] = [];
	const correctIndexes: number[] = [];

	for (const line of lines) {
		const m = line.match(/^[-+*]\s+\[([xX ])\]\s+(.+)$/);
		if (!m) continue;
		options.push(m[2]!.trim());
		if (m[1]!.toLowerCase() === "x") {
			correctIndexes.push(options.length - 1);
		}
	}

	if (correctIndexes.length === 1) {
		return {
			id: `q${index + 1}`,
			type: "single",
			prompt,
			options,
			correctIndex: correctIndexes[0]!,
			hint,
			explanation,
		};
	}

	return {
		id: `q${index + 1}`,
		type: "multi",
		prompt,
		options,
		correctIndexes,
		hint,
		explanation,
	};
}

function parseTrueFalse(
	index: number,
	prompt: string,
	lines: string[],
	hint: string | undefined,
	explanation: string | undefined,
): QuizQuestion {
	let correctAnswer = false;
	for (const line of lines) {
		const m = line.match(/^(true|false)\s*$/i);
		if (m) {
			correctAnswer = m[1]!.toLowerCase() === "true";
			break;
		}
	}

	return {
		id: `q${index + 1}`,
		type: "truefalse",
		prompt,
		correctAnswer,
		hint,
		explanation,
	};
}

function parseFreeText(
	index: number,
	prompt: string,
	lines: string[],
	hint: string | undefined,
	explanation: string | undefined,
): QuizQuestion {
	let correctAnswer = "";
	for (const line of lines) {
		if (line.startsWith("=")) {
			correctAnswer = line.replace(/^=\s*/, "").trim();
			break;
		}
	}

	return {
		id: `q${index + 1}`,
		type: "freetext",
		prompt,
		correctAnswer,
		hint,
		explanation,
	};
}

function stringAttr(value: string | true | undefined): string | undefined {
	return typeof value === "string" ? value : undefined;
}
