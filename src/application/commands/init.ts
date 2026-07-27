import { defineCommand } from "citty";
import path from "node:path";
import {
  ensureDirectory,
  pathExists,
  relativeToCwd,
  resolvePath,
} from "./cli-helpers.ts";

const IGNORE_TEMPLATE = `# One glob pattern per line.
# Blank lines and # comments are ignored.

drafts/**
`;

export interface InitCommandArgs {
  path?: string | null;
}

export interface InitCommandResult {
  created: string[];
  existing: string[];
}

export async function runInitCommand(args: InitCommandArgs): Promise<void> {
  const targetDir = resolvePath(args.path);
  const readrunDir = path.join(targetDir, ".readrun");
  const created: string[] = [];
  const existing: string[] = [];

  for (const relativeDir of [
    ".readrun",
    ".readrun/assets",
    ".readrun/assets/images",
    ".readrun/assets/data",
    ".readrun/widgets",
  ]) {
    const absoluteDir = path.join(targetDir, relativeDir);
    if (await pathExists(absoluteDir)) {
      existing.push(relativeDir);
      continue;
    }

    await ensureDirectory(absoluteDir);
    created.push(relativeDir);
  }

  const ignorePath = path.join(readrunDir, "ignore");
  if (await pathExists(ignorePath)) {
    existing.push(".readrun/ignore");
  } else {
    await Bun.write(ignorePath, IGNORE_TEMPLATE satisfies string);
    created.push(".readrun/ignore");
  }

  printInitResult({ created, existing }, targetDir);
}

function printInitResult(result: InitCommandResult, targetDir: string): void {
  console.log(`Initialised ${relativeToCwd(targetDir)}`);

  for (const entry of result.created) {
    console.log(`  created  ${entry}`);
  }

  for (const entry of result.existing) {
    console.log(`  exists   ${entry}`);
  }

  if (result.created.length === 0) {
    console.log("Nothing to do.");
  }

  console.log("  next     add .readrun/navigation.yaml for authored tree mode");
  console.log("  next     or add .readrun/entry.txt for wiki mode");
}

export const initCommand = defineCommand({
  meta: {
    name: "init",
    description: "Scaffold the base .readrun project directories.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Target folder (default: cwd)",
    },
  },
  async run({ args }) {
    await runInitCommand(args as InitCommandArgs);
  },
});
