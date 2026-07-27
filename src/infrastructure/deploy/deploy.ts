import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { buildStaticProject } from "../runtime/project-build.ts";
import { setupDeployment, type DeployPlatform } from "./deploy-setup.ts";

export type { DeployPlatform } from "./deploy-setup.ts";

export interface DeployOptions {
  contentDir: string;
  platform: DeployPlatform;
  force?: boolean;
}

export interface DeployResult {
  gitRoot: string;
  contentDir: string;
  outDir: string;
  platform: DeployPlatform;
  basePath?: string;
  pagesBuilt: number;
  emittedFiles: string[];
  configCreated: string[];
  configExisting: string[];
  configOverwritten: string[];
  authOutputWritten: boolean;
  warnings: string[];
}

export function findGitRoot(cwd: string): string | null {
  let current = path.resolve(cwd);

  while (true) {
    if (existsSync(path.join(current, ".git"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export async function deploy(
  options: DeployOptions,
  cwd = process.cwd(),
): Promise<DeployResult> {
  const gitRoot = findGitRoot(cwd);
  if (!gitRoot) {
    throw new Error("No git repository found. Run `rr deploy` from inside a git repo.");
  }

  await access(options.contentDir);

  const outDir = path.join(gitRoot, "dist");
  const build = await buildStaticProject({
    contentDir: options.contentDir,
    outDir,
    platform: options.platform,
    projectDir: gitRoot,
  });

  const setup = await setupDeployment({
    projectDir: gitRoot,
    contentDir: options.contentDir,
    platform: options.platform,
    force: options.force,
  });

  return {
    gitRoot,
    contentDir: options.contentDir,
    outDir,
    platform: options.platform,
    basePath: build.basePath,
    pagesBuilt: build.snapshot.contentIndex.pages.length,
    emittedFiles: build.emittedFiles,
    configCreated: setup.created,
    configExisting: setup.existing,
    configOverwritten: setup.overwritten,
    authOutputWritten: build.authOutputWritten,
    warnings: build.warnings,
  };
}

export function platformNextSteps(platform: DeployPlatform): string {
  switch (platform) {
    case "github":
      return [
        "Next steps for GitHub Pages:",
        "  1. Commit and push .github/workflows/deploy.yml",
        '  2. In repo Settings > Pages, set Source to "GitHub Actions"',
      ].join("\n");
    case "vercel":
      return [
        "Next steps for Vercel:",
        "  1. Run `vercel` (or `vercel --prod`) from this directory",
        "  2. Vercel detects vercel.json and uses the build command",
      ].join("\n");
    case "netlify":
      return [
        "Next steps for Netlify:",
        "  1. Link this repo in Netlify's dashboard",
        "  2. Set build command: `bunx rr build . --platform=netlify`",
        "  3. Set publish directory: `dist`",
      ].join("\n");
  }
}
