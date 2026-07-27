import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuPositioner,
	DropdownMenuSeparator,
} from "../../components/ui/DropdownMenu.tsx";
import { openOverlay } from "../overlay.ts";
import { commitSettings, loadSettings } from "../settings.ts";

interface AnchorPoint {
	x: number;
	y: number;
}

export function ContextMenuIsland(): React.JSX.Element {
	const [open, setOpen] = useState(false);
	const [point, setPoint] = useState<AnchorPoint>({ x: 0, y: 0 });
	const popupRef = useRef<HTMLDivElement | null>(null);
	const openMethodRef = useRef<"keyboard" | "pointer">("pointer");
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const close = useCallback(() => setOpen(false), []);
	const anchor = useMemo(
		() => ({
			contextElement: returnFocusRef.current ?? undefined,
			getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
		}),
		[point],
	);

	useEffect(() => {
		const openAt = (
			target: HTMLElement,
			nextPoint: AnchorPoint,
			method: "keyboard" | "pointer",
		): void => {
			returnFocusRef.current = target;
			openMethodRef.current = method;
			setPoint(nextPoint);
			setOpen(true);
		};
		const isContentTarget = (target: HTMLElement): boolean =>
			Boolean(target.closest(".readrun-article, .readrun-main, .markdown-body"));

		const handleContextMenu = (event: MouseEvent): void => {
			const target = event.target;
			if (!(target instanceof HTMLElement) || !isContentTarget(target)) return;
			event.preventDefault();
			openAt(target, { x: event.clientX, y: event.clientY }, "pointer");
		};
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (
				event.key !== "ContextMenu" &&
				!(event.shiftKey && event.key === "F10")
			) {
				return;
			}
			const target = event.target;
			if (!(target instanceof HTMLElement) || !isContentTarget(target)) return;
			event.preventDefault();
			const rect = target.getBoundingClientRect();
			openAt(target, { x: rect.left + 8, y: rect.top + 8 }, "keyboard");
		};

		document.addEventListener("contextmenu", handleContextMenu);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("contextmenu", handleContextMenu);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	useEffect(() => {
		if (!open || openMethodRef.current !== "keyboard") return;
		const frame = requestAnimationFrame(() => {
			popupRef.current
				?.querySelector<HTMLElement>("[role='menuitem']")
				?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}, [open, point]);

	useEffect(() => {
		if (!open) return;
		document.addEventListener("scroll", close, true);
		return () => document.removeEventListener("scroll", close, true);
	}, [close, open]);

	const runAction = (action: () => void): void => {
		close();
		action();
	};

	return (
		<DropdownMenu
			open={open}
			modal={false}
			onOpenChange={(nextOpen, details) => {
				setOpen(nextOpen);
				if (!nextOpen && details.reason === "escape-key") {
					returnFocusRef.current?.focus();
				}
			}}
		>
			<DropdownMenuPortal>
				<DropdownMenuPositioner
					anchor={anchor}
					positionMethod="fixed"
					side="bottom"
					align="start"
					collisionPadding={8}
				>
					<DropdownMenuContent
						id="context-menu"
						finalFocus={false}
						ref={popupRef}
					>
						<DropdownMenuItem
							onClick={() =>
								runAction(() => openOverlay("settings-overlay"))
							}
						>
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								runAction(() => openOverlay("page-search-overlay"))
							}
						>
							Search Page
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								runAction(() => openOverlay("site-search-overlay"))
							}
						>
							Search Site
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() =>
								runAction(() => {
									const settings = loadSettings();
									settings.showSidebar = !settings.showSidebar;
									commitSettings(settings);
								})
							}
						>
							Toggle Sidebar
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								runAction(() => {
									const settings = loadSettings();
									settings.focusMode = !settings.focusMode;
									commitSettings(settings);
								})
							}
						>
							Toggle Focus Mode
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenuPositioner>
			</DropdownMenuPortal>
		</DropdownMenu>
	);
}
