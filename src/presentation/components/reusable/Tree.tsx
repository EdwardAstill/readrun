import type React from "react";
import type { ReactNode } from "react";

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
	const list = <TreeNodeList nodes={props.nodes} />;

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
}): React.JSX.Element {
	return (
		<ul>
			{props.nodes.map((node) => (
				<TreeNode key={node.id} node={node} />
			))}
		</ul>
	);
}

function TreeNode(props: { node: TreeViewNode }): React.JSX.Element {
	const { node } = props;
	const children = node.children ?? [];

	if (children.length === 0) {
		return (
			<li {...node.itemProps} className={node.itemClassName}>
				{node.leading}
				<TreeNodeLabel node={node} />
				{node.trailing}
			</li>
		);
	}

	return (
		<li {...node.itemProps} className={node.itemClassName}>
			<details
				{...node.detailsProps}
				className={node.detailsClassName}
				open={node.open}
			>
				<summary {...node.summaryProps} className={node.summaryClassName}>
					{node.leading}
					<TreeNodeLabel node={node} />
					{node.trailing}
				</summary>
				<TreeNodeList nodes={children} />
			</details>
		</li>
	);
}

function TreeNodeLabel(props: { node: TreeViewNode }): React.JSX.Element {
	const { node } = props;
	if (node.href) {
		return (
			<a
				{...node.linkProps}
				href={node.href}
				className={node.linkClassName}
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
