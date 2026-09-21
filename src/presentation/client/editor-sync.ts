import { workspaceFrame } from "./workspace/frame-bridge.ts";

interface EditorBridge {
	initial(): Promise<{ pathname: string; line: number } | null>;
	scroll(pathname: string, line: number): void;
}

export interface SourceAnchor { line: number; top: number }

/** Interpolate between source anchors so tall rendered blocks do not cause drift. */
export function interpolate(anchors: readonly SourceAnchor[], value: number, from: "line" | "top"): number {
	const to = from === "line" ? "top" : "line";
	const first = anchors[0];
	if (!first) return 0;
	if (value <= first[from]) return first[to];
	for (let index = 1; index < anchors.length; index++) {
		const next = anchors[index]!;
		const previous = anchors[index - 1]!;
		if (value <= next[from]) {
			const span = next[from] - previous[from];
			return previous[to] + (span > 0 ? (value - previous[from]) / span : 0) * (next[to] - previous[to]);
		}
	}
	return anchors.at(-1)![to];
}

const positions = new Map<string, number>();

export function mountEditorSync(): () => void {
	let bridge: EditorBridge | undefined;
	try { bridge = (window.top as Window & { readrunEditor?: EditorBridge })?.readrunEditor; } catch { /* External embed. */ }
	const content = document.querySelector<HTMLElement>(".readrun-content");
	const main = document.querySelector<HTMLElement>("#main-content");
	const info = document.querySelector("#readrun-source-lines");
	if (!bridge || !content || !main || !info?.textContent) return () => {};
	const source = JSON.parse(info.textContent) as { startLine: number; endLine: number };
	const pathname = window.location.pathname;
	let disposed = false;
	let enabled = false;
	let interacted = false;
	let line = positions.get(pathname);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let frameId = 0;
	const active = () => !workspaceFrame() || workspaceFrame()?.getAttribute("data-workspace-active") === "true";
	const anchors = (): SourceAnchor[] => {
		const offset = content.scrollTop - content.getBoundingClientRect().top;
		const bounds = main.getBoundingClientRect();
		const result: SourceAnchor[] = [{ line: source.startLine, top: bounds.top + offset }];
		for (const element of main.querySelectorAll<HTMLElement>("[data-source-line]")) {
			const rect = element.getBoundingClientRect();
			if (!rect.height) continue;
			result.push({ line: Number(element.dataset.sourceLine), top: rect.top + offset });
			if (element.dataset.sourceEnd) result.push({ line: Number(element.dataset.sourceEnd), top: rect.bottom + offset });
		}
		result.push({ line: source.endLine, top: bounds.bottom + offset });
		// Nested blocks and collapsed UI can have overlapping positions.
		const ordered: SourceAnchor[] = [];
		for (const entry of result) {
			const previous = ordered.at(-1);
			if (Number.isFinite(entry.line) && (!previous || entry.line >= previous.line && entry.top >= previous.top)) ordered.push(entry);
		}
		return ordered;
	};
	const restore = () => {
		if (!enabled || interacted || line === undefined) return;
		content.scrollTo({ top: Math.max(0, interpolate(anchors(), line, "line")), behavior: "instant" });
	};
	const scroll = () => {
		if (!enabled || !interacted || !active()) return;
		if (timer !== undefined) return;
		timer = setTimeout(() => {
			timer = undefined;
			if (!active()) return;
			line = Math.max(1, Math.round(interpolate(anchors(), content.scrollTop, "top")));
			positions.set(pathname, line);
			bridge!.scroll(pathname, line);
		}, 60);
	};
	const interact = () => { interacted = true; };
	content.addEventListener("scroll", scroll, { passive: true });
	for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) document.addEventListener(event, interact, true);
	const observer = new ResizeObserver(restore);
	observer.observe(main);
	void bridge.initial().then((initial) => {
		if (disposed || initial?.pathname !== pathname) return;
		enabled = true;
		line ??= initial.line;
		frameId = requestAnimationFrame(restore);
		void document.fonts?.ready.then(() => { if (!disposed) restore(); });
	}).catch(() => {});
	return () => {
		disposed = true;
		clearTimeout(timer);
		cancelAnimationFrame(frameId);
		observer.disconnect();
		content.removeEventListener("scroll", scroll);
		for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) document.removeEventListener(event, interact, true);
	};
}
