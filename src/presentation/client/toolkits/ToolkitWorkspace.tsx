import { type Dispatch, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../components/ui/Button.tsx";
import { FloatingToolkitWindow } from "./FloatingToolkitWindow.tsx";
import type {
	ToolkitDefinition,
	ToolkitId,
	ToolkitWorkspaceState,
	ViewportSize,
} from "./types.ts";
import type { ToolkitWindowAction } from "./window-state.ts";

export interface ToolkitWorkspaceProps {
	definitions: readonly ToolkitDefinition[];
	state: ToolkitWorkspaceState;
	dispatch: Dispatch<ToolkitWindowAction>;
}

export function ToolkitWorkspace({
	definitions,
	state,
	dispatch,
}: ToolkitWorkspaceProps) {
	const [viewport, setViewport] = useState<ViewportSize>(readViewport);
	const pendingFocusRef = useRef<ToolkitId | null>(null);
	const reportedUnknownIdsRef = useRef(new Set<ToolkitId>());
	const definitionsById = useMemo(
		() => new Map(definitions.map((definition) => [definition.id, definition])),
		[definitions],
	);

	useEffect(() => {
		const normalize = (): void => {
			const nextViewport = readViewport();
			setViewport(nextViewport);
			dispatch({ type: "normalize", viewport: nextViewport, definitions });
		};

		window.addEventListener("resize", normalize);
		return () => window.removeEventListener("resize", normalize);
	}, [definitions, dispatch]);

	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		for (const windowState of state.windows) {
			if (
				!definitionsById.has(windowState.id) &&
				!reportedUnknownIdsRef.current.has(windowState.id)
			) {
				reportedUnknownIdsRef.current.add(windowState.id);
				console.error(
					`Toolkit window "${windowState.id}" has no registered definition.`,
				);
			}
		}
	}, [definitionsById, state.windows]);

	useEffect(() => {
		const closeTopmostToolkit = (event: KeyboardEvent): void => {
			if (event.key !== "Escape" || event.defaultPrevented) return;
			const topmost = state.windows
				.filter(
					(windowState) =>
						!windowState.minimized && definitionsById.has(windowState.id),
				)
				.reduce<(typeof state.windows)[number] | undefined>(
					(current, windowState) =>
						!current || windowState.zIndex > current.zIndex
							? windowState
							: current,
					undefined,
				);
			if (!topmost) return;

			event.preventDefault();
			dispatch({ type: "close", id: topmost.id });
		};

		window.addEventListener("keydown", closeTopmostToolkit);
		return () => window.removeEventListener("keydown", closeTopmostToolkit);
	}, [definitionsById, dispatch, state.windows]);

	useEffect(() => {
		const toolkitId = pendingFocusRef.current;
		if (!toolkitId) return;
		const restoredWindow = state.windows.find(
			(windowState) => windowState.id === toolkitId && !windowState.minimized,
		);
		if (!restoredWindow) return;

		pendingFocusRef.current = null;
		const frame = requestAnimationFrame(() => {
			const dialog = document.querySelector<HTMLElement>(
				`[role="dialog"][data-toolkit-id="${toolkitId}"]`,
			);
			const target =
				dialog?.querySelector<HTMLElement>("[data-toolkit-primary-input]") ??
				dialog?.querySelector<HTMLElement>("textarea, input") ??
				dialog?.querySelector<HTMLElement>("[data-toolkit-title-bar]");
			target?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}, [state.windows]);

	const compact = viewport.width < 640;
	const minimized = state.windows.flatMap((windowState) => {
		const definition = definitionsById.get(windowState.id);
		return windowState.minimized && definition ? [definition] : [];
	});

	const restore = (definition: ToolkitDefinition): void => {
		pendingFocusRef.current = definition.id;
		dispatch({ type: "open", definition, viewport });
	};

	return (
		<>
			{state.windows.map((windowState) => {
				const definition = definitionsById.get(windowState.id);
				if (!definition) return null;
				return (
					<FloatingToolkitWindow
						key={windowState.id}
						definition={definition}
						windowState={windowState}
						compact={compact}
						viewport={viewport}
						dispatch={dispatch}
					/>
				);
			})}

			{minimized.length > 0 ? (
				<div
					role="toolbar"
					aria-label="Minimized toolkits"
					className="fixed right-3 bottom-3 left-3 z-50 flex flex-wrap items-center gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur"
				>
					{minimized.map((definition) => (
						<Button
							key={definition.id}
							type="button"
							variant="outline"
							size="sm"
							aria-label={`Restore ${definition.title}`}
							onClick={() => restore(definition)}
						>
							{definition.title}
						</Button>
					))}
				</div>
			) : null}
		</>
	);
}

function readViewport(): ViewportSize {
	if (typeof window === "undefined") return { width: 0, height: 0 };
	return { width: window.innerWidth, height: window.innerHeight };
}
