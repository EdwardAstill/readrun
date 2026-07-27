import type { NavigationDocument } from "../navigation/schema.ts";
import type { ContentIndex } from "../pages/content-index.ts";
import { normalisePageRelPath, type Page } from "../pages/page.ts";
import type { ContentProjectConfig } from "../project/model.ts";

const ROOT_LANDING_REL_PATH_CANDIDATES = [
  "welcome.md",
  "welcome.jsx",
  "index.md",
  "index.jsx",
  "readme.md",
  "readme.jsx",
] as const;

export function selectRootLandingPage(
  index: ContentIndex,
  config: ContentProjectConfig,
): Page | null {
  if (index.mode === "wiki") {
    return index.entryPage;
  }

  const navigationIndexPath = getNavigationIndexPath(config);
  if (navigationIndexPath) {
    return index.byRelPath.get(navigationIndexPath) ?? null;
  }

  return (
    index.byUrl.get("/") ??
    findConventionalRootLandingPage(index) ??
    index.pages[0] ??
    null
  );
}

function getNavigationIndexPath(config: ContentProjectConfig): string | null {
  if (config.mode !== "tree" || config.treeSource !== "navigation") {
    return null;
  }

  const path = (config.navigationDocument as NavigationDocument | undefined)?.index?.path;
  return typeof path === "string" && path.trim().length > 0
    ? normalisePageRelPath(path)
    : null;
}

function findConventionalRootLandingPage(index: ContentIndex): Page | null {
  const rootPagesByRelPath = new Map<string, Page>();

  for (const page of index.pages) {
    if (!page.relPath.includes("/")) {
      rootPagesByRelPath.set(page.relPath.toLowerCase(), page);
    }
  }

  for (const relPath of ROOT_LANDING_REL_PATH_CANDIDATES) {
    const page = rootPagesByRelPath.get(relPath);
    if (page) {
      return page;
    }
  }

  return null;
}
