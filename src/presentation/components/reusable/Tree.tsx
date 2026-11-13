import type React from "react";
import { useId, type ReactNode } from "react";
import { ChevronRight, File, Folder } from "lucide-react";

import {
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "../ui/Sidebar.tsx";
import { cn } from "../ui/cn.ts";

type DataAttributeValue = string | number | boolean | undefined;
type DataAttributes = {
	[key: `data-${string}`]: DataAttributeValue;
};

type TreeItemProps = Omit<
	React.LiHTMLAttributes<HTMLLIElement>,
	"children" | "className"
> &
	DataAttributes;
type TreeDetailsProps = Omit<
	React.DetailsHTMLAttributes<HTMLDetailsElement>,
	"children" | "className" | "open"
> &
	DataAttributes;
type TreeSummaryProps = Omit<
	React.HTMLAttributes<HTMLElement>,
	"children" | "className"
> &
	DataAttributes;
type TreeLinkProps = Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	"children" | "className" | "href" | "title" | "aria-current"
> &
	DataAttributes;

export interface TreeViewNode {
	id: string;
	label: ReactNode;
	href?: string;
	title?: string;
	ariaCurrent?: React.AriaAttributes["aria-current"];
	leading?: ReactNode;
	trailing?: ReactNode;
	children?: readonly TreeViewNode[];
	isBranch?: boolean;
	open?: boolean;
	itemClassName?: string;
	detailsClassName?: string;
	summaryClassName?: string;
	linkClassName?: string;
	labelClassName?: string;
	itemProps?: TreeItemProps;
	detailsProps?: TreeDetailsProps;
	summaryProps?: TreeSummaryProps;
	linkProps?: TreeLinkProps;
}

export interface TreeProps {
	id?: string;
	className?: string;
	ariaLabel?: string;
	as?: "div" | "nav";
	nodes: readonly TreeViewNode[];
}

// Non-sortable edcn tree port: https://github.com/EdwardAstill/edcn/tree/main/registry/tree
// Keep native details/links for server rendering, authored folder pages, and search.
export function Tree(props: TreeProps): React.JSX.Element {
	const list = <TreeNodeList nodes={props.nodes} depth={0} ariaLabel={props.ariaLabel ?? "Contents"} />;

	if (props.as === "nav") {
		return (
			<nav
				id={props.id}
				className={props.className}
				data-edcn-tree=""
				aria-label={props.ariaLabel}
			>
				{list}
			</nav>
		);
	}

	return (
		<div id={props.id} className={props.className} aria-label={props.ariaLabel} data-edcn-tree="">
			{list}
		</div>
	);
}

function TreeNodeList(props: {
	nodes: readonly TreeViewNode[];
	depth: number;
	ariaLabel?: string;
	id?: string;
}): React.JSX.Element {
	const List = props.depth === 0 ? SidebarMenu : SidebarMenuSub;
	return (
		<List id={props.id} role={props.depth === 0 ? "tree" : "group"} aria-label={props.ariaLabel}>
			{props.nodes.map((node, index) => (
				<TreeNode key={node.id} node={node} depth={props.depth} index={index} size={props.nodes.length} />
			))}
		</List>
	);
}

function TreeNode(props: {
	node: TreeViewNode;
	depth: number;
	index: number;
	size: number;
}): React.JSX.Element {
	const { node } = props;
	const groupId = useId();
	const children = node.children ?? [];
	const Item = props.depth === 0 ? SidebarMenuItem : SidebarMenuSubItem;
	const rowProps = {
		role: "treeitem",
		className: "data-selected:bg-sidebar-accent",
		"data-tree-item": node.id,
		"aria-level": props.depth + 1,
		"aria-posinset": props.index + 1,
		"aria-setsize": props.size,
		"aria-selected": Boolean(node.ariaCurrent),
		"aria-owns": (children.length > 0 || node.isBranch) && node.open ? groupId : undefined,
		tabIndex: node.ariaCurrent || (props.depth === 0 && props.index === 0) ? 0 : -1,
	};

	if (children.length === 0 && !node.isBranch) {
		const label = (
			<>
				{node.leading ?? <File aria-hidden="true" />}
				<span className={cn("min-w-0 flex-1 truncate", node.labelClassName)} title={node.title}>
					{node.label}
				</span>
				{node.trailing}
			</>
		);

		return (
			<Item {...node.itemProps} className={node.itemClassName} role="none">
				{props.depth === 0 ? (
					<SidebarMenuButton
						render={
							node.href ? (
								<a
									{...node.linkProps}
									{...rowProps}
									href={node.href}
									title={node.title}
									aria-current={node.ariaCurrent}
								/>
							) : (
								<span {...rowProps} />
							)
						}
						isActive={Boolean(node.ariaCurrent)}
						className={node.linkClassName}
					>
						{label}
					</SidebarMenuButton>
				) : (
					<SidebarMenuSubButton
						render={
							<a
								{...node.linkProps}
								{...rowProps}
								href={node.href}
								title={node.title}
								aria-current={node.ariaCurrent}
							/>
						}
						isActive={Boolean(node.ariaCurrent)}
						className={node.linkClassName}
					>
						{label}
					</SidebarMenuSubButton>
				)}
			</Item>
		);
	}

	return (
		<Item {...node.itemProps} className={node.itemClassName} role="none">
			<details
				{...node.detailsProps}
				role="none"
				className={cn("group/collapsible", node.detailsClassName)}
				open={node.open}
			>
				{props.depth === 0 ? (
					<SidebarGroupLabel
						render={<summary {...node.summaryProps} {...rowProps} aria-expanded={Boolean(node.open)} />}
						className={cn(
							"group/label list-none gap-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium [&::-webkit-details-marker]:hidden",
							node.summaryClassName,
						)}
					>
						<ChevronRight aria-hidden="true" className="transition-transform group-open/collapsible:rotate-90" />
						{node.leading ?? <Folder aria-hidden="true" />}
						<TreeNodeLabel node={node} />
						{node.trailing}
					</SidebarGroupLabel>
				) : (
					<SidebarMenuButton
						render={<summary {...node.summaryProps} {...rowProps} aria-expanded={Boolean(node.open)} />}
						isActive={Boolean(node.ariaCurrent)}
						className={cn(
							"list-none [&::-webkit-details-marker]:hidden",
							node.summaryClassName,
						)}
					>
						<ChevronRight aria-hidden="true" className="transition-transform group-open/collapsible:rotate-90" />
						{node.leading ?? <Folder aria-hidden="true" />}
						<TreeNodeLabel node={node} />
						{node.trailing}
					</SidebarMenuButton>
				)}
				<TreeNodeList id={groupId} nodes={children} depth={props.depth + 1} />
			</details>
		</Item>
	);
}

function TreeNodeLabel(props: { node: TreeViewNode }): React.JSX.Element {
	const { node } = props;
	if (node.href) {
		return (
			<a
				{...node.linkProps}
				href={node.href}
				className={cn(
					"min-w-0 flex-1 truncate text-inherit hover:no-underline",
					node.linkClassName,
				)}
				title={node.title}
				aria-current={node.ariaCurrent}
			>
				{node.label}
			</a>
		);
	}

	return (
		<span className={cn("min-w-0 flex-1 truncate", node.labelClassName)} title={node.title}>
			{node.label}
		</span>
	);
}
