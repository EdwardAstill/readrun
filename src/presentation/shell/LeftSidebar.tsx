import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type { ResourceBrowserEntry } from "../contracts.ts";
import {
	Sidebar,
	SidebarFooter,
	SidebarTrigger,
} from "../components/ui/Sidebar.tsx";
import { PageNavPanel } from "./PageNavPanel.tsx";
import { ResourcePanel } from "./ResourcePanel.tsx";

export interface LeftSidebarProps {
	navigation: Navigation;
	currentUrl?: string;
	resources?: readonly ResourceBrowserEntry[];
	toolbar?: ReactNode;
}

export function MobileSidebarTrigger(): React.JSX.Element {
	return <SidebarTrigger className="md:hidden" />;
}

export function LeftSidebar(props: LeftSidebarProps): React.JSX.Element {
	return (
		<Sidebar
			id="readrun-sidebar"
			className="readrun-sidebar"
			aria-label="Site navigation"
		>
			<PageNavPanel
				navigation={props.navigation}
				currentUrl={props.currentUrl}
				toolbar={props.toolbar}
			/>
			{props.resources && props.resources.length > 0 ? (
				<SidebarFooter>
					<ResourcePanel resources={props.resources} />
				</SidebarFooter>
			) : null}
		</Sidebar>
	);
}
