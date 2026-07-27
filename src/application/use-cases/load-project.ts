import { resolveProjectMode } from "../../domain/project/config-schema.ts";
import type { ContentProjectConfig } from "../../domain/project/model.ts";
import type { ProjectConfigDocuments } from "../../domain/project/config-schema.ts";

export interface LoadProjectInput {
  root: string;
}

export interface LoadProjectPorts {
  readProjectConfigDocuments(root: string): Promise<ProjectConfigDocuments>;
}

export async function loadProject(
  input: LoadProjectInput,
  ports: LoadProjectPorts,
): Promise<ContentProjectConfig> {
  const docs = await ports.readProjectConfigDocuments(input.root);
  return resolveProjectMode(docs);
}
