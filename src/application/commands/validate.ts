import { defineCommand } from "citty";
import { createFilesystemContentSource } from "../../infrastructure/filesystem/content-source.ts";
import { readProjectConfigDocuments } from "../../infrastructure/filesystem/project-config-source.ts";
import { buildContentWidgets } from "../../infrastructure/widgets/content-widgets.ts";
import { validateProject } from "../use-cases/validate-project.ts";
import {
  relativeToCwd,
  resolveDirectory,
} from "./cli-helpers.ts";

export interface ValidateCommandArgs {
  path?: string | null;
  strict?: boolean | null;
}

export interface ValidateProjectInput {
  contentDir: string;
}

export async function runValidateCommand(
  args: ValidateCommandArgs,
): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  await buildContentWidgets(contentDir);
  const result = await validateProject(
    { root: contentDir },
    {
      contentSource: createFilesystemContentSource(contentDir),
      readProjectConfigDocuments,
    },
  );

  for (const issue of result.issues) {
    const prefix = issue.severity === "error" ? "error" : "warning";
    const location = issue.position?.relPath ? ` ${issue.position.relPath}` : "";
    console.log(`${prefix} ${issue.code}${location}: ${issue.message}`);
  }

  const failed = result.errors.length > 0 || (args.strict && result.warnings.length > 0);
  const label = relativeToCwd(contentDir);
  console.log(
    failed
      ? `Validation failed for ${label}: ${result.errors.length} errors, ${result.warnings.length} warnings.`
      : `Validation passed for ${label}: ${result.warnings.length} warnings.`,
  );

  if (failed) {
    process.exit(result.errors.length > 0 ? 1 : 2);
  }
}

export const validateCommand = defineCommand({
  meta: {
    name: "validate",
    description: "Validate a content folder and its .readrun project files.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Folder to validate (default: cwd)",
    },
    strict: {
      type: "boolean",
      required: false,
      description: "Treat warnings as failures",
    },
  },
  async run({ args }) {
    await runValidateCommand(args as ValidateCommandArgs);
  },
});
