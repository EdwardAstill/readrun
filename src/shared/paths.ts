import path from "node:path";

export const READRUN_DIR = ".readrun";
export const READRUN_ASSETS_DIR = ".readrun/assets";
export const READRUN_IGNORE_PATH = ".readrun/ignore";
export const READRUN_ENTRY_PATH = ".readrun/entry.txt";
export const READRUN_NAVIGATION_PATH = ".readrun/navigation.yaml";
export const READRUN_SEARCH_INDEX_URL = "/_readrun/search-index.json";
export const READRUN_ASSET_BASE_URL = "/_readrun/assets";

export function normalisePathSlashes(value: string): string {
  return value.replaceAll("\\", "/");
}

export function stripLeadingDotSlash(value: string): string {
  return value.replace(/^(?:\.\/)+/, "");
}

export function normaliseRelPath(value: string): string {
  const normalised = normalisePathSlashes(value).trim();

  if (normalised === "") {
    return "";
  }

  const withoutPrefix = stripLeadingDotSlash(normalised).replace(/^\/+/, "");
  const resolved = path.posix.normalize(withoutPrefix);

  return resolved === "." ? "" : resolved.replace(/^\/+/, "");
}

export function relPathSegments(relPath: string): string[] {
  const normalised = normaliseRelPath(relPath);
  return normalised === "" ? [] : normalised.split("/");
}

export function hasRelPathPrefix(relPath: string, prefix: string): boolean {
  const value = normaliseRelPath(relPath);
  const candidate = normaliseRelPath(prefix);

  if (candidate === "") {
    return true;
  }

  return value === candidate || value.startsWith(`${candidate}/`);
}

export function ensureLeadingSlash(value: string): string {
  if (value === "") {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

export function trimTrailingSlash(value: string): string {
  if (value === "/") {
    return "/";
  }

  return value.replace(/\/+$/, "");
}

export function encodeUrlPath(value: string): string {
  const withSlash = ensureLeadingSlash(normalisePathSlashes(value));
  return withSlash
    .split("/")
    .map((segment, index) => (index === 0 ? "" : encodeURIComponent(segment)))
    .join("/") || "/";
}

export function urlPathJoin(...parts: string[]): string {
  const joined = parts
    .map((part) => normalisePathSlashes(part))
    .filter((part) => part.length > 0)
    .join("/");

  return encodeUrlPath(joined);
}
