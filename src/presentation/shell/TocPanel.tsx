import type React from "react";

import { Panel } from "../components/reusable/Panel.tsx";
import { TocSidebarBody } from "./TocSidebarBody.tsx";
import type { TocItem } from "../contracts.ts";

export interface TocPanelProps {
	items: readonly TocItem[];
}

export function TocPanel(props: TocPanelProps): React.JSX.Element {
	return (
		<Panel
			searchId="toc-search"
			searchPlaceholder="Search heading"
			collapseButton={{
				id: "toc-fold-all-btn",
				label: "Collapse all headings",
				icon: "-",
				controls: "toc-tree",
			}}
		>
			<TocSidebarBody items={props.items} />
		</Panel>
	);
}
