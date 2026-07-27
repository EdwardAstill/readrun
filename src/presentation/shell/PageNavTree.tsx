import type React from "react";

import type { NavigationTreeNode } from "../../domain/navigation/model.ts";
import { SIDEBAR_NAV_SELECTOR } from "../client/navigation.ts";
import { Tree, type TreeViewNode } from "../components/reusable/Tree.tsx";
import { urlsMatch } from "./navigation-url.ts";

export interface PageNavTreeProps {
	tree: readonly NavigationTreeNode[];
	currentUrl?: string;
}

/** Build the nav-path for a branch (e.g. "/getting-started/commands"). */
function buildNavPath(ancestors: readonly string[], label: string): string {
	const segments = [...ancestors, label];
	return (
		"/" + segments.map((s) => s.toLowerCase().replace(/\s+/g, "-")).join("/")
	);
}

/** Check whether any descendant leaf matches the current URL. */
function containsCurrent(
	node: NavigationTreeNode,
	currentUrl?: string,
): boolean {
	if (!currentUrl) return false;
	if (node.kind === "leaf") return urlsMatch(node.page.url, currentUrl);
	return node.children.some((child) => containsCurrent(child, currentUrl));
}

export function PageNavTree(props: PageNavTreeProps): React.JSX.Element {
	return (
		<Tree
			as="nav"
			className={`${SIDEBAR_NAV_SELECTOR.slice(1)} nav-tree`}
			ariaLabel="Page navigation"
			nodes={props.tree.map((node) =>
				toPageNavTreeNode(node, props.currentUrl, []),
			)}
		/>
	);
}

function toPageNavTreeNode(
	node: NavigationTreeNode,
	currentUrl: string | undefined,
	ancestors: readonly string[],
): TreeViewNode {
	if (node.kind === "leaf") {
		return {
			id: node.id,
			label: node.label,
			href: node.page.url,
			ariaCurrent: urlsMatch(node.page.url, currentUrl) ? "page" : undefined,
		};
	}

	const navPath = buildNavPath(ancestors, node.label);
	const isOpen = containsCurrent(node, currentUrl);

	return {
		id: node.id,
		label: node.label,
		href: node.page?.url,
		ariaCurrent:
			node.page && urlsMatch(node.page.url, currentUrl) ? "page" : undefined,
		open: isOpen || undefined,
		detailsProps: {
			"data-nav-path": navPath,
		},
		children: node.children.map((child) =>
			toPageNavTreeNode(child, currentUrl, [...ancestors, node.label]),
		),
	};
}
