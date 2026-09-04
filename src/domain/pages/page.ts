import { ensureLeadingSlash } from "../../shared/paths.ts";

export type PageExtension = ".md" | ".jsx" | ".pdf";

export interface PageSource {
  filePath: string;
  relPath: string;
  source: string;
  mtimeMs: number;
}

export interface PageIdentity {
  url: string;
  filePath: string;
  relPath: string;
  filename: string;
}

interface LinkSourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface OutboundWikilink {
  raw: string;
  target: string;
  label?: string;
  position?: LinkSourcePosition;
}

export interface BasePage extends PageIdentity {
  title: string;
  mtimeMs: number;
}

export interface MarkdownPage extends BasePage {
  kind: "markdown";
  ext: ".md";
  body: string;
  tags: string[];
  outboundLinks: OutboundWikilink[];
}

export interface JsxPage extends BasePage {
  kind: "jsx";
  ext: ".jsx";
  source: string;
  tags: string[];
  outboundLinks: [];
}

export interface PdfPage extends BasePage {
  kind: "pdf";
  ext: ".pdf";
  sourceUrl: string;
  tags: [];
  outboundLinks: [];
}

export type Page = MarkdownPage | JsxPage | PdfPage;

interface ContentIssueLike {
  severity: "error" | "warning";
  code: string;
  message: string;
  relPath?: string;
  url?: string;
}

const PAGE_INDEX_BASENAME = "index";

export function normalisePageRelPath(path: string): string {
  const trimmed = path.trim().replace(/\\/g, "/");
  const withoutLeading = trimmed.replace(/^\.?\//, "");
  const segments = withoutLeading
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== ".");

  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment === "..") {
      resolved.pop();
      continue;
    }

    resolved.push(segment);
  }

  return resolved.join("/");
}

export function pageStemFromRelPath(
  relPath: string,
  options: { preserveIndex?: boolean } = {},
): string {
  const normalised = normalisePageRelPath(relPath);
  const withoutExt = normalised.replace(/\.(md|jsx|pdf)$/i, "");

  if (options.preserveIndex) {
    return withoutExt;
  }

  if (withoutExt === PAGE_INDEX_BASENAME) {
    return "";
  }

  if (withoutExt.endsWith(`/${PAGE_INDEX_BASENAME}`)) {
    return withoutExt.slice(0, -(`/${PAGE_INDEX_BASENAME}`.length));
  }

  return withoutExt;
}

export function pageUrlFromRelPath(
  relPath: string,
  options: { preserveIndex?: boolean } = {},
): string {
  const stem = pageStemFromRelPath(relPath, options);
  return stem.length === 0 ? "/" : `/${stem}`;
}

export function pageSourceUrlFromRelPath(relPath: string): string {
  return ensureLeadingSlash(normalisePageRelPath(relPath));
}

export function detectPageUrlCollision(pages: Page[]): ContentIssueLike[] {
  const seen = new Map<string, Page[]>();

  for (const page of pages) {
    const bucket = seen.get(page.url);
    if (bucket) {
      bucket.push(page);
    } else {
      seen.set(page.url, [page]);
    }
  }

  const issues: ContentIssueLike[] = [];

  for (const [url, entries] of Array.from(seen.entries())) {
    if (entries.length < 2) {
      continue;
    }

    const relPaths = entries
      .map((entry) => entry.relPath)
      .sort((a, b) => a.localeCompare(b));

    for (const entry of entries) {
      issues.push({
        severity: "error",
        code: "page-url-collision",
        message: `Multiple pages resolve to ${url}: ${relPaths.join(", ")}`,
        relPath: entry.relPath,
        url,
      });
    }
  }

  return issues;
}
