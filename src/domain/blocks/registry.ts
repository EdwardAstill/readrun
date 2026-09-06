export interface BlockDefinition {
  name: string;
  category: "executable" | "viewer" | "asset" | "quiz" | "other";
  aliases?: string[];
}

export const BLOCK_REGISTRY: BlockDefinition[] = [
  { name: "run", category: "executable", aliases: ["exec"] },
  { name: "python", category: "executable", aliases: ["py"] },
  { name: "jsx", category: "executable" },
  { name: "plot-jsx", category: "executable" },
  { name: "query", category: "executable" },
  { name: "upload", category: "other" },
  { name: "include", category: "other" },
  { name: "raw", category: "other" },
  { name: "viewer", category: "viewer" },
  { name: "csv", category: "viewer" },
  { name: "flowchart", category: "viewer" },
  { name: "stl", category: "viewer" },
  { name: "model", category: "viewer" },
  { name: "pdf", category: "viewer" },
  { name: "image", category: "asset" },
  { name: "audio", category: "asset" },
  { name: "video", category: "asset" },
  { name: "file", category: "asset" },
  { name: "quiz", category: "quiz" },
];

const VOID_BLOCK_NAMES = new Set([
  "upload",
  "include",
  "query",
  "viewer",
  "csv",
  "flowchart",
  "stl",
  "model",
  "pdf",
  "image",
  "audio",
  "video",
  "file",
]);

export const EXECUTABLE_BLOCKS = BLOCK_REGISTRY.filter(
  (definition) => definition.category === "executable",
);

export const VIEWER_BLOCKS = BLOCK_REGISTRY.filter(
  (definition) => definition.category === "viewer",
);

export const ASSET_BLOCKS = BLOCK_REGISTRY.filter(
  (definition) => definition.category === "asset",
);

export function getBlockDefinition(name: string): BlockDefinition | null {
  const normalised = name.trim().toLowerCase();
  return (
    BLOCK_REGISTRY.find(
      (definition) =>
        definition.name === normalised ||
        definition.aliases?.includes(normalised),
    ) ?? null
  );
}

export function isVoidBlock(name: string): boolean {
  const definition = getBlockDefinition(name);
  return VOID_BLOCK_NAMES.has(name.trim().toLowerCase()) ||
    (definition?.aliases ?? []).some((alias) => VOID_BLOCK_NAMES.has(alias));
}

export function isOpaqueBlock(name: string): boolean {
  const normalised = name.trim().toLowerCase();
  const definition = getBlockDefinition(normalised);

  return normalised === "raw" ||
    (definition?.category === "executable" && !isVoidBlock(normalised));
}
