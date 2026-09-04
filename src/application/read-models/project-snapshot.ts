import type { AssetIndex } from "../../domain/assets/model.ts";
import { buildAssetIndex } from "../../domain/assets/model.ts";
import type { Navigation } from "../../domain/navigation/model.ts";
import type { NavigationDocument } from "../../domain/navigation/schema.ts";
import { resolveNavigation } from "../../domain/navigation/resolve.ts";
import { buildContentIndex, type ContentIndex } from "../../domain/pages/content-index.ts";
import { discoverPages } from "../../domain/pages/discovery.ts";
import type { PdfPage } from "../../domain/pages/page.ts";
import { createContentScope, type ContentScope } from "../../domain/project/scope.ts";
import { detectRouteCollisions, generateSiteRoutes } from "../../domain/routes/generate.ts";
import type { SiteRoute } from "../../domain/routes/model.ts";
import { selectRootLandingPage } from "../../domain/routes/root-landing.ts";
import type {
  ContentProjectConfig,
  TreeContentProjectConfig,
  WikiContentProjectConfig,
} from "../../domain/project/model.ts";
import type { ValidationIssue, ValidationResult } from "../../domain/validation/model.ts";
import { createValidationResult } from "../../domain/validation/model.ts";
import type { ContentSource, ContentFile } from "../ports/content-source.ts";
import { resolveExecutableSourceRefs } from "./executable-source-refs.ts";

export type ContentChangeReason =
  | "initial-load"
  | "content-updated"
  | "asset-updated"
  | "navigation-updated"
  | "ignore-updated"
  | "config-updated"
  | "manual-reload";

export interface ProjectRuntimeState {
  root: string;
  startedAt: number;
  version: number;
  lastChange?: {
    at: number;
    relPath?: string;
    reason: ContentChangeReason;
  };
}

export interface ContentProjectSnapshotInput {
  root: string;
  config: ContentProjectConfig;
  files?: ContentFile[];
}

export interface ContentProjectSnapshot {
  root: string;
  builtAt: number;
  config: ContentProjectConfig;
  scope: ContentScope;
  files: ContentFile[];
  contentIndex: ContentIndex;
  assetIndex: AssetIndex;
  navigation: Navigation;
  routes: SiteRoute[];
  validation?: ValidationResult;
}

export interface LoadContentProjectSnapshotPorts {
  contentSource: ContentSource;
}

export async function loadContentProjectSnapshot(
  input: ContentProjectSnapshotInput,
  ports: LoadContentProjectSnapshotPorts,
): Promise<ContentProjectSnapshot> {
  const scope = createContentScope(input.config);
  const files = input.files ?? (await ports.contentSource.listFiles(scope));
  const pageFiles = files.filter((file) => file.decision?.kind === "page");
  const loadedPages = await Promise.all(
    pageFiles.map(async (file) => {
      if (file.relPath.toLowerCase().endsWith(".pdf")) {
        return {
          discovered: {
            filePath: file.filePath,
            relPath: file.relPath,
            mtimeMs: file.mtimeMs,
          },
          issues: [],
        };
      }

      const source = await ports.contentSource.readText(file.relPath);
      const resolved = file.relPath.endsWith(".md")
        ? await resolveExecutableSourceRefs(source, ports.contentSource)
        : { source, missing: [] };
      return {
        discovered: {
          filePath: file.filePath,
          relPath: file.relPath,
          mtimeMs: file.mtimeMs,
          source: resolved.source,
        },
        issues: resolved.missing.map((missing) => ({
          severity: "warning" as const,
          code: "executable.ref.missing",
          relPath: file.relPath,
          position: { line: missing.line },
          message: `Executable source "${missing.filename}" was not found.`,
        })),
      };
    }),
  );
  const discoveredInputs = loadedPages.map((loaded) => loaded.discovered);
  const discovery = discoverPages(
    discoveredInputs,
    input.config.mode === "wiki" ? { mode: "wiki" } : { mode: "tree" },
  );
  const pages = discovery.pages;

  const indexResult = buildContentIndex(contentIndexConfig(input.config), pages);
  const assetIndex = buildAssetIndex(files, scope);
  const navigation = resolveNavigation(
    navigationConfig(input.config),
    indexResult.index,
  );
  const routes = generateSiteRoutes({
    config: input.config,
    pages: indexResult.index.pages.map((page) => ({
      url: page.url,
      relPath: page.relPath,
      title: page.title,
    })),
    assets: [
      ...assetIndex.assets,
      ...indexResult.index.pages
        .filter((page): page is PdfPage => page.kind === "pdf")
        .map((page) => ({
          filePath: page.filePath,
          relPath: page.relPath,
          publicUrl: page.sourceUrl,
          kind: "file" as const,
          mtimeMs: page.mtimeMs,
        })),
    ],
    tags:
      indexResult.index.mode === "wiki"
        ? Array.from(indexResult.index.tags.values()).map((tag) => ({
            id: tag.id,
            label: tag.label,
            slug: tag.slug,
            pages: tag.pages.map((page) => ({
              url: page.url,
              relPath: page.relPath,
              title: page.title,
            })),
          }))
        : undefined,
  });
  const routesWithRoot = addRootLandingRoute(routes, indexResult.index, input.config);
  const issues = [
    ...toValidationIssues(input.config.issues),
    ...toValidationIssues(loadedPages.flatMap((loaded) => loaded.issues)),
    ...toValidationIssues(discovery.issues),
    ...toValidationIssues(indexResult.issues),
    ...toValidationIssues(detectRouteCollisions(routesWithRoot)),
  ];

  const builtAt = Date.now();

  return {
    root: input.root,
    builtAt,
    config: input.config,
    scope,
    files,
    contentIndex: indexResult.index,
    assetIndex,
    navigation,
    routes: routesWithRoot,
    validation: createValidationResult(issues),
  };
}

export function withValidation(
  snapshot: ContentProjectSnapshot,
  validation: ValidationResult,
): ContentProjectSnapshot {
  return {
    ...snapshot,
    validation,
  };
}

function contentIndexConfig(
  config: ContentProjectConfig,
): {
  mode: "tree" | "wiki";
  contentDir: string;
  entryPath?: string;
} {
  if (config.mode === "wiki") {
    return {
      mode: "wiki",
      contentDir: config.contentDir,
      entryPath: (config as WikiContentProjectConfig).entryPath,
    };
  }

  return {
    mode: "tree",
    contentDir: config.contentDir,
  };
}

function navigationConfig(
  config: ContentProjectConfig,
): {
  mode: "tree" | "wiki";
  navigationSource?: "filesystem" | "navigation";
  navigationDocument?: NavigationDocument;
} {
  if (config.mode === "tree") {
    return {
      mode: "tree",
      navigationSource: (config as TreeContentProjectConfig).treeSource,
      navigationDocument: config.treeSource === "navigation"
        ? (config.navigationDocument as NavigationDocument | undefined)
        : undefined,
    };
  }

  return { mode: "wiki" };
}

function toValidationIssues(
  issues: ReadonlyArray<{
    severity: "error" | "warning";
    code?: string;
    message: string;
    relPath?: string;
    position?: {
      line?: number;
      column?: number;
    };
  }>,
): ValidationIssue[] {
  return issues.map((issue) => ({
    severity: issue.severity,
    code: issue.code ?? "project.issue",
    message: issue.message,
    position: issue.relPath || issue.position
      ? {
          relPath: issue.relPath ?? "",
          line: issue.position?.line,
          column: issue.position?.column,
        }
      : undefined,
  }));
}

function addRootLandingRoute(
  routes: SiteRoute[],
  index: ContentIndex,
  config: ContentProjectConfig,
): SiteRoute[] {
  if (routes.some((route) => route.kind === "page" && route.url === "/")) {
    return routes;
  }

  const homePage = selectRootLandingPage(index, config);
  if (!homePage) {
    return routes;
  }

  return [
    {
      kind: "page",
      url: "/",
      page: {
        url: homePage.url,
        relPath: homePage.relPath,
        title: homePage.title,
      },
    },
    ...routes,
  ];
}
