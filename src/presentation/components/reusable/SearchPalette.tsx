import { Autocomplete } from "@base-ui/react/autocomplete";
import type React from "react";
import { useCallback, useRef } from "react";

import { Modal } from "./Modal.tsx";

export interface SearchPaletteItem {
	id: string;
	title: string;
	subtitle?: string;
	href?: string;
}

export interface SearchPaletteClasses {
	root?: string;
	open?: string;
	scrim?: string;
	card?: string;
	bar?: string;
	input?: string;
	close?: string;
	results?: string;
	result?: string;
	activeResult?: string;
	title?: string;
	subtitle?: string;
	empty?: string;
	loading?: string;
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
	classes?: SearchPaletteClasses;
}

const defaultClasses: Required<SearchPaletteClasses> = {
	root: "search-palette",
	open: "search-palette--open",
	scrim: "search-palette__scrim",
	card: "search-palette__card",
	bar: "search-palette__bar",
	input: "search-palette__input",
	close: "search-palette__close",
	results: "search-palette__results",
	result: "search-palette__result",
	activeResult: "search-palette__result--active",
	title: "search-palette__title",
	subtitle: "search-palette__subtitle",
	empty: "search-palette__empty",
	loading: "search-palette__loading",
};

export function SearchPalette(props: SearchPaletteProps): React.JSX.Element {
	const classes = { ...defaultClasses, ...props.classes };
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
			className={classes.root}
			openClassName={classes.open}
			contentClassName={classes.card}
			scrimClassName={classes.scrim}
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
				<div className={classes.bar}>
					<Autocomplete.Input
						ref={inputRef}
						className={classes.input}
						type="search"
						placeholder={props.placeholder}
						aria-label={ariaLabel}
					/>
					<button
						type="button"
						className={classes.close}
						onClick={props.onClose}
						aria-label="Close search"
					>
						×
					</button>
				</div>
				{props.loading ? (
					<div className={classes.loading} role="status" aria-live="polite">
						Loading...
					</div>
				) : props.value.trim() ? (
					<Autocomplete.Empty
						className={classes.empty}
						role="status"
						aria-live="polite"
					>
						{props.emptyLabel ?? "No matches"}
					</Autocomplete.Empty>
				) : null}
				<Autocomplete.List className={classes.results}>
					{(item: SearchPaletteItem, index: number) => (
						<Autocomplete.Item
							key={item.id}
							value={item}
							index={index}
							render={<a href={item.href ?? "#"} />}
							className={({ highlighted }) =>
								`${classes.result}${
									highlighted ? ` ${classes.activeResult}` : ""
								}`
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
							<span className={classes.title}>{item.title}</span>
							{item.subtitle ? (
								<span className={classes.subtitle}>{item.subtitle}</span>
							) : null}
						</Autocomplete.Item>
					)}
				</Autocomplete.List>
			</Autocomplete.Root>
		</Modal>
	);
}
