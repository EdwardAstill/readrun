import path from "node:path";
import { rm } from "node:fs/promises";

import type { BuildPlatform } from "../../application/commands/cli-helpers.ts";
import type { BuildResult } from "../../application/use-cases/build-site.ts";
import { buildSite } from "../../application/use-cases/build-site.ts";
import {
  formatPasswordAuthLookupWarning,
  formatPasswordAuthPath,
  readPasswordAuthConfig,
  writeVercelPasswordProtectedOutput,
} from "../auth/build-auth.ts";
import {
  formatPasswordFileIssue,
  inspectPasswordFile,
} from "../auth/password-auth.ts";
import { createFilesystemContentSource } from "../filesystem/content-source.ts";
import { readProjectConfigDocuments } from "../filesystem/project-config-source.ts";
import { buildContentWidgets } from "../widgets/content-widgets.ts";
import { writePlatformSiteFiles, writeStaticArtifacts } from "./static-artifacts.ts";

export interface StaticProjectBuildOptions {
  contentDir: string;
  outDir: string;
  platform: BuildPlatform;
  projectDir: string;
}

export interface StaticProjectBuildResult extends BuildResult {
  warnings: string[];
  authOutputWritten: boolean;
  basePath?: string;
}

export async function buildStaticProject(
  options: StaticProjectBuildOptions,
): Promise<StaticProjectBuildResult> {
  await buildContentWidgets(options.contentDir);

  const passwordAuth = await readPasswordAuthConfig({
    contentDir: options.contentDir,
    projectDir: options.projectDir,
  });
  const warnings: string[] = [];

  if (passwordAuth) {
    const passwordPath = formatPasswordAuthPath(options.projectDir, passwordAuth);
    for (const warning of passwordAuth.lookupWarnings ?? []) {
      warnings.push(formatPasswordAuthLookupWarning(options.projectDir, warning));
    }

    const inspection = await inspectPasswordFile(passwordAuth.passwordFile);
    for (const issue of inspection?.issues ?? []) {
      if (issue.severity === "warning") {
        warnings.push(`${passwordPath} ${formatPasswordFileIssue(issue)}`);
      }
    }

    if (options.platform !== "vercel") {
      warnings.push(
        `found ${passwordPath}, but password protection is only generated for --platform=vercel.`,
      );
    }
  }

  const basePath = options.platform === "github"
    ? githubProjectBasePath(options.projectDir)
    : undefined;
  const result = await buildSite(
    { root: options.contentDir, outDir: options.outDir, basePath },
    {
      contentSource: createFilesystemContentSource(options.contentDir),
      readProjectConfigDocuments,
      prepareOutput: (outDir) =>
        resetBuildOutput(options.contentDir, outDir, options.projectDir),
      writeStaticArtifacts,
    },
  );
  result.emittedFiles.push(
    ...await writePlatformSiteFiles(options.outDir, options.platform),
  );

  const authOutputWritten = passwordAuth !== null && options.platform === "vercel";
  if (authOutputWritten) {
    await writeVercelPasswordProtectedOutput(
      options.projectDir,
      options.outDir,
      passwordAuth,
    );
  } else {
    await rm(path.join(options.projectDir, ".vercel", "output"), {
      recursive: true,
      force: true,
    });
  }

  return { ...result, warnings, authOutputWritten, basePath };
}

function githubProjectBasePath(projectDir: string): string | undefined {
  const repositoryName = path.basename(path.resolve(projectDir));
  if (!repositoryName || repositoryName.toLowerCase().endsWith(".github.io")) {
    return undefined;
  }
  return `/${repositoryName}`;
}

async function resetBuildOutput(
  contentDir: string,
  outDir: string,
  projectDir: string,
): Promise<void> {
  const source = path.resolve(contentDir);
  const output = path.resolve(outDir);

  if (containsPath(output, source)) {
    throw new Error(
      `Refusing to replace build output because it contains the content folder: ${output}`,
    );
  }

  if (containsPath(output, path.resolve(projectDir))) {
    throw new Error(
      `Refusing to replace build output because it contains the working directory: ${output}`,
    );
  }

  await rm(output, { recursive: true, force: true });
}

function containsPath(container: string, candidate: string): boolean {
  const relative = path.relative(container, candidate);
  return relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative));
}
