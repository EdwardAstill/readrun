import { defineCommand } from "citty";
import {
  deploy,
  platformNextSteps,
} from "../../infrastructure/deploy/deploy.ts";
import {
  parseDeployPlatform,
  relativeToCwd,
  resolveDirectory,
  type DeployPlatform,
} from "./cli-helpers.ts";

export interface DeployCommandArgs {
  platform: string;
  path?: string | null;
  force?: boolean | null;
}

export interface DeployCommandContract {
  contentDir: string;
  outDir: string;
  platform: DeployPlatform;
  force: boolean;
}

export async function runDeployCommand(args: DeployCommandArgs): Promise<void> {
  const contentDir = await resolveDirectory(args.path);
  const platform = parseDeployPlatform(args.platform);
  const contract: DeployCommandContract = {
    contentDir,
    outDir: "",
    platform,
    force: Boolean(args.force),
  };
  const result = await deploy(contract);

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
  console.log(`Built ${result.pagesBuilt} pages into ${relativeToCwd(result.outDir)}.`);
  for (const file of result.emittedFiles) {
    console.log(`  emitted      ${file}`);
  }

  console.log("\nWriting deploy config...");
  for (const file of result.configCreated) {
    console.log(`  created      ${file}`);
  }
  for (const file of result.configOverwritten) {
    console.log(`  overwritten  ${file}`);
  }
  for (const file of result.configExisting) {
    console.log(`  exists       ${file}`);
  }
  if (result.authOutputWritten) {
    console.log("  created      .vercel/output (password-protected Vercel build output)");
  }

  console.log(`\n${platformNextSteps(result.platform)}`);
}

export const deployCommand = defineCommand({
  meta: {
    name: "deploy",
    description: "Prepare a static build and deployment config for a host.",
  },
  args: {
    platform: {
      type: "positional",
      required: true,
      description: "Deployment target: github, vercel, or netlify",
    },
    path: {
      type: "positional",
      required: false,
      description: "Content folder (default: cwd)",
    },
    force: {
      type: "boolean",
      required: false,
      default: false,
      description: "Overwrite existing deployment config files",
    },
  },
  async run({ args }) {
    await runDeployCommand(args as DeployCommandArgs);
  },
});
