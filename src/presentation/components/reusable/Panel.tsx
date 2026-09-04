import type React from "react";
import type { ReactNode } from "react";

import { InputGroupButton } from "../ui/InputGroup.tsx";
import { SidebarGroup } from "../ui/Sidebar.tsx";
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
	className?: string;
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
 * Reusable sidebar group: search bar + optional count/collapse button + body.
 * Compose inside SidebarContent with a Tree to create searchable panels.
 */
export function Panel(props: PanelProps): React.JSX.Element {
	return (
		<SidebarGroup className={props.className}>
			<div className="flex flex-col gap-2 pb-2">
				<div className="flex min-w-0 items-center gap-2">
					{props.leadingActions}
					<SearchBar
						id={props.searchId}
						className="min-w-0 flex-1"
						grouped
						groupAriaLabel={`${props.searchAriaLabel ?? props.searchPlaceholder} controls`}
						value={props.searchValue ?? ""}
						onChange={(value) => props.onSearchChange?.(value)}
						placeholder={props.searchPlaceholder}
						ariaLabel={props.searchAriaLabel ?? props.searchPlaceholder}
						trailingActions={
							props.collapseButton ? (
								<InputGroupButton
									id={props.collapseButton.id}
									size="icon-xs"
									aria-label={props.collapseButton.label}
									title={
										props.collapseButton.title ?? props.collapseButton.label
									}
									aria-expanded={props.collapseButton.expanded}
									aria-controls={props.collapseButton.controls}
									disabled={props.collapseButton.disabled}
									onClick={props.collapseButton.onClick}
								>
									{props.collapseButton.icon ?? "-"}
								</InputGroupButton>
							) : null
						}
					/>
					{props.count ? (
						<span className="text-xs text-muted-foreground">{props.count}</span>
					) : null}
				</div>
			</div>
			<PanelBody ariaLabel={props.bodyAriaLabel}>{props.children}</PanelBody>
		</SidebarGroup>
	);
}
