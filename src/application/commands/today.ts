import { defineCommand } from "citty";
import path from "node:path";
import { resolveDirectory, todayIsoDate } from "./cli-helpers.ts";
import { writePage } from "./new.ts";

export interface TodayCommandArgs {
  path?: string | null;
  folder?: string | null;
}

export async function runTodayCommand(args: TodayCommandArgs): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const folder = args.folder?.trim() || "journal";
  const date = todayIsoDate();
  const targetFile = path.join(contentDir, folder, `${date}.md`);
  const result = await writePage({
    targetFile,
    title: date,
  });

  console.log(`${result.created ? "created" : "exists "} ${result.path}`);
}

export const todayCommand = defineCommand({
  meta: {
    name: "today",
    description: "Open or create today's daily note.",
  },
  args: {
    path: {
      type: "positional",
      required: false,
      description: "Content folder (default: cwd)",
    },
    folder: {
      type: "string",
      required: false,
      default: "journal",
      description: "Subfolder for daily notes (default: journal)",
    },
  },
  async run({ args }) {
    await runTodayCommand(args as TodayCommandArgs);
  },
});
