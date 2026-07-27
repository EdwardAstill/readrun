import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import { Panel } from "../components/reusable/Panel.tsx";
import { PageNavTree } from "./PageNavTree.tsx";
import { WikiNav } from "./WikiNav.tsx";

export interface PageNavPanelProps {
	navigation: Navigation;
	currentUrl?: string;
	toolbar?: ReactNode;
}

export function PageNavPanel(props: PageNavPanelProps): React.JSX.Element {
	const navigationLabel =
		props.navigation.mode === "tree" ? "Page navigation" : "Wiki navigation";

	return (
		<Panel
			searchId="page-nav-search"
			searchPlaceholder="Search page"
			leadingActions={props.toolbar}
			collapseButton={{
				id: "page-nav-fold-all-btn",
				label: "Collapse all folders",
				icon: "-",
			}}
			bodyAriaLabel={navigationLabel}
		>
			<div
				id="rr-focus-crumbs"
				className="rr-focus-crumbs flex flex-wrap items-center gap-1 border-b p-2 text-sm empty:hidden"
				aria-label="Focused navigation folder"
			/>
			{props.navigation.mode === "tree" ? (
				<PageNavTree
					tree={props.navigation.tree}
					currentUrl={props.currentUrl}
				/>
			) : (
				<WikiNav
					sections={props.navigation.sections}
					currentUrl={props.currentUrl}
				/>
			)}
		</Panel>
	);
}
