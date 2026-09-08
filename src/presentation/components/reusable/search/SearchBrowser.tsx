import { useEffect, useId, useState, type CSSProperties } from "react";
import { ChevronRight, FileText, Folder, FolderOpen, Search, X } from "lucide-react";
import { Button } from "../../ui/Button.tsx";
import { cn } from "../../ui/cn.ts";
import { SearchPaneDivider } from "./SearchPaneDivider.tsx";
import type { SearchItem } from "./search.ts";
import { useNestedSearch } from "./use-nested-search.ts";

export interface SearchBrowserProps<T> {
	items: SearchItem<T>[];
	mode: "folders" | "wiki";
	currentTitle?: string;
	defaultSelectedId?: string;
	loading?: boolean;
	onOpen: (item: SearchItem<T>) => void;
}

/** edcn's nested/Miller search interaction, adapted to folders and outgoing note links. */
export function SearchBrowser<T>({ items, mode, currentTitle, defaultSelectedId, loading, onOpen }: SearchBrowserProps<T>) {
	const browser = useNestedSearch({ items, defaultMode: mode === "wiki" ? "miller" : "files", defaultSelectedId, onOpen });
	const [ratio, setRatio] = useState(0.45);
	const helpId = useId();
	const { selected, query, searching } = browser;
	const visible = browser.visibleEntries;
	// A Miller query with no matches retains its level, but has no file to preview.
	const preview = visible.length ? selected : undefined;
	useEffect(() => { browser.focusSearch(); }, []);
	const layoutStyle = { "--search-columns": `minmax(0, ${ratio}fr) 1px minmax(0, ${1 - ratio}fr)` } as CSSProperties;

	return <section aria-label={mode === "wiki" ? "WikiLink browser" : "Folder browser"} className="min-h-0">
		<div style={layoutStyle} className={cn("min-h-0", mode === "wiki" ? "grid h-[min(440px,60dvh)] grid-cols-[var(--search-columns)]" : "flex max-h-[65dvh] flex-col overflow-auto md:grid md:h-[min(440px,60dvh)] md:grid-cols-[var(--search-columns)] md:overflow-hidden")}>
			<div data-search-pane="current" className="flex min-h-0 min-w-0 flex-col">
				<div className="flex items-center gap-2 border-b px-3 py-2">
					<Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
					<input {...browser.getInputProps()} aria-label={mode === "wiki" ? "Search linked notes" : "Search all pages"}
						aria-describedby={helpId} placeholder={mode === "wiki" ? "Search linked notes…" : "Search names or paths…"}
						className="h-9 min-w-0 flex-1 rounded-sm bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
						onKeyDown={(event) => {
							if (event.key === "Escape" && !query) return;
							if (event.key === "Escape") event.stopPropagation();
							browser.getInputProps().onKeyDown?.(event);
						}} />
					{query && <Button size="icon-sm" variant="ghost" aria-label="Clear search" onClick={() => { browser.setQuery(""); browser.focusSearch(); }}><X /></Button>}
				</div>
				<div className="flex min-w-0 items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
					<span className="truncate" title={currentTitle}>{mode === "wiki" ? `Linked from ${currentTitle ?? "this page"}` : "Folders"}</span>
					<span role="status" className="shrink-0">{loading ? "Loading…" : searching ? `${browser.matchCount} matches` : `${mode === "wiki" ? items.length : browser.entries.filter((entry) => !entry.item.children).length} notes`}</span>
				</div>
				<div {...browser.getListProps()} aria-label={mode === "wiki" ? "Current: linked notes" : "Search results"}
					className={cn("min-h-0 flex-1 overflow-auto p-2", mode === "folders" && "min-h-40 md:min-h-0")}
					onKeyDown={(event) => { if (event.key === "Escape" && query) event.stopPropagation(); }}>
					{visible.map((entry) => {
						const state = browser.getItemState(entry);
						const Icon = state.isContainer ? state.isExpanded ? FolderOpen : Folder : FileText;
						const rowProps = browser.getItemProps(entry);
						return <div key={entry.item.id} {...rowProps} data-search-item={entry.item.id}
							style={{ paddingLeft: mode === "folders" ? 8 + entry.depth * 20 : 8 }}
							className={cn("flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", state.isSelected && "bg-accent text-accent-foreground", state.isMatch && "font-semibold")}
							onKeyDown={(event) => {
								if (event.key === "Escape" && !query) return;
								rowProps.onKeyDown?.(event);
							}}>
							{state.isContainer && <ChevronRight aria-hidden="true" className={cn("size-3 shrink-0", state.isExpanded && "rotate-90")} />}
							<Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
							<span className="min-w-0 truncate" title={entry.item.description ?? entry.item.label}>{entry.item.label}</span>
						</div>;
					})}
					{!loading && !visible.length && <p className="p-4 text-sm text-muted-foreground">{searching ? "No matching notes." : mode === "wiki" ? "This page has no resolved outgoing WikiLinks." : "No files found."}</p>}
				</div>
			</div>
			<SearchPaneDivider ratio={ratio} onRatioChange={setRatio} aria-label="Resize results and preview" className={mode === "folders" ? "hidden md:block" : undefined} />
			<aside data-search-pane="preview" aria-label="Content preview" className="flex min-h-0 min-w-0 flex-col border-t md:border-t-0">
				<div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 text-xs text-muted-foreground">
					<span>Preview</span>
					{preview && !preview.item.children && <Button variant="ghost" size="sm" onClick={() => onOpen(preview.item)}>Open <ChevronRight /></Button>}
				</div>
				<div key={preview?.item.id} className="min-h-0 flex-1 overflow-auto p-5">
					{preview ? <>
						<p className="mb-2 break-all font-mono text-xs text-muted-foreground">{preview.item.description ?? preview.path}</p>
						<h3 className="mb-4 break-words text-lg font-semibold tracking-tight">{preview.item.label}</h3>
						{preview.item.children ? <p className="text-sm text-muted-foreground">{preview.item.children.length} items inside. Select a note to preview its contents.</p>
							: <p className="whitespace-pre-wrap break-words text-sm leading-7">{preview.item.content || "No text preview available for this file."}</p>}
					</> : <p className="text-sm text-muted-foreground">Select a note to preview its contents.</p>}
				</div>
			</aside>
		</div>
		<footer id={helpId} className="flex flex-wrap gap-x-4 gap-y-1 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
			<span>↑ ↓ Navigate</span><span>Tab Cycle results</span>{mode === "folders" && <span>← → Expand folders</span>}<span>Enter Open</span><span>Esc {query ? "Clear search" : "Close"}</span>
		</footer>
	</section>;
}
