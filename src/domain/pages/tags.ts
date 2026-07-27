import type { Page } from "./page.ts";

interface TagEntryLike {
  id: string;
  label: string;
  slug: string;
  pages: Page[];
}

function sortPagesByTitleAndRelPath<T extends { title: string; relPath: string }>(pages: T[]): T[] {
  return [...pages].sort(
    (left, right) =>
      left.title.localeCompare(right.title, undefined, { sensitivity: "base" }) ||
      left.relPath.localeCompare(right.relPath, undefined, { sensitivity: "base" }),
  );
}

export function normaliseTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").toLowerCase();
}

export function slugifyTag(tag: string): string {
  const normalised = normaliseTag(tag)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const slug = normalised.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "tag";
}

export function sortTags(tags: Iterable<TagEntryLike>): TagEntryLike[] {
  return Array.from(tags).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: "base" }),
  );
}

export function buildTagIndex(pages: Page[]): Map<string, TagEntryLike> {
  const tags = new Map<string, TagEntryLike>();

  for (const page of pages) {
    for (const rawTag of page.tags) {
      const label = rawTag.trim();
      const id = normaliseTag(label);

      if (id.length === 0) {
        continue;
      }

      const existing = tags.get(id);
      if (existing) {
        existing.pages.push(page);
        continue;
      }

      tags.set(id, {
        id,
        label,
        slug: slugifyTag(label),
        pages: [page],
      });
    }
  }

  for (const entry of Array.from(tags.values())) {
    entry.pages = sortPagesByTitleAndRelPath(entry.pages);
  }

  return new Map(sortTags(tags.values()).map((entry) => [entry.id, entry]));
}
