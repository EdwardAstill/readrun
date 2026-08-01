import { existsSync } from "node:fs";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import packageJson from "../../../package.json" with { type: "json" };
import { buildStaticProject } from "../runtime/project-build.ts";
import {
  deploymentPackageIsCurrent,
  findDeploymentConflicts,
  setupDeployment,
  type DeployPlatform,
} from "./deploy-setup.ts";

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

export interface SiteInstallOptions {
  siteDir: string;
  frozenLockfile: boolean;
}

export interface DeployDependencies {
  installSiteDependencies(options: SiteInstallOptions): Promise<void>;
  resolveReadrunDependency?(): Promise<string>;
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
  dependencies: DeployDependencies = {
    installSiteDependencies,
  },
): Promise<DeployResult> {
  const gitRoot = findGitRoot(cwd);
  if (!gitRoot) {
    throw new Error("No git repository found. Run `rr deploy` from inside a git repo.");
  }

  await assertContentInsideRepository(gitRoot, options.contentDir);

  const setupOptions = {
    projectDir: gitRoot,
    contentDir: options.contentDir,
    platform: options.platform,
    force: options.force,
    readrunDependency: await (
      dependencies.resolveReadrunDependency ?? resolveReadrunDependency
    )(),
  };
  const siteDir = path.join(gitRoot, "site");
  const packageIsCurrent = await deploymentPackageIsCurrent(setupOptions);
  const conflicts = await findDeploymentConflicts(setupOptions);
  if (!options.force && !packageIsCurrent) {
    for (const artifact of ["bun.lock", "node_modules", "dist"]) {
      if (existsSync(path.join(siteDir, artifact))) {
        conflicts.push(`site/${artifact}`);
      }
    }
  }
  if (conflicts.length > 0) {
    throw new Error(
      `Deployment scaffold conflicts with existing files: ${conflicts.join(", ")}. ` +
        "Re-run with --force to overwrite them.",
    );
  }

  const useFrozenLockfile = !options.force &&
    packageIsCurrent &&
    existsSync(path.join(siteDir, "bun.lock"));

  const setup = await setupDeployment(setupOptions);
  await dependencies.installSiteDependencies({
    siteDir,
    frozenLockfile: useFrozenLockfile,
  });

  const outDir = path.join(siteDir, "dist");
  const build = await buildStaticProject({
    contentDir: options.contentDir,
    outDir,
    platform: options.platform,
    projectDir: gitRoot,
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

export async function resolveReadrunDependency(
  packageRoot = path.resolve(import.meta.dir, "../../.."),
): Promise<string> {
  if (existsSync(path.join(packageRoot, ".git"))) {
    const revision = await gitHeadRevision(packageRoot);
    if (revision) {
      return `github:EdwardAstill/readrun#${revision}`;
    }
  }

  try {
    const bunTag = (await readFile(path.join(packageRoot, ".bun-tag"), "utf8")).trim();
    const revision = bunTag.match(/(?:^|-)([0-9a-f]{7,40})$/i)?.[1];
    if (revision) {
      return `github:EdwardAstill/readrun#${revision}`;
    }
  } catch {
    // Registry packages do not have Bun's Git dependency marker.
  }

  return packageJson.version;
}

async function gitHeadRevision(packageRoot: string): Promise<string | null> {
  const subprocess = Bun.spawn(
    ["git", "-C", packageRoot, "rev-parse", "HEAD"],
    { stdout: "pipe", stderr: "ignore" },
  );
  const [exitCode, stdout] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
  ]);
  const revision = stdout.trim();
  return exitCode === 0 && /^[0-9a-f]{40}$/i.test(revision) ? revision : null;
}

export async function installSiteDependencies(
  options: SiteInstallOptions,
): Promise<void> {
  const args = [
    "bun",
    "install",
    "--cwd",
    options.siteDir,
    "--ignore-scripts",
  ];
  if (options.frozenLockfile) {
    args.push("--frozen-lockfile");
  }

  const subprocess = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
  ]);
  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim();
    throw new Error(`Failed to install site dependencies: ${detail}`);
  }
}

async function assertContentInsideRepository(
  gitRoot: string,
  contentDir: string,
): Promise<void> {
  const [repositoryPath, contentPath] = await Promise.all([
    realpath(gitRoot),
    realpath(contentDir),
  ]);
  const relativePath = path.relative(repositoryPath, contentPath);
  const isOutside = relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath);
  if (isOutside) {
    throw new Error(
      `Content folder must be inside the git repository: ${contentDir}`,
    );
  }
}

export function platformNextSteps(
  platform: DeployPlatform,
  authOutputWritten = false,
): string {
  switch (platform) {
    case "github":
      return [
        "Next steps for GitHub Pages:",
        "  1. Commit and push site/ and .github/workflows/deploy.yml",
        '  2. In repo Settings > Pages, set Source to "GitHub Actions"',
      ].join("\n");
    case "vercel":
      if (authOutputWritten) {
        return [
          "Next steps for password-protected Vercel:",
          "  1. Run `vercel deploy --prebuilt --prod` from the repository root",
          "  2. Vercel uploads the generated .vercel/output directory",
        ].join("\n");
      }
      return [
        "Next steps for Vercel:",
        "  1. Run `vercel` (or `vercel --prod`) from this directory",
        "  2. Vercel detects vercel.json and uses the build command",
      ].join("\n");
    case "netlify":
      return [
        "Next steps for Netlify:",
        "  1. Link this repo in Netlify's dashboard",
        "  2. Netlify detects netlify.toml and builds the site package",
      ].join("\n");
  }
}
