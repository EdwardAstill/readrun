import type React from "react";
import type { ReactNode } from "react";

import type { Navigation } from "../../domain/navigation/model.ts";
import type {
	ResourceBrowserEntry,
	ShellPage,
	TocItem,
} from "../contracts.ts";
import { LeftSidebar } from "./LeftSidebar.tsx";
import { RightSidebar } from "./RightSidebar.tsx";
import { ShellIcon } from "./ShellIcon.tsx";

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
		<div
			className={`readrun-shell${hasToc ? " readrun-shell--with-toc" : ""}`}
			data-readrun-root="true"
		>
			{/* Mobile topbar — hidden on desktop, shown via CSS at ≤768px */}
			<header className="mobile-topbar">
				<button
					className="mobile-topbar__btn"
					id="mobile-menu-btn"
					aria-label="Menu"
					aria-controls="readrun-sidebar"
					aria-expanded="false"
				>
					<ShellIcon name="menu" />
				</button>
				<span className="mobile-topbar__title">
					{props.siteTitle ?? props.page.title}
				</span>
				{props.searchEnabled ? (
					<button
						type="button"
						className="mobile-topbar__btn"
						id="mobile-search-btn"
						data-open-overlay="page-search-overlay"
						aria-label="Search this page"
					>
						<ShellIcon name="search" />
					</button>
				) : null}
				{props.settingsEnabled ? (
					<button
						type="button"
						className="mobile-topbar__btn"
						id="mobile-settings-btn"
						data-open-overlay="settings-overlay"
						aria-label="Open settings"
					>
						<ShellIcon name="settings" />
					</button>
				) : null}
			</header>

			<LeftSidebar
				navigation={props.navigation}
				currentUrl={props.page.url}
				resources={props.resources}
			/>

			{/* Scrim backdrop for mobile drawer */}
			<div className="drawer-scrim" id="drawer-scrim" />

			{/* Resize handle between sidebar and content */}
			<div
				className="resize-handle"
				id="resize-sidebar"
				data-resize-target="sidebar"
			/>

			<div className="readrun-content">
				<div className="readrun-layout">
					<section className="readrun-article">
						{props.mainContent}
						{props.pageMeta}
					</section>
				</div>
			</div>

			{hasToc ? (
				<div
					className="toc-sidebar-slot"
					id="toc-sidebar-slot"
					data-toc-slot="true"
				>
					<div
						className="resize-handle resize-handle--toc"
						id="resize-toc"
						data-resize-target="toc"
					/>
					<RightSidebar items={props.tocItems ?? []} />
				</div>
			) : null}

			<div
				data-island="shell-dialogs"
				data-search-enabled={props.searchEnabled === true}
				data-settings-enabled={props.settingsEnabled === true}
			/>
			{props.searchEnabled ? <div data-island="page-search" /> : null}
		</div>
	);
}
