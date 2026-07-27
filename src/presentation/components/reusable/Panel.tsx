import type React from "react";
import type { ReactNode } from "react";

import { Button } from "../ui/Button.tsx";
import { SidebarHeader } from "../ui/Sidebar.tsx";
import { PanelBody } from "./PanelBody.tsx";
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
			<SidebarHeader>
				<div className="flex min-w-0 items-center gap-2">
					{props.leadingActions}
					<SearchBar
						id={props.searchId}
						className="min-w-0 flex-1"
						value={props.searchValue ?? ""}
						onChange={(value) => props.onSearchChange?.(value)}
						placeholder={props.searchPlaceholder}
						ariaLabel={props.searchAriaLabel ?? props.searchPlaceholder}
					/>
					{props.count ? (
						<span className="text-xs text-muted-foreground">{props.count}</span>
					) : null}
					{props.collapseButton ? (
						<Button
							id={props.collapseButton.id}
							variant="ghost"
							size="icon-sm"
							aria-label={props.collapseButton.label}
							title={props.collapseButton.title ?? props.collapseButton.label}
							aria-expanded={props.collapseButton.expanded}
							aria-controls={props.collapseButton.controls}
							disabled={props.collapseButton.disabled}
							onClick={props.collapseButton.onClick}
						>
							{props.collapseButton.icon ?? "-"}
						</Button>
					) : null}
				</div>
			</SidebarHeader>
			<PanelBody ariaLabel={props.bodyAriaLabel}>{props.children}</PanelBody>
		</>
	);
}
