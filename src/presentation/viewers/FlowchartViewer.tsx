import type React from "react";

export function FlowchartViewer({ src, title, height = 480 }: {
	src: string; title?: string; height?: number;
}): React.JSX.Element {
	return <figure className="my-6">
		{title && <figcaption className="mb-2 text-sm text-muted-foreground">{title}</figcaption>}
		<div data-flowchart-src={src} aria-label={title ?? "Flowchart"}
			className="flowchart-viewer overflow-hidden rounded-xl border bg-background"
			style={{ height: Number.isFinite(height) && height > 0 ? height : 480 }}>
			<p role="status">Loading flowchart…</p>
		</div>
	</figure>;
}
