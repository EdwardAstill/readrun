import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type {
	ResourceBrowserEntry,
	ShellPage,
	TocItem,
} from "../contracts.ts";
import { SidebarProvider } from "../components/ui/Sidebar.tsx";
import { Button } from "../components/ui/Button.tsx";
import { PageNavPanel } from "./PageNavPanel.tsx";
import { TocPanel } from "./TocPanel.tsx";
import { ResourcePanel } from "./ResourcePanel.tsx";
import { X } from "lucide-react";

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
	return (
		<SidebarProvider className="h-svh min-h-0 overflow-hidden readrun-shell flex flex-col" data-readrun-root="true">
			<div className="readrun-content flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4">
				<div className="readrun-layout mx-auto w-full max-w-(--readrun-content-width)">
					<section className="readrun-article min-w-0">
						{props.mainContent}
						{props.pageMeta}
					</section>
				</div>
			</div>
			<NavigationDialog id="files-overlay" title="Files">
				<PageNavPanel navigation={props.navigation} currentUrl={props.page.url} />
			</NavigationDialog>
			<NavigationDialog id="outline-overlay" title="Outline">
				<div id="toc-sidebar-slot">
					{props.tocItems?.length ? <TocPanel items={props.tocItems} /> : <p className="p-4 text-sm text-muted-foreground">No headings on this page</p>}
				</div>
			</NavigationDialog>
			<NavigationDialog id="resources-overlay" title="Resources">
				<ResourcePanel resources={props.resources ?? []} />
			</NavigationDialog>
			<div
				data-island="shell-dialogs"
				data-search-enabled={props.searchEnabled === true}
				data-settings-enabled={props.settingsEnabled === true}
			/>
			{props.searchEnabled ? <div data-island="page-search" /> : null}
		</SidebarProvider>
	);
}

function NavigationDialog(props: { id: string; title: string; children: ReactNode }): React.JSX.Element {
	return (
		<dialog id={props.id} data-navigation-dialog aria-labelledby={`${props.id}-title`}
			className="fixed inset-0 m-auto max-h-[80svh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/50">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<h2 id={`${props.id}-title`} className="text-lg font-semibold">{props.title}</h2>
				<Button variant="ghost" size="icon-sm" data-close-navigation-dialog aria-label={`Close ${props.title}`}><X aria-hidden="true" /></Button>
			</div>
			{props.children}
		</dialog>
	);
}
