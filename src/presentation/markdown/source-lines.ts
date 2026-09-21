/** Source anchors for top-level headings and fences, without changing Markdown parsing. */
export function annotateSourceLines(html: string, source: string, startLine: number): string {
	const headings: number[] = [];
	const fences: number[] = [];
	const lines = source.split(/\r?\n/);
	let fence: { marker: string; length: number } | undefined;
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index]!;
		const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (fence) {
			if (match && match[1]![0] === fence.marker && match[1]!.length >= fence.length && !match[2]!.trim()) fence = undefined;
			continue;
		}
		if (match) {
			fence = { marker: match[1]![0]!, length: match[1]!.length };
			fences.push(startLine + index);
			continue;
		}
		if (/^ {0,3}#{1,6}(?:\s|$)/.test(line)) headings.push(startLine + index);
		else if (index > 0 && /^ {0,3}(?:=+|-+)\s*$/.test(line) && lines[index - 1]!.trim() && !/^\s*[-*>#]/.test(lines[index - 1]!)) headings.push(startLine + index - 1);
	}
	let heading = 0;
	let code = 0;
	const wrapped = `<readrun-source-fragment>${html}</readrun-source-fragment>`;
	let renderedHeadings = 0;
	let renderedCode = 0;
	new HTMLRewriter().on("readrun-source-fragment > *", {
		element(element) {
			if (/^h[1-6]$/.test(element.tagName)) renderedHeadings++;
			if (element.tagName === "pre") renderedCode++;
		},
	}).transform(wrapped);
	// Restrict anchors to top-level elements: headings in quotes/lists belong to
	// their enclosing section, and widget/quiz markup has its own block anchor.
	// If raw HTML, indented code, or nested Markdown makes the scan ambiguous,
	// interpolate from surrounding anchors rather than assigning wrong lines.
	return new HTMLRewriter()
		.on("readrun-source-fragment", { element(element) { element.removeAndKeepContent(); } })
		.on([1, 2, 3, 4, 5, 6].map((level) => `readrun-source-fragment > h${level}`).join(","), {
			element(element) {
				const line = headings[heading++];
				if (line !== undefined && renderedHeadings === headings.length) element.setAttribute("data-source-line", String(line));
			},
		})
		.on("readrun-source-fragment > pre", {
			element(element) {
				const line = fences[code++];
				if (line !== undefined && renderedCode === fences.length) element.setAttribute("data-source-line", String(line));
			},
		})
		.transform(wrapped);
}

export function annotateBlockLine(html: string, line: number, endLine: number): string {
	let first = true;
	return new HTMLRewriter().on("*", {
		element(element) {
			if (!first) return;
			first = false;
			element.setAttribute("data-source-line", String(line));
			element.setAttribute("data-source-end", String(endLine));
		},
	}).transform(html);
}
