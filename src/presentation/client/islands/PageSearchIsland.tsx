import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "../../components/reusable/Modal.tsx";
import { SearchBar } from "../../components/reusable/SearchBar.tsx";
import { closeOverlay } from "../overlay.ts";
import {
	clearPageSearchHighlights,
	highlightPageMatches,
	navigatePageSearch,
	type PageSearchState,
} from "../search/in-page.ts";

export interface PageSearchIslandProps {
	open: boolean;
}

export function PageSearchIsland(
	props: PageSearchIslandProps,
): React.JSX.Element {
	const [query, setQuery] = useState("");
	const [, setVersion] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const stateRef = useRef<PageSearchState>({ marks: [], activeIdx: -1 });
	const wasOpenRef = useRef(false);

	const bump = useCallback(() => setVersion((version) => version + 1), []);
	const close = useCallback(() => closeOverlay("page-search-overlay"), []);

	const reset = useCallback(() => {
		setQuery("");
		clearPageSearchHighlights();
		stateRef.current = { marks: [], activeIdx: -1 };
		bump();
	}, [bump]);

	const navigate = useCallback(
		(direction: 1 | -1) => {
			navigatePageSearch(direction, stateRef.current);
			bump();
		},
		[bump],
	);

	useEffect(() => {
		if (props.open) {
			stateRef.current = highlightPageMatches(query);
			bump();
		} else if (wasOpenRef.current) {
			reset();
		}
		wasOpenRef.current = props.open;
	}, [bump, props.open, query, reset]);

	useEffect(() => () => clearPageSearchHighlights(), []);

	return (
		<Modal
			id="page-search-overlay"
			open={props.open}
			onClose={close}
			className="page-search-modal"
			openClassName="page-search-modal--open"
			contentClassName="page-search-modal__dialog"
			scrimClassName="page-search-modal__scrim"
			ariaLabel="Search this page"
			initialFocusRef={inputRef}
		>
			<SearchBar
				inputRef={inputRef}
				className="page-search-modal__bar"
				inputClassName="page-search-modal__input"
				value={query}
				onChange={setQuery}
				placeholder="Search this page..."
				ariaLabel="Search this page"
				countClassName="page-search-modal__count"
				buttonClassName="page-search-modal__button"
				closeClassName="page-search-modal__close"
				matchCount={{
					current: stateRef.current.activeIdx + 1,
					total: stateRef.current.marks.length,
				}}
				onNavigate={navigate}
				onClose={close}
			/>
		</Modal>
	);
}
