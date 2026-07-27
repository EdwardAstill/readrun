import { defineCommand } from "citty";
import { buildContentWidgets } from "../../infrastructure/widgets/content-widgets.ts";
import { relativeToCwd, resolveDirectory } from "./cli-helpers.ts";

export interface WidgetsBuildCommandArgs {
  path?: string | null;
}

export async function runWidgetsBuildCommand(
  args: WidgetsBuildCommandArgs,
): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const result = await buildContentWidgets(contentDir);

  if (result.built.length === 0 && result.unchanged.length === 0) {
    console.log(`No widgets found under ${relativeToCwd(result.widgetsDir)}`);
    return;
  }

  for (const outputPath of result.built) {
    console.log(`built ${relativeToCwd(outputPath)}`);
  }
  for (const outputPath of result.unchanged) {
    console.log(`unchanged ${relativeToCwd(outputPath)}`);
  }
}

export const widgetsBuildCommand = defineCommand({
  meta: {
    name: "widgets-build",
    description: "Bundle .readrun/widgets/*.tsx into .readrun/.widgets-out/*.jsx.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Content folder (default: cwd)",
    },
  },
  async run({ args }) {
    await runWidgetsBuildCommand(args as WidgetsBuildCommandArgs);
  },
});
