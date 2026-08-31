import type React from "react";
import { useCallback } from "react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/Command.tsx";

export interface SearchPaletteItem {
	id: string;
	title: string;
	subtitle?: string;
	href?: string;
}

export interface SearchPaletteProps {
	id?: string;
	open: boolean;
	value: string;
	onChange: (value: string) => void;
	onClose: () => void;
	items: readonly SearchPaletteItem[];
	onSelect?: (item: SearchPaletteItem) => void;
	placeholder?: string;
	ariaLabel?: string;
	loading?: boolean;
	emptyLabel?: string;
}

export function SearchPalette(props: SearchPaletteProps): React.JSX.Element {
	const items = props.loading ? [] : props.items;
	const ariaLabel = props.ariaLabel ?? props.placeholder ?? "Search";

	const selectItem = useCallback(
		(item: SearchPaletteItem) => {
			props.onClose();
			if (props.onSelect) {
				props.onSelect(item);
				return;
			}
			if (item.href) window.location.href = item.href;
		},
		[props.onClose, props.onSelect],
	);

	return (
		<CommandDialog
			contentId={props.id}
			open={props.open}
			onOpenChange={(open) => {
				if (!open) props.onClose();
			}}
			title={ariaLabel}
			description={props.placeholder ?? "Search for an item to open."}
			commandProps={{ shouldFilter: false }}
		>
			<CommandInput
				value={props.value}
				onValueChange={props.onChange}
				placeholder={props.placeholder}
				aria-label={ariaLabel}
				autoFocus
			/>
			<CommandList>
				{props.loading ? (
					<CommandEmpty role="status" aria-live="polite">
						Loading...
					</CommandEmpty>
				) : props.value.trim() ? (
					<CommandEmpty role="status" aria-live="polite">
						{props.emptyLabel ?? "No matches"}
					</CommandEmpty>
				) : null}
				<CommandGroup>
					{items.map((item) => (
						<CommandItem
							key={item.id}
							value={item.id}
							onSelect={() => selectItem(item)}
						>
							<span className="min-w-0">
								<span className="block font-medium">{item.title}</span>
								{item.subtitle ? (
									<span className="block truncate text-muted-foreground">
										{item.subtitle}
									</span>
								) : null}
							</span>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
