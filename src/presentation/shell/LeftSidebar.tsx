import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type { ResourceBrowserEntry } from "../contracts.ts";
import { PageNavPanel } from "./PageNavPanel.tsx";
import { ResourcePanel } from "./ResourcePanel.tsx";

export interface LeftSidebarProps {
	navigation: Navigation;
	currentUrl?: string;
	resources?: readonly ResourceBrowserEntry[];
	toolbar?: ReactNode;
}

export function LeftSidebar(props: LeftSidebarProps): React.JSX.Element {
	return (
		<aside className="readrun-sidebar" id="readrun-sidebar">
			<PageNavPanel
				navigation={props.navigation}
				currentUrl={props.currentUrl}
				toolbar={props.toolbar}
			/>
			{props.resources && props.resources.length > 0 ? (
				<div className="sidebar-footer">
					<ResourcePanel resources={props.resources} />
				</div>
			) : null}
		</aside>
	);
}
