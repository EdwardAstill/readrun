import type React from "react";

export interface ModelViewerProps {
	src: string;
	title?: string;
	kind?: "stl" | "gltf";
	height?: number;
}

export function ModelViewer(props: ModelViewerProps): React.JSX.Element {
	const height = props.height ?? 480;
	const kind = props.kind ?? "stl";

	return (
		<div
			className="model-viewer"
			data-model-src={props.src}
			data-model-kind={kind}
			data-model-height={height}
			style={{ height }}
		>
			<canvas className="model-canvas" />
			<div className="model-error" hidden>
				{props.title ?? "Failed to load 3D model"}
			</div>
		</div>
	);
}
