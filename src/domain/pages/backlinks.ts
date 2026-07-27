import type { Page } from "./page.ts";
import type { WikilinkLookup } from "./wikilinks.ts";
import { resolveWikilink } from "./wikilinks.ts";

function sortPagesByTitleAndRelPath<T extends { title: string; relPath: string }>(pages: T[]): T[] {
  return [...pages].sort(
    (left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }) ||
      left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
  );
}

export function dedupeBacklinkSources(sources: Page[]): Page[] {
  const deduped = new Map<string, Page>();

  for (const source of sources) {
    deduped.set(source.url, source);
  }

  return sortPagesByTitleAndRelPath(Array.from(deduped.values()));
}

export function buildBacklinks(pages: Page[], lookup: WikilinkLookup): Map<string, Page[]> {
  const backlinks = new Map<string, Page[]>();

  for (const page of pages) {
    if (page.kind !== "markdown") {
      continue;
    }

    for (const link of page.outboundLinks) {
      const resolution = resolveWikilink(link.target, lookup);
      if (resolution.status !== "resolved" || resolution.page == null) {
        continue;
      }

      const bucket = backlinks.get(resolution.page.url);
      if (bucket) {
        bucket.push(page);
      } else {
        backlinks.set(resolution.page.url, [page]);
      }
    }
  }

  for (const [url, sources] of Array.from(backlinks.entries())) {
    backlinks.set(url, dedupeBacklinkSources(sources));
  }

  return backlinks;
}
