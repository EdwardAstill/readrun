import type { ContentIndex } from "./content-index.ts";

export interface SearchDocument {
  id: string;
  url: string;
  relPath: string;
  title: string;
  tags: string[];
  text: string;
}

export function plainTextForSearch(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/\[\[([^[\]|]+)\|?([^[\]]*)\]\]/g, (_match, target: string, label: string) =>
      ` ${label || target} `,
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchDocuments(index: ContentIndex): SearchDocument[] {
  return index.pages.map((page) => ({
    id: page.url,
    url: page.url,
    relPath: page.relPath,
    title: page.title,
    tags: [...page.tags],
    text: plainTextForSearch(
      page.kind === "markdown" ? page.body : page.kind === "jsx" ? page.source : "",
    ),
  }));
}
