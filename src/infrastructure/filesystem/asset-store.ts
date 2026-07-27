import * as path from "node:path";
import { mkdir } from "node:fs/promises";

import type { AssetStore } from "../../application/ports/asset-store.ts";
import { safeJoin } from "./project-config-source.ts";

export function createFilesystemAssetStore(root: string): AssetStore {
  const normalisedRoot = path.resolve(root);

  return {
    async write(name, content) {
      const filePath = safeJoin(normalisedRoot, name);
      if (filePath == null) {
        throw new Error(`Asset path is outside store root: ${name}`);
      }

      await mkdir(path.dirname(filePath), { recursive: true });
      await Bun.write(filePath, content);
    },
  };
}
