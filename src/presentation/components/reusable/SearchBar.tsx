import type React from "react";
import { useCallback, useEffect, useRef } from "react";

export interface SearchBarProps {
	id?: string;
	inputRef?: React.RefObject<HTMLInputElement>;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	ariaLabel?: string;
	matchCount?: { current: number; total: number };
	onNavigate?: (direction: 1 | -1) => void;
	onClose?: () => void;
	autoFocus?: boolean;
	className?: string;
	inputClassName?: string;
	countClassName?: string;
	buttonClassName?: string;
	closeClassName?: string;
	prevLabel?: string;
	nextLabel?: string;
	role?: "searchbox" | "combobox";
	ariaControls?: string;
	ariaExpanded?: boolean;
	ariaActiveDescendant?: string;
}

/**
 * Reusable search bar with optional match count, prev/next navigation, and close button.
 */
export function SearchBar(props: SearchBarProps): React.JSX.Element {
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = props.inputRef ?? internalInputRef;

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Escape") {
				props.onClose?.();
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				props.onNavigate?.(event.shiftKey ? -1 : 1);
			}
		},
		[props.onClose, props.onNavigate],
	);

	useEffect(() => {
		if (props.autoFocus) {
			const timer = setTimeout(() => inputRef.current?.focus(), 0);
			return () => clearTimeout(timer);
		}
	}, [props.autoFocus]);

	const total = props.matchCount?.total ?? 0;
	const current = props.matchCount?.current ?? 0;

	return (
		<div className={props.className}>
			<input
				id={props.id}
				ref={inputRef}
				className={props.inputClassName}
				type="search"
				value={props.value}
				onChange={(event) => props.onChange(event.currentTarget.value)}
				onKeyDown={handleKeyDown}
				placeholder={props.placeholder}
				role={props.role}
				aria-label={props.ariaLabel ?? props.placeholder}
				aria-controls={props.ariaControls}
				aria-expanded={props.ariaExpanded}
				aria-activedescendant={props.ariaActiveDescendant}
				aria-autocomplete={props.role === "combobox" ? "list" : undefined}
			/>
			{props.matchCount !== undefined && (
				<span
					className={props.countClassName ?? "search-bar__count"}
					role="status"
					aria-live="polite"
				>
					{props.value.trim() ? `${Math.max(current, 0)}/${total}` : "0/0"}
				</span>
			)}
			{props.onNavigate && (
				<>
					<button
						type="button"
						className={props.buttonClassName ?? "search-bar__button"}
						onClick={() => props.onNavigate?.(-1)}
						disabled={total === 0}
						aria-label="Previous match"
					>
						{props.prevLabel ?? "Prev"}
					</button>
					<button
						type="button"
						className={props.buttonClassName ?? "search-bar__button"}
						onClick={() => props.onNavigate?.(1)}
						disabled={total === 0}
						aria-label="Next match"
					>
						{props.nextLabel ?? "Next"}
					</button>
				</>
			)}
			{props.onClose && (
				<button
					type="button"
					className={props.closeClassName ?? "search-bar__close"}
					onClick={props.onClose}
					aria-label="Close search"
				>
					×
				</button>
			)}
		</div>
	);
}
