import { createRoot, type Root } from "react-dom/client";
import { parseFlowchart } from "../../domain/flowchart/model.ts";

export function initFlowcharts(root: ParentNode = document): () => void {
	const controller = new AbortController();
	const mounted: Root[] = [];
	for (const host of root.querySelectorAll<HTMLElement>("[data-flowchart-src]")) {
		void (async () => {
			try {
				const response = await fetch(host.dataset.flowchartSrc!, { signal: controller.signal });
				if (!response.ok) throw new Error(`Could not load JSON (HTTP ${response.status}).`);
				const definition = parseFlowchart(await response.text());
				const { Flowchart } = await import("../viewers/Flowchart.tsx");
				if (controller.signal.aborted) return;
				const reactRoot = createRoot(host);
				mounted.push(reactRoot);
				reactRoot.render(<Flowchart definition={definition} />);
			} catch (cause) {
				if (controller.signal.aborted) return;
				const error = document.createElement("p");
				error.setAttribute("role", "alert");
				error.textContent = `Flowchart could not load: ${cause instanceof Error ? cause.message : String(cause)}`;
				host.replaceChildren(error);
			}
		})();
	}
	return () => {
		controller.abort();
		for (const reactRoot of mounted) reactRoot.unmount();
	};
}
