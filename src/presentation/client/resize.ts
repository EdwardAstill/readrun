// Sidebar and TOC resize handles.
// Drag to resize sidebar (180–500px) or TOC (150–400px), persist to localStorage.

const SIDEBAR_KEY = "readrun:sidebar-width";
const TOC_KEY = "readrun:toc-width";
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 500;
const TOC_MIN = 150;
const TOC_MAX = 400;
const SIDEBAR_WIDTH_VAR = "--sidebar-width";
const TOC_WIDTH_VAR = "--readrun-toc-width";

export function initResizeHandles(): () => void {
	if (typeof document === "undefined") {
		return () => {};
	}

	// Restore saved widths
	restoreSavedWidths();

	const handles = document.querySelectorAll<HTMLElement>(".resize-handle");
	if (handles.length === 0) {
		return () => {};
	}

	const cleanups: Array<() => void> = [];

	for (const handle of handles) {
		const targetId = handle.dataset.resizeTarget;
		if (!targetId) continue;

		cleanups.push(attachResizeHandle(handle, targetId));
	}

	return () => {
		for (const cleanup of cleanups) {
			cleanup();
		}
	};
}

function attachResizeHandle(handle: HTMLElement, targetId: string): () => void {
	let dragging = false;

	const onPointerDown = (event: PointerEvent): void => {
		event.preventDefault();
		dragging = true;
		handle.classList.add("resize-handle--active");
		handle.setPointerCapture(event.pointerId);

		let lastX = event.clientX;

		const onPointerMove = (moveEvent: PointerEvent): void => {
			if (!dragging) return;
			const delta = moveEvent.clientX - lastX;
			lastX = moveEvent.clientX;

			if (targetId === "sidebar") {
				resizeSidebar(delta);
			} else if (targetId === "toc") {
				resizeToc(delta);
			}
		};

		const onPointerUp = (): void => {
			dragging = false;
			handle.classList.remove("resize-handle--active");
			handle.removeEventListener("pointermove", onPointerMove);
			handle.removeEventListener("pointerup", onPointerUp);
		};

		handle.addEventListener("pointermove", onPointerMove);
		handle.addEventListener("pointerup", onPointerUp);
	};

	handle.addEventListener("pointerdown", onPointerDown);

	return () => {
		handle.removeEventListener("pointerdown", onPointerDown);
	};
}

function resizeSidebar(delta: number): void {
	const shell = document.querySelector<HTMLElement>(".readrun-shell");
	if (!shell) return;

	const currentRaw = getComputedStyle(shell).gridTemplateColumns;
	const match = currentRaw.match(/([\d.]+)px/);
	const currentPx = match ? Number.parseFloat(match[1]!) : 288;
	const nextPx = clamp(currentPx + delta, SIDEBAR_MIN, SIDEBAR_MAX);

	setSidebarWidth(nextPx);
	saveSidebarWidth(nextPx);
}

function resizeToc(delta: number): void {
	const toc = document.querySelector<HTMLElement>("#toc-sidebar");
	if (!toc) return;

	const currentPx = Number.parseFloat(getComputedStyle(toc).width) || 256;
	// TOC is on the right, so moving the left edge right shrinks it.
	const nextPx = clamp(currentPx - delta, TOC_MIN, TOC_MAX);

	setTocWidth(nextPx);
	saveTocWidth(nextPx);
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, Math.round(value)));
}

function setTocWidth(px: number): void {
	document.documentElement.style.setProperty(TOC_WIDTH_VAR, `${px}px`);
}

function setSidebarWidth(px: number): void {
	document.documentElement.style.setProperty(SIDEBAR_WIDTH_VAR, `${px}px`);
}

function saveSidebarWidth(px: number): void {
	try {
		localStorage.setItem(SIDEBAR_KEY, String(px));
	} catch {
		// localStorage not available
	}
}

function saveTocWidth(px: number): void {
	try {
		localStorage.setItem(TOC_KEY, String(px));
	} catch {
		// localStorage not available
	}
}

function restoreSavedWidths(): void {
	const sidebarPx = readSavedNumber(SIDEBAR_KEY);
	const tocPx = readSavedNumber(TOC_KEY);

	if (sidebarPx !== null) {
		const clamped = clamp(sidebarPx, SIDEBAR_MIN, SIDEBAR_MAX);
		setSidebarWidth(clamped);
	}

	if (tocPx !== null) {
		const clamped = clamp(tocPx, TOC_MIN, TOC_MAX);
		setTocWidth(clamped);
	}
}

function readSavedNumber(key: string): number | null {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return null;
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : null;
	} catch {
		return null;
	}
}
