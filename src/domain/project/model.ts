export type ReadrunMode = "tree" | "wiki";

export type TreeNavigationSource = "filesystem" | "navigation";

export type ContentIssueSeverity = "error" | "warning";

export interface SourcePosition {
  line: number;
  column: number;
  offset?: number;
}

export interface ContentIssue {
  severity: ContentIssueSeverity;
  message: string;
  code?: string;
  relPath?: string;
  position?: SourcePosition;
}

export interface BaseContentProjectConfig {
  contentDir: string;
  mode: ReadrunMode | "invalid";
  ignorePatterns: string[];
  issues: ContentIssue[];
}

export interface FilesystemTreeContentProjectConfig
  extends BaseContentProjectConfig {
  mode: "tree";
  treeSource: "filesystem";
}

export interface AuthoredTreeContentProjectConfig
  extends BaseContentProjectConfig {
  mode: "tree";
  treeSource: "navigation";
  navigationPath: string;
  navigationDocument?: unknown;
}

export type TreeContentProjectConfig =
  | FilesystemTreeContentProjectConfig
  | AuthoredTreeContentProjectConfig;

export interface WikiContentProjectConfig extends BaseContentProjectConfig {
  mode: "wiki";
  entryPath: string;
}

export interface InvalidContentProjectConfig extends BaseContentProjectConfig {
  mode: "invalid";
}

export type ContentProjectConfig =
  | TreeContentProjectConfig
  | WikiContentProjectConfig
  | InvalidContentProjectConfig;

export function isTreeConfig(
  config: ContentProjectConfig,
): config is TreeContentProjectConfig {
  return config.mode === "tree";
}

export function isWikiConfig(
  config: ContentProjectConfig,
): config is WikiContentProjectConfig {
  return config.mode === "wiki";
}

export function isInvalidConfig(
  config: ContentProjectConfig,
): config is InvalidContentProjectConfig {
  return config.mode === "invalid";
}
