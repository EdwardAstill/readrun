import type { Page } from "./page.ts";
import { detectPageUrlCollision, normalisePageRelPath } from "./page.ts";
import { buildBacklinks } from "./backlinks.ts";
import { buildTagIndex } from "./tags.ts";
import type { WikilinkEntry } from "./wikilinks.ts";
import { buildWikilinkLookup } from "./wikilinks.ts";

export interface TagEntry {
  id: string;
  label: string;
  slug: string;
  pages: Page[];
}

interface BaseContentIndex {
  mode: "tree" | "wiki";
  contentDir: string;
  pages: Page[];
  byUrl: Map<string, Page>;
  byRelPath: Map<string, Page>;
  byExactTarget: Map<string, WikilinkEntry | "ambiguous">;
  byKey: Map<string, WikilinkEntry | "ambiguous">;
  all: WikilinkEntry[];
  backlinks: Map<string, Page[]>;
  tags: Map<string, TagEntry>;
  builtAt: number;
}

export interface TreeContentIndex extends BaseContentIndex {
  mode: "tree";
}

export interface WikiContentIndex extends BaseContentIndex {
  mode: "wiki";
  entryPage: Page;
}

export type ContentIndex = TreeContentIndex | WikiContentIndex;

interface ContentIndexIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  relPath?: string;
  url?: string;
}

export interface ContentIndexBuildResult {
  index: ContentIndex;
  issues: ContentIndexIssue[];
}

interface ConfigLike {
  mode?: "tree" | "wiki";
  contentDir?: string;
  entryRelPath?: string;
  entryPath?: string;
  entry?: string;
}

function findEntryRelPath(config: ConfigLike): string | null {
  const entry = config.entryRelPath ?? config.entryPath ?? config.entry;
  return typeof entry === "string" && entry.trim().length > 0 ? normalisePageRelPath(entry) : null;
}

function sortedPages(pages: Page[]): Page[] {
  return [...pages].sort(
    (left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }) ||
      left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
  );
}

export function getPageByUrl(index: ContentIndex, url: string): Page | null {
  return index.byUrl.get(url) ?? null;
}

export function getPageByRelPath(index: ContentIndex, relPath: string): Page | null {
  return index.byRelPath.get(normalisePageRelPath(relPath)) ?? null;
}

export function buildContentIndex(config: ConfigLike, pages: Page[]): ContentIndexBuildResult {
  const orderedPages = sortedPages(pages);
  const byUrl = new Map<string, Page>();
  const byRelPath = new Map<string, Page>();

  for (const page of orderedPages) {
    byUrl.set(page.url, page);
    byRelPath.set(page.relPath, page);
  }

  const lookup = buildWikilinkLookup(orderedPages);
  const backlinks = buildBacklinks(orderedPages, lookup);
  const tags = buildTagIndex(orderedPages) as Map<string, TagEntry>;
  const issues: ContentIndexIssue[] = [...detectPageUrlCollision(orderedPages)];
  const builtAt = Date.now();
  const base: BaseContentIndex = {
    mode: config.mode === "wiki" ? "wiki" : "tree",
    contentDir: config.contentDir ?? "",
    pages: orderedPages,
    byUrl,
    byRelPath,
    byExactTarget: lookup.byExactTarget,
    byKey: lookup.byKey,
    all: lookup.all,
    backlinks,
    tags,
    builtAt,
  };

  if (base.mode === "wiki") {
    const entryRelPath = findEntryRelPath(config);
    const entryPage =
      (entryRelPath != null ? byRelPath.get(entryRelPath) : undefined) ?? orderedPages[0];

    if (entryPage == null) {
      issues.push({
        severity: "error",
        code: "missing-wiki-entry-page",
        message: "Wiki mode requires at least one page to act as the entry page.",
      });

      return {
        index: {
          ...base,
          mode: "tree",
        },
        issues,
      };
    }

    if (entryRelPath != null && entryPage.relPath !== entryRelPath) {
      issues.push({
        severity: "error",
        code: "missing-configured-entry-page",
        message: `Configured wiki entry page was not discovered: ${entryRelPath}`,
        relPath: entryRelPath,
      });
    }

    return {
      index: {
        ...base,
        mode: "wiki",
        entryPage,
      },
      issues,
    };
  }

  return {
    index: {
      ...base,
      mode: "tree",
    },
    issues,
  };
}
