import type React from "react";

import type { TocItem } from "../contracts.ts";
import {
	Sidebar,
	SidebarContent,
} from "../components/ui/Sidebar.tsx";
import { TocPanel } from "./TocPanel.tsx";

export interface RightSidebarProps {
	items: readonly TocItem[];
}

export function RightSidebar(
	props: RightSidebarProps,
): React.JSX.Element | null {
	if (props.items.length === 0) {
		return null;
	}

	return (
		<Sidebar
			id="toc-sidebar"
			side="right"
			collapsible="none"
			className="w-full"
			role="navigation"
			aria-label="Table of contents"
		>
			<SidebarContent className="gap-0">
				<TocPanel items={props.items} />
			</SidebarContent>
		</Sidebar>
	);
}
