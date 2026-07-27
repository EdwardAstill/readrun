import type { ContentProjectSnapshot } from "../read-models/project-snapshot.ts";
import { loadContentProjectSnapshot } from "../read-models/project-snapshot.ts";
import type { ContentSource } from "../ports/content-source.ts";
import { loadProject, type LoadProjectPorts } from "./load-project.ts";

export interface DiscoverProjectInput {
  root: string;
}

export interface DiscoverProjectPorts extends LoadProjectPorts {
  contentSource: ContentSource;
}

export async function discoverProject(
  input: DiscoverProjectInput,
  ports: DiscoverProjectPorts,
): Promise<ContentProjectSnapshot> {
  const config = await loadProject(input, ports);
  return loadContentProjectSnapshot(
    {
      root: input.root,
      config,
    },
    {
      contentSource: ports.contentSource,
    },
  );
}
