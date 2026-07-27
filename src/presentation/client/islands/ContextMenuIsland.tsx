import { Menu } from "@base-ui/react/menu";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
		<Menu.Root
			open={open}
			modal={false}
			onOpenChange={(nextOpen, details) => {
				setOpen(nextOpen);
				if (!nextOpen && details.reason === "escape-key") {
					returnFocusRef.current?.focus();
				}
			}}
		>
			<Menu.Portal>
				<Menu.Positioner
					className="context-menu__positioner"
					anchor={anchor}
					positionMethod="fixed"
					side="bottom"
					align="start"
					collisionPadding={8}
				>
					<Menu.Popup
						id="context-menu"
						className="context-menu"
						finalFocus={false}
						ref={popupRef}
					>
						<Menu.Item
							className="context-menu__item"
							onClick={() =>
								runAction(() => openOverlay("settings-overlay"))
							}
						>
							Settings
						</Menu.Item>
						<Menu.Item
							className="context-menu__item"
							onClick={() =>
								runAction(() => openOverlay("page-search-overlay"))
							}
						>
							Search Page
						</Menu.Item>
						<Menu.Item
							className="context-menu__item"
							onClick={() =>
								runAction(() => openOverlay("site-search-overlay"))
							}
						>
							Search Site
						</Menu.Item>
						<Menu.Separator className="context-menu__sep" />
						<Menu.Item
							className="context-menu__item"
							onClick={() =>
								runAction(() => {
									const settings = loadSettings();
									settings.showSidebar = !settings.showSidebar;
									commitSettings(settings);
								})
							}
						>
							Toggle Sidebar
						</Menu.Item>
						<Menu.Item
							className="context-menu__item"
							onClick={() =>
								runAction(() => {
									const settings = loadSettings();
									settings.focusMode = !settings.focusMode;
									commitSettings(settings);
								})
							}
						>
							Toggle Focus Mode
						</Menu.Item>
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}
