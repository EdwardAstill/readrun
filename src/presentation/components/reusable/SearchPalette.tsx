import { Autocomplete } from "@base-ui/react/autocomplete";
import type React from "react";
import { useCallback, useRef } from "react";

import { Input } from "../ui/Input.tsx";
import { cn } from "../ui/cn.ts";
import { Modal } from "./Modal.tsx";

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
	const inputRef = useRef<HTMLInputElement>(null);
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
		<Modal
			id={props.id ?? "search-palette"}
			open={props.open}
			onClose={props.onClose}
			ariaLabel={ariaLabel}
			initialFocusRef={inputRef}
		>
			<Autocomplete.Root
				items={items}
				value={props.value}
				onValueChange={(value, eventDetails) => {
					if (eventDetails.reason !== "item-press") props.onChange(value);
				}}
				itemToStringValue={(item) => item.title}
				mode="none"
				open
				inline
				autoHighlight="always"
				keepHighlight
			>
				<div>
					<Autocomplete.Input
						ref={inputRef}
						render={<Input />}
						type="search"
						placeholder={props.placeholder}
						aria-label={ariaLabel}
					/>
				</div>
				{props.loading ? (
					<div className="py-6 text-center text-sm" role="status" aria-live="polite">
						Loading...
					</div>
				) : props.value.trim() ? (
					<Autocomplete.Empty
						className="py-6 text-center text-sm"
						role="status"
						aria-live="polite"
					>
						{props.emptyLabel ?? "No matches"}
					</Autocomplete.Empty>
				) : null}
				<Autocomplete.List className="max-h-80 overflow-y-auto">
					{(item: SearchPaletteItem, index: number) => (
						<Autocomplete.Item
							key={item.id}
							value={item}
							index={index}
							render={<a href={item.href ?? "#"} />}
						className={({ highlighted }) =>
							cn(
								"block rounded-md px-2 py-1.5 text-sm outline-none",
								highlighted && "bg-accent text-accent-foreground",
							)
						}
							onClick={(event) => {
								if (!item.href || props.onSelect) {
									event.preventDefault();
									selectItem(item);
								} else {
									props.onClose();
								}
							}}
						>
						<span className="font-medium">{item.title}</span>
						{item.subtitle ? (
							<span className="block text-muted-foreground">
								{item.subtitle}
							</span>
							) : null}
						</Autocomplete.Item>
					)}
				</Autocomplete.List>
			</Autocomplete.Root>
		</Modal>
	);
}
