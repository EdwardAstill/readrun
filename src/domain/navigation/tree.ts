import * as path from "node:path";

import type {
  NavigationTreeBranch,
  NavigationTreeLeaf,
  NavigationTreeNode,
  Page,
} from "./model.ts";
import { pageNavigationLabel } from "./labels.ts";
import type {
  NavigationDocument,
  NavigationSpecEntry,
  NavigationSpecNode,
} from "./schema.ts";
import { normaliseNavigationPath } from "./schema.ts";
import { error, type ContentIssue } from "../validation/model.ts";

export interface TreeContentIndexLike {
  pages: Page[];
  byRelPath?: Map<string, Page>;
}

interface MutableBranch {
  kind: "branch";
  id: string;
  label: string;
  orderPath?: number[];
  page?: Page;
  children: Map<string, MutableBranch | NavigationTreeLeaf>;
}

export function buildFilesystemTree(pages: readonly Page[]): NavigationTreeNode[] {
  const root: MutableBranch = {
    kind: "branch",
    id: "root",
    label: "root",
    children: new Map(),
  };

  const sortedPages = [...pages].sort(comparePagesByRelPath);

  for (const page of sortedPages) {
    insertFilesystemPage(root, page);
  }

  return sortNavigationTree(materialiseChildren(root));
}

export function buildAuthoredTree(
  document: NavigationDocument,
  index: TreeContentIndexLike,
): NavigationTreeNode[] {
  const byRelPath =
    index.byRelPath ?? new Map(index.pages.map((page) => [page.relPath, page]));

  return document.entries
    .map((entry, entryIndex) =>
      buildAuthoredNode(entry, byRelPath, [entryIndex]),
    )
    .filter((node): node is NavigationTreeNode => node !== null);
}

export function sortNavigationTree(
  nodes: readonly NavigationTreeNode[],
): NavigationTreeNode[] {
  return [...nodes]
    .sort(compareNavigationNodes)
    .map((node) =>
      node.kind === "branch"
        ? {
            ...node,
            children: sortNavigationTree(node.children) as [
              NavigationTreeNode,
              ...NavigationTreeNode[],
            ],
          }
        : node,
    );
}

export function findDuplicateNavigationRefs(
  document: NavigationDocument,
): ContentIssue[] {
  const seen = new Map<string, NavigationSpecEntry[]>();

  if (document.index) {
    seen.set(document.index.path, []);
  }

  for (const entry of flattenEntries(document.entries)) {
    const ref = directEntryRef(entry);
    if (ref) {
      const existing = seen.get(ref.path) ?? [];
      existing.push(entry);
      seen.set(ref.path, existing);
    }
  }

  const duplicates: ContentIssue[] = [];
  for (const [ref, entries] of seen) {
    if (entries.length < 2) {
      continue;
    }

    duplicates.push(
      error({
        code: "navigation.ref.duplicate",
        message: `Navigation path "${ref}" is referenced multiple times.`,
        position: entries[0]?.position,
        related: entries
          .slice(1)
          .map((entry) => entry.position)
          .filter((position) => position !== undefined),
      }),
    );
  }

  return duplicates;
}

function insertFilesystemPage(root: MutableBranch, page: Page): void {
  const relPath = normaliseNavigationPath(page.relPath);
  const parts = relPath.split("/").filter(Boolean);
  const lastSegment = parts.pop();
  if (!lastSegment) {
    return;
  }

  let branch = root;
  const parentSegments: string[] = [];

  for (const segment of parts) {
    const existing = branch.children.get(segment);
    if (existing?.kind === "branch") {
      branch = existing;
    } else {
      parentSegments.push(segment);
      const next: MutableBranch = {
        kind: "branch",
        id: `dir:${segmentsToPath(parentSegments)}`,
        label: prettifySegment(segment),
        children: new Map(),
      };
      branch.children.set(segment, next);
      branch = next;
      continue;
    }
    parentSegments.push(segment);
  }

  const basename = stripPageExtension(lastSegment);
  if (basename.toLowerCase() === "index") {
    if (parts.length === 0) {
      branch.children.set(`__root_index__:${page.relPath}`, leafFromPage(page));
    } else {
      branch.page = page;
    }
    return;
  }

  branch.children.set(basename, leafFromPage(page));
}

function buildAuthoredNode(
  entry: NavigationSpecEntry,
  byRelPath: Map<string, Page>,
  orderPath: number[],
): NavigationTreeNode | null {
  const node = entry.node;
  if (node.kind === "page") {
    const page = byRelPath.get(normaliseNavigationPath(node.path));
    if (!page) {
      return null;
    }
    return {
      kind: "leaf",
      id: entryId(entry),
      label: entry.label,
      page,
      orderPath,
    };
  }

  const children = node.entries
    .map((child, index) =>
      buildAuthoredNode(child, byRelPath, [...orderPath, index]),
    )
    .filter((child): child is NavigationTreeNode => child !== null);

  if (children.length === 0) {
    if (!node.index) {
      return null;
    }

    const page = byRelPath.get(normaliseNavigationPath(node.index));
    if (!page) {
      return null;
    }

    return {
      kind: "leaf",
      id: entryId(entry),
      label: entry.label,
      page,
      orderPath,
    };
  }

  const branch: NavigationTreeBranch = {
    kind: "branch",
    id: entryId(entry),
    label: entry.label,
    children: children as [NavigationTreeNode, ...NavigationTreeNode[]],
    orderPath,
  };

  if (node.index) {
    const page = byRelPath.get(normaliseNavigationPath(node.index));
    if (page) {
      branch.page = page;
    }
  }

  return branch;
}

function directEntryRef(
  entry: NavigationSpecEntry,
): { path: string; node: NavigationSpecNode } | null {
  if (entry.node.kind === "page") {
    return { path: normaliseNavigationPath(entry.node.path), node: entry.node };
  }

  if (entry.node.index) {
    return {
      path: normaliseNavigationPath(entry.node.index),
      node: entry.node,
    };
  }

  return null;
}

function flattenEntries(entries: readonly NavigationSpecEntry[]): NavigationSpecEntry[] {
  const all: NavigationSpecEntry[] = [];
  for (const entry of entries) {
    all.push(entry);
    if (entry.node.kind === "branch") {
      all.push(...flattenEntries(entry.node.entries));
    }
  }
  return all;
}

function materialiseChildren(branch: MutableBranch): NavigationTreeNode[] {
  const nodes: NavigationTreeNode[] = [];
  const childrenList = Array.from(branch.children.values());
  for (let index = 0; index < childrenList.length; index += 1) {
    const child = childrenList[index];
    if (!child) {
      continue;
    }

    if (child.kind === "leaf") {
      nodes.push({ ...child, orderPath: [index] });
      continue;
    }

    const children = materialiseChildren(child);
    if (children.length === 0 && !child.page) {
      continue;
    }

    if (children.length === 0 && child.page) {
      nodes.push({
        kind: "leaf",
        id: child.id,
        label: child.label,
        page: child.page,
        orderPath: [index],
      });
      continue;
    }

    nodes.push({
      kind: "branch",
      id: child.id,
      label: child.label,
      page: child.page,
      orderPath: [index],
      children: children as [NavigationTreeNode, ...NavigationTreeNode[]],
    });
  }

  return nodes;
}

function leafFromPage(page: Page): NavigationTreeLeaf {
  return {
    kind: "leaf",
    id: `page:${page.relPath}`,
    label: pageNavigationLabel(page),
    page,
  };
}

function entryId(entry: NavigationSpecEntry): string {
  return `nav:${entry.labelPath.join("/")}`;
}

function compareNavigationNodes(
  left: NavigationTreeNode,
  right: NavigationTreeNode,
): number {
  const leftOrder = left.orderPath?.join(".") ?? "";
  const rightOrder = right.orderPath?.join(".") ?? "";
  if (leftOrder !== rightOrder) {
    return leftOrder.localeCompare(rightOrder, undefined, { numeric: true });
  }

  if (left.kind !== right.kind) {
    return left.kind === "branch" ? -1 : 1;
  }

  return left.label.localeCompare(right.label, undefined, {
    sensitivity: "base",
  });
}

function comparePagesByRelPath(left: Page, right: Page): number {
  return left.relPath.localeCompare(right.relPath, undefined, {
    sensitivity: "base",
  });
}

function stripPageExtension(segment: string): string {
  return segment.replace(/\.(md|jsx|pdf)$/i, "");
}

function prettifySegment(segment: string): string {
  return stripPageExtension(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function segmentsToPath(segments: string[]): string {
  return path.posix.join(...segments);
}
