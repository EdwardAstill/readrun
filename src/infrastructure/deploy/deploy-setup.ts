import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type DeployPlatform = "github" | "vercel" | "netlify";

export interface SetupDeploymentOptions {
  projectDir: string;
  contentDir: string;
  platform: DeployPlatform;
  force?: boolean;
  readrunDependency?: string;
}

export interface SetupDeploymentResult {
  created: string[];
  existing: string[];
  overwritten: string[];
}

interface DeploymentFile {
  path: string;
  content: string;
}

export async function setupDeployment(
  options: SetupDeploymentOptions,
): Promise<SetupDeploymentResult> {
  const result: SetupDeploymentResult = {
    created: [],
    existing: [],
    overwritten: [],
  };
  const contentPath = relativePathForCommand(
    path.join(options.projectDir, "site"),
    options.contentDir,
  );

  for (const file of deploymentFiles(
    options.platform,
    contentPath,
    options.readrunDependency,
  )) {
    const absolutePath = path.join(options.projectDir, file.path);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    const current = await readExisting(absolutePath);

    if (file.path === "site/.gitignore") {
      const merged = mergeSiteGitignore(current);
      if (current === merged) {
        result.existing.push(file.path);
      } else {
        await Bun.write(absolutePath, merged);
        if (current === null) {
          result.created.push(file.path);
        } else {
          result.overwritten.push(file.path);
        }
      }
      continue;
    }

    if (current === file.content) {
      result.existing.push(file.path);
      continue;
    }

    if (current !== null && !options.force) {
      result.existing.push(file.path);
      continue;
    }

    await Bun.write(absolutePath, file.content);
    if (current === null) {
      result.created.push(file.path);
    } else {
      result.overwritten.push(file.path);
    }
  }

  return result;
}

export async function findDeploymentConflicts(
  options: SetupDeploymentOptions,
): Promise<string[]> {
  if (options.force) {
    return [];
  }

  const contentPath = relativePathForCommand(
    path.join(options.projectDir, "site"),
    options.contentDir,
  );
  const conflicts: string[] = [];
  for (const file of deploymentFiles(
    options.platform,
    contentPath,
    options.readrunDependency,
  )) {
    if (file.path === "site/.gitignore") {
      continue;
    }
    const current = await readExisting(path.join(options.projectDir, file.path));
    if (current !== null && current !== file.content) {
      conflicts.push(file.path);
    }
  }
  return conflicts;
}

export async function deploymentPackageIsCurrent(
  options: SetupDeploymentOptions,
): Promise<boolean> {
  const contentPath = relativePathForCommand(
    path.join(options.projectDir, "site"),
    options.contentDir,
  );
  const packageFile = deploymentFiles(
    options.platform,
    contentPath,
    options.readrunDependency,
  ).find(
    (file) => file.path === "site/package.json",
  );
  const current = await readExisting(
    path.join(options.projectDir, "site", "package.json"),
  );
  return current !== null && current === packageFile?.content;
}

export function deploymentFiles(
  platform: DeployPlatform,
  contentPath: string,
  readrunDependency = "github:EdwardAstill/readrun",
): DeploymentFile[] {
  const siteFiles: DeploymentFile[] = [
    {
      path: "site/package.json",
      content: sitePackageJson(contentPath, readrunDependency),
    },
    {
      path: "site/.gitignore",
      content: "node_modules/\ndist/\n",
    },
  ];

  switch (platform) {
    case "github":
      return [
        ...siteFiles,
        {
          path: ".github/workflows/deploy.yml",
          content: githubPagesWorkflow(),
        },
      ];
    case "vercel":
      return [
        ...siteFiles,
        {
          path: "vercel.json",
          content: `${JSON.stringify(
            {
              $schema: "https://openapi.vercel.sh/vercel.json",
              installCommand: "bun install --cwd site --frozen-lockfile",
              buildCommand: "bun run --cwd site build:vercel",
              outputDirectory: "site/dist",
            },
            null,
            2,
          )}\n`,
        },
      ];
    case "netlify":
      return [
        ...siteFiles,
        {
          path: "netlify.toml",
          content: `[build]\n  command = "bun install --cwd site --frozen-lockfile && bun run --cwd site build:netlify"\n  publish = "site/dist"\n`,
        },
      ];
  }
}

function sitePackageJson(contentPath: string, readrunDependency: string): string {
  const command = `rr build ${shellQuote(contentPath)} --project-root=..`;
  return `${JSON.stringify(
    {
      name: "readrun-site",
      private: true,
      packageManager: "bun@1.3.14",
      scripts: {
        build: command,
        "build:github": `${command} --platform=github`,
        "build:vercel": `${command} --platform=vercel`,
        "build:netlify": `${command} --platform=netlify`,
      },
      dependencies: {
        readrun: readrunDependency,
      },
    },
    null,
    2,
  )}\n`;
}

function mergeSiteGitignore(current: string | null): string {
  const required = ["node_modules/", "dist/"];
  if (current === null) {
    return `${required.join("\n")}\n`;
  }

  const existingLines = new Set(current.split(/\r?\n/));
  const missing = required.filter((line) => !existingLines.has(line));
  if (missing.length === 0) {
    return current;
  }
  const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
  return `${current}${separator}${missing.join("\n")}\n`;
}

function githubPagesWorkflow(): string {
  return `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install --cwd site --frozen-lockfile

      - run: bun run --cwd site build:github

      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/dist

      - id: deployment
        uses: actions/deploy-pages@v4
`;
}

async function readExisting(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function relativePathForCommand(projectDir: string, contentDir: string): string {
  const relativePath = path.relative(projectDir, contentDir).replace(/\\/g, "/");
  return relativePath === "" ? "." : relativePath;
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, `'"'"'`)}'`;
}
