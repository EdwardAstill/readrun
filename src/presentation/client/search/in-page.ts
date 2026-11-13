export interface PageSearchState {
	marks: HTMLElement[];
	activeIdx: number;
}

const CONTENT_SELECTOR = "#main-content";

function getContentRoot(): HTMLElement | null {
	return document.querySelector(CONTENT_SELECTOR);
}

export function clearPageSearchHighlights(root?: ParentNode): void {
	const scope = root ?? getContentRoot();
	if (!scope) return;

	scope.querySelectorAll("mark.page-search-highlight").forEach((mark) => {
		const parent = mark.parentNode;
		if (!parent) return;
		parent.replaceChild(mark.ownerDocument.createTextNode(mark.textContent ?? ""), mark);
		parent.normalize();
	});
}

export function highlightPageMatches(
	query: string,
	root?: ParentNode,
): PageSearchState {
	clearPageSearchHighlights(root);
	const state: PageSearchState = { marks: [], activeIdx: -1 };
	const trimmed = query.trim();
	if (!trimmed) return state;

	const scope = root ?? getContentRoot();
	if (!scope) return state;

	const owner = scope.ownerDocument ?? document;
	const walker = owner.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		const parent = node.parentElement;
		if (!parent || parent.closest("script, style, noscript, template, textarea, input, select, button, [contenteditable]:not([contenteditable=false]), [hidden]")) continue;
		textNodes.push(node as Text);
	}

	const pattern = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
	for (const textNode of textNodes) {
		const text = textNode.textContent ?? "";
		let match = pattern.exec(text);
		if (!match) continue;

		const fragment = owner.createDocumentFragment();
		let lastIdx = 0;
		while (match) {
			const idx = match.index;
			if (idx > lastIdx) {
				fragment.appendChild(owner.createTextNode(text.slice(lastIdx, idx)));
			}

			const mark = owner.createElement("mark");
			mark.className = "page-search-highlight";
			mark.textContent = match[0];
			fragment.appendChild(mark);
			state.marks.push(mark);

			lastIdx = idx + match[0].length;
			match = pattern.exec(text);
		}

		if (lastIdx < text.length) {
			fragment.appendChild(owner.createTextNode(text.slice(lastIdx)));
		}
		textNode.parentNode?.replaceChild(fragment, textNode);
	}

	if (state.marks.length > 0) {
		state.activeIdx = 0;
		const first = state.marks[0]!;
		first.classList.add("page-search-highlight--active");
		first.scrollIntoView({ block: "center" });
	}

	return state;
}

export function navigatePageSearch(
	direction: 1 | -1,
	state: PageSearchState,
): void {
	if (state.marks.length === 0) return;

	const current = state.marks[state.activeIdx];
	current?.classList.remove("page-search-highlight--active");

	state.activeIdx =
		(state.activeIdx + direction + state.marks.length) % state.marks.length;

	const next = state.marks[state.activeIdx]!;
	next.classList.add("page-search-highlight--active");
	next.scrollIntoView({ block: "center" });
}
