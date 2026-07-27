import type React from "react";
import type { ReactNode } from "react";

import { SearchBar } from "./SearchBar.tsx";

export interface PanelCollapseButton {
	id?: string;
	label: string;
	title?: string;
	icon?: ReactNode;
	disabled?: boolean;
	expanded?: boolean;
	controls?: string;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export interface PanelProps {
	searchId: string;
	searchPlaceholder: string;
	searchAriaLabel?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	leadingActions?: ReactNode;
	count?: ReactNode;
	collapseButton?: PanelCollapseButton;
	bodyClassName?: string;
	bodyAriaLabel?: string;
	children: ReactNode;
}

/**
 * Reusable panel: search bar + optional count/collapse button + scrollable body.
 * Compose with a Tree to create searchable tree panels.
 */
export function Panel(props: PanelProps): React.JSX.Element {
	return (
		<>
			<div className="sidebar-panel-header">
				<div className="sidebar-panel-action-row">
					{props.leadingActions}
					<SearchBar
						id={props.searchId}
						className="sidebar-panel-search sidebar-panel-search--unlabeled"
						value={props.searchValue ?? ""}
						onChange={(value) => props.onSearchChange?.(value)}
						placeholder={props.searchPlaceholder}
						ariaLabel={props.searchAriaLabel ?? props.searchPlaceholder}
					/>
					{props.count ? (
						<span className="sidebar-panel-count">{props.count}</span>
					) : null}
					{props.collapseButton ? (
						<button
							id={props.collapseButton.id}
							className="sidebar-panel-icon-button"
							type="button"
							aria-label={props.collapseButton.label}
							title={props.collapseButton.title ?? props.collapseButton.label}
							aria-expanded={props.collapseButton.expanded}
							aria-controls={props.collapseButton.controls}
							disabled={props.collapseButton.disabled}
							onClick={props.collapseButton.onClick}
						>
							{props.collapseButton.icon ?? "-"}
						</button>
					) : null}
				</div>
			</div>
			<div
				className={props.bodyClassName ?? "sidebar-panel-body"}
				aria-label={props.bodyAriaLabel}
			>
				{props.children}
			</div>
		</>
	);
}
