import {
	bindFilterableTreeChrome,
	firstVisibleTreeLink,
	highlightTreeLabel,
	normalizeTreeSearch,
	openSearchAncestors,
	restoreSearchOpenedBranches,
	restoreTreeLabel,
	syncTreeFoldButton,
	toggleTreeBranches,
} from "./filterable-tree.ts";

const SEARCH_OPENED_ATTR = "data-rr-resource-search-opened";

export function initResourceBrowserChrome(): () => void {
	if (typeof document === "undefined") return () => {};

	const root = document.querySelector<HTMLElement>(".resource-browser");
	if (!root) return () => {};
	const searchInput = document.getElementById(
		"resource-browser-search",
	) as HTMLInputElement | null;
	const foldButton = document.getElementById("resource-browser-fold-all-btn");
	const syncFoldButton = (): void => {
		syncTreeFoldButton(foldButton, visibleGroups(root), {
			empty: "No resource groups to expand",
			expand: "Expand all resource groups",
			collapse: "Collapse all resource groups",
		});
	};

	syncResourceBrowser(root);
	return bindFilterableTreeChrome({
		searchInput,
		foldButton,
		toggleTarget: findTree(root),
		applySearch: (query) => applyResourceSearch(root, query),
		firstVisibleLink: () =>
			firstVisibleTreeLink(
				root,
				"li[data-resource-browser-item]:not(.rr-resource-hidden) a[href]",
				"li[data-resource-browser-item]:not(.rr-resource-hidden) a[href]",
			),
		toggleAll: () => {
			toggleTreeBranches(visibleGroups(root));
		},
		syncFoldButton,
	});
}

function findTree(root: ParentNode): HTMLElement | null {
	return root.querySelector<HTMLElement>("#resource-browser-tree");
}

function resourceItems(root: ParentNode): HTMLElement[] {
	return Array.from(
		root.querySelectorAll<HTMLElement>("li[data-resource-browser-item]"),
	);
}

function resourceGroups(root: ParentNode): HTMLElement[] {
	return Array.from(
		root.querySelectorAll<HTMLElement>("li[data-resource-browser-group]"),
	);
}

function applyResourceSearch(root: HTMLElement, rawQuery: string): void {
	const query = normalizeTreeSearch(rawQuery);
	restoreSearchOpenedBranches(root, SEARCH_OPENED_ATTR);

	for (const item of resourceItems(root)) {
		const link = item.querySelector<HTMLElement>("a.resource-browser__link");
		restoreTreeLabel(link);
		link?.classList.remove("rr-match", "rr-match-strong", "rr-dim");

		const label = normalizeTreeSearch(
			item.dataset.resourceBrowserLabel ?? item.textContent ?? "",
		);
		const matches = query.length === 0 || label.includes(query);
		item.classList.toggle("rr-resource-hidden", !matches);
		if (!query || !link) continue;

		if (matches) {
			link.classList.add(label.startsWith(query) ? "rr-match-strong" : "rr-match");
			highlightTreeLabel(link, query);
			openSearchAncestors(
				root,
				item,
				SEARCH_OPENED_ATTR,
				() => true,
			);
		} else {
			link.classList.add("rr-dim");
		}
	}

	syncResourceBrowser(root);
}

function syncResourceBrowser(root: HTMLElement): void {
	let visibleTotal = 0;

	for (const group of resourceGroups(root)) {
		const visibleItems = resourceItems(group).filter(
			(item) => !item.classList.contains("rr-resource-hidden"),
		);
		visibleTotal += visibleItems.length;
		group.classList.toggle("rr-resource-hidden", visibleItems.length === 0);
		const count = group.querySelector<HTMLElement>(
			".resource-browser__category-count",
		);
		if (count) count.textContent = String(visibleItems.length);
	}

	const count = document.getElementById("resource-browser-count");
	if (count) count.textContent = String(visibleTotal);
	const empty = root.querySelector<HTMLElement>(".rr-resource-empty");
	if (empty) empty.hidden = visibleTotal !== 0 || resourceItems(root).length === 0;
}

function visibleGroups(root: HTMLElement): HTMLDetailsElement[] {
	return resourceGroups(root)
		.filter((group) => !group.classList.contains("rr-resource-hidden"))
		.map((group) => group.querySelector<HTMLDetailsElement>(":scope > details"))
		.filter((details): details is HTMLDetailsElement => details !== null);
}
