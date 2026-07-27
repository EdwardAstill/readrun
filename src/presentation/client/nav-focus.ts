// Focus mode (double-click folder to zoom in) + nav collapse persistence.

const FOCUS_STORAGE_KEY = "rr:focus-path";
const OPEN_STORAGE_KEY = "readrun:nav-open";

// ── Focus mode ──

function readFocus(): string[] {
	try {
		const raw = localStorage.getItem(FOCUS_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (
			Array.isArray(parsed) &&
			parsed.every((s: unknown) => typeof s === "string")
		) {
			return parsed as string[];
		}
	} catch {
		// ignore unavailable or invalid storage
	}
	return [];
}

function writeFocus(focus: string[]): void {
	try {
		if (focus.length === 0) localStorage.removeItem(FOCUS_STORAGE_KEY);
		else localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(focus));
	} catch {
		// ignore unavailable storage
	}
}

/** Get the nav-path from a <details> or its closest ancestor <details>. */
function pathOfDetails(el: HTMLElement): string[] | null {
	const details = el.closest<HTMLElement>("details[data-nav-path]");
	if (!details) return null;
	const raw = details.dataset.navPath ?? "";
	if (!raw) return null;
	return raw.replace(/^\/+/, "").split("/").filter(Boolean);
}

function findNavRoot(): HTMLElement | null {
	return document.querySelector<HTMLElement>(".sidebar-nav.nav-tree");
}

function mountFocusChrome(nav: HTMLElement): void {
	const sidebar = nav.closest<HTMLElement>(".readrun-sidebar");
	if (sidebar) {
		sidebar.classList.add("rr-focus-active");
	}
}

function unmountFocusChrome(nav: HTMLElement): void {
	const sidebar = nav.closest<HTMLElement>(".readrun-sidebar");
	if (sidebar) {
		sidebar.classList.remove("rr-focus-active");
	}
}

function createCrumbButton(className: string, text: string): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.className = className;
	button.textContent = text;
	return button;
}

function createCrumbSeparator(): HTMLSpanElement {
	const sep = document.createElement("span");
	sep.className = "rr-crumb-sep";
	sep.textContent = "›";
	return sep;
}

function findBreadcrumbs(nav: HTMLElement): HTMLElement | null {
	return nav.parentElement?.querySelector<HTMLElement>(
		":scope > #rr-focus-crumbs",
	) ?? null;
}

function directDetailsPath(li: HTMLElement): string | null {
	const details = li.querySelector<HTMLElement>(
		":scope > details[data-nav-path]",
	);
	return details?.dataset.navPath?.replace(/^\/+/, "") || null;
}

function containingDetailsPath(li: HTMLElement): string | null {
	const details = li.closest<HTMLElement>("details[data-nav-path]");
	return details?.dataset.navPath?.replace(/^\/+/, "") || null;
}

function findDetailsByPath(nav: HTMLElement, path: string): HTMLElement | null {
	for (const details of nav.querySelectorAll<HTMLElement>(
		"details[data-nav-path]",
	)) {
		if (details.dataset.navPath === path) {
			return details;
		}
	}
	return null;
}

function openFocusedAncestors(nav: HTMLElement, focus: readonly string[]): void {
	let path = "";
	for (const segment of focus) {
		path += `/${segment}`;
		const details = findDetailsByPath(nav, path);
		if (details instanceof HTMLDetailsElement) {
			details.open = true;
		}
	}
}

/** Visible segments: e.g. ["getting-started", "commands"] → clickable breadcrumbs. */
function renderBreadcrumbs(
	crumbs: HTMLElement | null,
	segments: readonly string[],
	applyFn: (segments: string[]) => void,
): void {
	if (!crumbs) return;

	crumbs.textContent = "";
	crumbs.className =
		segments.length > 0 ? "rr-focus-crumbs has-focus" : "rr-focus-crumbs empty";

	if (segments.length === 0) {
		return;
	}

	const all = createCrumbButton("rr-crumb root", "All");
	all.title = "Widen back to everything";
	all.addEventListener("click", () => {
		writeFocus([]);
		applyFn([]);
	});
	crumbs.appendChild(all);

	for (let i = 0; i < segments.length; i++) {
		crumbs.appendChild(createCrumbSeparator());

		const seg = segments[i]!;
		const btn = createCrumbButton("rr-crumb", seg);
		if (i < segments.length - 1) {
			btn.title = "Widen to " + segments.slice(0, i + 1).join("/");
			btn.addEventListener("click", () => {
				const nextFocus = segments.slice(0, i + 1);
				writeFocus(nextFocus);
				applyFn(nextFocus);
			});
		} else {
			btn.classList.add("current");
			btn.disabled = true;
		}
		crumbs.appendChild(btn);
	}
}

function resetFocusStyles(nav: HTMLElement): void {
	nav.querySelectorAll<HTMLElement>("li").forEach((li) => {
		li.classList.remove("rr-hidden", "rr-focus-self");
		li.style.display = "";
	});
	nav.querySelectorAll<HTMLElement>("summary").forEach((summary) => {
		summary.style.display = "";
	});
	nav
		.querySelectorAll<HTMLElement>("details[data-nav-path] > ul")
		.forEach((ul) => {
			ul.style.paddingLeft = "";
		});
}

/** Apply focus: show only elements inside the focused subtree. */
function applyFocus(nav: HTMLElement, focus: readonly string[]): void {
	const crumbs = findBreadcrumbs(nav);
	resetFocusStyles(nav);

	if (focus.length === 0) {
		renderBreadcrumbs(crumbs, [], (segments) => applyFocus(nav, segments));
		nav.removeAttribute("data-focus");
		document.dispatchEvent(new CustomEvent("readrun:nav-focus-change"));
		return;
	}

	const focusPath = "/" + focus.join("/");
	nav.setAttribute("data-focus", "true");

	const focusedDetails = findDetailsByPath(nav, focusPath);

	if (!focusedDetails) {
		writeFocus([]);
		applyFocus(nav, []);
		return;
	}

	const focusKey = focus.join("/");
	nav.querySelectorAll<HTMLElement>("li").forEach((li) => {
		const directPath = directDetailsPath(li);
		const parentPath = containingDetailsPath(li);

		if (directPath) {
			if (directPath === focusKey || focusKey.startsWith(`${directPath}/`)) {
				li.classList.add("rr-focus-self");
				return;
			}

			if (directPath.startsWith(`${focusKey}/`)) {
				return;
			}

			li.classList.add("rr-hidden");
			return;
		}

		if (parentPath === focusKey || parentPath?.startsWith(`${focusKey}/`)) {
			return;
		}

		li.classList.add("rr-hidden");
	});

	openFocusedAncestors(nav, focus);

	renderBreadcrumbs(crumbs, focus, (segments) => applyFocus(nav, segments));
	document.dispatchEvent(new CustomEvent("readrun:nav-focus-change"));
}

export function clearNavFocus(): void {
	writeFocus([]);
	const nav = findNavRoot();
	if (nav) {
		applyFocus(nav, []);
	}
}

export function initNavFocus(): () => void {
	const nav = findNavRoot();
	if (!nav) return () => {};

	mountFocusChrome(nav);
	applyFocus(nav, readFocus());

	const handleDblClick = (event: MouseEvent): void => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const summary = target.closest("summary");
		if (!summary || !nav.contains(summary)) return;
		const details = summary.closest<HTMLElement>("details[data-nav-path]");
		if (!details) return;

		const path = pathOfDetails(details);
		if (!path || path.length === 0) return;

		event.preventDefault();
		event.stopPropagation();

		const current = readFocus();
		if (
			current.length === path.length &&
			current.every((s, i) => s === path[i])
		) {
			writeFocus([]);
			applyFocus(nav, []);
		} else {
			writeFocus(path);
			applyFocus(nav, path);
		}
	};

	nav.addEventListener("dblclick", handleDblClick);

	return () => {
		nav.removeEventListener("dblclick", handleDblClick);
		unmountFocusChrome(nav);
	};
}

// ── Nav collapse persistence ──

function readOpenPaths(): Set<string> | null {
	try {
		const raw = localStorage.getItem(OPEN_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (
			Array.isArray(parsed) &&
			parsed.every((s: unknown) => typeof s === "string")
		) {
			return new Set(parsed as string[]);
		}
	} catch {
		// ignore unavailable or invalid storage
	}
	return null;
}

function writeOpenPaths(nav: HTMLElement): void {
	try {
		const openPaths = Array.from(
			nav.querySelectorAll<HTMLDetailsElement>("details[data-nav-path]"),
		)
			.filter((details) => details.open)
			.map((details) => details.dataset.navPath)
			.filter(
				(path): path is string => typeof path === "string" && path.length > 0,
			);
		localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(openPaths));
	} catch {
		// ignore unavailable storage
	}
}

function containsActivePage(details: HTMLElement): boolean {
	return details.querySelector("a[aria-current='page']") !== null;
}

export function initNavCollapse(): () => void {
	const nav = findNavRoot();
	if (!nav) return () => {};

	const storedOpenPaths = readOpenPaths();
	const allDetails = Array.from(
		nav.querySelectorAll<HTMLDetailsElement>("details[data-nav-path]"),
	);

	if (storedOpenPaths) {
		for (const details of allDetails) {
			const path = details.dataset.navPath ?? "";
			details.open = storedOpenPaths.has(path) || containsActivePage(details);
		}
	}

	const handleToggle = (event: Event): void => {
		const details = event.target;
		if (!(details instanceof HTMLDetailsElement)) return;
		if (!details.dataset.navPath || !nav.contains(details)) return;
		writeOpenPaths(nav);
	};

	nav.addEventListener("toggle", handleToggle, true);

	return () => {
		nav.removeEventListener("toggle", handleToggle, true);
	};
}
