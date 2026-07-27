import type { AssetIndex } from "../../domain/assets/model.ts";
import { READRUN_ASSETS_DIR, relPathSegments } from "../../shared/paths.ts";

export interface DataFileAlias {
	url: string;
	outputPath: string;
	sourcePath: string;
}

export function dataFileAliases(assetIndex: AssetIndex): DataFileAlias[] {
	const dataPrefix = `${READRUN_ASSETS_DIR}/data/`;
	return assetIndex.assets
		.filter((asset) => asset.relPath.startsWith(dataPrefix))
		.map((asset) => ({
			relPath: asset.relPath.slice(dataPrefix.length),
			sourcePath: asset.filePath,
		}))
		.filter(({ relPath }) =>
			relPathSegments(relPath).every(
				(segment) => !segment.startsWith(".") && segment !== "__pycache__",
			),
		)
		.map(({ relPath, sourcePath }) => ({
			url: `/_readrun/files/${relPath
				.split("/")
				.map((segment) => encodeURIComponent(segment))
				.join("/")}`,
			outputPath: `_readrun/files/${relPath}`,
			sourcePath,
		}))
		.sort((left, right) => left.outputPath.localeCompare(right.outputPath));
}
