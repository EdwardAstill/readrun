import type React from "react";
import type { ReactNode } from "react";

import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
} from "../ui/Sidebar.tsx";

export interface PanelBodyProps {
	ariaLabel?: string;
	children: ReactNode;
}

/** Shared scrollable body for sidebar navigation panels. */
export function PanelBody(props: PanelBodyProps): React.JSX.Element {
	return (
		<SidebarContent className="gap-0">
			<SidebarGroup>
				<SidebarGroupContent aria-label={props.ariaLabel}>
					{props.children}
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
