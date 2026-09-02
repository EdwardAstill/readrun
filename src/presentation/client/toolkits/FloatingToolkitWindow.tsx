import { Minus, X } from "lucide-react";
import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	useRef,
} from "react";

import { Button } from "../../components/ui/Button.tsx";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../../components/ui/ContextMenu.tsx";
import { cn } from "../../components/ui/cn.ts";
import type {
	ToolkitDefinition,
	ToolkitWindowState,
	ViewportSize,
	WindowRect,
} from "./types.ts";
import {
	clampWindowRect,
	type ToolkitWindowAction,
} from "./window-state.ts";

export interface FloatingToolkitWindowProps {
	definition: ToolkitDefinition;
	windowState: ToolkitWindowState;
	compact: boolean;
	viewport: ViewportSize;
	stackingZIndex: number;
	dispatch: Dispatch<ToolkitWindowAction>;
}

type PointerMode = "move" | "east" | "south" | "southeast";

interface PointerTransform {
	mode: PointerMode;
	pointerId: number;
	startX: number;
	startY: number;
	startRect: WindowRect;
}

export function FloatingToolkitWindow({
	definition,
	windowState,
	compact,
	viewport,
	stackingZIndex,
	dispatch,
}: FloatingToolkitWindowProps) {
	const pointerTransformRef = useRef<PointerTransform | null>(null);
	const titleId = `toolkit-window-${definition.id}-title`;

	const setRect = (rect: WindowRect): void => {
		dispatch({
			type: "set-rect",
			id: definition.id,
			rect: clampWindowRect(rect, viewport, definition.minimumSize),
			viewport,
			minimumSize: definition.minimumSize,
		});
	};

	const beginPointerTransform = (
		event: ReactPointerEvent<HTMLElement>,
		mode: PointerMode,
	): void => {
		if (event.button !== 0) return;
		if (
			mode === "move" &&
			(event.target as Element).closest(
				"button, input, [role='menuitem'], [data-resize-handle]",
			)
		) {
			return;
		}

		dispatch({ type: "raise", id: definition.id });
		pointerTransformRef.current = {
			mode,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			startRect: { ...windowState.rect },
		};
		event.currentTarget.setPointerCapture(event.pointerId);
		event.preventDefault();
	};

	const continuePointerTransform = (
		event: ReactPointerEvent<HTMLElement>,
	): void => {
		const transform = pointerTransformRef.current;
		if (!transform || transform.pointerId !== event.pointerId) return;
		const deltaX = event.clientX - transform.startX;
		const deltaY = event.clientY - transform.startY;
		const rect = { ...transform.startRect };

		if (transform.mode === "move") {
			rect.x += deltaX;
			rect.y += deltaY;
		} else {
			if (transform.mode === "east" || transform.mode === "southeast") {
				rect.width += deltaX;
			}
			if (transform.mode === "south" || transform.mode === "southeast") {
				rect.height += deltaY;
			}
		}

		setRect(rect);
	};

	const finishPointerTransform = (
		event: ReactPointerEvent<HTMLElement>,
	): void => {
		if (pointerTransformRef.current?.pointerId !== event.pointerId) return;
		pointerTransformRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const wideStyle = {
		top: `${windowState.rect.y}px`,
		left: `${windowState.rect.x}px`,
		width: `${windowState.rect.width}px`,
		height: `${windowState.rect.height}px`,
		borderRadius: "var(--radius-xl)",
	};
	const compactStyle = {
		top: "8px",
		left: "0px",
		right: "0px",
		bottom: "0px",
		width: "auto",
		height: "auto",
		borderTopLeftRadius: "var(--radius-xl)",
		borderTopRightRadius: "var(--radius-xl)",
		borderBottomLeftRadius: "0px",
		borderBottomRightRadius: "0px",
	};

	return (
		<ContextMenu
			onOpenChange={(open) => {
				if (open) dispatch({ type: "raise", id: definition.id });
			}}
		>
			<ContextMenuTrigger
				className="select-text"
				render={
					<section
						role="dialog"
						aria-modal="false"
						aria-labelledby={titleId}
						data-toolkit-id={definition.id}
						data-compact={compact ? "true" : "false"}
						data-x={windowState.rect.x}
						data-y={windowState.rect.y}
						data-width={windowState.rect.width}
						data-height={windowState.rect.height}
						hidden={windowState.minimized}
						inert={windowState.minimized}
						className={cn(
							"fixed flex flex-col overflow-hidden border bg-background text-foreground shadow-xl",
							compact ? "rounded-t-xl rounded-b-none" : "rounded-xl",
						)}
						style={{
							...(compact ? compactStyle : wideStyle),
							display: windowState.minimized ? "none" : undefined,
							zIndex: stackingZIndex,
						}}
						onPointerDown={() =>
							dispatch({ type: "raise", id: definition.id })
						}
					/>
				}
			>
			<div
				tabIndex={-1}
				aria-label={`Move ${definition.title}`}
				data-toolkit-title-bar
				className="flex shrink-0 cursor-move items-center gap-2 rounded-t-xl border-b bg-muted/70 px-2 py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
				onPointerDown={(event) => beginPointerTransform(event, "move")}
				onPointerMove={continuePointerTransform}
				onPointerUp={finishPointerTransform}
				onPointerCancel={finishPointerTransform}
			>
				<h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-medium">
					{definition.title}
				</h2>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Minimize ${definition.title}`}
					onClick={() => dispatch({ type: "minimize", id: definition.id })}
				>
					<Minus aria-hidden="true" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Close ${definition.title}`}
					onClick={() => dispatch({ type: "close", id: definition.id })}
				>
					<X aria-hidden="true" />
				</Button>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">{definition.render()}</div>

			<ResizeHandle
				label={`Resize ${definition.title} horizontally`}
				mode="east"
				className="top-10 right-0 bottom-3 w-2 cursor-ew-resize"
				onPointerDown={beginPointerTransform}
				onPointerMove={continuePointerTransform}
				onPointerEnd={finishPointerTransform}
			/>
			<ResizeHandle
				label={`Resize ${definition.title} vertically`}
				mode="south"
				className="right-3 bottom-0 left-3 h-2 cursor-ns-resize"
				onPointerDown={beginPointerTransform}
				onPointerMove={continuePointerTransform}
				onPointerEnd={finishPointerTransform}
			/>
			<ResizeHandle
				label={`Resize ${definition.title}`}
				mode="southeast"
				className="right-0 bottom-0 size-4 cursor-nwse-resize"
				onPointerDown={beginPointerTransform}
				onPointerMove={continuePointerTransform}
				onPointerEnd={finishPointerTransform}
			/>

			</ContextMenuTrigger>
			<ContextMenuContent
				aria-label={`Window menu for ${definition.title}`}
				positionerStyle={{ zIndex: stackingZIndex + 1 }}
			>
				<ContextMenuItem
					onClick={() => dispatch({ type: "close", id: definition.id })}
				>
					Close
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

function ResizeHandle({
	label,
	mode,
	className,
	onPointerDown,
	onPointerMove,
	onPointerEnd,
}: {
	label: string;
	mode: Exclude<PointerMode, "move">;
	className: string;
	onPointerDown: (
		event: ReactPointerEvent<HTMLElement>,
		mode: PointerMode,
	) => void;
	onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
	onPointerEnd: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
	return (
		<div
			role="separator"
			aria-label={label}
			aria-orientation={mode === "east" ? "vertical" : "horizontal"}
			data-resize-handle={mode}
			className={cn("absolute z-10", className)}
			onPointerDown={(event) => onPointerDown(event, mode)}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerEnd}
			onPointerCancel={onPointerEnd}
		/>
	);
}
