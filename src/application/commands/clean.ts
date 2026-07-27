import { defineCommand } from "citty";
import path from "node:path";
import {
  relativeToCwd,
  removePath,
  resolveDirectory,
  resolvePath,
} from "./cli-helpers.ts";

export interface CleanCommandArgs {
  path?: string | null;
  out?: string | null;
  "dry-run"?: boolean | null;
}

export async function runCleanCommand(args: CleanCommandArgs): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const outDir = args.out ? resolvePath(args.out) : path.resolve(process.cwd(), "dist");
  const dryRun = Boolean(args["dry-run"]);
  const removedOutDir = await removePath(outDir, { dryRun });
  const removedWidgetsDir = await removePath(path.join(contentDir, ".readrun", ".widgets-out"), {
    dryRun,
  });

  if (removedOutDir) {
    console.log(`${dryRun ? "[dry-run] " : ""}removed ${relativeToCwd(outDir)}`);
  }

  if (removedWidgetsDir) {
    console.log(
      `${dryRun ? "[dry-run] " : ""}removed ${relativeToCwd(path.join(contentDir, ".readrun", ".widgets-out"))}`,
    );
  }

  if (!removedOutDir && !removedWidgetsDir) {
    console.log("Nothing to clean.");
  }
}

export const cleanCommand = defineCommand({
  meta: {
    name: "clean",
    description: "Remove generated readrun output from the working tree.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Content folder (default: cwd)",
    },
    out: {
      type: "string",
      required: false,
      description: "Explicit build output folder to remove (default: ./dist)",
    },
    "dry-run": {
      type: "boolean",
      required: false,
      default: false,
      description: "Print what would be removed without deleting",
    },
  },
  async run({ args }) {
    await runCleanCommand(args as CleanCommandArgs);
  },
});
