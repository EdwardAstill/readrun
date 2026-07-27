import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
	SearchPalette,
	type SearchPaletteItem,
} from "../../components/reusable/SearchPalette.tsx";
import { closeOverlay } from "../overlay.ts";
import { readRuntimeConfig } from "../runtime-config.ts";
import {
	loadSearchIndex,
	searchDocuments,
	type SiteSearchDocument,
} from "../search/site.ts";

export interface SiteSearchIslandProps {
	open: boolean;
}

export function SiteSearchIsland(
	props: SiteSearchIslandProps,
): React.JSX.Element {
	const [query, setQuery] = useState("");
	const [documents, setDocuments] = useState<SiteSearchDocument[]>([]);
	const [loading, setLoading] = useState(false);

	const close = useCallback(() => closeOverlay("site-search-overlay"), []);

	useEffect(() => {
		if (props.open) return;
		setQuery("");
	}, [props.open]);

	useEffect(() => {
		if (!props.open || documents.length > 0) return;

		const runtime = readRuntimeConfig();
		if (!runtime?.searchIndexUrl) return;

		let cancelled = false;
		setLoading(true);
		void loadSearchIndex(runtime.searchIndexUrl).then((nextDocuments) => {
			if (cancelled) return;
			setDocuments(nextDocuments);
			setLoading(false);
		});

		return () => {
			cancelled = true;
		};
	}, [documents.length, props.open]);

	const results = useMemo(
		() => searchDocuments(query, documents).map(toPaletteItem),
		[documents, query],
	);

	const selectResult = useCallback((item: SearchPaletteItem) => {
		if (!item.href) return;
		const anchor = document.createElement("a");
		anchor.href = item.href;
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	}, []);

	return (
		<SearchPalette
			id="site-search-overlay"
			open={props.open}
			value={query}
			onChange={setQuery}
			onClose={close}
			items={results}
			onSelect={selectResult}
			placeholder="Search all pages..."
			ariaLabel="Search all pages"
			loading={loading}
			classes={{
				root: "site-search-palette",
				open: "site-search-palette--open",
				scrim: "site-search-palette__scrim",
				card: "site-search-palette__card",
				bar: "site-search-palette__bar",
				input: "site-search-palette__input",
				close: "site-search-palette__close",
				results: "site-search-palette__results",
				result: "site-search-palette__result",
				activeResult: "site-search-palette__result--active",
				title: "site-search-palette__title",
				subtitle: "site-search-palette__snippet",
				empty: "site-search-palette__empty",
				loading: "site-search-palette__empty",
			}}
		/>
	);
}

function toPaletteItem(
	result: ReturnType<typeof searchDocuments>[number],
): SearchPaletteItem {
	return {
		id: result.document.id ?? result.document.url,
		title: result.document.title,
		subtitle: result.snippet || result.document.relPath,
		href: result.document.url,
	};
}
