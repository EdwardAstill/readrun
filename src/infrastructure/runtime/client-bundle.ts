import * as path from "node:path";

export interface BundleResult {
  script: string;
  style: string;
  warnings: string[];
}

export async function bundleClient(entry?: string): Promise<BundleResult> {
  if (!entry) {
    return fallbackBundle();
  }

  const filePath = path.resolve(entry);
  if (!(await Bun.file(filePath).exists())) {
    return fallbackBundle([`Client entry not found: ${entry}`]);
  }

  try {
    const result = await Bun.build({
      entrypoints: [filePath],
      target: "browser",
      format: "esm",
      splitting: false,
      minify: false,
    });

    const script = await firstOutputText(result.outputs, ".js");
    const style = await firstOutputText(result.outputs, ".css");
    return {
      script: script ?? fallbackBundle().script,
      style: style ?? "",
      warnings: result.logs.map((log) => String(log)),
    };
  } catch (error) {
    return fallbackBundle([
      error instanceof Error ? error.message : String(error),
    ]);
  }
}

async function firstOutputText(
  outputs: readonly BuildArtifact[],
  suffix: string,
): Promise<string | undefined> {
  const artifact = outputs.find((output) => output.path.endsWith(suffix));
  if (!artifact) {
    return undefined;
  }

  return artifact.text();
}

function fallbackBundle(warnings: string[] = []): BundleResult {
  return {
    script: `window.dispatchEvent(new CustomEvent("readrun:client-ready"));`,
    style: "",
    warnings,
  };
}

type BuildArtifact = {
  path: string;
  text(): Promise<string>;
};
