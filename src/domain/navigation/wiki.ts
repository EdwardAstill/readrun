import type {
  Page,
  WikiLinkNavigationItem,
  WikiNavigation,
  WikiNavigationItem,
  WikiNavigationSection,
} from "./model.ts";
import { pageNavigationLabel } from "./labels.ts";

export interface WikiTagLike {
  id: string;
  label: string;
  slug: string;
  pages: Page[];
}

export interface WikiContentIndexLike {
  pages: Page[];
  entryPage: Page;
  tags?: Map<string, WikiTagLike>;
}

export function buildWikiNavigation(index: WikiContentIndexLike): WikiNavigation {
  return {
    mode: "wiki",
    entryPage: index.entryPage,
    sections: [buildAllPagesSection(index), ...buildTagSections(index)],
  };
}

export function buildAllPagesSection(
  index: Pick<WikiContentIndexLike, "pages">,
): WikiNavigationSection {
  const items = [...index.pages]
    .sort(comparePages)
    .map((page) => pageItem(`page:${page.relPath}`, pageNavigationLabel(page), page));

  return {
    id: "all-pages",
    label: "All Pages",
    items,
  };
}

export function buildTagSections(
  index: Pick<WikiContentIndexLike, "tags">,
): WikiNavigationSection[] {
  const tags = Array.from(index.tags?.values() ?? []).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
  );

  if (tags.length === 0) {
    return [];
  }

  const items: WikiNavigationItem[] = tags.map((tag) =>
    linkItem(`tag:${tag.slug}`, tag.label, `/tags/${tag.slug}/`, tag.pages.length),
  );

  return [
    {
      id: "tags",
      label: "Tags",
      items,
    },
  ];
}

function pageItem(id: string, label: string, page: Page) {
  return { kind: "page" as const, id, label, page };
}

function linkItem(
  id: string,
  label: string,
  href: string,
  count?: number,
): WikiLinkNavigationItem {
  return { kind: "link", id, label, href, count };
}

function comparePages(left: Page, right: Page): number {
  const title = left.title.localeCompare(right.title, undefined, {
    sensitivity: "base",
  });
  if (title !== 0) {
    return title;
  }
  return left.relPath.localeCompare(right.relPath, undefined, {
    sensitivity: "base",
  });
}
