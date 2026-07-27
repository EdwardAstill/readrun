import {
  createValidationResult,
  mergeValidationResults,
  type ValidationContext,
  type ValidationResult,
} from "../../domain/validation/model.ts";
import { validateAssetRefs } from "../../domain/validation/asset-rules.ts";
import { validateBlocks } from "../../domain/validation/block-rules.ts";
import { validateLinks } from "../../domain/validation/link-rules.ts";
import { validateNavigation } from "../../domain/validation/navigation-rules.ts";
import { validateProjectConfig } from "../../domain/validation/project-rules.ts";
import type { ContentProjectSnapshot } from "../read-models/project-snapshot.ts";
import { discoverProject, type DiscoverProjectPorts } from "./discover-project.ts";

export interface ValidateProjectInput {
  root?: string;
  snapshot?: ContentProjectSnapshot;
}

export interface ValidateProjectPorts extends DiscoverProjectPorts {}

export async function validateProject(
  input: ValidateProjectInput,
  ports: ValidateProjectPorts,
): Promise<ValidationResult> {
  const snapshot = input.snapshot ??
    (input.root
      ? await discoverProject({ root: input.root }, ports)
      : null);

  if (snapshot == null) {
    return createValidationResult();
  }

  const context = validationContextFromSnapshot(snapshot);
  const results = [
    snapshot.validation ?? createValidationResult(),
    validateProjectConfig(context),
    validateNavigation(context),
    validateLinks(context),
    validateBlocks(context),
    validateAssetRefs(context),
  ];

  return mergeValidationResults(results);
}

function validationContextFromSnapshot(
  snapshot: ContentProjectSnapshot,
): ValidationContext {
  return {
    config: snapshot.config.mode === "wiki"
      ? {
          mode: "wiki",
          entryPath: snapshot.config.entryPath,
        }
      : snapshot.config.mode === "tree"
      ? {
          mode: "tree",
          navigationSource: snapshot.config.treeSource,
        }
      : undefined,
    index: snapshot.contentIndex,
    pages: snapshot.contentIndex.pages,
    assets: snapshot.assetIndex.byRelPath,
    navigationDocument:
      snapshot.config.mode === "tree" && snapshot.config.treeSource === "navigation"
        ? (snapshot.config.navigationDocument as ValidationContext["navigationDocument"])
        : undefined,
  };
}
