import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type DeployPlatform = "github" | "vercel" | "netlify";

export interface SetupDeploymentOptions {
  projectDir: string;
  contentDir: string;
  platform: DeployPlatform;
  force?: boolean;
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
  const contentPath = relativePathForCommand(options.projectDir, options.contentDir);

  for (const file of deploymentFiles(options.platform, contentPath)) {
    const absolutePath = path.join(options.projectDir, file.path);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    const current = await readExisting(absolutePath);

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

export function deploymentFiles(
  platform: DeployPlatform,
  contentPath: string,
): DeploymentFile[] {
  switch (platform) {
    case "github":
      return [
        {
          path: ".github/workflows/deploy.yml",
          content: githubPagesWorkflow(contentPath),
        },
      ];
    case "vercel":
      return [
        {
          path: "vercel.json",
          content: `${JSON.stringify(
            {
              buildCommand: `bunx rr build ${shellQuote(contentPath)} --platform=vercel`,
              outputDirectory: "dist",
            },
            null,
            2,
          )}\n`,
        },
      ];
    case "netlify":
      return [
        {
          path: "netlify.toml",
          content: `[build]\n  command = "bunx rr build ${tomlEscape(contentPath)} --platform=netlify"\n  publish = "dist"\n`,
        },
      ];
  }
}

function githubPagesWorkflow(contentPath: string): string {
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

      - run: bun install

      - run: bunx rr build ${shellQuote(contentPath)} --platform=github

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

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

function tomlEscape(value: string): string {
  return shellQuote(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
