import {
  READRUN_ASSETS_DIR,
  READRUN_ENTRY_PATH,
  READRUN_IGNORE_PATH,
  READRUN_NAVIGATION_PATH,
  hasRelPathPrefix,
  normaliseRelPath,
  relPathSegments,
} from "../../shared/paths.ts";
import type { ContentProjectConfig } from "./model.ts";
import {
  compileIgnorePatterns,
  parseIgnore,
  shouldIgnoreRelPath,
  type CompiledIgnorePattern,
} from "./ignore.ts";

export type ScopeKind =
  | "page"
  | "asset"
  | "config"
  | "ignored"
  | "private"
  | "generated"
  | "external"
  | "unsupported";

export type ScopeReason =
  | "outside-content-root"
  | "matched-ignore-pattern"
  | "default-ignored-dir"
  | "project-config"
  | "project-asset"
  | "project-private"
  | "generated-output"
  | "supported-page"
  | "unsupported-path";

export interface ScopeDecision {
  relPath: string;
  public: boolean;
  kind: ScopeKind;
  reason: ScopeReason;
}

export interface ContentScope {
  config: ContentProjectConfig;
  compiledIgnorePatterns: CompiledIgnorePattern[];
}

export function createContentScope(config: ContentProjectConfig): ContentScope {
  const parsedPatterns = config.ignorePatterns.flatMap((pattern, index) => {
    const parsed = parseIgnore(pattern);
    return parsed.length > 0 ? parsed : [{ pattern, line: index + 1 }];
  });
  const compiledIgnorePatterns = compileIgnorePatterns(parsedPatterns);

  return { config, compiledIgnorePatterns };
}

export function isPublicContentPath(
  relPath: string,
  scope: ContentScope,
): boolean {
  return explainScopeDecision(relPath, scope).public;
}

export function isPublicPagePath(relPath: string, scope: ContentScope): boolean {
  return explainScopeDecision(relPath, scope).kind === "page";
}

export function isPublicAssetPath(relPath: string, scope: ContentScope): boolean {
  return explainScopeDecision(relPath, scope).kind === "asset";
}

export function isProjectConfigPath(
  relPath: string,
  scope: ContentScope,
): boolean {
  return explainScopeDecision(relPath, scope).kind === "config";
}

export function explainScopeDecision(
  relPath: string,
  scope: ContentScope,
): ScopeDecision {
  const normalised = normaliseRelPath(relPath);

  if (
    normalised === "" ||
    normalised.startsWith("../") ||
    normalised === ".." ||
    relPath.startsWith("/")
  ) {
    return decision(normalised, false, "external", "outside-content-root");
  }

  if (isGeneratedPath(normalised)) {
    return decision(normalised, false, "generated", "generated-output");
  }

  if (shouldIgnoreRelPath(normalised, scope.compiledIgnorePatterns)) {
    const reason = relPathSegments(normalised).some((segment) =>
      ["dist", "build", "out", "coverage", ".git", "node_modules"].includes(segment),
    )
      ? "default-ignored-dir"
      : "matched-ignore-pattern";

    return decision(normalised, false, "ignored", reason);
  }

  if (isConfigPath(normalised)) {
    return decision(normalised, false, "config", "project-config");
  }

  if (hasRelPathPrefix(normalised, READRUN_ASSETS_DIR)) {
    return normalised === READRUN_ASSETS_DIR
      ? decision(normalised, false, "private", "project-private")
      : decision(normalised, true, "asset", "project-asset");
  }

  if (normalised.startsWith(".readrun/")) {
    return decision(normalised, false, "private", "project-private");
  }

  if (relPathSegments(normalised).some((segment) => segment.startsWith("."))) {
    return decision(normalised, false, "private", "project-private");
  }

  if (/\.(md|jsx|pdf)$/i.test(normalised)) {
    return decision(normalised, true, "page", "supported-page");
  }

  return decision(normalised, false, "unsupported", "unsupported-path");
}

function decision(
  relPath: string,
  isPublic: boolean,
  kind: ScopeKind,
  reason: ScopeReason,
): ScopeDecision {
  return {
    relPath,
    public: isPublic,
    kind,
    reason,
  };
}

function isConfigPath(relPath: string): boolean {
  return (
    relPath === READRUN_IGNORE_PATH ||
    relPath === READRUN_ENTRY_PATH ||
    relPath === READRUN_NAVIGATION_PATH
  );
}

function isGeneratedPath(relPath: string): boolean {
  return (
    relPath === ".readrun/.widgets-out" ||
    hasRelPathPrefix(relPath, ".readrun/.widgets-out") ||
    relPath === ".readrun/dist" ||
    hasRelPathPrefix(relPath, ".readrun/dist")
  );
}
