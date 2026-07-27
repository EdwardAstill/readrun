import type React from "react";

import { Tree, type TreeViewNode } from "../components/reusable/Tree.tsx";
import type { TocItem } from "../contracts.ts";

export interface TocSidebarBodyProps {
	items: readonly TocItem[];
}

interface TocNode {
	item: TocItem;
	children: TocNode[];
}

export function TocSidebarBody(props: TocSidebarBodyProps): React.JSX.Element {
	const tree = buildTocTree(props.items);

	return (
		<Tree
			id="toc-tree"
			className="toc-tree nav-tree"
			nodes={tree.map(toTocTreeNode)}
		/>
	);
}

function buildTocTree(items: readonly TocItem[]): TocNode[] {
	const roots: TocNode[] = [];
	const stack: TocNode[] = [];

	for (const item of items) {
		const node: TocNode = { item, children: [] };
		while (
			stack.length > 0 &&
			stack[stack.length - 1]!.item.level >= item.level
		) {
			stack.pop();
		}

		if (stack.length === 0) {
			roots.push(node);
		} else {
			stack[stack.length - 1]!.children.push(node);
		}

		stack.push(node);
	}

	return roots;
}

function toTocTreeNode(node: TocNode): TreeViewNode {
	return {
		id: node.item.id,
		label: node.item.label,
		href: `#${node.item.id}`,
		linkClassName: "toc-link",
		open: node.children.length > 0 ? true : undefined,
		itemProps: {
			"data-level": node.item.level,
		},
		detailsProps:
			node.children.length > 0
				? {
						"data-toc-heading": node.item.id,
					}
				: undefined,
		children: node.children.map(toTocTreeNode),
	};
}
