import {
	applyLabelTreeSearch,
	bindFilterableTreeChrome,
	firstVisibleTreeLink,
	syncTreeFoldButton,
	toggleTreeBranches,
	visibleTreeBranches,
} from "./filterable-tree.ts";

const OPEN_STORAGE_KEY = "readrun:nav-open";
const SEARCH_OPENED_ATTR = "data-rr-page-nav-search-opened";

export function initPageNavTreeChrome(): () => void {
	if (typeof document === "undefined") return () => {};

	const searchInput = document.getElementById(
		"page-nav-search",
	) as HTMLInputElement | null;
	const foldButton = document.getElementById("page-nav-fold-all-btn");
	const tree = findPageNavTree();
	const syncFoldButton = (): void => {
		syncTreeFoldButton(foldButton, visibleFolders(), {
			empty: "No folders to expand",
			expand: "Expand all folders",
			collapse: "Collapse all folders",
		});
	};
	const teardownChrome = bindFilterableTreeChrome({
		searchInput,
		foldButton,
		toggleTarget: tree,
		applySearch: applyPageNavSearch,
		firstVisibleLink: firstVisiblePageNavLink,
		toggleAll: () => {
			const nav = findPageNavTree();
			if (!nav) return;
			toggleTreeBranches(visibleFolders(nav));
			writeOpenPaths(nav);
		},
		syncFoldButton,
	});

	document.addEventListener("readrun:nav-focus-change", syncFoldButton);
	return () => {
		document.removeEventListener("readrun:nav-focus-change", syncFoldButton);
		teardownChrome();
	};
}

function findPageNavTree(): HTMLElement | null {
	return document.querySelector<HTMLElement>(".sidebar-nav.nav-tree");
}

function findPageNav(): HTMLElement | null {
	return document.querySelector<HTMLElement>(".sidebar-nav");
}

function applyPageNavSearch(rawQuery: string): void {
	const nav = findPageNav();
	if (!nav) return;
	applyLabelTreeSearch({
		root: nav,
		rawQuery,
		labelSelector:
			"li > a[href], li > details > summary > a[href], li > details > summary > span",
		itemResetClasses: ["rr-page-nav-hidden", "rr-page-nav-match"],
		itemMatchClass: "rr-page-nav-match",
		searchOpenedAttribute: SEARCH_OPENED_ATTR,
		isBranch: (details) => details.hasAttribute("data-nav-path"),
	});
}

function firstVisiblePageNavLink(): HTMLAnchorElement | null {
	return firstVisibleTreeLink(
		findPageNav(),
		"li.rr-page-nav-match a[href]",
		"li:not(.rr-page-nav-hidden) a[href]",
	);
}

function visibleFolders(
	nav: HTMLElement | null = findPageNavTree(),
): HTMLDetailsElement[] {
	return nav
		? visibleTreeBranches(
				nav,
				"li:not(.rr-hidden):not(.rr-focus-self) > details[data-nav-path]",
			)
		: [];
}

function writeOpenPaths(nav: HTMLElement): void {
	try {
		const openPaths = Array.from(
			nav.querySelectorAll<HTMLDetailsElement>("details[data-nav-path]"),
		)
			.filter((details) => details.open)
			.map((details) => details.dataset.navPath)
			.filter(
				(path): path is string => typeof path === "string" && path.length > 0,
			);
		localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openPaths));
	} catch {
		// Ignore unavailable storage.
	}
}
