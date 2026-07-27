import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type {
	ResourceBrowserEntry,
	ShellPage,
	TocItem,
} from "../contracts.ts";
import {
	SidebarInset,
	SidebarProvider,
} from "../components/ui/Sidebar.tsx";
import { LeftSidebar, MobileSidebarTrigger } from "./LeftSidebar.tsx";
import { RightSidebar } from "./RightSidebar.tsx";

export interface ReadrunShellProps {
	navigation: Navigation;
	page: ShellPage;
	siteTitle?: string;
	searchEnabled?: boolean;
	settingsEnabled?: boolean;
	mainContent: ReactNode;
	tocItems?: readonly TocItem[];
	pageMeta?: ReactNode;
	resources?: readonly ResourceBrowserEntry[];
}

export function ReadrunShell(props: ReadrunShellProps): React.JSX.Element {
	const hasToc = Boolean(props.tocItems && props.tocItems.length > 0);

	return (
		<SidebarProvider
			className="readrun-shell"
			data-readrun-root="true"
		>
			<div
				className="contents"
				data-island="resizable-shell"
			>
				<LeftSidebar
					navigation={props.navigation}
					currentUrl={props.page.url}
					resources={props.resources}
				/>

				<SidebarInset>
					<MobileSidebarTrigger />
					<div className="readrun-content flex min-w-0 flex-1 flex-col p-4">
						<div className="readrun-layout mx-auto w-full max-w-(--readrun-content-width)">
							<section className="readrun-article min-w-0">
								{props.mainContent}
								{props.pageMeta}
							</section>
						</div>
					</div>
				</SidebarInset>

				{hasToc ? (
					<div id="toc-sidebar-slot" data-toc-slot="true">
						<RightSidebar items={props.tocItems ?? []} />
					</div>
				) : null}
			</div>

			<div
				data-island="shell-dialogs"
				data-search-enabled={props.searchEnabled === true}
				data-settings-enabled={props.settingsEnabled === true}
			/>
			{props.searchEnabled ? <div data-island="page-search" /> : null}
		</SidebarProvider>
	);
}
