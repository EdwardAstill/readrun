import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, ListTree } from "lucide-react";
import { Modal } from "../../components/reusable/Modal.tsx";
import { SearchBrowser } from "../../components/reusable/search/SearchBrowser.tsx";
import type { SearchItem } from "../../components/reusable/search/search.ts";
import { Button } from "../../components/ui/Button.tsx";
import { closeOverlay } from "../overlay.ts";
import { readRuntimeConfig } from "../runtime-config.ts";
import { currentSearchDocument, folderSearchItems, wikiSearchItems } from "../search/browser.ts";
import { loadSearchIndex, type SiteSearchDocument } from "../search/site.ts";

export interface SiteSearchIslandProps {
	open: boolean;
}

export function SiteSearchIsland({ open }: SiteSearchIslandProps) {
	const [documents, setDocuments] = useState<SiteSearchDocument[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);
	const [mode, setMode] = useState<"folders" | "wiki">(() =>
		typeof document !== "undefined" && document.querySelector('[aria-label="Wiki navigation"]') ? "wiki" : "folders",
	);
	const [currentUrl, setCurrentUrl] = useState("");
	const close = useCallback(() => closeOverlay("site-search-overlay"), []);

	useEffect(() => {
		if (!open) return;
		const syncPage = () => setCurrentUrl(window.location.pathname);
		syncPage();
		document.addEventListener("readrun:remount", syncPage);
		return () => document.removeEventListener("readrun:remount", syncPage);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const runtime = readRuntimeConfig();
		if (!runtime?.searchIndexUrl) return;
		let cancelled = false;
		setLoading(true);
		setLoadFailed(false);
		void loadSearchIndex(runtime.searchIndexUrl).then((nextDocuments) => {
			if (cancelled) return;
			setDocuments(nextDocuments);
			setLoading(false);
		}).catch(() => {
			if (cancelled) return;
			setLoading(false);
			setLoadFailed(true);
		});
		return () => { cancelled = true; };
	}, [open]);

	const current = currentSearchDocument(documents, currentUrl);
	const folders = useMemo(() => folderSearchItems(documents), [documents]);
	const links = useMemo(() => wikiSearchItems(documents, current), [documents, current]);
	const selectResult = useCallback((item: SearchItem<SiteSearchDocument>) => {
		if (!item.data) return;
		close();
		const anchor = document.createElement("a");
		anchor.href = item.data.url;
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	}, [close]);

	return <Modal id="site-search-overlay" open={open} onClose={close} ariaLabel="Search files"
		contentClassName="gap-0 overflow-hidden p-0 sm:max-w-5xl">
		<header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 pr-12">
			<h2 className="text-sm font-medium">Search files</h2>
			<div role="group" aria-label="Search mode" className="flex gap-1 rounded-lg bg-muted p-1">
				<Button size="sm" variant={mode === "folders" ? "outline" : "ghost"} aria-pressed={mode === "folders"} onClick={() => setMode("folders")}><ListTree />Folders</Button>
				<Button size="sm" variant={mode === "wiki" ? "outline" : "ghost"} aria-pressed={mode === "wiki"} onClick={() => setMode("wiki")}><Link />WikiLinks</Button>
			</div>
		</header>
		{loadFailed ? <p role="alert" className="p-6 text-sm text-muted-foreground">Could not load files. Close and reopen search to try again.</p> : open && <SearchBrowser key={`${mode}:${currentUrl}:${loading}`} mode={mode} items={mode === "wiki" ? links : folders}
			currentTitle={current?.title} defaultSelectedId={mode === "folders" ? current?.url : undefined} loading={loading} onOpen={selectResult} />}
	</Modal>;
}
