import type { ContentScope, ScopeDecision } from "../../domain/project/scope.ts";

export interface ContentFile {
  filePath: string;
  relPath: string;
  mtimeMs: number;
  size?: number;
  decision?: ScopeDecision;
}

export interface ContentSource {
  listFiles(scope: ContentScope): Promise<ContentFile[]>;
  readText(relPath: string): Promise<string>;
}
