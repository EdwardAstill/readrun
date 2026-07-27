import type React from "react";

import { Tree, type TreeViewNode } from "../../components/reusable/Tree.tsx";
import type { ResourceBrowserEntry } from "../../contracts.ts";

export interface ResourceBrowserGroup {
	kind: string;
	label: string;
	entries: readonly ResourceBrowserEntry[];
}

export interface ResourceBrowserTreeProps {
	groups: readonly ResourceBrowserGroup[];
	groupsOpen: boolean;
}

const CATEGORY_ORDER = ["image", "media", "data", "script", "file", "other"];

const CATEGORY_LABELS: Record<string, string> = {
	image: "Images",
	media: "Media",
	data: "Data",
	script: "Scripts",
	file: "Files",
	other: "Other",
};

export function ResourceBrowserTree(
	props: ResourceBrowserTreeProps,
): React.JSX.Element {
	return (
		<Tree
			id="resource-browser-tree"
			className="resource-browser__tree nav-tree"
			nodes={props.groups.map((group) =>
				toResourceBrowserTreeNode(group, props.groupsOpen),
			)}
		/>
	);
}

export function groupResourceBrowserEntries(
	entries: readonly ResourceBrowserEntry[],
): ResourceBrowserGroup[] {
	const grouped = new Map<string, ResourceBrowserEntry[]>();
	for (const entry of entries) {
		const kind = normaliseKind(entry.kind);
		if (!grouped.has(kind)) grouped.set(kind, []);
		grouped.get(kind)!.push(entry);
	}

	return [...grouped.entries()]
		.sort(([left], [right]) => {
			const leftOrder = CATEGORY_ORDER.indexOf(left);
			const rightOrder = CATEGORY_ORDER.indexOf(right);
			return sortOrder(leftOrder) - sortOrder(rightOrder);
		})
		.map(([kind, groupEntries]) => ({
			kind,
			label: CATEGORY_LABELS[kind] ?? kind,
			entries: groupEntries,
		}));
}

function toResourceBrowserTreeNode(
	group: ResourceBrowserGroup,
	groupsOpen: boolean,
): TreeViewNode {
	return {
		id: group.kind,
		label: group.label,
		open: groupsOpen,
		detailsClassName: "resource-browser__category",
		summaryClassName: "resource-browser__category-header",
		leading: (
			<span className="resource-browser__category-icon">
				{categoryIcon(group.kind)}
			</span>
		),
		trailing: (
			<span className="resource-browser__category-count">
				{group.entries.length}
			</span>
		),
		itemProps: {
			"data-resource-browser-group": group.kind,
		},
		children: group.entries.map(toResourceBrowserResourceNode),
	};
}

function toResourceBrowserResourceNode(
	resource: ResourceBrowserEntry,
): TreeViewNode {
	return {
		id: resource.id,
		label: resource.label,
		href: resource.href,
		title: resource.label,
		itemClassName: "resource-browser__item",
		itemProps: {
			"data-resource-browser-item": "true",
			"data-resource-browser-label": `${resource.label} ${resource.href}`,
		},
		linkClassName: "resource-browser__link",
		linkProps: {
			"data-resource-file": "",
		},
		leading:
			resource.kind === "image" && resource.href ? (
				<img
					className="resource-browser__thumbnail"
					src={resource.href}
					alt={resource.label}
					loading="lazy"
				/>
			) : (
				<span className="resource-browser__file-icon">
					{fileIcon(resource.label)}
				</span>
			),
	};
}

function sortOrder(index: number): number {
	return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function normaliseKind(kind: string | undefined): string {
	if (
		kind === "image" ||
		kind === "media" ||
		kind === "data" ||
		kind === "script" ||
		kind === "file"
	) {
		return kind;
	}
	return "other";
}

function categoryIcon(kind: string): string {
	switch (kind) {
		case "image":
			return "🖼";
		case "media":
			return "🎬";
		case "data":
			return "📊";
		case "script":
			return "📜";
		case "file":
			return "📄";
		default:
			return "📁";
	}
}

function fileIcon(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "";
	switch (ext) {
		case "py":
			return "🐍";
		case "ts":
		case "tsx":
			return "🔷";
		case "js":
		case "jsx":
		case "mjs":
			return "🟨";
		case "json":
			return "📋";
		case "csv":
		case "tsv":
			return "📊";
		case "yaml":
		case "yml":
			return "⚙️";
		case "md":
			return "📝";
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "webp":
		case "svg":
			return "🖼";
		case "mp4":
		case "webm":
		case "mov":
			return "🎥";
		case "mp3":
		case "wav":
		case "ogg":
			return "🎵";
		case "pdf":
			return "📕";
		case "zip":
		case "tar":
		case "gz":
			return "📦";
		case "sh":
			return "💻";
		default:
			return "📄";
	}
}
