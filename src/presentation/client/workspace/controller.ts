import { createInitialState } from "../../components/workspace/lib/factory.ts";
import { createWorkspaceStore } from "../../components/workspace/lib/store.ts";
import type { WorkspaceState } from "../../components/workspace/lib/types.ts";

// The view type identifies the document; the view id identifies an open instance.
// Splitting may deliberately open a second instance of the same document.
export function documentUrl(value: string, base: string): string | null {
	try {
		const url = new URL(value, base);
		if (url.origin !== new URL(base).origin || !["http:", "https:"].includes(url.protocol)) return null;
		return url.pathname + url.search + url.hash;
	} catch {
		return null;
	}
}

export function activeView(state: WorkspaceState) {
	const id = state.activeStackId ? state.stacks[state.activeStackId]?.activeViewId : null;
	return id ? state.views[id] : undefined;
}

export function createReadingWorkspace(url: string, title: string) {
	const store = createWorkspaceStore(createInitialState({ views: [{ type: url, title }] }));
	return {
		store,
		open(url: string, title: string, stackId?: string) {
			const state = store.getState();
			const key = url.split("#")[0];
			const matches = Object.values(state.views).filter((view) => view.type.split("#")[0] === key);
			const preferredStack = state.stacks[stackId ?? state.activeStackId ?? ""];
			const existing = matches.find((view) => preferredStack?.viewIds.includes(view.id)) ?? matches[0];
			if (existing) {
				store.dispatch({ type: "view/activate", viewId: existing.id });
				return existing.id;
			}
			store.dispatch({ type: "view/open", viewType: url, title, stackId });
			return activeView(store.getState())!.id;
		},
		split(direction: "horizontal" | "vertical") {
			const view = activeView(store.getState());
			if (!view) return;
			store.dispatch({ type: "stack/split", direction, viewType: view.type, title: view.title });
		},
	};
}

export type ReadingWorkspaceController = ReturnType<typeof createReadingWorkspace>;
