import type React from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

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

export function Tree(props: TreeProps): React.JSX.Element {
	const list = <TreeNodeList nodes={props.nodes} depth={0} />;

	if (props.as === "nav") {
		return (
			<nav
				id={props.id}
				className={props.className}
				aria-label={props.ariaLabel}
			>
				{list}
			</nav>
		);
	}

	return (
		<div id={props.id} className={props.className} aria-label={props.ariaLabel}>
			{list}
		</div>
	);
}

function TreeNodeList(props: {
	nodes: readonly TreeViewNode[];
	depth: number;
}): React.JSX.Element {
	const List = props.depth === 0 ? SidebarMenu : SidebarMenuSub;
	return (
		<List>
			{props.nodes.map((node) => (
				<TreeNode key={node.id} node={node} depth={props.depth} />
			))}
		</List>
	);
}

function TreeNode(props: {
	node: TreeViewNode;
	depth: number;
}): React.JSX.Element {
	const { node } = props;
	const children = node.children ?? [];
	const Item = props.depth === 0 ? SidebarMenuItem : SidebarMenuSubItem;

	if (children.length === 0) {
		const label = (
			<>
				{node.leading}
				<span className={node.labelClassName} title={node.title}>
					{node.label}
				</span>
				{node.trailing}
			</>
		);

		return (
			<Item {...node.itemProps} className={node.itemClassName}>
				{props.depth === 0 ? (
					<SidebarMenuButton
						render={
							node.href ? (
								<a
									{...node.linkProps}
									href={node.href}
									title={node.title}
									aria-current={node.ariaCurrent}
								/>
							) : (
								<span />
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
		<Item {...node.itemProps} className={node.itemClassName}>
			<details
				{...node.detailsProps}
				className={cn("group/collapsible", node.detailsClassName)}
				open={node.open}
			>
				{props.depth === 0 ? (
					<SidebarGroupLabel
						render={<summary {...node.summaryProps} />}
						className={cn(
							"group/label list-none gap-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&::-webkit-details-marker]:hidden",
							node.summaryClassName,
						)}
					>
						{node.leading}
						<TreeNodeLabel node={node} />
						{node.trailing}
						<ChevronRight className="ml-auto transition-transform group-open/collapsible:rotate-90" />
					</SidebarGroupLabel>
				) : (
					<SidebarMenuButton
						render={<summary {...node.summaryProps} />}
						isActive={Boolean(node.ariaCurrent)}
						className={cn(
							"list-none [&::-webkit-details-marker]:hidden",
							node.summaryClassName,
						)}
					>
						{node.leading}
						<TreeNodeLabel node={node} />
						{node.trailing}
						<ChevronRight className="ml-auto transition-transform group-open/collapsible:rotate-90" />
					</SidebarMenuButton>
				)}
				<TreeNodeList nodes={children} depth={props.depth + 1} />
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
		<span className={node.labelClassName} title={node.title}>
			{node.label}
		</span>
	);
}
