import type React from "react";
import type { ReactNode } from "react";

import { SidebarGroupContent } from "../ui/Sidebar.tsx";

export interface PanelBodyProps {
	ariaLabel?: string;
	children: ReactNode;
}

/** Shared group content for sidebar navigation panels. */
export function PanelBody(props: PanelBodyProps): React.JSX.Element {
	return (
		<SidebarGroupContent aria-label={props.ariaLabel}>
			{props.children}
		</SidebarGroupContent>
	);
}
