import type { ContentProjectSnapshot } from "../read-models/project-snapshot.ts";
import { discoverProject, type DiscoverProjectPorts } from "./discover-project.ts";

export interface BuildResult {
  snapshot: ContentProjectSnapshot;
  emittedFiles: string[];
}

export interface BuildSiteInput {
  root: string;
  outDir: string;
  basePath?: string;
}

export interface StaticArtifactOptions {
  basePath?: string;
}

export interface BuildSitePorts extends DiscoverProjectPorts {
  prepareOutput?(outDir: string): Promise<void>;
  writeStaticArtifacts(
    outDir: string,
    snapshot: ContentProjectSnapshot,
    options?: StaticArtifactOptions,
  ): Promise<string[]>;
}

export async function buildSite(
  input: BuildSiteInput,
  ports: BuildSitePorts,
): Promise<BuildResult> {
  const snapshot = await discoverProject({ root: input.root }, ports);
  await ports.prepareOutput?.(input.outDir);
  const emittedFiles = await ports.writeStaticArtifacts(input.outDir, snapshot, {
    basePath: input.basePath,
  });
  return { snapshot, emittedFiles };
}
