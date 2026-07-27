import { parseBlocks } from "../blocks/parser.ts";
import { getBlockDefinition } from "../blocks/registry.ts";
import { READRUN_ASSETS_DIR, normaliseRelPath } from "../../shared/paths.ts";

import {
  createValidationResult,
  warning,
  type ValidationAssetRefLike,
  type ValidationContext,
  type ValidationResult,
} from "./model.ts";

const ASSET_ATTR_NAMES = ["src", "path", "file", "href"];

export function validateAssetRefs(
  context: ValidationContext,
): ValidationResult {
  const issues = [];
  const pages = context.pages ?? context.index?.pages ?? [];
  const assetMap = toAssetMap(context.assets);

  for (const page of pages) {
    if (page.kind && page.kind !== "markdown") {
      continue;
    }

    const parsed = parseBlocks(page.body ?? "");
    for (const block of parsed.blocks) {
      const definition = getBlockDefinition(block.name);
      if (!definition || definition.category !== "asset") {
        continue;
      }

      for (const attr of block.attrs) {
        if (!ASSET_ATTR_NAMES.includes(attr.name) || typeof attr.value !== "string") {
          continue;
        }

        if (!assetExists(assetMap, attr.value)) {
          issues.push(
            warning({
              code: "asset.missing",
              message: `Asset "${attr.value}" referenced by block "${block.name}" in "${page.relPath}" was not found.`,
            }),
          );
        }
      }
    }
  }

  return createValidationResult(issues);
}

function assetExists(
  assetMap: Map<string, ValidationAssetRefLike>,
  value: string,
): boolean {
  const normalised = normaliseRelPath(value);
  return assetMap.has(normalised) ||
    assetMap.has(`${READRUN_ASSETS_DIR}/${normalised}`);
}

function toAssetMap(
  assets: ValidationContext["assets"],
): Map<string, ValidationAssetRefLike> {
  if (assets instanceof Map) {
    return assets;
  }

  return new Map((assets ?? []).map((asset) => [asset.relPath, asset]));
}
