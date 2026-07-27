import type React from "react";

import type { TocItem } from "../contracts.ts";
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
		<nav
			id="toc-sidebar"
			className="toc-sidebar"
			aria-label="Table of contents"
		>
			<TocPanel items={props.items} />
		</nav>
	);
}
