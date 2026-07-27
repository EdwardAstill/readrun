import type React from "react";

import type { WikiNavigationSection } from "../../domain/navigation/model.ts";
import { Tree, type TreeViewNode } from "../components/reusable/Tree.tsx";
import { SIDEBAR_NAV_SELECTOR } from "../client/navigation.ts";
import { urlsMatch } from "./navigation-url.ts";

export interface WikiNavProps {
	sections: readonly WikiNavigationSection[];
	currentUrl?: string;
}

/** Extract all page items from wiki sections into a flat sorted list of TreeViewNodes. */
function sectionsToFlatNodes(
	sections: readonly WikiNavigationSection[],
	currentUrl: string | undefined,
): TreeViewNode[] {
	const seen = new Set<string>();
	const nodes: TreeViewNode[] = [];

	for (const section of sections) {
		for (const item of section.items) {
			if (item.kind !== "page") continue;
			if (seen.has(item.page.url)) continue;
			seen.add(item.page.url);

			nodes.push({
				id: item.id,
				label: item.label,
				href: item.page.url,
				ariaCurrent: urlsMatch(item.page.url, currentUrl) ? "page" : undefined,
			});
		}
	}

	nodes.sort((a, b) =>
		String(a.label).localeCompare(String(b.label), undefined, {
			sensitivity: "base",
		}),
	);

	return nodes;
}

export function WikiNav(props: WikiNavProps): React.JSX.Element {
	const nodes = sectionsToFlatNodes(props.sections, props.currentUrl);

	return (
		<Tree
			as="nav"
			className={`${SIDEBAR_NAV_SELECTOR.slice(1)} nav-tree`}
			ariaLabel="Wiki navigation"
			nodes={nodes}
		/>
	);
}
