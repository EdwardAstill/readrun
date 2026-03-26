import { resolve, normalize } from "path";

export function extractTitle(source: string, fallback: string): string {
  const match = source.match(/^#\s+(.+)$/m);
  return match?.[1] ?? fallback;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPathWithin(child: string, parent: string): boolean {
  const resolved = normalize(resolve(parent, child));
  const normalizedParent = normalize(resolve(parent));
  return resolved.startsWith(normalizedParent + "/") || resolved === normalizedParent;
}
