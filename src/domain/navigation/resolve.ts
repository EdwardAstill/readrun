import type { Navigation, TreeNavigationSource } from "./model.ts";
import { buildAuthoredTree, buildFilesystemTree, type TreeContentIndexLike } from "./tree.ts";
import { buildWikiNavigation, type WikiContentIndexLike } from "./wiki.ts";
import type { NavigationDocument } from "./schema.ts";

export interface NavigationConfigLike {
  mode: "tree" | "wiki";
  navigationSource?: TreeNavigationSource;
  navigationDocument?: NavigationDocument;
}

export function resolveNavigation(
  config: NavigationConfigLike,
  index: TreeContentIndexLike | WikiContentIndexLike,
): Navigation {
  if (config.mode === "wiki") {
    const wikiIndex = index as WikiContentIndexLike;
    return buildWikiNavigation(wikiIndex);
  }

  const source = config.navigationSource ?? "filesystem";
  const tree =
    source === "navigation" && config.navigationDocument
      ? buildAuthoredTree(config.navigationDocument, index as TreeContentIndexLike)
      : buildFilesystemTree(index.pages);

  return {
    mode: "tree",
    source,
    tree,
  };
}
