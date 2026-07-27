import type React from "react";
import type { ReactNode } from "react";

export interface PanelBodyProps {
	ariaLabel?: string;
	children: ReactNode;
}

/** Shared scrollable body for sidebar navigation panels. */
export function PanelBody(props: PanelBodyProps): React.JSX.Element {
	return (
		<div className="sidebar-panel-body" aria-label={props.ariaLabel}>
			{props.children}
		</div>
	);
}
