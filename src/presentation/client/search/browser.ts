import type { SearchItem } from "../../components/reusable/search/search.ts";
import { urlsMatch } from "../../shell/navigation-url.ts";
import type { SiteSearchDocument } from "./site.ts";

export function documentItem(document: SiteSearchDocument): SearchItem<SiteSearchDocument> {
	return {
		id: document.url,
		label: document.title,
		description: document.relPath,
		content: document.text ?? document.body,
		data: document,
	};
}

export function folderSearchItems(documents: readonly SiteSearchDocument[]): SearchItem<SiteSearchDocument>[] {
	const roots: SearchItem<SiteSearchDocument>[] = [];
	const folders = new Map<string, SearchItem<SiteSearchDocument>>();
	for (const document of documents) {
		const parts = (document.relPath ?? "").split("/");
		let siblings = roots;
		let path = "";
		for (const name of parts.slice(0, -1)) {
			path += `${name}/`;
			let folder = folders.get(path);
			if (!folder) {
				folder = { id: `folder:${path}`, label: name, children: [] };
				folders.set(path, folder);
				siblings.push(folder);
			}
			siblings = folder.children!;
		}
		siblings.push({ ...documentItem(document), label: parts.at(-1) || document.title });
	}
	function sort(items: SearchItem<SiteSearchDocument>[]) {
		items.sort((a, b) => Number(!!b.children) - Number(!!a.children) || a.label.localeCompare(b.label));
		for (const item of items) if (item.children) sort(item.children);
	}
	sort(roots);
	return roots;
}

export function currentSearchDocument(documents: readonly SiteSearchDocument[], url: string): SiteSearchDocument | undefined {
	return documents.find((document) => urlsMatch(document.url, url));
}

export function wikiSearchItems(documents: readonly SiteSearchDocument[], current?: SiteSearchDocument): SearchItem<SiteSearchDocument>[] {
	const byPath = new Map(documents.map((document) => [document.relPath, document]));
	return [...new Set(current?.linkedRelPaths ?? [])].flatMap((path) => {
		const document = byPath.get(path);
		return document ? [documentItem(document)] : [];
	});
}
