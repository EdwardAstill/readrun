// TOC scroll spy — highlights the active section link as the user scrolls.

import {
	applyLabelTreeSearch,
	bindFilterableTreeChrome,
	firstVisibleTreeLink,
	syncTreeFoldButton,
	toggleTreeBranches,
	visibleTreeBranches,
} from "./filterable-tree.ts";

const SEARCH_OPENED_ATTR = "data-rr-toc-search-opened";

export function initTocSidebar(): () => void {
	const teardownScrollSpy = initTocScrollSpy();
	const teardownChrome = initTocSidebarChrome();

	return () => {
		teardownScrollSpy();
		teardownChrome();
	};
}

export function initTocScrollSpy(): () => void {
	if (typeof document === "undefined") {
		return () => {};
	}

	let observer: IntersectionObserver | null = null;

	const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".toc-link");
	if (tocLinks.length === 0) return () => {};

	const headingIds = new Map<string, HTMLAnchorElement>();
	for (const link of tocLinks) {
		const href = link.getAttribute("href");
		if (!href?.startsWith("#")) continue;
		const id = decodeURIComponent(href.slice(1));
		headingIds.set(id, link);
	}

	observer = new IntersectionObserver(
			(entries) => {
				// Collect heading elements currently intersecting
				const visible: Array<{ id: string; top: number }> = [];
				for (const entry of entries) {
					if (entry.isIntersecting && entry.target.id) {
						visible.push({
							id: entry.target.id,
							top: entry.boundingClientRect.top,
						});
					}
				}

				// Clear all active classes first
				for (const link of tocLinks) {
					link.classList.remove("toc-link--active");
				}

				if (visible.length === 0) return;

				// Pick the topmost visible heading
				visible.sort((a, b) => a.top - b.top);
				const topId = visible[0]!.id;
				const activeLink = headingIds.get(topId);
				if (activeLink) {
					activeLink.classList.add("toc-link--active");
				}
			},
			{
				rootMargin: "-80px 0px -60% 0px",
				threshold: 0,
			},
	);

	// Observe all heading elements referenced by TOC links
	for (const id of headingIds.keys()) {
		const heading = document.getElementById(id);
		if (heading) {
			observer.observe(heading);
		}
	}

	return () => {
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	};
}

function initTocSidebarChrome(): () => void {
	if (typeof document === "undefined") return () => {};

	const searchInput = document.getElementById(
		"toc-search",
	) as HTMLInputElement | null;
	const foldButton = document.getElementById("toc-fold-all-btn");
	const tree = findTocTree();
	const syncFoldButton = (): void => {
		syncTreeFoldButton(foldButton, visibleTocBranches(), {
			empty: "No headings to expand",
			expand: "Expand all headings",
			collapse: "Collapse all headings",
		});
	};

	return bindFilterableTreeChrome({
		searchInput,
		foldButton,
		toggleTarget: tree,
		applySearch: applyTocSearch,
		firstVisibleLink: firstVisibleTocLink,
		toggleAll: () => {
			toggleTreeBranches(visibleTocBranches());
		},
		syncFoldButton,
	});
}

function findTocTree(): HTMLElement | null {
	return document.getElementById("toc-tree");
}

function applyTocSearch(rawQuery: string): void {
	const tree = findTocTree();
	if (!tree) return;
	applyLabelTreeSearch({
		root: tree,
		rawQuery,
		labelSelector: "li > a.toc-link, li > details > summary > a.toc-link",
		itemResetClasses: ["rr-toc-hidden", "rr-toc-match"],
		itemMatchClass: "rr-toc-match",
		searchOpenedAttribute: SEARCH_OPENED_ATTR,
		isBranch: (details) => details.hasAttribute("data-toc-heading"),
	});
}

function firstVisibleTocLink(): HTMLAnchorElement | null {
	return firstVisibleTreeLink(
		findTocTree(),
		"li.rr-toc-match a.toc-link",
		"li:not(.rr-toc-hidden) a.toc-link",
	);
}

function visibleTocBranches(): HTMLDetailsElement[] {
	const tree = findTocTree();
	return tree
		? visibleTreeBranches(
				tree,
				"li:not(.rr-toc-hidden) > details[data-toc-heading]",
			)
		: [];
}
