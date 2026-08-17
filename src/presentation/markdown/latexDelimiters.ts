import type MarkdownIt from "markdown-it";

export function markdownItLatexDelimiters(markdown: MarkdownIt): void {
	markdown.inline.ruler.before(
		"escape",
		"readrun_math_parentheses",
		(state, silent) => {
			if (state.src.slice(state.pos, state.pos + 2) !== "\\(") {
				return false;
			}

			const contentStart = state.pos + 2;
			const delimiterEnd = findClosingDelimiter(
				state.src,
				contentStart,
				")",
			);
			const lineEnd = state.src.indexOf("\n", contentStart);

			if (
				delimiterEnd < 0 ||
				delimiterEnd === contentStart ||
				(lineEnd >= 0 && delimiterEnd > lineEnd)
			) {
				return false;
			}

			if (!silent) {
				const token = state.push("math_inline", "math", 0);
				token.markup = "\\(\\)";
				token.content = state.src.slice(contentStart, delimiterEnd);
			}

			state.pos = delimiterEnd + 2;
			return true;
		},
	);

	markdown.block.ruler.before(
		"paragraph",
		"readrun_math_brackets",
		(state, startLine, endLine, silent) => {
			const start = state.bMarks[startLine]! + state.tShift[startLine]!;
			const firstLineEnd = state.eMarks[startLine]!;
			if (state.src.slice(start, start + 2) !== "\\[") {
				return false;
			}

			const contentLines: string[] = [];
			let closingLine = startLine;
			let line = state.src.slice(start + 2, firstLineEnd);
			let delimiterEnd = findClosingDelimiter(line, 0, "]");

			while (delimiterEnd < 0 && closingLine + 1 < endLine) {
				contentLines.push(line);
				closingLine += 1;
				const lineStart =
					state.bMarks[closingLine]! + state.tShift[closingLine]!;
				const lineEnd = state.eMarks[closingLine]!;
				line = state.src.slice(lineStart, lineEnd);
				delimiterEnd = findClosingDelimiter(line, 0, "]");
			}

			if (
				delimiterEnd < 0 ||
				line.slice(delimiterEnd + 2).trim().length > 0
			) {
				return false;
			}

			if (silent) {
				return true;
			}

			contentLines.push(line.slice(0, delimiterEnd));
			const token = state.push("math_block", "math", 0);
			token.block = true;
			token.content = contentLines.join("\n").trim();
			token.map = [startLine, closingLine + 1];
			token.markup = "\\[\\]";
			state.line = closingLine + 1;
			return true;
		},
		{ alt: ["paragraph", "reference", "blockquote", "list"] },
	);
}

function findClosingDelimiter(
	source: string,
	from: number,
	closingCharacter: ")" | "]",
): number {
	let closingCharacterIndex = source.indexOf(closingCharacter, from);
	while (closingCharacterIndex >= 0) {
		let slashIndex = closingCharacterIndex - 1;
		while (slashIndex >= from && source[slashIndex] === "\\") {
			slashIndex -= 1;
		}

		const slashCount = closingCharacterIndex - slashIndex - 1;
		if (slashCount % 2 === 1) {
			return closingCharacterIndex - 1;
		}

		closingCharacterIndex = source.indexOf(
			closingCharacter,
			closingCharacterIndex + 1,
		);
	}

	return -1;
}
