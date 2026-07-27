import type React from "react";

import { CsvViewer } from "../../viewers/CsvViewer.tsx";
import { MediaViewer } from "../../viewers/MediaViewer.tsx";
import { ModelViewer } from "../../viewers/ModelViewer.tsx";
import { PdfViewer } from "../../viewers/PdfViewer.tsx";

export interface ViewerBlockProps {
	kind?: "csv" | "image" | "audio" | "video" | "file" | "model" | "pdf";
	src?: string;
	source?: string;
	title?: string;
	height?: number;
}

export function ViewerBlock(props: ViewerBlockProps): React.JSX.Element {
	switch (props.kind) {
		case "csv":
			return <CsvViewer source={props.source} caption={props.title} />;
		case "audio":
		case "video":
		case "file":
		case "image":
			return (
				<MediaViewer
					kind={props.kind}
					src={props.src ?? ""}
					title={props.title}
				/>
			);
		case "model":
			return (
				<ModelViewer
					src={props.src ?? ""}
					title={props.title}
					kind={modelKindFromSrc(props.src)}
					height={props.height}
				/>
			);
		case "pdf":
			return <PdfViewer src={props.src ?? ""} title={props.title} />;
		default:
			return (
				<MediaViewer kind="file" src={props.src ?? ""} title={props.title} />
			);
	}
}

function modelKindFromSrc(src?: string): "stl" | "gltf" {
	if (!src) return "stl";
	const lower = src.toLowerCase();
	if (lower.endsWith(".glb") || lower.endsWith(".gltf")) return "gltf";
	return "stl";
}
