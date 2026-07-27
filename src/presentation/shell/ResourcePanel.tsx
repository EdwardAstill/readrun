import type React from "react";

import type { ResourceBrowserEntry } from "../contracts.ts";
import {
	groupResourceBrowserEntries,
	ResourceBrowserTree,
} from "../client/resource-browser/ResourceBrowserTree.tsx";
import { Panel } from "../components/reusable/Panel.tsx";

export interface ResourcePanelProps {
	resources: readonly ResourceBrowserEntry[];
}

export function ResourcePanel(props: ResourcePanelProps): React.JSX.Element {
	const categories = groupResourceBrowserEntries(props.resources);
	const hasResources = props.resources.length > 0;

	return (
		<div className="resource-browser">
			<Panel
				searchId="resource-browser-search"
				searchPlaceholder="Search resource"
				collapseButton={{
					id: "resource-browser-fold-all-btn",
					label: "Collapse all resource groups",
					icon: "-",
					disabled: categories.length === 0,
					controls: "resource-browser-tree",
				}}
			>
				{!hasResources ? (
					<div className="text-xs text-muted-foreground">No resources found</div>
				) : null}
				<ResourceBrowserTree groups={categories} groupsOpen={true} />
				<div
					className="rr-resource-empty text-xs text-muted-foreground"
					hidden
				>
					No resources match
				</div>
			</Panel>
		</div>
	);
}
