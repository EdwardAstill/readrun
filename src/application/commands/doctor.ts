import { defineCommand } from "citty";
import path from "node:path";
import { builtInDocsDir, pathExists, readrunConfigDir } from "./cli-helpers.ts";

export interface DoctorCheck {
  name: string;
  status: "ok" | "warn" | "fail";
  detail: string;
}

export async function runDoctorCommand(): Promise<void> {
  const checks: DoctorCheck[] = [];
  const configDir = readrunConfigDir();
  const configFile = path.join(configDir, "settings.toml");

  checks.push({
    name: "Bun runtime",
    status: typeof Bun !== "undefined" ? "ok" : "fail",
    detail: typeof Bun !== "undefined" ? `Bun ${Bun.version}` : "Bun not detected",
  });

  checks.push({
    name: "Built-in docs",
    status: (await pathExists(builtInDocsDir())) ? "ok" : "warn",
    detail: builtInDocsDir(),
  });

  checks.push({
    name: "User config",
    status: (await pathExists(configFile)) ? "ok" : "warn",
    detail: (await pathExists(configFile))
      ? configFile
      : `${configFile} (created on first run)`,
  });

  for (const check of checks) {
    const marker =
      check.status === "ok" ? "ok  " : check.status === "warn" ? "warn" : "fail";
    console.log(`${marker}  ${check.name}  ${check.detail}`);
  }

  if (checks.some((check) => check.status === "fail")) {
    process.exit(1);
  }
}

export const doctorCommand = defineCommand({
  meta: {
    name: "doctor",
    description: "Check local readrun CLI prerequisites.",
  },
  async run() {
    await runDoctorCommand();
  },
});
