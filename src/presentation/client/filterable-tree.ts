export interface FilterableTreeChromeOptions {
	searchInput: HTMLInputElement | null;
	foldButton: HTMLElement | null;
	toggleTarget: HTMLElement | null;
	applySearch: (query: string) => void;
	firstVisibleLink: () => HTMLAnchorElement | null;
	toggleAll: () => void;
	syncFoldButton: () => void;
}

export interface LabelTreeSearchOptions {
	root: HTMLElement;
	rawQuery: string;
	labelSelector: string;
	itemResetClasses: readonly string[];
	itemMatchClass: string;
	searchOpenedAttribute: string;
	isBranch: (details: HTMLDetailsElement) => boolean;
}

export interface FoldButtonLabels {
	empty: string;
	expand: string;
	collapse: string;
}

export function bindFilterableTreeChrome(
	options: FilterableTreeChromeOptions,
): () => void {
	const {
		searchInput,
		foldButton,
		toggleTarget,
		applySearch,
		firstVisibleLink,
		toggleAll,
		syncFoldButton,
	} = options;

	const onSearchInput = (): void => {
		applySearch(searchInput?.value ?? "");
		syncFoldButton();
	};
	const onSearchKeyDown = (event: KeyboardEvent): void => {
		if (event.key === "Escape") {
			if (searchInput) searchInput.value = "";
			applySearch("");
			syncFoldButton();
			searchInput?.blur();
			return;
		}
		if (event.key === "Enter") {
			const link = firstVisibleLink();
			if (link) {
				event.preventDefault();
				link.click();
			}
		}
	};
	const onFoldAllClick = (): void => {
		toggleAll();
		syncFoldButton();
	};

	syncFoldButton();
	searchInput?.addEventListener("input", onSearchInput);
	searchInput?.addEventListener("keydown", onSearchKeyDown);
	foldButton?.addEventListener("click", onFoldAllClick);
	toggleTarget?.addEventListener("toggle", syncFoldButton, true);

	return () => {
		searchInput?.removeEventListener("input", onSearchInput);
		searchInput?.removeEventListener("keydown", onSearchKeyDown);
		foldButton?.removeEventListener("click", onFoldAllClick);
		toggleTarget?.removeEventListener("toggle", syncFoldButton, true);
		applySearch("");
	};
}

export function applyLabelTreeSearch(options: LabelTreeSearchOptions): void {
	const {
		root,
		rawQuery,
		labelSelector,
		itemResetClasses,
		itemMatchClass,
		searchOpenedAttribute,
		isBranch,
	} = options;
	const query = normalizeTreeSearch(rawQuery);
	const items = root.querySelectorAll<HTMLElement>("li");
	const labels = root.querySelectorAll<HTMLElement>(labelSelector);

	for (const item of items) item.classList.remove(...itemResetClasses);
	for (const label of labels) {
		restoreTreeLabel(label);
		label.classList.remove("rr-match", "rr-match-strong", "rr-dim");
	}
	restoreSearchOpenedBranches(root, searchOpenedAttribute);
	if (!query) return;

	for (const label of labels) {
		const text = normalizeTreeSearch(label.textContent ?? "");
		const item = label.closest<HTMLElement>("li");
		if (!item) continue;

		if (text.includes(query)) {
			item.classList.add(itemMatchClass);
			label.classList.add(text.startsWith(query) ? "rr-match-strong" : "rr-match");
			highlightTreeLabel(label, query);
			openSearchAncestors(
				root,
				label,
				searchOpenedAttribute,
				isBranch,
			);
		} else {
			label.classList.add("rr-dim");
		}
	}
}

export function normalizeTreeSearch(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function restoreTreeLabel(label: HTMLElement | null): void {
	if (!label) return;
	const original = label.dataset.rrOriginalHtml;
	if (original !== undefined) {
		label.innerHTML = original;
		delete label.dataset.rrOriginalHtml;
	}
}

export function highlightTreeLabel(label: HTMLElement, query: string): void {
	const text = label.textContent ?? "";
	const index = normalizeTreeSearch(text).indexOf(query);
	if (index < 0) return;
	if (label.dataset.rrOriginalHtml === undefined) {
		label.dataset.rrOriginalHtml = label.innerHTML;
	}
	const mark = document.createElement("mark");
	mark.textContent = text.slice(index, index + query.length);
	label.replaceChildren(
		document.createTextNode(text.slice(0, index)),
		mark,
		document.createTextNode(text.slice(index + query.length)),
	);
}

export function restoreSearchOpenedBranches(
	root: HTMLElement,
	attribute: string,
): void {
	root
		.querySelectorAll<HTMLDetailsElement>(`details[${attribute}]`)
		.forEach((details) => {
			details.open = false;
			details.removeAttribute(attribute);
		});
}

export function openSearchAncestors(
	root: HTMLElement,
	element: Element,
	attribute: string,
	isBranch: (details: HTMLDetailsElement) => boolean,
): void {
	let current = element.parentElement;
	while (current && current !== root) {
		if (current instanceof HTMLDetailsElement && isBranch(current)) {
			if (!current.open) {
				current.open = true;
				current.setAttribute(attribute, "true");
			}
		}
		current = current.parentElement;
	}
}

export function visibleTreeBranches(
	root: HTMLElement,
	selector: string,
): HTMLDetailsElement[] {
	return Array.from(root.querySelectorAll<HTMLDetailsElement>(selector));
}

export function toggleTreeBranches(branches: HTMLDetailsElement[]): boolean {
	const open = !branches.some((details) => details.open);
	for (const details of branches) details.open = open;
	return open;
}

export function syncTreeFoldButton(
	button: HTMLElement | null,
	branches: readonly HTMLDetailsElement[],
	labels: FoldButtonLabels,
): void {
	if (!button) return;
	if (branches.length === 0) {
		button.setAttribute("disabled", "true");
		button.textContent = "+";
		button.setAttribute("aria-label", labels.empty);
		button.setAttribute("title", labels.empty);
		button.setAttribute("aria-expanded", "false");
		return;
	}

	const expanded = branches.some((details) => details.open);
	const label = expanded ? labels.collapse : labels.expand;
	button.textContent = expanded ? "-" : "+";
	button.setAttribute("aria-label", label);
	button.setAttribute("title", label);
	button.setAttribute("aria-expanded", String(expanded));
	button.removeAttribute("disabled");
}

export function firstVisibleTreeLink(
	root: HTMLElement | null,
	matchSelector: string,
	fallbackSelector: string,
): HTMLAnchorElement | null {
	if (!root) return null;
	const match = root.querySelector<HTMLAnchorElement>(matchSelector);
	if (match) return match;
	if (root.querySelector(".rr-dim")) return null;
	return root.querySelector<HTMLAnchorElement>(fallbackSelector);
}
