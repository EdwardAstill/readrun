import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type { ResourceBrowserEntry } from "../contracts.ts";
import {
	Sidebar,
	SidebarContent,
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

export function MobileSidebarHeader(): React.JSX.Element {
	return (
		<header className="flex h-12 shrink-0 items-center border-b px-4 md:hidden">
			<MobileSidebarTrigger />
		</header>
	);
}

export function LeftSidebar(props: LeftSidebarProps): React.JSX.Element {
	return (
		<Sidebar
			id="readrun-sidebar"
			className="readrun-sidebar"
			aria-label="Site navigation"
		>
			<SidebarContent className="gap-0">
				<PageNavPanel
					navigation={props.navigation}
					currentUrl={props.currentUrl}
					toolbar={props.toolbar}
				/>
				{props.resources && props.resources.length > 0 ? (
					<ResourcePanel resources={props.resources} />
				) : null}
			</SidebarContent>
		</Sidebar>
	);
}
