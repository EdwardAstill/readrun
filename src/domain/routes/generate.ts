import { READRUN_SEARCH_INDEX_URL, trimTrailingSlash } from "../../shared/paths.ts";
import type { AssetIndex, AssetRef } from "../assets/model.ts";
import type { ContentIssue } from "../project/model.ts";
import type {
  AssetRoute,
  PageRoute,
  SearchRoute,
  SiteRoute,
  SiteRouteInput,
  SystemRoute,
  TagRoute,
  TagRouteTag,
} from "./model.ts";

export function generateSiteRoutes(input: SiteRouteInput): SiteRoute[] {
  const routes: SiteRoute[] = [];

  for (const page of input.pages) {
    routes.push({
      kind: "page",
      url: normaliseRouteUrl(page.url),
      page,
    } satisfies PageRoute);
  }

  if (input.config.mode === "wiki") {
    for (const tag of normaliseTags(input.tags)) {
      routes.push({
        kind: "tag",
        url: `/tags/${encodeURIComponent(tag.slug)}/`,
        tag,
      } satisfies TagRoute);
    }
  }

  if (input.includeSearchRoute !== false) {
    routes.push({
      kind: "search-index",
      url: READRUN_SEARCH_INDEX_URL,
    } satisfies SearchRoute);
  }

  for (const asset of normaliseAssets(input)) {
    routes.push({
      kind: "asset",
      url: asset.publicUrl,
      asset,
    } satisfies AssetRoute);
  }

  for (const route of input.systemRoutes ?? []) {
    routes.push({
      ...route,
      url: normaliseRouteUrl(route.url),
    } satisfies SystemRoute);
  }

  return routes;
}

export function routeOutputPath(route: SiteRoute): string {
  if (route.kind === "asset") {
    return trimLeadingSlash(route.url);
  }

  if (route.kind === "search-index") {
    return trimLeadingSlash(route.url);
  }

  const cleanUrl = trimTrailingSlash(normaliseRouteUrl(route.url));
  const base = cleanUrl === "/" ? "" : trimLeadingSlash(cleanUrl);

  return base === "" ? "index.html" : `${base}/index.html`;
}

export function findRouteByUrl(
  routes: readonly SiteRoute[],
  url: string,
): SiteRoute | null {
  const candidate = normaliseRouteUrl(url);
  return routes.find((route) => normaliseRouteUrl(route.url) === candidate) ?? null;
}

export function detectRouteCollisions(
  routes: readonly SiteRoute[],
): ContentIssue[] {
  const byUrl = new Map<string, SiteRoute[]>();

  for (const route of routes) {
    const key = normaliseRouteUrl(route.url);
    const bucket = byUrl.get(key) ?? [];
    bucket.push(route);
    byUrl.set(key, bucket);
  }

  const issues: ContentIssue[] = [];

  for (const [url, bucket] of byUrl) {
    if (bucket.length < 2) {
      continue;
    }

    issues.push({
      severity: "error",
      code: "route.collision",
      message: `Multiple routes resolve to ${url}.`,
    });
  }

  return issues;
}

function normaliseAssets(input: SiteRouteInput) {
  const assets = input.assets;

  if (!assets) {
    return [];
  }

  return isAssetIndex(assets) ? assets.assets : assets;
}

function normaliseTags(
  tags: SiteRouteInput["tags"],
): ReadonlyArray<TagRouteTag> {
  if (!tags) {
    return [];
  }

  return isReadonlyMap(tags) ? [...tags.values()] : tags;
}

function isReadonlyMap(
  value: NonNullable<SiteRouteInput["tags"]>,
): value is ReadonlyMap<string, TagRouteTag> {
  return "get" in value && "has" in value && "size" in value;
}

function isAssetIndex(
  value: NonNullable<SiteRouteInput["assets"]>,
): value is AssetIndex {
  return !Array.isArray(value) && "assets" in value;
}

function normaliseRouteUrl(url: string): string {
  if (url === "" || url === "/") {
    return "/";
  }

  if (url.startsWith("/_readrun/") || /\.[a-z0-9]+$/i.test(url)) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  const withSlash = url.startsWith("/") ? url : `/${url}`;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, "");
}
