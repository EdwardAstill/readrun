import type { OutboundWikilink, Page } from "./page.ts";
import { normalisePageRelPath, pageStemFromRelPath } from "./page.ts";
import { isOpaqueBlock } from "../blocks/registry.ts";

export interface WikilinkEntry {
  key: string;
  page: Page;
  url: string;
  relPath: string;
  title: string;
}

export interface WikilinkLookup {
  all: WikilinkEntry[];
  byExactTarget: Map<string, WikilinkEntry | "ambiguous">;
  byKey: Map<string, WikilinkEntry | "ambiguous">;
}

export interface WikilinkResolution {
  key: string;
  target: string;
  status: "resolved" | "unresolved" | "ambiguous";
  page?: Page;
  entry?: WikilinkEntry;
  candidates?: WikilinkEntry[];
}

export interface ResolvedWikilink extends WikilinkResolution {
  raw: string;
  label?: string;
  position?: OutboundWikilink["position"];
}

function wikilinkKeysForPage(page: Page): string[] {
  const relPathKey = normaliseWikilinkKey(page.relPath);
  const stemKey = normaliseWikilinkKey(pageStemFromRelPath(page.relPath));
  const titleKey = normaliseWikilinkKey(page.title);

  return Array.from(new Set([relPathKey, stemKey, titleKey].filter((value) => value.length > 0)));
}

function exactWikilinkTargetsForPage(page: Page): string[] {
  return Array.from(
    new Set([
      stripWikilinkTargetExtension(normalisePageRelPath(page.relPath)),
      pageStemFromRelPath(page.relPath),
    ].filter((value) => value.length > 0)),
  );
}

function sortPagesByTitleAndRelPath<T extends { title: string; relPath: string }>(pages: T[]): T[] {
  return [...pages].sort(
    (left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }) ||
      left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
  );
}

export function normaliseWikilinkKey(value: string): string {
  const trimmed = value
    .trim()
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "");
  const withoutLabel = trimmed.split("|", 1)[0] ?? "";
  const withoutHash = withoutLabel.split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  const normalisedPath = normalisePageRelPath(withoutQuery).replace(/\.(md|jsx|pdf)$/i, "");
  const squashed = normalisedPath.replace(/\s+/g, " ").trim().toLowerCase();

  if (squashed === "index") {
    return "";
  }

  return squashed.endsWith("/index") ? squashed.slice(0, -"/index".length) : squashed;
}

export function exactWikilinkTarget(value: string): string {
  const trimmed = value
    .trim()
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "");
  const withoutLabel = trimmed.split("|", 1)[0] ?? "";
  const withoutHash = withoutLabel.split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  const normalisedPath = stripWikilinkTargetExtension(normalisePageRelPath(withoutQuery));

  if (normalisedPath === "index") {
    return "";
  }

  return normalisedPath.endsWith("/index")
    ? normalisedPath.slice(0, -"/index".length)
    : normalisedPath;
}

function stripWikilinkTargetExtension(value: string): string {
  return value.replace(/\.(md|jsx|pdf)$/i, "");
}

export function extractOutboundWikilinks(body: string): OutboundWikilink[] {
  const pattern = /\[\[([^[\]]+?)\]\]/g;
  const matches: OutboundWikilink[] = [];
  const searchableBody = maskNonProse(body);

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(searchableBody)) != null) {
    const raw = body.slice(match.index, match.index + match[0].length);
    const inner = match[1] ?? "";
    const separator = inner.indexOf("|");
    const target = (separator >= 0 ? inner.slice(0, separator) : inner).trim();
    const label = separator >= 0 ? inner.slice(separator + 1).trim() : undefined;

    const offset = match.index;
    const before = body.slice(0, offset);
    const line = before.split("\n").length;
    const column = offset - before.lastIndexOf("\n");

    if (target.length === 0) {
      continue;
    }

    matches.push({
      raw,
      target,
      label: label && label.length > 0 ? label : undefined,
      position: {
        line,
        column,
        offset,
      },
    });
  }

  return matches;
}

const BLOCK_LINE_PATTERN =
  /^\s*\[(?<close>\/)?(?<name>[A-Za-z][A-Za-z0-9-]*)(?:=(?<src>[^\s\]"]+))?[^\]]*\]\s*$/;

function maskNonProse(source: string): string {
  const chunks = source.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g) ?? [];
  const masked: string[] = [];
  let inFrontmatter = false;
  let frontmatterDone = false;
  let fenceCharacter: string | null = null;
  let opaqueBlockName: string | null = null;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]!;
    if (chunk === "") {
      continue;
    }

    const newline = chunk.match(/(?:\r\n|\r|\n)$/)?.[0] ?? "";
    const line = newline ? chunk.slice(0, -newline.length) : chunk;
    const trimmed = line.trim();
    const lineNumber = index + 1;

    if (!frontmatterDone && lineNumber === 1 && trimmed === "---") {
      inFrontmatter = true;
      masked.push(maskLine(line) + newline);
      continue;
    }

    if (inFrontmatter) {
      masked.push(maskLine(line) + newline);
      if (trimmed === "---") {
        inFrontmatter = false;
        frontmatterDone = true;
      }
      continue;
    }

    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (!opaqueBlockName && fenceMatch) {
      const marker = fenceMatch[1]!;
      if (fenceCharacter == null) {
        fenceCharacter = marker[0]!;
      } else if (marker.startsWith(fenceCharacter)) {
        fenceCharacter = null;
      }
      masked.push(maskLine(line) + newline);
      continue;
    }

    if (fenceCharacter != null) {
      masked.push(maskLine(line) + newline);
      continue;
    }

    const blockMatch = BLOCK_LINE_PATTERN.exec(line);
    if (opaqueBlockName != null) {
      if (
        blockMatch?.groups?.close &&
        blockMatch.groups.name === opaqueBlockName
      ) {
        opaqueBlockName = null;
      }
      masked.push(maskLine(line) + newline);
      continue;
    }

    if (
      blockMatch?.groups &&
      !blockMatch.groups.close &&
      !blockMatch.groups.src &&
      isOpaqueBlock(blockMatch.groups.name!)
    ) {
      opaqueBlockName = blockMatch.groups.name!;
      masked.push(maskLine(line) + newline);
      continue;
    }

    masked.push(maskInlineCode(line) + newline);
  }

  return masked.join("");
}

function maskLine(line: string): string {
  return " ".repeat(line.length);
}

function maskInlineCode(line: string): string {
  return line.replace(/(`+)(.*?)\1/g, (value) => maskLine(value));
}

export function buildWikilinkLookup(pages: Page[]): WikilinkLookup {
  const all: WikilinkEntry[] = [];
  const dedupe = new Set<string>();
  const exactGrouped = new Map<string, WikilinkEntry[]>();

  for (const page of sortPagesByTitleAndRelPath(pages)) {
    for (const key of wikilinkKeysForPage(page)) {
      const dedupeKey = `${key}::${page.url}`;
      if (dedupe.has(dedupeKey)) {
        continue;
      }

      dedupe.add(dedupeKey);
      all.push({
        key,
        page,
        url: page.url,
        relPath: page.relPath,
        title: page.title,
      });
    }

    for (const target of exactWikilinkTargetsForPage(page)) {
      const entry: WikilinkEntry = {
        key: target,
        page,
        url: page.url,
        relPath: page.relPath,
        title: page.title,
      };
      const bucket = exactGrouped.get(target);
      if (bucket) {
        bucket.push(entry);
      } else {
        exactGrouped.set(target, [entry]);
      }
    }
  }

  const grouped = new Map<string, WikilinkEntry[]>();
  for (const entry of all) {
    const bucket = grouped.get(entry.key);
    if (bucket) {
      bucket.push(entry);
    } else {
      grouped.set(entry.key, [entry]);
    }
  }

  const byKey = new Map<string, WikilinkEntry | "ambiguous">();
  for (const [key, entries] of Array.from(grouped.entries())) {
    const first = entries[0];
    if (first == null) {
      continue;
    }

    byKey.set(key, entries.length === 1 ? first : "ambiguous");
  }

  const byExactTarget = new Map<string, WikilinkEntry | "ambiguous">();
  for (const [target, entries] of Array.from(exactGrouped.entries())) {
    const first = entries[0];
    if (first == null) {
      continue;
    }

    byExactTarget.set(target, entries.length === 1 ? first : "ambiguous");
  }

  return { all, byExactTarget, byKey };
}

export function resolveWikilink(target: string, lookup: WikilinkLookup): WikilinkResolution {
  const exactTarget = exactWikilinkTarget(target);
  const exactMatched = lookup.byExactTarget.get(exactTarget);

  if (exactMatched != null && exactMatched !== "ambiguous") {
    return {
      key: exactTarget,
      target,
      status: "resolved",
      page: exactMatched.page,
      entry: exactMatched,
    };
  }

  const key = normaliseWikilinkKey(target);
  const matched = lookup.byKey.get(key);

  if (matched == null) {
    return {
      key,
      target,
      status: "unresolved",
    };
  }

  if (matched === "ambiguous") {
    const candidates = [...lookup.all]
      .filter((entry) => entry.key === key)
      .sort(
        (left, right) =>
          left.title.localeCompare(right.title, undefined, { sensitivity: "base" }) ||
          left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
      );

    return {
      key,
      target,
      status: "ambiguous",
      candidates,
    };
  }

  return {
    key,
    target,
    status: "resolved",
    page: matched.page,
    entry: matched,
  };
}

export function resolvePageWikilinks(page: Page, lookup: WikilinkLookup): ResolvedWikilink[] {
  if (page.kind !== "markdown") {
    return [];
  }

  return page.outboundLinks.map((link) => {
    const resolution = resolveWikilink(link.target, lookup);
    return {
      ...resolution,
      raw: link.raw,
      label: link.label,
      position: link.position,
    };
  });
}
