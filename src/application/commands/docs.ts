import { defineCommand } from "citty";
import {
  builtInDocsDir,
  resolveExistingPath,
  serverArgs,
  type ServerArgsValues,
} from "./cli-helpers.ts";
import { runServeCommand } from "./serve.ts";

export interface DocsCommandArgs extends ServerArgsValues {}

export async function runDocsCommand(args: DocsCommandArgs): Promise<void> {
  const docsDir = await resolveExistingPath(
    builtInDocsDir(),
    () => "Built-in docs folder not found.",
  );

  await runServeCommand(
    {
      ...args,
      path: docsDir,
    },
    { source: "docs" },
  );
}

export const docsCommand = defineCommand({
  meta: {
    name: "docs",
    description: "Serve the built-in readrun docs content set.",
  },
  args: { ...serverArgs },
  async run({ args }) {
    await runDocsCommand(args as DocsCommandArgs);
  },
});
