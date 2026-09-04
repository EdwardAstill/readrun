import { parseFrontmatter } from "./frontmatter.ts";
import type { JsxPage, MarkdownPage, Page, PageExtension, PdfPage } from "./page.ts";
import {
  normalisePageRelPath,
  pageSourceUrlFromRelPath,
  pageUrlFromRelPath,
} from "./page.ts";
import { extractOutboundWikilinks } from "./wikilinks.ts";

export interface DiscoveredFile {
  filePath: string;
  relPath: string;
  source?: string;
  mtimeMs: number;
  ext: PageExtension;
}

interface PageDiscoveryIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  relPath?: string;
}

export interface PageDiscoveryResult {
  pages: Page[];
  issues: PageDiscoveryIssue[];
}

interface FileEntryLike {
  filePath?: string;
  path?: string;
  relPath?: string;
  source?: string;
  text?: string;
  contents?: string;
  mtimeMs?: number;
}

interface ConfigLike {
  mode?: "tree" | "wiki";
}

function pageTitleFromBody(body: string, fallback: string): string {
  for (const line of body.split(/\r?\n/)) {
    const match = /^\s*#\s+(.+?)\s*$/.exec(line);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return fallback;
}

function fallbackTitleFromRelPath(relPath: string): string {
  const segments = relPath.split("/");
  const filename = segments[segments.length - 1] ?? relPath;
  const stem = filename.replace(/\.(md|jsx|pdf)$/i, "");

  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Untitled";
}

function normaliseTags(tags: string[] | undefined): string[] {
  if (tags == null) {
    return [];
  }

  const seen = new Set<string>();
  const values: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    const key = trimmed.toLowerCase();

    if (trimmed.length === 0 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    values.push(trimmed);
  }

  return values;
}

function toDiscoveredFile(entry: FileEntryLike): DiscoveredFile | null {
  const relPathInput = entry.relPath ?? entry.path ?? entry.filePath;

  if (relPathInput == null) {
    return null;
  }

  const relPath = normalisePageRelPath(relPathInput);
  const lowerRelPath = relPath.toLowerCase();
  const ext = lowerRelPath.endsWith(".md")
    ? ".md"
    : lowerRelPath.endsWith(".jsx")
      ? ".jsx"
      : lowerRelPath.endsWith(".pdf")
        ? ".pdf"
        : null;

  if (ext == null) {
    return null;
  }

  const source = entry.source ?? entry.text ?? entry.contents;
  if (ext !== ".pdf" && source == null) {
    return null;
  }

  return {
    filePath: entry.filePath ?? relPath,
    relPath,
    source,
    mtimeMs: entry.mtimeMs ?? 0,
    ext,
  };
}

export function pageFromDiscoveredFile(file: DiscoveredFile, _config: ConfigLike): Page {
  const segments = file.relPath.split("/");
  const filename = segments[segments.length - 1] ?? file.relPath;
  const fallbackTitle = fallbackTitleFromRelPath(file.relPath);
  const base = {
    url: pageUrlFromRelPath(file.relPath, {
      preserveIndex: _config.mode === "wiki",
    }),
    filePath: file.filePath,
    relPath: file.relPath,
    filename,
    mtimeMs: file.mtimeMs,
  };

  if (file.ext === ".pdf") {
    const page: PdfPage = {
      ...base,
      kind: "pdf",
      ext: ".pdf",
      title: fallbackTitle,
      sourceUrl: pageSourceUrlFromRelPath(file.relPath),
      tags: [],
      outboundLinks: [],
    };
    return page;
  }

  const parsed = parseFrontmatter(file.source ?? "");
  const title = parsed.frontmatter.title?.trim() || pageTitleFromBody(parsed.body, fallbackTitle);
  const tags = normaliseTags(parsed.frontmatter.tags);
  const textBase = { ...base, title };

  if (file.ext === ".md") {
    const page: MarkdownPage = {
      ...textBase,
      kind: "markdown",
      ext: ".md",
      body: parsed.body,
      tags,
      outboundLinks: extractOutboundWikilinks(parsed.body),
    };
    return page;
  }

  const page: JsxPage = {
    ...textBase,
    kind: "jsx",
    ext: ".jsx",
    source: parsed.body,
    tags,
    outboundLinks: [],
  };
  return page;
}

export function discoverPages(files: FileEntryLike[], config: ConfigLike): PageDiscoveryResult {
  const pages: Page[] = [];
  const issues: PageDiscoveryIssue[] = [];

  for (const entry of files) {
    const discovered = toDiscoveredFile(entry);
    if (discovered == null) {
      continue;
    }

    pages.push(pageFromDiscoveredFile(discovered, config));
  }

  pages.sort(
    (left, right) =>
      left.url.localeCompare(right.url, undefined, { sensitivity: "base" }) ||
      left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
  );

  if (config.mode === "wiki" && pages.length === 0) {
    issues.push({
      severity: "warning",
      code: "wiki-without-pages",
      message: "Wiki mode was resolved without any discovered pages.",
    });
  }

  return { pages, issues };
}
