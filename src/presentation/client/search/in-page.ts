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
		parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
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

	const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let node: Node | null;
	while ((node = walker.nextNode())) {
		textNodes.push(node as Text);
	}

	const lowerQuery = trimmed.toLowerCase();
	for (const textNode of textNodes) {
		const text = textNode.textContent ?? "";
		const lower = text.toLowerCase();
		let idx = lower.indexOf(lowerQuery);
		if (idx === -1) continue;

		const fragment = document.createDocumentFragment();
		let lastIdx = 0;
		while (idx !== -1) {
			if (idx > lastIdx) {
				fragment.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
			}

			const mark = document.createElement("mark");
			mark.className = "page-search-highlight";
			mark.textContent = text.slice(idx, idx + trimmed.length);
			fragment.appendChild(mark);
			state.marks.push(mark);

			lastIdx = idx + trimmed.length;
			idx = lower.indexOf(lowerQuery, lastIdx);
		}

		if (lastIdx < text.length) {
			fragment.appendChild(document.createTextNode(text.slice(lastIdx)));
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
