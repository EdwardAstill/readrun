import {
  READRUN_ASSET_BASE_URL,
  READRUN_ASSETS_DIR,
  ensureLeadingSlash,
  normaliseRelPath,
} from "../../shared/paths.ts";
import {
  explainScopeDecision,
  type ContentScope,
} from "../project/scope.ts";

export type AssetKind =
  | "image"
  | "script"
  | "data"
  | "file"
  | "media"
  | "unknown";

export interface AssetSourceEntry {
  filePath: string;
  relPath: string;
  mtimeMs?: number;
}

export interface AssetRef {
  filePath: string;
  relPath: string;
  publicUrl: string;
  kind: AssetKind;
  mtimeMs?: number;
}

export interface AssetIndex {
  assets: AssetRef[];
  byRelPath: Map<string, AssetRef>;
  byUrl: Map<string, AssetRef>;
}

export function buildAssetIndex(
  entries: AssetSourceEntry[],
  scope: ContentScope,
): AssetIndex {
  const assets: AssetRef[] = [];
  const byRelPath = new Map<string, AssetRef>();
  const byUrl = new Map<string, AssetRef>();

  for (const entry of entries) {
    const relPath = normaliseRelPath(entry.relPath);
    const decision = explainScopeDecision(relPath, scope);

    if (decision.kind !== "asset") {
      continue;
    }

    const asset: AssetRef = {
      filePath: entry.filePath,
      relPath,
      publicUrl: assetUrlFromRelPath(relPath),
      kind: classifyAsset(relPath),
      mtimeMs: entry.mtimeMs,
    };

    assets.push(asset);
    byRelPath.set(asset.relPath, asset);
    byUrl.set(asset.publicUrl, asset);
  }

  assets.sort((left, right) => left.relPath.localeCompare(right.relPath));

  return { assets, byRelPath, byUrl };
}

export function assetUrlFromRelPath(relPath: string): string {
  const normalised = normaliseRelPath(relPath);
  const assetRelPath = normalised.startsWith(`${READRUN_ASSETS_DIR}/`)
    ? normalised.slice(READRUN_ASSETS_DIR.length + 1)
    : normalised;

  const encodedSegments = assetRelPath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return ensureLeadingSlash(`${READRUN_ASSET_BASE_URL}/${encodedSegments}`);
}

export function classifyAsset(relPath: string): AssetKind {
  const normalised = normaliseRelPath(relPath);
  const ext = extensionOf(normalised);

  if (
    normalised.startsWith(`${READRUN_ASSETS_DIR}/scripts/`) ||
    [".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".sh"].includes(ext)
  ) {
    return "script";
  }

  if (
    normalised.startsWith(`${READRUN_ASSETS_DIR}/data/`) ||
    [".json", ".csv", ".tsv", ".yaml", ".yml", ".toml", ".xml"].includes(ext)
  ) {
    return "data";
  }

  if (
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp", ".ico"].includes(
      ext,
    )
  ) {
    return "image";
  }

  if (
    [".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".oga", ".flac", ".m4a"].includes(
      ext,
    )
  ) {
    return "media";
  }

  if (ext !== "") {
    return "file";
  }

  return "unknown";
}

function extensionOf(relPath: string): string {
  const filename = relPath.split("/").at(-1) ?? "";
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}
