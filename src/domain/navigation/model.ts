export type TreeNavigationSource = "filesystem" | "navigation";

export interface Page {
  url: string;
  filePath: string;
  relPath: string;
  title: string;
  filename: string;
  mtimeMs: number;
  kind?: "markdown" | "jsx";
  ext?: ".md" | ".jsx";
  tags?: string[];
}

export type NavigationTreeNode = NavigationTreeLeaf | NavigationTreeBranch;

export type NonEmptyArray<T> = [T, ...T[]];

export interface BaseNavigationTreeNode {
  id: string;
  label: string;
  orderPath?: number[];
}

export interface NavigationTreeLeaf extends BaseNavigationTreeNode {
  kind: "leaf";
  page: Page;
}

export interface NavigationTreeBranch extends BaseNavigationTreeNode {
  kind: "branch";
  page?: Page;
  children: NonEmptyArray<NavigationTreeNode>;
}

export type Navigation = TreeNavigation | WikiNavigation;

export interface TreeNavigation {
  mode: "tree";
  source: TreeNavigationSource;
  tree: NavigationTreeNode[];
}

export interface WikiNavigation {
  mode: "wiki";
  entryPage: Page;
  sections: WikiNavigationSection[];
}

export interface WikiNavigationSection {
  id: "all-pages" | "tags";
  label: string;
  items: WikiNavigationItem[];
}

export type WikiNavigationItem = WikiPageNavigationItem | WikiLinkNavigationItem;

export interface WikiPageNavigationItem {
  kind: "page";
  id: string;
  label: string;
  page: Page;
}

export interface WikiLinkNavigationItem {
  kind: "link";
  id: string;
  label: string;
  href: string;
  count?: number;
}
